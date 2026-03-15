<template>
  <div
    class="StuEval-Internal h-100 d-flex flex-column bg-white animate__animated animate__fadeIn"
  >
    <header class="Eval-Header flex-shrink-0 bg-navy">
      <div class="d-flex align-items-center justify-content-center p-4">
        <div class="header-icon-ring me-3">
          <i class="bi bi-journal-check fs-3 text-white"></i>
        </div>
        <div class="text-start">
          <h4 class="fw-bold text-white mb-0">單元學習回顧與反思</h4>
          <p class="small text-white text-opacity-75 mb-0">
            Stage 4：校準與調節建議
          </p>
        </div>
      </div>
    </header>

    <div
      class="Eval-Body flex-grow-1 overflow-auto p-4 p-md-5 custom-scrollbar"
    >
      <section class="reflect-card mb-5 text-center">
        <label class="section-label-v2"
          ><i class="bi bi-clock-history me-2"></i>1. 時間執行校準</label
        >
        <div
          class="calibration-container p-4 rounded-4 bg-light border-solid d-flex justify-content-around align-items-center"
        >
          <div class="time-node">
            <div class="time-circle planned">
              <strong>{{ plannedMins }}</strong
              ><small>預計</small>
            </div>
          </div>
          <i class="bi bi-chevron-right text-muted"></i>
          <div class="time-node">
            <div
              class="time-circle actual"
              :class="actualMins > plannedMins ? 'is-over' : 'is-perfect'"
            >
              <strong>{{ actualMins }}</strong
              ><small>實際</small>
            </div>
          </div>
        </div>
      </section>

      <section class="reflect-card mb-5">
        <label class="section-label-v2"
          ><i class="bi bi-search me-2"></i>2. 執行落差歸因 (可多選)</label
        >
        <div class="attribution-grid mb-3">
          <button
            v-for="opt in attributionOptions"
            :key="opt.val"
            class="btn-attribution-v2"
            :class="{ active: attribution.includes(opt.val) }"
            @click="toggleAttribution(opt)"
          >
            {{ opt.label }}
          </button>
        </div>
        <div
          v-if="attribution.includes('other')"
          class="animate__animated animate__fadeIn"
        >
          <textarea
            v-model="otherAttributionText"
            class="other-input"
            rows="2"
            placeholder="請填寫其他影響進度的具體原因..."
          ></textarea>
        </div>
      </section>

      <section class="reflect-card mb-5">
        <label class="section-label-v2"
          ><i class="bi bi-penta-star me-2"></i>3. 學習策略有效性</label
        >
        <div
          class="star-rating-box p-4 rounded-4 border-solid text-center bg-white shadow-xs"
        >
          <div class="d-flex justify-content-center gap-3">
            <i
              v-for="i in 5"
              :key="i"
              class="bi fs-2 pointer star-icon"
              :class="i <= strategyScore ? 'bi-star-fill active' : 'bi-star'"
              @click="handleScoreClick(i)"
            ></i>
          </div>
        </div>
      </section>

      <section class="reflect-card mb-5">
        <label class="section-label-v2"
          ><i class="bi bi-chat-quote me-2"></i>4. 我的學習心得</label
        >
        <div class="comment-box p-3 rounded-4 border-solid bg-white shadow-xs">
          <textarea
            v-model="userComment"
            @focus="handleCommentFocus"
            @blur="handleCommentBlur"
            class="form-control border-0 no-focus-ring"
            rows="3"
            placeholder="單元重點、收穫或下次改進點..."
          ></textarea>
          <div class="text-end mt-1">
            <small
              :class="userComment.length < 5 ? 'text-danger' : 'text-muted'"
              >{{ userComment.length }} / 200</small
            >
          </div>
        </div>
      </section>

      <section class="reflect-card mb-4">
        <label class="section-label-v2"
          ><i class="bi bi-robot me-2"></i>5. AI 導師調整建議</label
        >
        <div class="ai-suggestion-fixed-box p-4 shadow-sm">
          <div
            v-if="isAiLoading"
            class="h-100 d-flex align-items-center justify-content-center"
          >
            <span class="ai-loading-text"
              ><i class="bi bi-stars me-2"></i>AI 導師正在分析您的表現...</span
            >
          </div>
          <div
            v-else
            class="h-100 d-flex flex-column animate__animated animate__fadeIn"
          >
            <div class="ai-scroll-content custom-scrollbar pe-2">
              <p class="text-pre-wrap">
                {{ aiAdviceText || "完成反思後自動生成建議。" }}
              </p>
            </div>
            <button
              @click="handleRefreshAi"
              class="btn btn-refresh-ai-sm mt-2 w-auto align-self-start"
            >
              <i class="bi bi-arrow-clockwise"></i> 重新分析
            </button>
          </div>
        </div>
      </section>
    </div>

    <footer class="Eval-Footer p-4 border-top bg-light">
      <div class="container-fluid max-width-600">
        <p v-if="!isFormComplete" class="text-danger small mb-3 text-center">
          <i class="bi bi-exclamation-circle me-1"></i
          >請完成上方所有內容後方可存檔
        </p>
        <button
          @click="handleConfirm"
          class="btn-submit-v2"
          :disabled="!isFormComplete"
        >
          <span>確認反思並存檔</span>
          <i class="bi bi-send-check ms-2"></i>
        </button>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { AiService } from "../../../services/aiService";
import Swal from "sweetalert2";
import { recordStudentAction as recordAction } from "../../../utils/logger.js";
import "./StuSRLEval.css";

const props = defineProps({
  isOpen: Boolean,
  plannedMins: Number,
  actualMins: Number,
  srlSession: Object,
});

const emit = defineEmits(["confirm", "close"]);

const attribution = ref([]);
const otherAttributionText = ref("");
const strategyScore = ref(0);
const userComment = ref("");
const aiAdviceText = ref("");
const isAiLoading = ref(false);

const attributionOptions = [
  { val: "difficulty", label: "內容難度較高" },
  { val: "distraction", label: "外部環境干擾" },
  { val: "strategy", label: "學習方法不當" },
  { val: "effort", label: "專注程度不足" },
  { val: "other", label: "其他(手動輸入)" },
];

const isFormComplete = computed(() => {
  const basicOk =
    attribution.value.length > 0 &&
    strategyScore.value > 0 &&
    userComment.value.trim().length >= 5;
  if (attribution.value.includes("other") && !otherAttributionText.value.trim())
    return false;
  return basicOk;
});

// --- 🌟 Log 1：進入頁面 ---
onMounted(() => {
  if (props.isOpen) {
    const logMsg = `🚀 [System Log] 進入 Stage 4 反思頁面 | 預計: ${props.plannedMins}m, 實際: ${props.actualMins}m`;
    console.log(logMsg);
    recordAction(props.srlSession?.courseId, "進入 Stage 4 反思頁面", {
      planned: props.plannedMins,
      actual: props.actualMins,
    });
    generateAiAdvice();
  }
});

// --- 🌟 Log 2：歸因內容點擊 (多選) ---
const toggleAttribution = (opt) => {
  const idx = attribution.value.indexOf(opt.val);
  const actionType = idx > -1 ? "取消選取" : "確認選取";

  if (idx > -1) attribution.value.splice(idx, 1);
  else attribution.value.push(opt.val);

  const logMsg = `🎯 [Action Log] 點選歸因內容: ${opt.label} (${actionType})`;
  console.log(logMsg, "| 目前清單:", attribution.value);

  recordAction(props.srlSession?.courseId, "點選歸因內容", {
    label: opt.label,
    value: opt.val,
    action: actionType,
    currentAll: attribution.value,
  });
};

// --- 🌟 Log 3：評分內容點擊 (星星) ---
const handleScoreClick = (score) => {
  strategyScore.value = score;
  const logMsg = `⭐ [Action Log] 點選策略評分: ${score} 星`;
  console.log(logMsg);

  recordAction(props.srlSession?.courseId, "點選策略評分內容", {
    score: score,
    unitTitle: props.srlSession?.unitTitle,
  });
};

// --- 🌟 Log 4：重新分析按鈕點擊 ---
const handleRefreshAi = () => {
  const logMsg = `🔄 [Action Log] 點選重新分析內容 (Request new AI advice)`;
  console.log(logMsg);

  recordAction(props.srlSession?.courseId, "點選重新分析內容");
  generateAiAdvice();
};

// --- 🌟 Log 5：確認存檔按鈕點擊 ---
const handleConfirm = () => {
  if (!isFormComplete.value) {
    console.warn("⚠️ [Submit Refused] 表單未完成，無法提交");
    return;
  }

  const logMsg = `🏁 [Submit Log] 點選確認反思並存檔 | 歸因: ${attribution.value} | 評分: ${strategyScore.value}星`;
  console.log(logMsg);

  recordAction(props.srlSession?.courseId, "點選確認反思並存檔按鈕", {
    finalAttribution: attribution.value,
    finalScore: strategyScore.value,
    commentLength: userComment.value.length,
  });

  const payload = {
    attribution: attribution.value,
    otherText: otherAttributionText.value,
    strategyScore: strategyScore.value,
    userComment: userComment.value,
    aiAdvice: aiAdviceText.value,
    submittedAt: new Date().toISOString(),
  };
  emit("confirm", payload);
};

// --- 輔助紀錄：心得輸入焦點行為 ---
const handleCommentFocus = () => {
  console.log("✍️ [Focus Log] 開始撰寫心得內容");
  recordAction(props.srlSession?.courseId, "開始撰寫心得內容");
};

const handleCommentBlur = () => {
  console.log(
    "📝 [Blur Log] 完成心得內容撰寫 | 字數:",
    userComment.value.length,
  );
  recordAction(props.srlSession?.courseId, "完成心得撰寫內容", {
    length: userComment.value.length,
  });
};

// --- 輔助紀錄：手動輸入內容監控 ---
watch(otherAttributionText, (newVal) => {
  if (newVal.length > 0 && newVal.length % 10 === 0) {
    // 每增加 10 個字紀錄一次，避免過度頻繁
    console.log("🖋️ [Input Log] 正在輸入手動歸因內容:", newVal);
    recordAction(props.srlSession?.courseId, "輸入手動歸因內容", {
      text: newVal,
    });
  }
});

// --- AI 生成邏輯 ---
const generateAiAdvice = async () => {
  if (isAiLoading.value) return;
  isAiLoading.value = true;

  try {
    // 1. 組合歸因標籤
    const labels = attribution.value
      .map((v) => attributionOptions.find((o) => o.val === v)?.label)
      .join("、");

    const attributionFinal =
      labels +
      (otherAttributionText.value ? ` (${otherAttributionText.value})` : "");

    // 2. 🌟 關鍵更正：必須對準父組件傳入的正確 Key 名稱
    // 父組件傳入的是 teacherGlobalPrompt 而非 teacherPrompt
    const globalRule = props.srlSession?.teacherGlobalPrompt || "無";
    const groupRule = props.srlSession?.teacherGroupPrompt || "無";

    const combinedTeacherPrompt = `
      [全域教學導向]: ${globalRule}
      [組別特定要求]: ${groupRule}
    `.trim();

    const context = {
      unit: props.srlSession?.unitTitle || "當前單元",
      gap: props.actualMins - props.plannedMins,
      attribution: attributionFinal,
      score: strategyScore.value,
      userComment: userComment.value,
      teacherInstructions: combinedTeacherPrompt,
    };

    // 3. 除錯紀錄：這會顯示您在 JSON 中設定的「路徑測試123」等內容
    console.log("🤖 [AI Request] 最終指令路徑校準:", {
      global: globalRule,
      group: groupRule,
    });

    const result = await AiService.getEvalAdvice(context);
    aiAdviceText.value = result;

    recordAction(props.srlSession?.courseId, "成功串接雙重指令生成建議", {
      unitTitle: props.srlSession?.unitTitle,
    });
  } catch (error) {
    console.error("❌ AI 建議生成失敗:", error);
    handleFallback();
  } finally {
    isAiLoading.value = false;
  }
};
const handleFallback = () => {
  const diff = props.actualMins - props.plannedMins;
  aiAdviceText.value = `【分析模式】預計 ${props.plannedMins}m, 實際 ${props.actualMins}m。您的時間管理表現穩定。`;
};

// 監聽歸因與評分變化自動觸發 AI (這是研究設計的自動反饋觸發)
watch(
  [attribution, strategyScore],
  () => {
    if (attribution.value.length > 0 && strategyScore.value > 0) {
      console.log("🔄 [Trigger Log] 檢測到歸因或評分異動，自動重新生成建議");
      generateAiAdvice();
    }
  },
  { deep: true },
);
</script>
