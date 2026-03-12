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
            <div class="value-group">
              <h2 class="text-navy">{{ avgHwScore }}</h2>
              <span class="unit">分</span>
            </div>
          </div>

          <div class="StuDashboard-stat-item border-start ps-md-5">
            <div class="label">我的考試均分</div>
            <div class="value-group">
              <h2 class="text-navy">{{ avgExamScore }}</h2>
              <span class="unit">分</span>
            </div>
          </div>

          <div class="StuDashboard-stat-item border-start ps-md-5">
            <div class="label">討論區參與</div>
            <div class="value-group">
              <h2 class="text-navy">{{ discussionCount }}</h2>
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
          style="width: 95%; max-width: 650px"
        >
          <div
            class="StuDashboard-modal-header d-flex justify-content-between align-items-center p-4"
          >
            <div class="d-flex align-items-center">
              <div class="modal-icon-badge me-3">
                <i class="bi bi-trophy-fill text-warning"></i>
              </div>
              <h5 class="m-0 fw-900 text-navy">班級積分排行榜</h5>
            </div>

            <button class="btn-close-minimal" @click="showRankModal = false">
              <i class="bi bi-x-lg"></i>
            </button>
          </div>

          <div class="StuDashboard-modal-body p-3 p-md-4 custom-scrollbar">
            <StuRank :course-id="props.courseId" />
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, nextTick, onUnmounted } from "vue";
import { rtdb as db } from "../../firebase/config";
import { ref as dbRef, onValue, push } from "firebase/database";
import { getAuth } from "firebase/auth";
import { Chart, registerables } from "chart.js";
import StuRank from "./Modal/StuRank.vue";
import "./StuDashboard.css";

Chart.register(...registerables);

const props = defineProps({ courseId: String });
const courseId = props.courseId;

// --- 狀態控制 ---
const showRankModal = ref(false);
const discussionCount = ref(0);
const performanceSummary = ref({ hw: [], exam: [] });

// 湛藍主題色變數
const THEME_NAVY = "#4a70a9";

let hwChartInstance = null;
let examChartInstance = null;

// --- 🌟 SRL 行為紀錄 ---
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

// --- 計算均分 (具備 Baseline 對齊的資料源) ---
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

// --- 圖表繪製核心 (優化樣式與銷毀) ---
const updateChart = async (id, labels, myScores, color) => {
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
        backgroundColor: color + "15", // 更淡的填充色
        tension: 0.3, // 稍微增加圓滑度，符合極簡美感
        fill: true,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: "#ffffff",
        pointBorderColor: color,
        pointBorderWidth: 2,
        borderWidth: 2.5,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false }, // 隱藏圖例讓畫面更乾淨
      tooltip: {
        backgroundColor: "rgba(255, 255, 255, 0.95)",
        titleColor: "#4a70a9",
        bodyColor: "#1e293b",
        borderColor: "rgba(74, 112, 169, 0.1)",
        borderWidth: 1,
        padding: 12,
        cornerRadius: 10,
        displayColors: false,
      },
    },
    scales: {
      y: {
        min: 0,
        max: 100,
        grid: { color: "rgba(74, 112, 169, 0.05)", drawBorder: false },
        ticks: { stepSize: 20, color: "#94a3b8", font: { weight: "600" } },
      },
      x: {
        grid: { display: false },
        ticks: { color: "#94a3b8", font: { weight: "600" } },
      },
    },
  };

  let instance = id === "hwCompareChart" ? hwChartInstance : examChartInstance;

  if (instance) {
    instance.data = data;
    instance.update();
  } else {
    const newChart = new Chart(ctx, {
      type: "line",
      data,
      options: chartOptions,
    });
    if (id === "hwCompareChart") hwChartInstance = newChart;
    else examChartInstance = newChart;
  }
};

onMounted(() => {
  const auth = getAuth();
  const uid = auth.currentUser?.uid;
  if (!uid) return;

  recordStudentAction(courseId, uid, "進入學習診斷儀表板");

  // 1. 監聽功課數據
  onValue(dbRef(db, `courses/${courseId}/assignments`), (snap) => {
    if (!snap.exists()) return;
    const data = snap.val();
    const processedHw = Object.entries(data)
      .map(([id, val]) => ({
        title: val.title || "未命名功課",
        score:
          val.scores?.[uid]?.score !== undefined ? val.scores[uid].score : null,
      }))
      .filter((i) => i.score !== null);

    performanceSummary.value.hw = processedHw;
    updateChart(
      "hwCompareChart",
      processedHw.map((i) => i.title),
      processedHw.map((i) => i.score),
      THEME_NAVY,
    );
  });

  // 2. 監聽考試數據
  onValue(dbRef(db, `courses/${courseId}/exams`), (snap) => {
    if (!snap.exists()) return;
    const data = snap.val();
    const processedExam = Object.entries(data)
      .map(([id, val]) => ({
        title: val.title || "未命名考試",
        score:
          val.scores?.[uid]?.score !== undefined ? val.scores[uid].score : null,
      }))
      .filter((i) => i.score !== null);

    performanceSummary.value.exam = processedExam;
    updateChart(
      "examCompareChart",
      processedExam.map((i) => i.title),
      processedExam.map((i) => i.score),
      THEME_NAVY,
    );
  });

  // 3. 監聽討論參與
  onValue(dbRef(db, `courses/${courseId}/discussions`), (snap) => {
    if (!snap.exists()) {
      discussionCount.value = 0;
      return;
    }
    let totalMsgs = 0;
    Object.values(snap.val()).forEach((disc) => {
      if (disc.messages) {
        totalMsgs += Object.values(disc.messages).filter(
          (m) => m.userId === uid,
        ).length;
      }
    });
    discussionCount.value = totalMsgs;
  });
});

// 🌟 組件銷毀時清理圖表
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
