<template>
  <div
    class="TrDashboard container-fluid py-4 animate__animated animate__fadeIn"
  >
    <div class="stats-full-width mb-4">
      <div
        class="stats-card shadow-sm d-flex align-items-center justify-content-between bg-white rounded-4 border-0"
      >
        <div class="stats-main p-4">
          <div class="label text-muted fw-bold small">班級總人數</div>
          <div class="d-flex align-items-baseline gap-2 mt-2">
            <h2 class="text-navy fw-bold mb-0 display-6">{{ totalCount }}</h2>
            <span class="text-muted small">位學生</span>
          </div>
        </div>

        <div class="stats-action-area p-4 border-start">
          <button
            class="btn-quick-kanban"
            @click="showStudentList = true"
            title="開啟分組管理看板"
          >
            <div class="button-label mt-1">分組管理</div>
          </button>
        </div>
      </div>

      <TrList
        v-if="showStudentList"
        :courseId="courseId"
        :groups="experimentGroups"
        @close="showStudentList = false"
      />
    </div>

    <div class="dashboard-grid mb-4">
      <div class="chart-card shadow-sm p-4">
        <h6 class="chart-header text-navy">
          <i class="bi bi-clock-history me-2"></i>24 小時活躍趨勢
        </h6>
        <div class="chart-container"><canvas id="activityChart"></canvas></div>
      </div>

      <div class="chart-card shadow-sm p-4">
        <h6 class="chart-header text-navy">
          <i class="bi bi-book me-2"></i>教材點閱進度
        </h6>
        <div class="chart-container"><canvas id="materialChart"></canvas></div>
      </div>

      <div class="chart-card shadow-sm p-4">
        <h6 class="chart-header text-navy">
          <i class="bi bi-journal-check me-2"></i>作業繳交率
        </h6>
        <div class="chart-container"><canvas id="hwChart"></canvas></div>
      </div>

      <div class="chart-card shadow-sm p-4">
        <h6 class="chart-header text-navy">
          <i class="bi bi-pencil-square me-2"></i>考試繳交率
        </h6>
        <div class="chart-container"><canvas id="examChart"></canvas></div>
      </div>

      <div class="chart-card shadow-sm p-4">
        <h6 class="chart-header text-navy">
          <i class="bi bi-pie-chart-fill me-2"></i>討論區活躍度
        </h6>
        <div class="chart-container pie-wrapper">
          <canvas id="discussionPie"></canvas>
        </div>
      </div>

      <div class="chart-card shadow-sm p-4">
        <h6 class="chart-header text-navy">
          <i class="bi bi-flag-fill me-2"></i>課程單元進度
        </h6>
        <div class="chart-container pie-wrapper">
          <canvas id="progressChart"></canvas>
        </div>
      </div>
    </div>

    <div class="ai-analysis-full-width">
      <div class="chart-card shadow-sm p-4 ai-card border-0 rounded-4">
        <h6 class="chart-header text-navy">
          <i class="bi bi-robot me-2"></i>AI 統合分析
        </h6>
        <div class="ai-analysis-box mt-3 p-4 rounded-3 bg-light">
          <p class="mb-0 text-navy lh-lg italic">
            {{ aiAnalysis || "分析引擎掃描中... 正在整合全班學習數據" }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, nextTick } from "vue";
import { useRoute } from "vue-router";
// 🌟 修正：路徑與您的 Firebase 配置對接
import { rtdb as db } from "../../firebase/config";
import { ref as dbRef, onValue, get } from "firebase/database";
import { Chart, registerables } from "chart.js";
import Swal from "sweetalert2";
import "./TrDashboard.css";

// 🌟 導入 Modal 組件
import TrList from "./Modal/TrList.vue";

Chart.register(...registerables);

const route = useRoute();
const courseId = route.params.courseId;

// --- 1. 狀態定義 ---
const profiles = ref({});
const students = ref([]);
const experimentGroups = ref([]);
const aiAnalysis = ref("");
const chartInstances = {};
const showStudentList = ref(false);

// 🌟 修正關鍵：補回 totalCount 解決渲染報錯
const totalCount = computed(() => students.value.length);

const chartConfigs = [
  {
    id: "activityChart",
    title: "24 小時活躍趨勢",
    icon: "bi-clock-history",
    type: "line",
  },
  { id: "materialChart", title: "教材點閱進度", icon: "bi-book", type: "bar" },
  { id: "hwChart", title: "作業繳交率", icon: "bi-journal-check", type: "bar" },
  {
    id: "examChart",
    title: "考試繳交率",
    icon: "bi-pencil-square",
    type: "bar",
  },
  {
    id: "discussionPie",
    title: "討論區活躍度",
    icon: "bi-pie-chart-fill",
    type: "pie",
  },
  {
    id: "progressChart",
    title: "課程單元進度",
    icon: "bi-flag-fill",
    type: "doughnut",
  },
];

// --- 2. 資料監聽與圖表連動 ---
onMounted(() => {
  const coursePath = `courses/${courseId}`;

  // A. 監聽課程基礎資訊
  onValue(dbRef(db, coursePath), (snap) => {
    const d = snap.val();
    if (!d) return;

    profiles.value = d.profiles || {};
    students.value = Object.values(d.profiles || {});

    // 實驗分組數據更新
    experimentGroups.value = d.experiment?.groups
      ? Object.entries(d.experiment.groups).map(([id, g]) => ({ id, ...g }))
      : [];

    // B. 監聽追蹤數據以渲染動態圖表
    onValue(dbRef(db, `student_traces`), (traceSnap) => {
      const allTraces = traceSnap.val() || {};
      const courseTraces = Object.entries(allTraces)
        .filter(([key]) => key.startsWith(courseId))
        .map(([_, v]) => v);

      nextTick(() => {
        updateAllCharts(d, courseTraces);
      });
    });
  });
});

// --- 3. 圖表計算邏輯核心 ---
const updateAllCharts = (courseData, traces) => {
  const now = new Date();
  const total = students.value.length || 1;

  // A. 任務與考試繳交率
  const hwDone = traces.filter((t) => t.hwStatus === "submitted").length;
  renderChart(
    "hwChart",
    ["已繳交", "未完成"],
    [hwDone, Math.max(0, total - hwDone)],
    "bar",
    "#3a5a8a",
  );

  const examDone = traces.filter((t) => t.examStatus === "submitted").length;
  renderChart(
    "examChart",
    ["已繳交", "未完成"],
    [examDone, Math.max(0, total - examDone)],
    "bar",
    "#f44336",
  );

  // B. 單元開放狀態
  const units = courseData.units || {};
  const visibleUnits = Object.values(units).filter((u) => u.visible).length;
  renderChart(
    "progressChart",
    ["已開放", "未開放"],
    [visibleUnits, Object.keys(units).length - visibleUnits],
    "doughnut",
  );

  // C. 教材閱讀分佈
  const matLabels = Object.values(courseData.materials || {}).map(
    (m) => m.title || "未命名",
  );
  const matData = matLabels.map(() => Math.floor(Math.random() * 20)); // 模擬數據，可改為 trace 計數
  renderChart("materialChart", matLabels, matData, "bar", "#4caf50");

  // D. 24 小時活躍趨勢時間軸
  const hourLabels = Array.from({ length: 24 }, (_, i) => {
    const d = new Date(now.getTime() - (23 - i) * 60 * 60 * 1000);
    return `${d.getHours()}:00`;
  });
  const activityData = hourLabels.map(() => Math.floor(Math.random() * 10));
  renderChart("activityChart", hourLabels, activityData, "line", "#3a5a8a");

  // E. 討論區活躍度 (圓餅圖)
  const discussions = courseData.discussions || {};
  const discLabels = Object.values(discussions).map((d) => d.title || "話題");
  const discData = discLabels.map(() => Math.floor(Math.random() * 15));
  renderChart(
    "discussionPie",
    discLabels.length ? discLabels : ["暫無數據"],
    discData.length ? discData : [1],
    "pie",
  );
};

const renderChart = (id, labels, data, type, color) => {
  const ctx = document.getElementById(id);
  if (!ctx || !labels.length) return;
  if (chartInstances[id]) chartInstances[id].destroy();

  const isPie = type === "pie" || type === "doughnut";

  chartInstances[id] = new Chart(ctx, {
    type: type,
    data: {
      labels: labels,
      datasets: [
        {
          label: "學生人數/次數",
          data: data,
          backgroundColor: isPie
            ? ["#3a5a8a", "#4caf50", "#f44336", "#ff9800", "#eef2ff"]
            : color || "#4a70a9",
          borderRadius: type === "bar" ? 5 : 0,
          fill: type === "line",
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: isPie, position: "bottom" } },
      scales: isPie ? {} : { y: { beginAtZero: true } },
    },
  });
};

// --- 4. 數據下載邏輯 ---
const downloadLogsCSV = async (student) => {
  const snap = await get(dbRef(db, `courses/${courseId}/logs/${student.uid}`));
  if (!snap.exists()) return Swal.fire("提示", "該學生尚無操作紀錄", "info");

  const logs = snap.val();
  const csvContent =
    "\ufeff時間,動作,詳細內容\n" +
    Object.values(logs)
      .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
      .map(
        (l) =>
          `${new Date(l.timestamp).toLocaleString()},${l.action || "一般"},${l.content || ""}`,
      )
      .join("\n");

  const link = document.createElement("a");
  link.href = URL.createObjectURL(new Blob([csvContent], { type: "text/csv" }));
  link.download = `${student.displayName || "學生"}_學習歷程.csv`;
  link.click();
};
</script>
