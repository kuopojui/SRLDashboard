<template>
  <div
    class="StuEval-Internal h-100 d-flex flex-column bg-white animate__animated animate__fadeIn"
  >
    <header class="Eval-Header flex-shrink-0">
      <div class="d-flex align-items-center justify-content-center p-4">
        <div class="header-icon-ring me-3">
          <i class="bi bi-journal-check fs-3 text-white"></i>
        </div>
        <div class="text-start">
          <h4 class="fw-bold text-white mb-0">單元學習回顧與反思</h4>
          <p class="small text-white text-opacity-75 mb-0">
            Stage 4：對照目標標準，校準學習路徑
          </p>
        </div>
      </div>
    </header>

    <div
      class="Eval-Body flex-grow-1 overflow-auto p-4 p-md-5 custom-scrollbar"
    >
      <section class="reflect-card mb-5">
        <label class="section-label-v2">
          <i class="bi bi-clock-history me-2"></i>1. 時間執行校準
        </label>
        <div class="calibration-container p-4 rounded-4 bg-light border-solid">
          <div class="row align-items-center g-3 text-center">
            <div class="col-5">
              <div class="time-node">
                <div class="time-circle planned shadow-sm">
                  <span class="num">{{ plannedMins }}</span>
                  <span class="unit">預計分鐘</span>
                </div>
                <span class="node-status mt-2">目標設定</span>
              </div>
            </div>

            <div class="col-2 d-flex justify-content-center">
              <div class="connector-line">
                <i class="bi bi-chevron-right fs-4 text-muted"></i>
              </div>
            </div>

            <div class="col-5">
              <div class="time-node">
                <div
                  class="time-circle actual shadow-sm"
                  :class="{
                    'is-over': actualMins > plannedMins,
                    'is-perfect': actualMins <= plannedMins,
                  }"
                >
                  <span class="num">{{ actualMins }}</span>
                  <span class="unit">實際投入</span>
                </div>
                <span
                  class="node-status mt-2 fw-bold"
                  :class="
                    actualMins > plannedMins ? 'text-danger' : 'text-success'
                  "
                >
                  {{ actualMins > plannedMins ? "超出預期" : "符合預期" }}
                </span>
              </div>
            </div>
          </div>

          <div
            class="feedback-toast mt-4 p-3 rounded-3 border-start border-4"
            :class="
              actualMins > plannedMins
                ? 'border-danger bg-danger-subtle'
                : 'border-success bg-success-subtle'
            "
          >
            <p class="mb-0 small text-dark">
              <i class="bi bi-info-circle-fill me-2"></i>
              {{
                actualMins > plannedMins
                  ? `執行時間比預計多了 ${actualMins - plannedMins} 分鐘，下單元可嘗試拆解更細的目標。`
                  : "表現精準！你對自身學習節奏的掌控度非常高。"
              }}
            </p>
          </div>
        </div>
      </section>

      <section class="reflect-card mb-5">
        <label class="section-label-v2">
          <i class="bi bi-search me-2"></i>2. 執行落差歸因
        </label>
        <p class="text-muted small mb-3">若有落差，你認為主要原因是什麼？</p>
        <div class="attribution-grid">
          <button
            v-for="opt in attributionOptions"
            :key="opt.val"
            class="btn-attribution-v2"
            :class="{ active: attribution === opt.val }"
            @click="attribution = opt.val"
          >
            {{ opt.label }}
          </button>
        </div>
      </section>

      <section class="reflect-card mb-5">
        <label class="section-label-v2">
          <i class="bi bi-penta-star me-2"></i>3. 學習策略有效性
        </label>
        <div
          class="star-rating-box p-4 rounded-4 border-solid text-center bg-white shadow-xs"
        >
          <p class="small text-muted mb-3">
            評估本次選用的策略對理解教材的幫助
          </p>
          <div class="d-flex justify-content-center gap-3">
            <i
              v-for="i in 5"
              :key="i"
              class="bi fs-2 pointer star-icon"
              :class="i <= strategyScore ? 'bi-star-fill active' : 'bi-star'"
              @click="strategyScore = i"
            ></i>
          </div>
        </div>
      </section>

      <section class="reflect-card mb-5">
        <label class="section-label-v2">
          <i class="bi bi-chat-quote me-2"></i>4. 我的學習心得
        </label>
        <div class="comment-box p-3 rounded-4 border-solid bg-white shadow-xs">
          <textarea
            v-model="userComment"
            class="form-control border-0 bg-transparent no-focus-ring"
            rows="3"
            placeholder="請分享這單元學到了什麼，或是下次可以怎麼改進？"
          ></textarea>
          <div class="text-end mt-1">
            <small
              :class="userComment.length < 5 ? 'text-danger' : 'text-muted'"
            >
              {{ userComment.length }} / 200 (至少 5 個字)
            </small>
          </div>
        </div>
      </section>

      <section class="reflect-card mb-4">
        <label class="section-label-v2">
          <i class="bi bi-robot me-2"></i>5. AI 導師調整建議
        </label>
        <div class="ai-suggestion-v2 p-4 rounded-4 border-solid shadow-sm">
          <div v-if="isAiLoading" class="text-center py-3">
            <div
              class="spinner-border spinner-border-sm text-primary me-2"
            ></div>
            <span class="small text-muted italic"
              >導師正在生成 Stage 4 調節建議...</span
            >
          </div>
          <div v-else class="d-flex align-items-start">
            <div class="ai-icon-wrapper me-3">
              <i class="bi bi-chat-left-quote-fill text-primary fs-4"></i>
            </div>
            <div class="flex-grow-1">
              <p class="small mb-3 text-dark lh-lg">
                {{ aiAdviceText }}
              </p>
              <button @click="generateAiAdvice" class="btn btn-refresh-ai">
                <i class="bi bi-arrow-clockwise me-1"></i>重新分析
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>

    <footer class="Eval-Footer p-4 border-top bg-light flex-shrink-0">
      <div class="container-fluid max-width-600">
        <p
          v-if="!attribution || strategyScore === 0 || userComment.length < 5"
          class="text-danger small mb-3 animate__animated animate__headShake"
        >
          <i class="bi bi-exclamation-circle me-1"></i>
          請完成所有反思項目與心得(5字以上)後提交
        </p>
        <button
          @click="handleConfirm"
          class="btn-submit-reflection w-100"
          :disabled="
            !attribution || strategyScore === 0 || userComment.length < 5
          "
        >
          確認反思並存檔 <i class="bi bi-arrow-right-short ms-2"></i>
        </button>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from "vue";
// 🌟 改為引入 AiService 統一管理
import { AiService } from "../../../services/aiService";
import "./StuSRLEval.css";
import Swal from "sweetalert2";

const props = defineProps({
  isOpen: Boolean,
  plannedMins: { type: Number, default: 0 },
  actualMins: { type: Number, default: 0 },
  srlSession: { type: Object, default: () => ({}) },
});

const emit = defineEmits(["confirm", "close"]);

// --- 響應式狀態 ---
const attribution = ref(null);
const strategyScore = ref(0);
const userComment = ref(""); // 學生輸入的心得
const aiAdviceText = ref("正在根據您的表現分析調節建議...");
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
  // 初始進入若尚未填寫，先給予預設載入文字，或執行一次基礎分析
  if (props.isOpen) generateAiAdvice();
});

// --- 監聽觸發 ---
// 🌟 當學生選擇了「歸因原因」與「評分」後，自動觸發 AI 分支獲取精準建議
watch([attribution, strategyScore], () => {
  if (attribution.value && strategyScore.value > 0) {
    generateAiAdvice();
  }
});

/**
 * 🚀 核心邏輯：生成 AI 反思建議 (呼叫 AiService 分支)
 */
const generateAiAdvice = async () => {
  if (isAiLoading.value) return;
  isAiLoading.value = true;

  try {
    const selectedAttr =
      attributionOptions.find((o) => o.val === attribution.value)?.label ||
      "未選擇";

    // 1. 封裝反思階段需要的 Context
    const context = {
      unit: props.srlSession?.unitTitle || "當前單元",
      gap: props.actualMins - props.plannedMins,
      attribution: selectedAttr,
      score: strategyScore.value,
      userComment: userComment.value,
    };

    // 2. 🌟 呼叫 aiService.js 中的 Eval 專用分支
    const result = await AiService.getEvalAdvice(context);
    aiAdviceText.value = result;
  } catch (error) {
    console.error("AI 反思分析失敗:", error);
    aiAdviceText.value = "目前分析服務繁忙，請先專注於填寫您的學習心得。";
  } finally {
    isAiLoading.value = false;
  }
};

/**
 * 🌟 提交邏輯：打包 Stage 4 數據
 */
const handleConfirm = () => {
  if (
    !attribution.value ||
    strategyScore.value === 0 ||
    userComment.value.length < 5
  ) {
    Swal.fire({
      title: "反思尚未完成",
      text: "請填寫歸因、評分並輸入至少 5 個字的心得再提交喔！",
      icon: "warning",
      confirmButtonColor: "#4a70a9",
    });
    return;
  }

  const reflectionPayload = {
    unitTitle: props.srlSession?.unitTitle || "未命名單元",
    attribution: attribution.value,
    strategyScore: strategyScore.value,
    userComment: userComment.value,
    aiAdvice: aiAdviceText.value,
    plannedMins: props.plannedMins,
    actualMins: props.actualMins,
    timeGap: props.actualMins - props.plannedMins,
    submittedAt: new Date().toISOString(),
  };

  console.log("✅ [Stage 4] 反思數據打包成功:", reflectionPayload);
  emit("confirm", reflectionPayload);
};
</script>
