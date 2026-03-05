<template>
  <Teleport to="body">
    <Transition name="eval-fade">
      <div v-if="isOpen" class="StuEval-Overlay" @click.self="$emit('close')">
        <div class="Eval-Card shadow-lg animate__animated animate__zoomIn">
          <div class="Eval-Header">
            <div class="d-flex align-items-center justify-content-center">
              <i class="bi bi-journal-check fs-3 me-3 text-white"></i>
              <div class="text-start">
                <h4 class="fw-bold text-white mb-0">單元學習回顧與反思</h4>
                <p class="small text-white opacity-75 mb-0">
                  對照目標標準，調整下一次的學習規劃 (Stage 4)
                </p>
              </div>
            </div>
          </div>

          <div class="Eval-Body p-4 overflow-auto" style="max-height: 70vh">
            <section class="reflect-section mb-4">
              <label class="section-title">
                <i class="bi bi-bar-chart-steps me-2 text-primary"></i>1.
                時間執行校準 (Performance Calibration)
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
                    <div class="compare-icon">
                      <i
                        class="bi bi-arrow-right-circle-fill fs-2 text-muted"
                      ></i>
                    </div>
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
                          actualMins > plannedMins
                            ? 'text-danger'
                            : 'text-success'
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
                    actualMins > plannedMins
                      ? 'border-danger'
                      : 'border-success'
                  "
                >
                  <div
                    v-if="actualMins > plannedMins"
                    class="animate__animated animate__fadeIn"
                  >
                    <p class="mb-0 small leading-relaxed">
                      <i
                        class="bi bi-exclamation-triangle-fill text-danger me-2"
                      ></i>
                      系統偵測到落差：實際比預計多了
                      <strong>{{ actualMins - plannedMins }}</strong> 分鐘。
                      這代表你在任務難度判斷上可能出現了誤差。
                    </p>
                  </div>
                  <div
                    v-else
                    class="animate__animated animate__fadeIn text-success"
                  >
                    <p class="mb-0 small leading-relaxed">
                      <i class="bi bi-check-circle-fill me-2"></i>
                      <strong>表現精準！</strong>
                      你的能力與目標設定完全校準，有利於維持穩定的學習效能。
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section class="reflect-section mb-4">
              <label class="section-title">
                <i class="bi bi-question-circle me-2 text-primary"></i>2.
                執行落差歸因 (Attribution)
              </label>
              <p class="small text-muted mb-2">
                請選出造成落差（或影響執行）的主因：
              </p>
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
              <label class="section-title">
                <i class="bi bi-star me-2 text-primary"></i>3. 策略有效性評估
              </label>
              <p class="small text-muted mb-2">
                你本次使用的策略：<strong class="text-navy">
                  {{
                    srlSession?.standards?.strategies?.join("、") || "自主調整"
                  }}
                </strong>
              </p>
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

            <section class="reflect-section mb-3">
              <label class="section-title">
                <i class="bi bi-lightbulb me-2 text-primary"></i>4. AI
                智能調整建議 (Feed-forward)
              </label>
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
                  <p class="small mb-2 text-navy fw-bold leading-relaxed">
                    <i class="bi bi-robot me-1 text-primary"></i>
                    {{ aiAdviceText }}
                  </p>

                  <button
                    @click="generateTestAdvice"
                    class="btn btn-sm btn-outline-primary border-0 px-2 py-0 mb-2"
                    style="font-size: 10px"
                  >
                    <i class="bi bi-arrow-clockwise"></i> 重新產生建議
                  </button>
                </div>

                <div class="form-check small mt-1">
                  <input
                    class="form-check-input pointer"
                    type="checkbox"
                    v-model="acceptAdvice"
                    id="adviceCheck"
                  />
                  <label class="form-check-label pointer" for="adviceCheck">
                    我接受建議，並會在下個單元嘗試優化我的計畫。
                  </label>
                </div>
              </div>
            </section>
          </div>

          <div class="Eval-Footer p-4 text-center border-top bg-light">
            <button
              @click="handleConfirm"
              class="btn btn-navy-confirm px-5 rounded-pill shadow-sm"
              :disabled="!attribution || strategyScore === 0"
            >
              提交反思並完成單元 <i class="bi bi-send-fill ms-2"></i>
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed } from "vue";
import { askOpenAI } from "../../../services/aiService";

// 🌟 明確定義 Props
const props = defineProps({
  isOpen: Boolean,
  plannedMins: {
    type: Number,
    default: 0,
  },
  actualMins: {
    type: Number,
    default: 0,
  },
  srlSession: {
    type: Object,
    default: () => ({}),
  },
});

// 🌟 明確定義 Emits
const emit = defineEmits(["confirm", "close"]);

const attribution = ref(null);
const strategyScore = ref(0);
const acceptAdvice = ref(false);

// 🌟 AI 回覆相關狀態
const aiAdviceText = ref("正在載入 AI 學習建議...");
const isAiLoading = ref(false);

const attributionOptions = [
  { val: "difficulty", label: "內容難度較高" },
  { val: "distraction", label: "外部環境干擾" },
  { val: "strategy", label: "學習方法不當" },
  { val: "effort", label: "專注程度不足" },
  { val: "other", label: "其他突發狀況" },
];

const aiAdvice = computed(() => {
  if (props.actualMins > props.plannedMins) {
    return "偵測到時間預算不足。下次建議將『預計時間』增加 20%，或在學習前先進行前測以掌握難度。";
  }
  return "表現出色！目前策略組合非常契合。下個單元可挑戰難度更高的策略如『批判性筆記』。";
});

const handleConfirm = () => {
  emit("confirm", {
    attribution: attribution.value,
    strategyScore: strategyScore.value,
    acceptAdvice: acceptAdvice.value,
    actualMins: props.actualMins,
    plannedMins: props.plannedMins,
    timeGap: props.actualMins - props.plannedMins,
  });
};

const generateTestAdvice = async () => {
  isAiLoading.value = true;
  aiAdviceText.value = "AI 正在分析您的學習歷程...";

  try {
    // 組合要給 AI 的訊息
    const systemMsg =
      props.teacherPrompt || "你是一位引導學生進行自我調節學習的教練。";
    const studentMsg = `
      單元：${props.srlSession?.unitTitle || "當前單元"}
      計畫時間：${props.plannedMins} 分鐘
      實際時間：${props.actualMins} 分鐘
      使用策略：${props.srlSession?.standards?.strategies?.join("、") || "自主調整"}
      請針對我的時間預估準確度與策略使用給予一段 100 字內的學習建議。
    `;

    // 🚀 正式呼叫 API
    const result = await askOpenAI(systemMsg, studentMsg);
    aiAdviceText.value = result;
  } catch (error) {
    aiAdviceText.value =
      "目前無法連線至 AI 服務，請確認 .env 設定與 API 額度。";
  } finally {
    isAiLoading.value = false;
  }
};
</script>
