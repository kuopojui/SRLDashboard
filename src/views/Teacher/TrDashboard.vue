<template>
  <div
    class="TrDashboard container-fluid py-4 animate__animated animate__fadeIn"
  >
    <div class="row mb-4">
      <div class="col-12">
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
            <button class="btn-quick-kanban" @click="showStudentList = true">
              <i class="bi bi-people-fill"></i>
              <span class="button-label">分組管理</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="row g-4 mb-4">
      <div
        v-for="chart in chartConfigs"
        :key="chart.id"
        class="col-12 col-lg-6"
      >
        <div class="chart-card shadow-sm p-4 bg-white rounded-4 border-0 h-100">
          <h6 class="chart-header text-navy fw-bold mb-3">
            <i :class="['bi', chart.icon, 'me-2']"></i>{{ chart.title }}
          </h6>
          <div
            class="chart-container"
            style="position: relative; height: 300px"
          >
            <div
              v-if="!hasData[chart.id]"
              class="no-data-overlay d-flex align-items-center justify-content-center h-100"
            >
              <span class="text-muted small">暫無數據內容</span>
            </div>
            <canvas :id="chart.id"></canvas>
          </div>
        </div>
      </div>
    </div>

    <div class="row">
      <div class="col-12">
        <div
          class="chart-card shadow-sm p-4 ai-card border-0 rounded-4 bg-white"
        >
          <h6 class="chart-header text-navy fw-bold d-flex align-items-center">
            <i class="bi bi-robot me-2 fs-4"></i>AI 學習數據智慧分析報告
          </h6>
          <div
            class="ai-analysis-box mt-3 p-4 rounded-3"
            style="background-color: #efece3; border-left: 5px solid #4a70a9"
          >
            <p class="mb-0 text-navy lh-lg fw-medium">
              {{
                aiAnalysis || "數據掃描中... 等待全班學習行為匯入後生成報告。"
              }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <TrList
      v-if="showStudentList"
      :courseId="courseId"
      :groups="experimentGroups"
      @close="showStudentList = false"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, computed, nextTick } from "vue";
import { useRoute } from "vue-router";
import { rtdb as db } from "../../firebase/config";
import { ref as dbRef, onValue } from "firebase/database";
import { Chart, registerables } from "chart.js";
import "./TrDashboard.css";
import TrList from "./Modal/TrList.vue";

Chart.register(...registerables);
const route = useRoute();
const courseId = route.params.id || route.params.courseId;

const students = ref([]);
const experimentGroups = ref([]);
const aiAnalysis = ref("");
const chartInstances = {};
const showStudentList = ref(false);
const hasData = ref({});

const totalCount = computed(() => students.value.length);

const chartConfigs = [
  {
    id: "activityChart",
    title: "24小時活躍趨勢",
    icon: "bi-clock-history",
    color: "#4a70a9",
    type: "line",
  },
  {
    id: "materialChart",
    title: "教材點閱分佈",
    icon: "bi-book",
    color: "#2d6a4f",
    type: "bar",
  },
  {
    id: "hwChart",
    title: "功課繳交率",
    icon: "bi-journal-check",
    color: "#BF4646",
    type: "bar",
  },
  {
    id: "examChart",
    title: "測驗繳交率",
    icon: "bi-pencil-square",
    color: "#ca6702",
    type: "bar",
  },
  {
    id: "discussionPie",
    title: "討論區參與率",
    icon: "bi-pie-chart-fill",
    color: "multi",
    type: "pie",
  },
  {
    id: "progressChart",
    title: "課程單元開放度",
    icon: "bi-flag-fill",
    color: "#5e548e",
    type: "doughnut",
  },
];

onMounted(() => {
  if (!courseId) return;

  onValue(dbRef(db, `courses/${courseId}`), (snap) => {
    const data = snap.val();
    if (!data) return;
    students.value = Object.values(data.profiles || {});
    experimentGroups.value = data.experiment?.groups
      ? Object.values(data.experiment.groups)
      : [];

    onValue(dbRef(db, `student_traces/${courseId}`), (traceSnap) => {
      const traces = traceSnap.val() ? Object.values(traceSnap.val()) : [];
      nextTick(() => updateAllCharts(data, traces));
    });
  });
});

const updateAllCharts = (courseData, traces) => {
  const total = totalCount.value || 0;

  // 1. 24H 活躍趨勢 - 真實分析
  const hourCounts = new Array(24).fill(0);
  traces.forEach((t) => {
    if (t.lastActive) hourCounts[new Date(t.lastActive).getHours()]++;
  });
  renderChart(
    "activityChart",
    Array.from({ length: 24 }, (_, i) => `${i}:00`),
    hourCounts.some((c) => c > 0) ? hourCounts : [],
    "line",
    "#4a70a9",
  );

  // 2. 教材點閱 - 真實分析
  const mats = courseData.materials || {};
  const matLabels = Object.values(mats).map((m) => m.title);
  const matData = Object.keys(mats).map(
    (id) => traces.filter((t) => t.readMaterials?.[id]).length,
  );
  renderChart(
    "materialChart",
    matLabels,
    matData.some((d) => d > 0) ? matData : [],
    "bar",
    "#2d6a4f",
  );

  // 3. 功課繳交率 - 真實分析
  const hwSubmitted = traces.filter((t) => t.hwStatus === "submitted").length;
  renderChart(
    "hwChart",
    ["已繳交", "未完成"],
    total > 0 && hwSubmitted > 0 ? [hwSubmitted, total - hwSubmitted] : [],
    "bar",
    "#BF4646",
  );

  // 4. 測驗繳交率 - 真實分析
  const examSubmitted = traces.filter(
    (t) => t.examStatus === "submitted",
  ).length;
  renderChart(
    "examChart",
    ["已繳交", "未完成"],
    total > 0 && examSubmitted > 0
      ? [examSubmitted, total - examSubmitted]
      : [],
    "bar",
    "#ca6702",
  );

  // 5. 討論區參與率 - 真實分析
  const discs = courseData.discussions || {};
  const discLabels = Object.values(discs).map((d) => d.title);
  const discData = Object.keys(discs).map(
    (id) => traces.filter((t) => t.posts?.[id]).length,
  );
  renderChart(
    "discussionPie",
    discLabels,
    discData.some((d) => d > 0) ? discData : [],
    "pie",
  );

  // 6. 課程單元開放度 - 真實分析
  const units = courseData.units || {};
  const opened = Object.values(units).filter((u) => u.visible).length;
  renderChart(
    "progressChart",
    ["已開放", "待開放"],
    Object.keys(units).length > 0
      ? [opened, Object.keys(units).length - opened]
      : [],
    "doughnut",
    "#5e548e",
  );

  generateAIAnalysis(total, hwSubmitted, examSubmitted, traces);
};

const renderChart = (id, labels, data, type, color) => {
  const ctx = document.getElementById(id);
  if (!ctx) return;
  if (chartInstances[id]) chartInstances[id].destroy();

  hasData.value[id] = data.length > 0 && data.some((d) => d > 0);
  if (!hasData.value[id]) return;

  const isPie = type === "pie" || type === "doughnut";
  chartInstances[id] = new Chart(ctx, {
    type: type,
    data: {
      labels: labels,
      datasets: [
        {
          data: data,
          backgroundColor: isPie
            ? ["#4a70a9", "#2d6a4f", "#BF4646", "#ca6702", "#5e548e", "#00b4d8"]
            : color,
          tension: 0.4,
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

const generateAIAnalysis = (total, hw, exam, traces) => {
  if (total === 0)
    return (aiAnalysis.value = "目前尚無學生數據，無法進行分析。");

  const hwRate = Math.round((hw / total) * 100);
  const examRate = Math.round((exam / total) * 100);
  const inactive = traces.filter(
    (t) => Date.now() - new Date(t.lastActive).getTime() > 259200000,
  ).length;

  // 真實串接判斷
  let report = `分析報告：全班功課繳交率為 ${hwRate}%，測驗繳交率為 ${examRate}%。`;
  if (inactive > 0)
    report += ` 目前有 ${inactive} 名學生超過 3 天未活躍，建議關切。`;
  if (hwRate > 80) report += ` 班級整體學習動能強勁。`;

  aiAnalysis.value = report;
};
</script>
