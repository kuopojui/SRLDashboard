<template>
  <div
    class="StuEval-Internal h-100 d-flex flex-column bg-white animate__animated animate__fadeIn"
  >
    <div class="Eval-Header flex-shrink-0">
      <div class="d-flex align-items-center justify-content-center p-3">
        <i class="bi bi-journal-check fs-3 me-3 text-white"></i>
        <div class="text-start">
          <h4 class="fw-bold text-white mb-0">單元學習回顧與反思</h4>
          <p class="small text-white opacity-75 mb-0">
            對照目標標準，調整下一次的學習規劃 (Stage 4)
          </p>
        </div>
      </div>
    </div>

    <div class="Eval-Body flex-grow-1 overflow-auto p-4 p-md-5">
      <section class="reflect-section mb-4">
        <label class="section-title">
          <i class="bi bi-bar-chart-steps me-2 text-primary"></i>1. 時間執行校準
        </label>
        <div class="calibration-display p-4 rounded-4 bg-light border">
          <div class="row align-items-center text-center">
            <div class="col-5">
              <div class="time-circle-wrapper">
                <div class="time-circle planned shadow-sm">
                  <span class="num">{{ plannedMins }}</span>
                  <span class="unit">預計分鐘</span>
                </div>
                <div class="label-status mt-2 small fw-bold text-navy">
                  設定標準
                </div>
              </div>
            </div>
            <div class="col-2">
              <i class="bi bi-arrow-right-circle-fill fs-2 text-muted"></i>
            </div>
            <div class="col-5">
              <div class="time-circle-wrapper">
                <div
                  class="time-circle actual shadow-sm"
                  :class="{
                    'is-over pulse-danger': actualMins > plannedMins,
                    'is-perfect': actualMins <= plannedMins,
                  }"
                >
                  <span class="num">{{ actualMins }}</span>
                  <span class="unit">實際分鐘</span>
                </div>
                <div
                  class="label-status mt-2 small fw-bold"
                  :class="
                    actualMins > plannedMins ? 'text-danger' : 'text-success'
                  "
                >
                  {{ actualMins > plannedMins ? "超出預期" : "符合預期" }}
                </div>
              </div>
            </div>
          </div>
          <div
            class="calibration-feedback mt-4 p-3 bg-white rounded-3 border-start border-4 shadow-sm"
            :class="
              actualMins > plannedMins ? 'border-danger' : 'border-success'
            "
          >
            <p class="mb-0 small">
              {{
                actualMins > plannedMins
                  ? `比預計多了 ${actualMins - plannedMins} 分鐘，這代表判斷可能出現誤差。`
                  : "表現精準！你的能力與目標設定完全校準。"
              }}
            </p>
          </div>
        </div>
      </section>

      <section class="reflect-section mb-4">
        <label class="section-title"
          ><i class="bi bi-question-circle me-2 text-primary"></i>2.
          執行落差歸因</label
        >
        <div class="d-flex flex-wrap gap-2">
          <button
            v-for="opt in attributionOptions"
            :key="opt.val"
            class="btn-attribution"
            :class="{ active: attribution === opt.val }"
            @click="attribution = opt.val"
          >
            {{ opt.label }}
          </button>
        </div>
      </section>

      <section class="reflect-section mb-4">
        <label class="section-title"
          ><i class="bi bi-star me-2 text-primary"></i>3. 策略有效性評估</label
        >
        <div class="star-rating d-flex justify-content-center gap-3 py-2">
          <i
            v-for="i in 5"
            :key="i"
            class="bi fs-3 pointer transition-star"
            :class="
              i <= strategyScore
                ? 'bi-star-fill text-warning scale-up'
                : 'bi-star text-muted'
            "
            @click="strategyScore = i"
          ></i>
        </div>
      </section>

      <section class="reflect-section mb-2">
        <label class="section-title"
          ><i class="bi bi-lightbulb me-2 text-primary"></i>4. AI
          智能調整建議</label
        >
        <div
          class="ai-suggestion p-3 border-start border-4 border-primary bg-light rounded-end shadow-xs"
        >
          <div v-if="isAiLoading" class="text-center py-2">
            <div
              class="spinner-border spinner-border-sm text-primary me-2"
            ></div>
            <span class="small text-muted italic">教練正在思考中...</span>
          </div>
          <div v-else>
            <p class="small mb-2 text-navy fw-bold">
              <i class="bi bi-robot me-1 text-primary"></i>{{ aiAdviceText }}
            </p>
            <button
              @click="generateTestAdvice"
              class="btn btn-sm btn-outline-primary border-0 px-2 py-0 mb-2"
              style="font-size: 10px"
            >
              重新產生建議
            </button>
          </div>
        </div>
      </section>
    </div>

    <div class="Eval-Footer p-4 text-center border-top bg-light flex-shrink-0">
      <p
        v-if="!attribution || strategyScore === 0"
        class="text-danger small mb-2"
      >
        <i class="bi bi-info-circle me-1"></i> 請填寫上方所有項目後再提交
      </p>
      <button
        @click="handleConfirm"
        class="btn btn-navy-confirm px-5 rounded-pill shadow-sm"
        :disabled="!attribution || strategyScore === 0"
      >
        提交反思並完成單元 <i class="bi bi-send-fill ms-2"></i>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { askOpenAI } from "../../../services/aiService";
import "./StuSRLEval.css";
import Swal from "sweetalert2";

const props = defineProps({
  isOpen: Boolean,
  plannedMins: { type: Number, default: 0 },
  actualMins: { type: Number, default: 0 },
  srlSession: { type: Object, default: () => ({}) },
  teacherPrompt: {
    type: String,
    default:
      "你是一位引導學生進行自我調節學習(SRL)的專業教練，請用鼓勵且客觀的口吻給予建議。",
  },
});

const emit = defineEmits(["confirm", "close"]);

// --- 響應式狀態 ---
const attribution = ref(null);
const strategyScore = ref(0);
const acceptAdvice = ref(false);
const aiAdviceText = ref("正在載入 AI 學習建議...");
const isAiLoading = ref(false);

const attributionOptions = [
  { val: "difficulty", label: "內容難度較高" },
  { val: "distraction", label: "外部環境干擾" },
  { val: "strategy", label: "學習方法不當" },
  { val: "effort", label: "專注程度不足" },
  { val: "other", label: "其他突發狀況" },
];

// --- 生命週期 ---
onMounted(() => {
  if (props.isOpen) generateTestAdvice();
});

// --- 核心邏輯 ---

/**
 * 🌟 升級版提交邏輯：具備防呆驗證與數據發送功能
 * 確保學生完成 Stage 4 的自我反射
 */
const handleConfirm = () => {
  // 1. 執行落差歸因防呆：引發歸因分析
  if (!attribution.value) {
    Swal.fire({
      title: "尚未選擇落差歸因",
      text: "請選出最能描述本次執行狀況的主因，這有助於優化下次計畫。",
      icon: "info",
      confirmButtonColor: "#4a70a9",
    });
    return;
  }

  // 2. 策略有效性評估防呆：強化元認知評估
  if (strategyScore.value === 0) {
    Swal.fire({
      title: "請為策略有效性評分",
      text: "點擊星星，評估本次使用的學習策略對你的幫助程度。",
      icon: "info",
      confirmButtonColor: "#4a70a9",
    });
    return;
  }

  // 3. 通過驗證後打包數據 (SRL Stage 4)
  const reflectionPayload = {
    attribution: attribution.value,
    strategyScore: strategyScore.value,
    acceptAdvice: acceptAdvice.value,
    actualMins: props.actualMins,
    plannedMins: props.plannedMins,
    timeGap: props.actualMins - props.plannedMins,
    aiAdvice: aiAdviceText.value,
    submittedAt: new Date().toISOString(),
  };

  // 4. 發送至父組件執行資料庫儲存與跳轉
  console.log("✅ 防呆通過，提交反思數據:", reflectionPayload);
  emit("confirm", reflectionPayload);
};

/**
 * 🚀 AI 建議生成 (Feed-forward)
 * 根據執行結果提供下一個單元的調整建議
 */
const generateTestAdvice = async () => {
  if (isAiLoading.value) return;
  isAiLoading.value = true;
  try {
    const studentMsg = `單元：${props.srlSession?.unitTitle || "當前單元"}，預計${props.plannedMins}分，實際${props.actualMins}分。請給予80字內反思建議。`;
    const result = await askOpenAI(props.teacherPrompt, studentMsg);
    aiAdviceText.value = result || "表現不錯！請繼續保持。";
  } catch (error) {
    console.error("AI Analysis Error:", error);
    aiAdviceText.value = "建議載入失敗，但系統已記錄您的學習數據。";
  } finally {
    isAiLoading.value = false;
  }
};
</script>
