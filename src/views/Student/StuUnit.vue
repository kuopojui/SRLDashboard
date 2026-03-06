<template>
  <div class="StuUnit-Page" :class="{ 'has-monitor': showMonitor }">
    <header class="sticky-top shadow-sm srl-header">
      <nav class="srl-monitor-navbar">
        <div
          v-if="activeFeatures.monitoring && srlSession"
          class="header-progress-container"
        >
          <div
            class="header-progress-fill"
            :style="{ width: actualProgressPercent + '%' }"
            :class="{ 'over-time': isOverTime }"
          ></div>
        </div>

        <div class="container-fluid h-100 px-2 px-md-4">
          <div class="row align-items-center h-100 g-0">
            <div class="col-3 d-flex align-items-center overflow-hidden">
              <button
                @click="goBack"
                class="btn-back flex-shrink-0 me-2"
                title="返回"
              >
                <i class="bi bi-arrow-left"></i>
              </button>
              <div
                class="unit-meta d-flex flex-column justify-content-center overflow-hidden me-2"
              >
                <h5
                  class="mb-0 fw-bold text-white unit-title-text text-truncate"
                >
                  {{ unitTitle }}
                </h5>
                <small
                  class="text-white text-opacity-50 d-none d-md-block"
                  style="font-size: 0.6rem"
                >
                  {{ activeTabName }}
                </small>
              </div>
            </div>

            <div
              class="col-6 d-flex flex-column align-items-center justify-content-center px-1"
            >
              <div class="timer-badge-wrapper mb-1">
                <code class="timer-badge-main">
                  {{ formattedTime }}
                  <span class="d-none d-md-inline"
                    ><span class="mx-1 opacity-25">/</span>
                    {{ srlSession?.targetTime }}:00</span
                  >
                </code>
              </div>

              <div class="progress-center-track shadow-inner">
                <div
                  class="progress-center-fill"
                  :style="{ width: actualProgressPercent + '%' }"
                  :class="{ 'is-over-time': isOverTime }"
                ></div>

                <Transition name="bounce">
                  <div v-if="isOverTime" class="overtime-alert-bubble">
                    <i class="bi bi-exclamation-triangle-fill"></i>
                    <span class="d-none d-sm-inline ms-1">已超時</span>
                  </div>
                </Transition>
              </div>
            </div>

            <div
              class="col-3 d-flex justify-content-end align-items-center gap-2"
            >
              <button
                v-if="activeFeatures.monitoring"
                @click="showMonitor = !showMonitor"
                class="btn-ai-mini"
                :class="{ 'is-active': showMonitor }"
                title="AI 學習監控"
              >
                <i class="bi bi-cpu-fill"></i>
                <span class="ms-2 d-none d-lg-inline">監控儀表板</span>
              </button>

              <button
                @click="handleFinish"
                class="btn-finish-sm"
                title="結束本次學習"
              >
                <i class="bi bi-check2-all"></i>
                <span class="ms-2 d-none d-lg-inline">完成學習</span>
              </button>
            </div>
          </div>
        </div>
      </nav>
    </header>

    <div
      v-if="showMonitor"
      class="monitor-overlay d-lg-none"
      @click="showMonitor = false"
    ></div>

    <Transition name="slide">
      <div v-if="showMonitor" class="monitor-drawer shadow-lg">
        <div v-if="isMonitorLoading" class="p-5 text-center mt-5">
          <div class="spinner-border text-primary mb-3" role="status"></div>
          <p class="text-muted small italic">正在同步學習軌跡...</p>
        </div>

        <div v-else class="p-4">
          <div
            class="drawer-header mb-4 pb-3 border-bottom d-flex justify-content-between align-items-center"
          >
            <div>
              <h5 class="fw-bold text-navy mb-1">
                <i class="bi bi-cpu-fill me-2 text-primary"></i>自我調節監控中心
              </h5>
              <span class="badge bg-light text-muted fw-normal"
                >數據更新：{{ lastUpdateTime }}</span
              >
            </div>
            <button @click="showMonitor = false" class="btn-close-drawer">
              <i class="bi bi-x-lg"></i>
            </button>
          </div>

          <div class="monitor-section mb-4">
            <label class="section-label-v2">班級領先群 (Top 25%) 對照圖</label>
            <div
              class="comparison-card p-3 rounded-4 bg-white border shadow-sm"
            >
              <div
                class="d-flex justify-content-around align-items-end"
                style="height: 120px"
              >
                <div class="v-bar-container">
                  <div
                    class="v-bar my-score"
                    :style="{ height: (currentScore / 100) * 100 + '%' }"
                  >
                    <span class="bar-val">{{ currentScore }}</span>
                  </div>
                  <span class="bar-label">個人得分</span>
                </div>
                <div class="v-bar-container">
                  <div
                    class="v-bar top-score"
                    :style="{ height: (topAverage / 100) * 100 + '%' }"
                  >
                    <span class="bar-val">{{ topAverage }}</span>
                  </div>
                  <span class="bar-label">領先平均</span>
                </div>
              </div>

              <div
                class="gap-indicator-v2 mt-3"
                :class="scoreGap >= 0 ? 'is-positive' : 'is-negative'"
              >
                <i
                  class="bi"
                  :class="
                    scoreGap >= 0 ? 'bi-graph-up' : 'bi-patch-exclamation'
                  "
                ></i>
                <span>{{
                  scoreGap >= 0
                    ? "表現優異，請維持進度"
                    : `距離領先群目標尚差 ${Math.abs(scoreGap)} 分`
                }}</span>
              </div>
            </div>
          </div>

          <div class="monitor-section mb-4">
            <label class="section-label-v2">AI 智慧導師建議</label>
            <div class="ai-chat-box p-3 rounded-4 border shadow-sm">
              <div class="d-flex align-items-center mb-3 text-navy">
                <div class="ai-avatar me-2"><i class="bi bi-stars"></i></div>
                <span class="fw-bold small">智慧調節分析：</span>
              </div>

              <div class="strategy-list-v2">
                <div
                  v-for="(strategy, index) in aiStrategies"
                  :key="index"
                  class="ai-reply-pill"
                >
                  <i class="bi bi-lightbulb-fill me-2 text-warning"></i>
                  {{ strategy }}
                </div>
                <div
                  v-if="aiStrategies.length === 0"
                  class="ai-reply-pill opacity-75"
                >
                  <i class="bi bi-check2-circle me-2 text-success"></i>
                  偵測中... 目前您的學習步調穩定。
                </div>
              </div>
            </div>
          </div>

          <div class="monitor-section mb-4">
            <label class="section-label-v2">單元操作數據</label>
            <div class="trace-stats-v2 p-3 bg-white border rounded-4 shadow-sm">
              <div
                class="trace-row d-flex justify-content-between py-2 border-bottom"
              >
                <span class="text-muted small"
                  ><i class="bi bi-play-circle me-2"></i>影片觀看</span
                >
                <strong class="text-navy">{{ traceData.videoMins }} min</strong>
              </div>
              <div
                class="trace-row d-flex justify-content-between py-2 border-bottom"
              >
                <span class="text-muted small"
                  ><i class="bi bi-book me-2"></i>教材閱讀</span
                >
                <strong class="text-navy"
                  >{{ traceData.readingMins }} min</strong
                >
              </div>
              <div class="trace-row d-flex justify-content-between py-2">
                <span class="text-muted small"
                  ><i class="bi bi-x-circle me-2"></i>累積錯誤</span
                >
                <strong
                  :class="
                    traceData.errorCount > 3 ? 'text-danger' : 'text-success'
                  "
                >
                  {{ traceData.errorCount }} 題
                </strong>
              </div>
            </div>
          </div>

          <button
            @click="showMonitor = false"
            class="btn btn-navy w-100 rounded-pill py-2 shadow-sm"
          >
            確認並繼續學習
          </button>
        </div>
      </div>
    </Transition>

    <main class="container-fluid py-4 main-content">
      <div class="row g-4">
        <div class="col-lg-2 unit-sidebar-rwd">
          <div class="sidebar-sticky-wrapper">
            <div class="sidebar-tabs-container border shadow-sm">
              <p
                class="text-uppercase small fw-bold text-muted mb-lg-3 d-none d-lg-block px-3 pt-3"
              >
                單元任務
              </p>

              <ul class="nav flex-lg-column flex-row custom-nav-scroll">
                <li v-for="tab in tabs" :key="tab.id" class="nav-item">
                  <a
                    class="nav-link-sidebar"
                    :class="{ active: activeTab === tab.id }"
                    @click="activeTab = tab.id"
                  >
                    <i :class="tab.icon"></i>
                    <span class="tab-label ms-2">{{ tab.label }}</span>
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div
          :class="[
            showMonitor ? 'col-lg-7' : 'col-lg-7',
            'col-md-8',
            'flex-grow-1',
          ]"
        >
          <div
            class="card content-card border-0 shadow-sm min-vh-70 rounded-4 overflow-hidden"
          >
            <div class="card-body p-4">
              <div class="tab-content-wrapper">
                <div v-if="activeTab === 'material'" class="教材內容">
                  <div class="placeholder-content py-5 text-center">
                    <i
                      class="bi bi-play-btn-fill display-1 text-primary opacity-25"
                    ></i>
                    <h4 class="mt-4 fw-bold">正在載入數位教材...</h4>
                    <p class="text-muted">單元識別碼: {{ id }}</p>
                  </div>
                </div>

                <div v-else-if="activeTab === 'quiz'" class="測驗內容">
                  <div class="quiz-container p-4 text-center">
                    <i class="bi bi-patch-question display-4 text-success"></i>
                    <h5 class="mt-3">單元自我檢測</h5>
                    <p class="text-muted">完成測驗以檢核學習成效</p>
                    <button class="btn btn-primary rounded-pill px-4">
                      開始測驗
                    </button>
                  </div>
                </div>

                <div v-else class="其他內容 p-5 text-center italic">
                  正在讀取 {{ activeTabName }} 數據...
                </div>
              </div>
            </div>
          </div>
        </div>

        <div
          v-if="activeFeatures.monitoring && srlSession"
          class="col-lg-3 col-md-4"
        >
          <div class="sticky-top sidebar-sticky-wrapper">
            <div class="card toolbox-card border-0 shadow-sm mb-4 rounded-4">
              <div class="card-body">
                <h6 class="fw-bold text-navy mb-3">
                  <i class="bi bi-lightbulb-fill text-warning me-2"></i>規劃策略
                </h6>
                <div class="d-flex flex-wrap gap-2">
                  <span
                    v-for="s in srlSession?.strategies"
                    :key="s"
                    class="badge-strategy-sidebar"
                  >
                    {{ s }}
                  </span>
                </div>
              </div>
            </div>

            <div class="card note-card border-0 shadow-sm rounded-4">
              <div class="card-body">
                <h6 class="fw-bold text-navy mb-3">
                  <i class="bi bi-pencil-square me-2 text-primary"></i>學習筆記
                </h6>
                <textarea
                  class="form-control mb-3 border-light bg-light"
                  rows="10"
                  placeholder="這張投影片的重點是..."
                ></textarea>
                <button class="btn btn-navy w-100 rounded-pill shadow-sm">
                  儲存紀錄
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <StuSRLEval
        v-if="showEvalModal"
        :isOpen="showEvalModal"
        :plannedMins="srlSession?.targetTime || 0"
        :actualMins="Math.floor(elapsedTime / 60)"
        @close="showEvalModal = false"
        @confirm="onEvalConfirm"
      />
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from "vue";
import { useRouter } from "vue-router";
import Swal from "sweetalert2";

// 🌟 匯入 RTDB 實例與其專用函式
import { rtdb } from "../../firebase/config";
import {
  ref as dbRef,
  get,
  onValue,
  update,
  serverTimestamp,
} from "firebase/database";

import "./StuUnit.css";
import StuSRLEval from "./Modal/StuSRLEval.vue";

// --- Props & Router ---
const props = defineProps({
  courseId: String,
  id: String, // 單元 ID
  userId: String,
});
const router = useRouter();

// --- 1. 基礎 UI 狀態 ---
const showMonitor = ref(false);
const showEvalModal = ref(false);
const activeTab = ref("material");
const unitTitle = ref("正在載入...");
const isMonitorLoading = ref(false);
const lastUpdateTime = ref("");

// --- 2. 實驗組功能開關 (由資料庫控制) ---
const features = ref({
  monitoring: false, // 決定儀表板按鈕與頂部計時器
  aiAdvice: false, // 決定監控抽屜內的 AI 建議區
});

// --- 3. SRL 會話與計時器 ---
const srlSession = ref({
  targetTime: 0,
  strategies: [],
  targetGoal: "",
});
const elapsedTime = ref(0);
let timerInterval = null;

// --- 4. 實時監控數據 ---
const currentScore = ref(0);
const topAverage = ref(85); // 預設值
const aiStrategies = ref([]);
const traceData = ref({
  videoMins: 0,
  readingMins: 0,
  errorCount: 0,
});

const activeFeatures = ref({
  planning: false,
  monitoring: false,
  aiAdvice: false,
  reflection: false,
});

// --- 5. 計算屬性 ---

/**
 * 🌟 核心修正：讓 hasMonitorFeature 映射到實驗組的監控開關
 * 此屬性用於控制 Header 的儀表板按鈕、計時器以及監控抽屜的顯示
 */
const hasMonitorFeature = computed(() => {
  return features.value?.monitoring === true;
});

/**
 * 🌟 AI 策略開關：用於監控抽屜內的 AI 建議區塊
 */
const hasAiAdviceFeature = computed(() => {
  return features.value?.aiAdvice === true;
});

/**
 * 判斷是否有 SRL 計畫數據且開啟監控
 * 用於顯示頂部背景進度條
 */
const hasSrlData = computed(() => {
  return hasMonitorFeature.value && srlSession.value?.targetTime > 0;
});

const activeTabName = computed(() => {
  const tab = tabs.find((t) => t.id === activeTab.value);
  return tab ? tab.label : "";
});

/**
 * 格式化計時顯示 (MM:SS)
 */
const formattedTime = computed(() => {
  const m = Math.floor(elapsedTime.value / 60);
  const s = elapsedTime.value % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
});

/**
 * 計算當前進度百分比
 * 依據 srlSession.value.targetTime (預計分鐘) 轉換為秒數計算
 */
const actualProgressPercent = computed(() => {
  // 避免除以 0，預設至少 1 分鐘
  const planned = (srlSession.value?.targetTime || 1) * 60;
  return Math.min((elapsedTime.value / planned) * 100, 100);
});

/**
 * 判斷是否超時
 */
const isOverTime = computed(() => {
  const plannedSecs = (srlSession.value?.targetTime || 0) * 60;
  return plannedSecs > 0 && elapsedTime.value > plannedSecs;
});

/**
 * 計算分差 (領先群平均 - 個人目前得分)
 */
const scoreGap = computed(() => {
  return (topAverage.value || 0) - (currentScore.value || 0);
});

// 導覽標籤設定
const tabs = [
  { id: "material", label: "課程教材", icon: "bi bi-book" },
  { id: "quiz", label: "單元測驗", icon: "bi bi-card-checklist" },
  { id: "hw", label: "功課提交", icon: "bi bi-file-earmark-arrow-up" },
  { id: "discuss", label: "討論區", icon: "bi bi-chat-dots" },
];

// --- 6. 核心功能：讀取實驗分組與 SRL 設定 ---
const initSrlEnvironment = async () => {
  const courseId = props.courseId?.trim();
  const unitId = props.id?.trim();
  const userId = props.userId?.trim();

  if (!courseId || !unitId || !userId) {
    console.error("❌ 初始化中斷：參數不全", { courseId, unitId, userId });
    return;
  }

  try {
    // 1. 獲取 Profile (內含組別 ID 與 SRL 計畫資料)
    const profilePath = `courses/${courseId}/profiles/${userId}`;
    const profileSnap = await get(dbRef(rtdb, profilePath));

    if (!profileSnap.exists()) {
      console.error("❌ 找不到 Profile 紀錄:", profilePath);
      return;
    }

    const profile = profileSnap.val();
    const gid = profile.groupId;
    console.log("📡 偵查到學生組別 ID:", gid);

    // 2. 核心修正：讀取實驗組功能開關
    if (gid) {
      const featurePath = `courses/${courseId}/experiment/groups/${gid}/features`;
      const featureSnap = await get(dbRef(rtdb, featurePath));

      if (featureSnap.exists()) {
        const featData = featureSnap.val();
        activeFeatures.value = {
          aiAdvice: !!featData.aiAdvice,
          monitoring: !!featData.monitoring,
          planning: !!featData.planning,
          reflection: !!featData.reflection,
          isLeaderboardAnonymous: !!featData.isLeaderboardAnonymous,
        };
        console.log("🧪 實驗組功能載入成功:", activeFeatures.value);
      }
    }

    // 3. 讀取個人單元計畫數據 (獲取 targetTime 與 strategies)
    const planData = profile.srl?.planning?.[unitId];
    if (planData) {
      srlSession.value = planData;
      console.log("✅ 成功吸到計畫數據:", srlSession.value);
    } else {
      console.warn("❌ 找不到單元計畫:", `srl/planning/${unitId}`);
      srlSession.value = null;
    }

    // 🌟 修正點 1：從單元原始數據路徑抓取標題
    // 根據 JSON，標題存放在 courses/[courseId]/units/[unitId]/title
    const unitSnap = await get(
      dbRef(rtdb, `courses/${courseId}/units/${unitId}`),
    );
    if (unitSnap.exists()) {
      unitTitle.value = unitSnap.val().title || "未命名單元";
      console.log("✅ 成功讀取單元標題:", unitTitle.value);
    }

    // 🌟 修正點 2：計時器啟動邏輯優化
    // 只要有監控權限，不論有無計畫都應顯示計時器以記錄學習時長
    if (activeFeatures.value.monitoring) {
      console.log("⏱️ 偵測到監控權限，啟動計時器...");
      startTimer();
    }
  } catch (error) {
    console.error("🔥 偵查過程失敗:", error);
  }
};
const startTimer = () => {
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    elapsedTime.value++;
  }, 1000);
};

// --- 7. 監控儀表板數據 ---
const fetchMonitorData = async () => {
  if (!features.value.monitoring) return;
  isMonitorLoading.value = true;

  try {
    // ✅ 領先群基準 (暫定路徑，可依需求調整)
    // 假設放在 courses/{courseId}/units/{unitId}/stats
    const statsPath = dbRef(
      rtdb,
      `courses/${props.courseId}/units/${props.id}/stats`,
    );
    const statsSnap = await get(statsPath);
    if (statsSnap.exists()) {
      topAverage.value = statsSnap.val().topAverage || 85;
    }

    // ✅ 實時監聽個人軌跡 (路徑依您的日誌結構調整)
    // 這裡示範從 student_traces 讀取
    const tracePath = dbRef(rtdb, `student_traces/${props.userId}_${props.id}`);
    onValue(tracePath, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        currentScore.value = data.currentScore || 0;
        traceData.value = data;
      }
      lastUpdateTime.value = new Date().toLocaleTimeString();
    });

    // ✅ 讀取 AI 建議 (僅當功能開啟時)
    if (features.value.aiAdvice) {
      // 這裡可串接您的 AI API 或從 DB 讀取預設建議
      aiStrategies.value = [
        "嘗試將目前的重點畫成心智圖",
        "針對錯誤題目重新閱讀教材",
      ];
    }
  } catch (error) {
    console.error("讀取監控數據失敗:", error);
  } finally {
    isMonitorLoading.value = false;
  }
};

// --- 8. 事件處理 ---
const goBack = () =>
  router.push({
    name: "StuCourseDetail",
    params: { courseId: props.courseId },
  });

const handleFinish = async () => {
  const result = await Swal.fire({
    title: "完成本次學習？",
    text: "建議在離開前進行最後的自我反思。",
    icon: "question",
    showCancelButton: true,
    confirmButtonColor: "#4a70a9",
    confirmButtonText: "開始反思",
    cancelButtonText: "繼續學習",
  });
  if (result.isConfirmed) showEvalModal.value = true;
};

onMounted(() => {
  initSrlEnvironment();
});

onUnmounted(() => {
  if (timerInterval) clearInterval(timerInterval);
});

watch(showMonitor, (newVal) => {
  if (newVal) fetchMonitorData();
});
</script>
