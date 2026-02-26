<template>
  <div
    class="StuDashboard StuDashboard-container animate__animated animate__fadeIn"
  >
    <div class="StuDashboard-stats-wrapper mb-4">
      <div
        class="StuDashboard-stats-card shadow-sm p-4 d-flex align-items-center justify-content-between"
      >
        <div class="d-flex gap-5 StuDashboard-stats-responsive">
          <div class="StuDashboard-stat-item">
            <div class="label">我的功課均分</div>
            <div class="value-group mt-1">
              <h2 class="text-navy mb-0">{{ avgHwScore }}</h2>
              <span class="unit">分</span>
            </div>
          </div>
          <div class="StuDashboard-stat-item border-start ps-md-5">
            <div class="label">我的考試均分</div>
            <div class="value-group mt-1">
              <h2 class="text-navy mb-0">{{ avgExamScore }}</h2>
              <span class="unit">分</span>
            </div>
          </div>
          <div class="StuDashboard-stat-item border-start ps-md-5">
            <div class="label">討論區參與</div>
            <div class="value-group mt-1">
              <h2 class="text-navy mb-0">{{ discussionCount }}</h2>
              <span class="unit">次發言</span>
            </div>
          </div>
        </div>

        <button
          @click="handleOpenRank"
          class="StuDashboard-btn-rank shadow-sm d-none d-md-flex"
        >
          <i class="bi bi-trophy-fill me-2"></i>查看排行榜
        </button>
      </div>

      <button
        @click="handleOpenRank"
        class="StuDashboard-btn-rank w-100 mt-3 d-md-none shadow-sm"
      >
        <i class="bi bi-trophy-fill me-2"></i>查看排行榜
      </button>
    </div>

    <div class="StuDashboard-grid">
      <div class="StuDashboard-chart-card shadow-sm p-4">
        <h6 class="StuDashboard-chart-header text-navy">
          <i class="bi bi-graph-up me-2"></i>功課成績對照
          <small class="text-muted">(個人 vs 全班)</small>
        </h6>
        <div class="StuDashboard-canvas-box mt-3">
          <canvas id="hwCompareChart"></canvas>
        </div>
      </div>

      <div class="StuDashboard-chart-card shadow-sm p-4">
        <h6 class="StuDashboard-chart-header text-navy">
          <i class="bi bi-pencil-square me-2"></i>考試成績對照
          <small class="text-muted">(個人 vs 全班)</small>
        </h6>
        <div class="StuDashboard-canvas-box mt-3">
          <canvas id="examCompareChart"></canvas>
        </div>
      </div>
    </div>

    <Transition name="modal-fade">
      <div
        v-if="showRankModal"
        class="StuDashboard-modal-overlay"
        @click.self="showRankModal = false"
      >
        <div
          class="StuDashboard-modal-box shadow-lg animate__animated animate__zoomIn"
        >
          <div class="StuDashboard-modal-header">
            <h5 class="m-0 fw-bold">
              <i class="bi bi-trophy-fill me-2 text-warning"></i>班級匿名排行榜
            </h5>
            <button class="btn-close-custom" @click="handleCloseRank">✕</button>
          </div>
          <div class="StuDashboard-modal-body p-4">
            <StuRank />
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, nextTick, onUnmounted } from "vue";
import { rtdb as db } from "../../firebase/config";
import { ref as dbRef, onValue, push } from "firebase/database"; // 🌟 補上 push
import { getAuth } from "firebase/auth";
import { getFunctions, httpsCallable } from "firebase/functions";
import { Chart, registerables } from "chart.js";
import StuRank from "./Modal/StuRank.vue";
import "./StuDashboard.css";

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

// --- 🌟 補上行為紀錄函式 ---
const recordStudentAction = async (cId, uid, actionType) => {
  try {
    const logRef = dbRef(db, `courses/${cId}/logs/${uid}`);
    await push(logRef, {
      action: actionType,
      timestamp: Date.now(),
      platform: "web",
    });
  } catch (e) {
    console.error("行為紀錄失敗:", e);
  }
};

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

// --- 圖表繪製核心 (補強銷毀邏輯) ---
const updateChart = async (id, labels, myScores, color) => {
  await nextTick();
  const ctx = document.getElementById(id);
  if (!ctx) return;

  // 🌟 核心修正：僅保留「我的成績」資料集，移除 avgScores 相關邏輯
  const data = {
    labels,
    datasets: [
      {
        label: "我的成績",
        data: myScores,
        borderColor: color,
        backgroundColor: color + "20",
        tension: 0.1, // 控制組改用基礎折線，減少視覺引導
        fill: true,
        pointRadius: 5,
        pointBackgroundColor: color,
        borderWidth: 2,
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
          legend: {
            display: true,
            position: "bottom",
            labels: { boxWidth: 10, font: { size: 12 } },
          },
          tooltip: {
            backgroundColor: "rgba(255, 255, 255, 0.9)",
            titleColor: "#1e293b",
            bodyColor: "#1e293b",
            borderColor: "#e2e8f0",
            borderWidth: 1,
            displayColors: false,
          },
        },
        scales: {
          y: {
            min: 0,
            max: 100,
            grid: { color: "#f1f5f9" },
            ticks: { stepSize: 20, color: "#94a3b8" },
          },
          x: {
            grid: { display: false },
            ticks: { color: "#94a3b8" },
          },
        },
      },
    });
    if (id === "hwCompareChart") hwChartInstance = newChart;
    else examChartInstance = newChart;
  }
};
onMounted(() => {
  const uid = getAuth().currentUser?.uid;
  if (!uid) return;

  // 🌟 現在這個函式已經定義了，不會再噴錯
  recordStudentAction(courseId, uid, "進入學習診斷儀表板");

  // 1. 監聽功課數據
  onValue(dbRef(db, `courses/${courseId}/assignments`), (snap) => {
    const data = snap.val() || {};
    const processedHw = Object.entries(data).map(([id, val]) => ({
      title: val.title,
      score: val.submissions?.[uid]?.score || 0,
      avg: val.stats?.avgScore || 0,
    }));
    performanceSummary.value.hw = processedHw;

    updateChart(
      "hwCompareChart",
      processedHw.map((i) => i.title),
      processedHw.map((i) => i.score),
      processedHw.map((i) => i.avg),
      "#4a70a9",
    );
  });

  // 2. 監聽考試數據
  onValue(dbRef(db, `courses/${courseId}/exams`), (snap) => {
    const data = snap.val() || {};
    const processedExam = Object.entries(data).map(([id, val]) => ({
      title: val.title,
      score: val.submissions?.[uid]?.score || 0,
      avg: val.stats?.avgScore || 0,
    }));
    performanceSummary.value.exam = processedExam;

    updateChart(
      "examCompareChart",
      processedExam.map((i) => i.title),
      processedExam.map((i) => i.score),
      processedExam.map((i) => i.avg),
      "#10b981",
    );
  });
});

// 🌟 卸載時銷毀圖表，防止記憶體洩漏
onUnmounted(() => {
  if (hwChartInstance) hwChartInstance.destroy();
  if (examChartInstance) examChartInstance.destroy();
});

const handleOpenRank = () => {
  showRankModal.value = true;
};
const handleCloseRank = () => {
  showRankModal.value = false;
};
</script>
