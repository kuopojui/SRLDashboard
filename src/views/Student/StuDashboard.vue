<template>
  <div class="StuDashboard animate__animated animate__fadeIn">
    <div class="stats-full-width mb-4">
      <div
        class="stats-card shadow-sm d-flex align-items-center justify-content-between p-4"
      >
        <div class="d-flex gap-5 stats-responsive">
          <div class="stat-item">
            <div class="label text-muted fw-bold small">我的功課均分</div>
            <div class="d-flex align-items-baseline gap-2 mt-2">
              <h2 class="text-navy fw-bold mb-0">{{ avgHwScore }}</h2>
              <span class="text-muted small">分</span>
            </div>
          </div>
          <div class="stat-item border-start ps-md-5">
            <div class="label text-muted fw-bold small">我的考試均分</div>
            <div class="d-flex align-items-baseline gap-2 mt-2">
              <h2 class="text-navy fw-bold mb-0">{{ avgExamScore }}</h2>
              <span class="text-muted small">分</span>
            </div>
          </div>
          <div class="stat-item border-start ps-md-5">
            <div class="label text-muted fw-bold small">討論區參與</div>
            <div class="d-flex align-items-baseline gap-2 mt-2">
              <h2 class="text-navy fw-bold mb-0">{{ discussionCount }}</h2>
              <span class="text-muted small">次發言</span>
            </div>
          </div>
        </div>

        <button
          @click="handleOpenRank"
          class="btn-quick-kanban shadow-sm d-none d-md-flex"
        >
          <i class="bi bi-trophy-fill me-2"></i>查看排行榜
        </button>
      </div>
      <button
        @click="handleOpenRank"
        class="btn-quick-kanban w-100 mt-3 d-md-none shadow-sm"
      >
        <i class="bi bi-trophy-fill me-2"></i>查看排行榜
      </button>
    </div>

    <div class="dashboard-grid mb-4">
      <div class="chart-card shadow-sm p-4">
        <h6 class="chart-header text-navy">
          <i class="bi bi-graph-up me-2"></i>功課成績對照
          <small class="text-muted">(個人 vs 全班)</small>
        </h6>
        <div class="chart-container">
          <canvas id="hwCompareChart"></canvas>
        </div>
      </div>

      <div class="chart-card shadow-sm p-4">
        <h6 class="chart-header text-navy">
          <i class="bi bi-pencil-square me-2"></i>考試成績對照
          <small class="text-muted">(個人 vs 全班)</small>
        </h6>
        <div class="chart-container">
          <canvas id="examCompareChart"></canvas>
        </div>
      </div>
    </div>

    <div class="ai-analysis-full-width">
      <div class="chart-card shadow-sm p-4 ai-card border-0">
        <h6 class="chart-header text-navy">
          <i class="bi bi-robot me-2"></i>AI 學習診斷助理
        </h6>
        <div class="ai-analysis-box mt-3">
          <div
            v-if="isAnalyzing"
            class="d-flex align-items-center gap-2 text-navy py-3"
          >
            <div class="spinner-border spinner-border-sm" role="status"></div>
            <span>AI 正在研讀您的表現並生成個人化建議...</span>
          </div>
          <div v-else class="ai-content text-navy">
            {{ aiAnalysis }}
          </div>
        </div>
        <div class="mt-3 text-end">
          <small class="text-muted fst-italic"
            >※ 診斷結果由 AI 生成，請結合老師的指導共同調整學習策略</small
          >
        </div>
      </div>
    </div>

    <Transition name="modal-fade">
      <div
        v-if="showRankModal"
        class="modal-overlay-custom"
        @click.self="showRankModal = false"
      >
        <div class="kanban-modal shadow-lg animate__animated animate__zoomIn">
          <div class="modal-header-custom">
            <h5 class="header-title m-0">
              <i class="bi bi-trophy-fill me-2 text-warning"></i>班級匿名排行榜
            </h5>
            <button class="btn-close-custom" @click="handleCloseRank">✕</button>
          </div>
          <div class="modal-scroll-body p-4">
            <StuRank />
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch, nextTick } from "vue";
import { rtdb as db } from "../../firebase/config";
import { ref as dbRef, onValue, set } from "firebase/database";
import { getAuth } from "firebase/auth";
import { getFunctions, httpsCallable } from "firebase/functions";
import { Chart, registerables } from "chart.js";
import StuRank from "./Modal/StuRank.vue";
import "./StuDashboard.css"; // 引入獨立 CSS

Chart.register(...registerables);

const props = defineProps({ courseId: String });
const courseId = props.courseId;

// --- 狀態控制 ---
const aiAnalysis = ref("正在載入學習歷程...");
const isAnalyzing = ref(false);
const showRankModal = ref(false);
const discussionCount = ref(0);
const performanceSummary = ref({ hw: [], exam: [] });

let hwChartInstance = null;
let examChartInstance = null;
let aiDebounceTimer = null;

// --- 計算均分 ---
const avgHwScore = computed(() => {
  const scores = performanceSummary.value.hw
    .map((i) => i.score)
    .filter((v) => v !== null);
  return scores.length
    ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
    : 0;
});

const avgExamScore = computed(() => {
  const scores = performanceSummary.value.exam
    .map((i) => i.score)
    .filter((v) => v !== null);
  return scores.length
    ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
    : 0;
});

// --- 圖表繪製核心 ---
const updateChart = async (id, labels, myScores, avgScores, color) => {
  await nextTick();
  const ctx = document.getElementById(id);
  if (!ctx) return;

  const data = {
    labels,
    datasets: [
      {
        label: "我的成績",
        data: myScores,
        borderColor: color,
        backgroundColor: color + "20",
        tension: 0.4,
        fill: true,
        pointRadius: 6,
        pointHoverRadius: 8,
      },
      {
        label: "全班平均",
        data: avgScores,
        borderColor: "#94a3b8",
        borderDash: [6, 4],
        tension: 0.4,
        fill: false,
        pointRadius: 0,
      },
    ],
  };

  let instance = id === "hwCompareChart" ? hwChartInstance : examChartInstance;
  if (instance) {
    instance.data = data;
    instance.update();
  } else {
    const newChart = new Chart(ctx, {
      type: "line",
      data,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: "bottom", labels: { boxWidth: 12, padding: 20 } },
        },
        scales: {
          y: { min: 0, max: 100, ticks: { stepSize: 20 } },
          x: { grid: { display: false } },
        },
      },
    });
    if (id === "hwCompareChart") hwChartInstance = newChart;
    else examChartInstance = newChart;
  }
};

// --- AI 診斷邏輯 ---
const triggerAIAnalysis = async () => {
  if (
    isAnalyzing.value ||
    (!performanceSummary.value.hw.length &&
      !performanceSummary.value.exam.length)
  )
    return;

  isAnalyzing.value = true;
  try {
    const functions = getFunctions(undefined, "asia-east1");
    const analyzeFunc = httpsCallable(functions, "analyzeStudentProgress");
    const res = await analyzeFunc({
      courseId,
      stats: {
        assignments: performanceSummary.value.hw,
        exams: performanceSummary.value.exam,
        discussionCount: discussionCount.value,
      },
    });
    aiAnalysis.value = res.data.analysis;
    // 紀錄 AI 診斷至 Firebase Log
  } catch (e) {
    aiAnalysis.value = "目前暫時無法連接 AI 助理，請稍後再試。";
  } finally {
    isAnalyzing.value = false;
  }
};

onMounted(() => {
  const uid = getAuth().currentUser?.uid;
  if (!uid) return;

  recordStudentAction(courseId, uid, "進入學習診斷儀表板");

  // 監聽功課
  onValue(dbRef(db, `courses/${courseId}/assignments`), (snap) => {
    // 數據解析邏輯... (如原代碼)
    // updateChart(...)
  });

  // 監聽考試
  onValue(dbRef(db, `courses/${courseId}/exams`), (snap) => {
    // 數據解析邏輯... (如原代碼)
    // updateChart(...)
  });
});

const handleOpenRank = () => {
  showRankModal.value = true;
};
const handleCloseRank = () => {
  showRankModal.value = false;
};
</script>
