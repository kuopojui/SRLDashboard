<template>
  <div class="StuUnit-Page" :class="{ 'has-monitor': showMonitor }">
    <div v-if="hasSrlData" class="calibration-bar shadow-sm">
      <div
        class="container-fluid px-4 d-flex align-items-center justify-content-between"
      >
        <div class="progress-info">
          <span class="fw-bold text-navy">
            <i class="bi bi-clock-history me-1"></i> 時間監控：
          </span>
          <small
            >預計 {{ srlSession.standards?.plannedMins }} 分鐘 / 已使用
            {{ formattedTime }}</small
          >
        </div>
        <div class="progress-track-wrapper flex-grow-1 mx-4">
          <div class="progress-track">
            <div
              class="progress-fill actual"
              :style="{ width: actualProgressPercent + '%' }"
              :class="{ 'over-time': isOverTime }"
            ></div>
          </div>
        </div>
        <div v-if="isOverTime" class="text-danger fw-bold pulse-text">
          <i class="bi bi-exclamation-triangle"></i> 已超出預計時間
        </div>
      </div>
    </div>

    <nav class="srl-monitor-navbar">
      <div
        class="container-fluid d-flex justify-content-between align-items-center h-100 px-4"
      >
        <div class="nav-left-group d-flex align-items-center">
          <button @click="goBack" class="btn-back me-3" title="返回課程大綱">
            <i class="bi bi-arrow-left"></i>
          </button>

          <div class="unit-meta">
            <h5 class="mb-0 fw-bold text-white">{{ unitTitle }}</h5>
            <div class="d-flex align-items-center gap-2 mt-1">
              <span class="badge bg-white bg-opacity-25 fw-light">
                {{ activeTabName }}
              </span>

              <button
                v-if="hasMonitorFeature"
                @click="showMonitor = !showMonitor"
                class="btn-ai-toggle"
                :class="{ 'is-active': showMonitor }"
              >
                <i class="bi bi-cpu-fill me-1"></i> AI 監控中心
              </button>
            </div>
          </div>
        </div>

        <div class="nav-right-group">
          <button
            @click="handleFinish"
            class="btn-finish shadow-sm animate__animated animate__fadeInRight"
          >
            <i class="bi bi-check2-circle me-1"></i> 完成本單元學習
          </button>
        </div>
      </div>
    </nav>

    <Transition name="slide">
      <div v-if="showMonitor" class="monitor-drawer shadow">
        <div class="p-4">
          <div class="drawer-header mb-4">
            <h5 class="fw-bold text-navy mb-1">
              <i class="bi bi-graph-up-arrow me-2"></i>自我監控中心
            </h5>
            <small class="text-muted">數據更新時間：剛剛</small>
          </div>

          <div class="monitor-section mb-4">
            <label class="section-label">班級領先群 (前25%) 對照</label>
            <div
              class="score-card d-flex align-items-center justify-content-around p-3 rounded"
            >
              <div class="score-item">
                <div class="score-val">{{ currentScore }}</div>
                <div class="score-lab">目前得分</div>
              </div>
              <div class="score-divider"></div>
              <div class="score-item top-group">
                <div class="score-val">{{ topAverage }}</div>
                <div class="score-lab">領先群平均</div>
              </div>
            </div>
            <div
              class="discrepancy-msg mt-2"
              :class="scoreGap > 0 ? 'text-danger' : 'text-success'"
            >
              <i
                class="bi"
                :class="
                  scoreGap > 0 ? 'bi-caret-down-fill' : 'bi-caret-up-fill'
                "
              ></i>
              與領先群差距：{{ scoreGap }} 分
            </div>
          </div>

          <div class="monitor-section mb-4">
            <label class="section-label">AI 智能策略建議</label>
            <div class="ai-suggestion-box">
              <div class="d-flex align-items-center mb-2 text-primary">
                <i class="bi bi-stars me-2"></i>
                <span class="fw-bold small">偵測到目前的障礙...</span>
              </div>
              <p class="small text-secondary mb-3">
                您的練習錯誤率高於平均，前 25% 的學生此時通常執行：
              </p>
              <div class="strategy-options">
                <div
                  v-for="strategy in aiStrategies"
                  :key="strategy"
                  class="strategy-item-mini"
                >
                  <i class="bi bi-check2-circle text-success me-2"></i
                  >{{ strategy }}
                </div>
              </div>
            </div>
          </div>

          <div class="monitor-section">
            <label class="section-label">單元操作分佈 (min)</label>
            <div class="trace-stats mt-2">
              <div class="trace-row">
                <span>影片觀看:</span> <strong>12 min</strong>
              </div>
              <div class="trace-row">
                <span>教材閱讀:</span> <strong>8 min</strong>
              </div>
              <div class="trace-row">
                <span>錯誤題數:</span> <strong class="text-danger">5 題</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <main class="container-fluid py-4 main-content">
      <div class="row g-4">
        <div :class="columnLayout">
          <div class="card content-card border-0 shadow-sm">
            <div class="card-header bg-white border-0 pt-4 px-4">
              <ul class="nav nav-tabs-custom">
                <li v-for="tab in tabs" :key="tab.id" class="nav-item">
                  <a
                    class="nav-link"
                    :class="{ active: activeTab === tab.id }"
                    @click="activeTab = tab.id"
                  >
                    <i :class="tab.icon"></i> {{ tab.label }}
                  </a>
                </li>
              </ul>
            </div>
            <div class="card-body p-4 min-vh-70">
              <div class="tab-content-wrapper">
                <div v-if="activeTab === 'material'" class="教材內容">
                  <div class="placeholder-content">
                    <i class="bi bi-play-btn display-1 text-muted"></i>
                    <p class="mt-3">正在載入單元教材 (ID: {{ id }})</p>
                  </div>
                </div>
                <div v-else class="其他內容 p-5 text-center">
                  <p class="text-muted">
                    正在從資料庫讀取 {{ activeTabName }} 數據...
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-if="hasSrlData" class="col-lg-3">
          <div class="card toolbox-card border-0 shadow-sm mb-4">
            <div class="card-body">
              <h6 class="fw-bold text-navy mb-3">
                <i class="bi bi-lightbulb me-2"></i>規劃採用的策略
              </h6>
              <div class="d-flex flex-wrap gap-2">
                <span
                  v-for="s in srlSession.standards?.strategies"
                  :key="s"
                  class="badge-strategy"
                  >{{ s }}</span
                >
              </div>
            </div>
          </div>
          <div class="card note-card border-0 shadow-sm">
            <div class="card-body">
              <h6 class="fw-bold text-navy mb-3">
                <i class="bi bi-pencil-square me-2"></i>學習隨手記
              </h6>
              <textarea
                class="form-control mb-3"
                rows="12"
                placeholder="紀錄你的思考過程..."
              ></textarea>
              <button class="btn btn-navy w-100 rounded-pill">儲存紀錄</button>
            </div>
          </div>
        </div>
      </div>
      <StuSRLEval
        v-if="showEvalModal"
        :isOpen="showEvalModal"
        :plannedMins="srlSession.standards?.plannedMins || 0"
        :actualMins="Math.floor(elapsedTime / 60)"
        @close="showEvalModal = false"
        @confirm="onEvalConfirm"
      />
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import Swal from "sweetalert2";
import "./StuUnit.css";
import StuSRLEval from "./Modal/StuSRLEval.vue";

const props = defineProps({ courseId: String, id: String });
const router = useRouter();

// --- 狀態變數 ---
const showMonitor = ref(false);
const activeTab = ref("material");
const unitTitle = ref("正在載入單元標題...");
const srlSession = ref({});
const elapsedTime = ref(0);
let timerInterval = null;

// --- 模擬數據 (研究用) ---
const currentScore = ref(78);
const topAverage = ref(92);
const aiStrategies = [
  "精緻化策略 (Elaboration)",
  "自我提問 (Self-questioning)",
  "視覺化筆記",
];
const tabs = [
  { id: "material", label: "課程教材", icon: "bi bi-book" },
  { id: "quiz", label: "單元測驗", icon: "bi bi-card-checklist" },
  { id: "hw", label: "功課提交", icon: "bi bi-file-earmark-arrow-up" },
  { id: "discuss", label: "討論區", icon: "bi bi-chat-dots" },
];

// --- 計算屬性 ---
const hasSrlData = computed(
  () => !!(srlSession.value && srlSession.value.standards),
);
const hasMonitorFeature = ref(true); // 實驗組開關
const scoreGap = computed(() => topAverage.value - currentScore.value);
const activeTabName = computed(
  () => tabs.find((t) => t.id === activeTab.value)?.label,
);

const formattedTime = computed(() => {
  const m = Math.floor(elapsedTime.value / 60);
  const s = elapsedTime.value % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
});

const isOverTime = computed(() => {
  const plannedSecs = (srlSession.value.standards?.plannedMins || 0) * 60;
  return plannedSecs > 0 && elapsedTime.value > plannedSecs;
});

const actualProgressPercent = computed(() => {
  const planned = (srlSession.value.standards?.plannedMins || 1) * 60;
  const progress = (elapsedTime.value / planned) * 100;
  return Math.min(progress, 100);
});

const columnLayout = computed(() => {
  if (!hasSrlData.value) return "col-lg-12";
  return showMonitor.value ? "col-lg-6" : "col-lg-9";
});

// --- 邏輯功能 ---
const goBack = () =>
  router.push({
    name: "StuCourseDetail",
    params: { courseId: props.courseId },
  });

// 1. 在 setup 中新增狀態控制
// 1. 狀態控制
const showEvalModal = ref(false);

const activeFeatures = ref({
  evaluation: true, // 實驗組：設為 true 才會彈出反思視窗
  monitoring: true,
});

const handleFinish = async () => {
  const result = await Swal.fire({
    title: "完成本次學習？",
    text: hasSrlData.value
      ? "AI 監控中心建議您在離開前進行最後的自我反思。"
      : "確定要結束本單元學習嗎？",
    icon: "question",
    showCancelButton: true,
    confirmButtonColor: "#002c53",
    confirmButtonText: "是的，完成學習",
    cancelButtonText: "繼續學習",
  });

  if (result.isConfirmed) {
    // 檢查該組別是否有「自我評估」功能 (實驗組)
    const canEvaluate = activeFeatures.value?.evaluation || false;

    if (canEvaluate) {
      // 🌟 實驗組：啟動反思模組 (Stage 4)
      showEvalModal.value = true;
    } else {
      // 🌟 控制組：直接結案並回傳基礎數據
      completeUnitAction();
    }
  }
};

/**
 * 🌟 處理來自 StuSRLEval 組件的確認事件 (Stage 4: Evaluation)
 */
const onEvalConfirm = async (evalData) => {
  console.log("正在處理 Stage 4 反思數據並結束單元...", evalData);

  try {
    // 1. 取得規劃階段的資料
    const planningData = srlSession.value.standards || {};

    // 2. 整合完整的 SRL 數據 Payload (包含你要求的四個維度)
    const srlLog = {
      unitId: props.id,
      unitTitle: unitTitle.value,

      // 維度 1: 績效校準 (Performance Calibration)
      plannedMins: planningData.plannedMins || 0,
      actualMins: evalData.actualMins,
      timeGap: evalData.timeGap, // 實際 - 預計

      // 維度 2: 結構化歸因 (Structured Attribution)
      attribution: evalData.attribution,

      // 維度 3: 策略有效性評估 (Strategy Evaluation)
      plannedStrategies: planningData.strategies || [],
      strategyScore: evalData.strategyScore, // 星等評分

      // 維度 4: 前瞻性調整 (Feed-forward Planning)
      acceptAiAdvice: evalData.acceptAdvice,

      completedAt: new Date().toISOString(),
    };

    // 3. 寫入 Firebase (取消註解並執行實際存檔)
    /* const logRef = doc(db, "srl_logs", `${props.courseId}_${userId.value}`);
    await updateDoc(logRef, {
      sessions: arrayUnion(srlLog)
    });
    */

    console.log("SRL 數據閉環成功，準備跳轉：", srlLog);

    // 4. UI 反饋
    showEvalModal.value = false;

    await Swal.fire({
      icon: "success",
      title: "單元學習已完成",
      text: "反思是進步的開始，正在為您跳轉回清單...",
      timer: 1500,
      showConfirmButton: false,
    });

    // 🌟 5. 執行跳轉與清理 (這會觸發 goBack 回到單元清單)
    completeUnitAction();
  } catch (error) {
    console.error("存檔或跳轉失敗:", error);
    Swal.fire("錯誤", "系統跳轉失敗，請手動返回清單", "error");
  }
};

/**
 * 最終結案並清除 Session 的統一出口
 * 這會讓頁面跳轉回單元清單 (StuCourseDetail)
 */
const completeUnitAction = () => {
  // 清除本地暫存，確保下次進入新單元時是乾淨的狀態
  localStorage.removeItem("active_srl_session");

  // 呼叫 goBack 函式執行 router.push
  goBack();
};

onMounted(() => {
  const savedData = localStorage.getItem("active_srl_session");
  if (savedData) {
    srlSession.value = JSON.parse(savedData);
    const startTime = srlSession.value.startTime || Date.now();
    elapsedTime.value = Math.floor((Date.now() - startTime) / 1000);
    timerInterval = setInterval(() => elapsedTime.value++, 1000);
  }
});

onUnmounted(() => {
  if (timerInterval) clearInterval(timerInterval);
});
</script>
