<template>
  <div
    class="StuDashboard StuDashboard-container animate__animated animate__fadeIn"
  >
    <!-- 1. 頂部數據統計卡片 -->
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

        <!-- 桌機版排行榜按鈕 -->
        <button
          @click="handleOpenRank"
          class="StuDashboard-btn-rank shadow-sm d-none d-md-flex align-items-center"
        >
          <i class="bi bi-trophy-fill me-2 text-warning"></i>查看排行榜
        </button>
      </div>

      <!-- 手機版排行榜按鈕 -->
      <button
        @click="handleOpenRank"
        class="StuDashboard-btn-rank w-100 mt-3 d-md-none shadow-sm"
      >
        <i class="bi bi-trophy-fill me-2 text-warning"></i>查看排行榜
      </button>
    </div>

    <!-- 2. 成績對照圖表區 -->
    <div class="StuDashboard-flex-column gap-4">
      <div class="StuDashboard-chart-card shadow-sm p-4 mb-4">
        <h6 class="StuDashboard-chart-header text-navy fw-bold">
          <i class="bi bi-graph-up me-2"></i>功課成績對照
          <small class="text-muted ms-1">(個人 vs 組內指標)</small>
        </h6>
        <div
          class="StuDashboard-canvas-box mt-3"
          style="position: relative; height: 350px"
        >
          <canvas id="hwCompareChart"></canvas>
        </div>
      </div>

      <div class="StuDashboard-chart-card shadow-sm p-4 mb-4">
        <h6 class="StuDashboard-chart-header text-navy fw-bold">
          <i class="bi bi-pencil-square me-2"></i>考試成績對照
          <small class="text-muted ms-1">(個人 vs 組內指標)</small>
        </h6>
        <div
          class="StuDashboard-canvas-box mt-3"
          style="position: relative; height: 350px"
        >
          <canvas id="examCompareChart"></canvas>
        </div>
      </div>
    </div>

    <!-- 3. 排行榜彈窗 (Modal) -->
    <Transition name="modal-fade">
      <div
        v-if="showRankModal"
        class="StuDashboard-modal-overlay"
        @click.self="handleCloseRank"
      >
        <div
          class="StuDashboard-modal-box shadow-lg animate__animated animate__zoomIn animate__faster"
        >
          <!-- 彈窗頭部 -->
          <!-- 彈窗頭部 -->
          <div
            class="StuDashboard-modal-header d-flex justify-content-between align-items-center p-4 border-bottom"
          >
            <div class="d-flex align-items-center overflow-hidden">
              <div
                class="modal-icon-badge me-3 shadow-sm d-flex align-items-center justify-content-center bg-white border rounded-circle"
                style="width: 48px; height: 48px"
              >
                <i class="bi bi-trophy-fill text-warning fs-4"></i>
              </div>
              <div class="overflow-hidden">
                <div class="modal-header-title-group">
                  <h5 class="m-0 fw-900 text-navy text-truncate">
                    班級積分排行榜
                  </h5>
                  <span
                    class="Strank-mode-badge-mini"
                    :class="{ 'is-anonymous': rankAnonymousStatus }"
                  >
                    <i
                      :class="
                        rankAnonymousStatus
                          ? 'bi bi-incognito'
                          : 'bi bi-person-check'
                      "
                    ></i>
                    {{ rankAnonymousStatus ? "匿名模式" : "實名模式" }}
                  </span>
                </div>
                <p class="text-muted small mb-0 d-none d-sm-block">
                  根據功課與考試總分即時計算
                </p>
              </div>
            </div>
            <button class="btn-close-minimal ms-2" @click="handleCloseRank">
              <i class="bi bi-x-lg"></i>
            </button>
          </div>

          <!-- 彈窗主體 (StuRank 組件) -->
          <div
            class="StuDashboard-modal-body p-0 custom-scrollbar"
            style="max-height: 70vh; overflow-y: auto"
          >
            <!-- 🌟 加入 @update-is-anonymous 監聽 -->
            <StuRank
              :course-id="props.courseId"
              @update-is-anonymous="handleRankAnonUpdate"
            />
          </div>

          <!-- 彈窗底部 -->
          <div class="p-3 bg-light text-center rounded-bottom-4"></div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, nextTick, onUnmounted } from "vue";
import { rtdb as db } from "../../firebase/config";
import { ref as dbRef, onValue } from "firebase/database";
import { getAuth } from "firebase/auth";
import { Chart, registerables } from "chart.js";
import StuRank from "./Modal/StuRank.vue";
import "./StuDashboard.css";
import { recordStudentAction } from "../../utils/logger.js";

Chart.register(...registerables);

const props = defineProps({ courseId: String });
const courseId = props.courseId;

// --- 狀態控制 ---
const showRankModal = ref(false);
const discussionCount = ref(0);
const performanceSummary = ref({ hw: [], exam: [] });
const groupMemberIds = ref([]);
const pageEnterTime = ref(null);
const rankAnonymousStatus = ref(true);

const THEME_NAVY = "#4a70a9";
let hwChartInstance = null;
let examChartInstance = null;

// --- 🌟 新增：排行榜控制邏輯 ---
const handleOpenRank = () => {
  showRankModal.value = true;
  // 鎖定背景捲動 (防止彈窗開啟時後方頁面還能滑動)
  document.body.style.overflow = "hidden";

  // 行為追蹤紀錄
  recordStudentAction(courseId, "查看積分排行榜");
};

const handleCloseRank = () => {
  showRankModal.value = false;
  // 恢復背景捲動
  document.body.style.overflow = "auto";
};

// 額外檢查：在元件卸載時確保捲動恢復正常
onUnmounted(() => {
  document.body.style.overflow = "auto";
  if (hwChartInstance) hwChartInstance.destroy();
  if (examChartInstance) examChartInstance.destroy();
});

// --- 🌟 1. 統計計算邏輯 (修正：包含真實 0 分與樣本防呆) ---
const calculateGroupStats = (scores) => {
  // 注意：scores 傳入前應已過濾掉「未繳交者」，保留含 0 在內的真實分數
  if (!scores || scores.length === 0) return { median: 0, top25Avg: 0 };

  const validScores = scores
    .filter((s) => typeof s === "number" && !isNaN(s))
    .sort((a, b) => a - b);

  const len = validScores.length;
  if (len === 0) return { median: 0, top25Avg: 0 };

  // 計算中位數
  const mid = Math.floor(len / 2);
  const median =
    len % 2 !== 0
      ? validScores[mid]
      : (validScores[mid - 1] + validScores[mid]) / 2;

  // 計算領先指標 (前 25%)
  let top25Avg = 0;
  if (len < 4) {
    // 樣本不足 4 人時，前 25% 平均即為該組目前最高分
    top25Avg = validScores[len - 1];
  } else {
    const topCount = Math.max(1, Math.ceil(len * 0.25));
    const topScores = [...validScores].sort((a, b) => b - a).slice(0, topCount);
    top25Avg = topScores.reduce((a, b) => a + b, 0) / topScores.length;
  }

  return {
    median: Math.round(median),
    top25Avg: Math.round(top25Avg),
  };
};

// --- 🌟 補回缺失的平均分計算 (用於儀表板卡片顯示) ---
const avgHwScore = computed(() => {
  const scores = performanceSummary.value.hw
    .map((i) => i.score)
    .filter((v) => typeof v === "number");
  return scores.length
    ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
    : 0;
});

const avgExamScore = computed(() => {
  const scores = performanceSummary.value.exam
    .map((i) => i.score)
    .filter((v) => typeof v === "number");
  return scores.length
    ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
    : 0;
});

// --- 🌟 2. 圖表繪製核心 ---
const updateChart = async (id, labels, myScores, medians, topAvgs, color) => {
  await nextTick();
  const ctx = document.getElementById(id);
  if (!ctx) return;

  if (id === "hwCompareChart" && hwChartInstance) hwChartInstance.destroy();
  if (id === "examCompareChart" && examChartInstance)
    examChartInstance.destroy();

  const data = {
    labels,
    datasets: [
      {
        label: "我的成績",
        data: myScores,
        borderColor: color,
        backgroundColor: color + "15",
        tension: 0.3,
        fill: true,
        borderWidth: 3,
        pointRadius: 5,
        zIndex: 10,
      },
      {
        label: "組內中位數",
        data: medians,
        borderColor: "#94a3b8", // 灰色
        borderDash: [5, 5],
        pointRadius: 0,
        fill: false,
        tension: 0.1,
      },
      {
        label: "組內前 25% 平均",
        data: topAvgs,
        borderColor: "#fbbf24", // 金色
        borderDash: [2, 2],
        pointRadius: 0,
        fill: false,
        tension: 0.1,
      },
    ],
  };

  const newChart = new Chart(ctx, {
    type: "line",
    data,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: true, position: "bottom" } },
      scales: {
        y: {
          min: 0,
          max: 100,
          ticks: { stepSize: 20, color: "#94a3b8" },
          grid: { color: "#f1f5f9" },
        },
        x: { ticks: { color: "#94a3b8" } },
      },
    },
  });

  if (id === "hwCompareChart") hwChartInstance = newChart;
  else examChartInstance = newChart;
};

// --- 🌟 3. 初始化與監聽邏輯 ---
onMounted(() => {
  const auth = getAuth();
  const uid = auth.currentUser?.uid;
  if (!uid) return;

  pageEnterTime.value = Date.now();
  recordStudentAction(courseId, "進入學習診斷儀表板");

  // A. 識別組別成員
  onValue(dbRef(db, `courses/${courseId}/profiles`), (snap) => {
    const profiles = snap.val() || {};
    const myGroupId = profiles[uid]?.groupId;
    if (myGroupId) {
      groupMemberIds.value = Object.keys(profiles).filter(
        (k) => profiles[k].groupId === myGroupId,
      );
    }
  });

  // B. 處理功課分數 (Assignments)
  onValue(dbRef(db, `courses/${courseId}/assignments`), (snap) => {
    if (!snap.exists()) return;
    const assignmentsData = snap.val();
    const hwList = [];

    Object.entries(assignmentsData).forEach(([id, data]) => {
      const myScore = data.scores?.[uid]?.score;
      if (myScore === undefined) return;

      // 🌟 判定組員是否繳交：有 status 或已給分則納入統計
      const groupScores = groupMemberIds.value
        .map((mId) => {
          const record = data.scores?.[mId];
          const hasSubmitted =
            record?.status === "submitted" || record?.score !== undefined;
          return hasSubmitted ? Number(record.score) || 0 : null;
        })
        .filter((s) => s !== null);

      const { median, top25Avg } = calculateGroupStats(groupScores);

      hwList.push({
        title: data.title || "功課",
        score: myScore,
        median,
        top25Avg,
        createdAt: data.createdAt || 0,
      });
    });

    hwList.sort((a, b) => a.createdAt - b.createdAt);
    performanceSummary.value.hw = hwList;
    if (hwList.length > 0) {
      updateChart(
        "hwCompareChart",
        hwList.map((i) => i.title),
        hwList.map((i) => i.score),
        hwList.map((i) => i.median),
        hwList.map((i) => i.top25Avg),
        THEME_NAVY,
      );
    }
  });

  // C. 處理測驗分數 (Exams)
  onValue(dbRef(db, `courses/${courseId}/exams`), (snap) => {
    if (!snap.exists()) return;
    const examsData = snap.val();
    const examList = [];

    Object.entries(examsData).forEach(([id, data]) => {
      const myScore = data.scores?.[uid]?.score;
      if (myScore === undefined) return;

      // 🌟 判定組員是否繳交
      const groupScores = groupMemberIds.value
        .map((mId) => {
          const record = data.scores?.[mId];
          const hasSubmitted =
            record?.status === "submitted" || record?.score !== undefined;
          return hasSubmitted ? Number(record.score) || 0 : null;
        })
        .filter((s) => s !== null);

      const { median, top25Avg } = calculateGroupStats(groupScores);

      examList.push({
        title: data.title || "測驗",
        score: myScore,
        median,
        top25Avg,
        createdAt: data.createdAt || 0,
      });
    });

    examList.sort((a, b) => a.createdAt - b.createdAt);
    performanceSummary.value.exam = examList;
    if (examList.length > 0) {
      updateChart(
        "examCompareChart",
        examList.map((i) => i.title),
        examList.map((i) => i.score),
        examList.map((i) => i.median),
        examList.map((i) => i.top25Avg),
        "#6366f1",
      );
    }
  });

  // D. 討論參與監聽
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

onUnmounted(() => {
  if (hwChartInstance) hwChartInstance.destroy();
  if (examChartInstance) examChartInstance.destroy();
});

const handleRankAnonUpdate = (status) => {
  console.log("收到匿名狀態更新:", status);
  rankAnonymousStatus.value = status;
};
</script>
