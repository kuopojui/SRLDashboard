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
import { ref, onMounted, computed, nextTick, onUnmounted } from "vue";
import { useRoute } from "vue-router";
import { rtdb as db } from "../../firebase/config";
import { ref as dbRef, onValue } from "firebase/database";
import { Chart, registerables } from "chart.js";
import "./TrDashboard.css";
import TrList from "./Modal/TrList.vue";

Chart.register(...registerables);
const route = useRoute();
const courseId = route.params.id || route.params.courseId;

// --- 狀態控制 ---
const students = ref([]);
const experimentGroups = ref([]);
const aiAnalysis = ref("");
const chartInstances = {};
const showStudentList = ref(false);
const hasData = ref({});

const totalCount = computed(() => students.value.length);

// 圖表配置定義
const chartConfigs = [
  {
    id: "activityChart",
    title: "學生活躍動態統計 (24H)",
    icon: "bi-clock-history",
    type: "line",
  },
  {
    id: "materialChart",
    title: "教材累計點閱分佈",
    icon: "bi-book",
    type: "bar",
    color: "#2d6a4f",
  },
  {
    id: "hwChart",
    title: "功課繳交情況",
    icon: "bi-journal-check",
    type: "bar",
    color: "#BF4646",
  },
  {
    id: "examChart",
    title: "測驗繳交情況",
    icon: "bi-pencil-square",
    type: "bar",
    color: "#ca6702",
  },
  {
    id: "discussionPie",
    title: "熱門討論排行 (Top 5)",
    icon: "bi-pie-chart-fill",
    type: "pie",
  },
  {
    id: "progressChart",
    title: "課程單元開放狀態",
    icon: "bi-flag-fill",
    type: "doughnut",
    color: "#5e548e",
  },
];

// --- 🌟 核心計算邏輯：平均、中位、P75 (含樣本防呆) ---
const calculateStats = (scores) => {
  if (!scores || scores.length === 0) return { avg: 0, median: 0, p75: 0 };

  // 過濾掉非數字並排序
  const valid = scores
    .filter((s) => typeof s === "number" && !isNaN(s))
    .sort((a, b) => a - b);
  const len = valid.length;
  if (len === 0) return { avg: 0, median: 0, p75: 0 };

  const avg = Math.round(valid.reduce((a, b) => a + b, 0) / len);
  const mid = Math.floor(len / 2);
  const median = len % 2 !== 0 ? valid[mid] : (valid[mid - 1] + valid[mid]) / 2;

  let p75 = 0;
  if (len < 4) {
    p75 = valid[len - 1]; // 不滿 4 人取最高分
  } else {
    const topCount = Math.max(1, Math.ceil(len * 0.25));
    const topScores = [...valid].sort((a, b) => b - a).slice(0, topCount);
    p75 = Math.round(topScores.reduce((a, b) => a + b, 0) / topScores.length);
  }
  return { avg, median: Math.round(median), p75 };
};

onMounted(() => {
  if (!courseId) return;

  const coursePath = dbRef(db, `courses/${courseId}`);
  onValue(coursePath, (snap) => {
    const data = snap.val();
    if (!data) return;

    // 更新基本資料
    students.value = data.profiles ? Object.keys(data.profiles) : [];

    // 🌟 核心修正：直接傳入物件，保留組別 ID (Key)
    // 這樣 TrList 裡面的 Object.entries(props.groups) 才能抓到正確的 ID
    experimentGroups.value = data.experiment?.groups || {};

    nextTick(() => {
      // 1. 活動趨勢 (多線條折線圖)
      processActivityChart(data.logs, students.value);

      // 2. 教材分析
      processMaterialChart(data.materials, data.logs);

      // 3. 功課分析
      processSubmissionChart("hwChart", data.assignments, "#BF4646");

      // 4. 測驗分析
      processSubmissionChart("examChart", data.exams, "#ca6702");

      // 5. 討論排行
      processDiscussionChart(data.discussions);

      // 6. 單元狀態
      processProgressChart(data.units);

      // 生成報告
      generateAIReport(data);
    });
  });
});

// --- 📈 數據處理函數群 ---

const processActivityChart = (logs, studentUids) => {
  const labels = Array.from({ length: 24 }, (_, i) => `${i}:00`);
  const hourlyDataMatrix = Array.from({ length: 24 }, () => ({}));

  // 初始化矩陣：確保每個學生在每個時段都有初始值 0
  studentUids.forEach((uid) => {
    for (let i = 0; i < 24; i++) hourlyDataMatrix[i][uid] = 0;
  });

  if (logs) {
    Object.entries(logs).forEach(([uid, userLogs]) => {
      if (!studentUids.includes(uid)) return;
      Object.values(userLogs).forEach((entry) => {
        const hour = new Date(entry.timestamp).getHours();
        if (hourlyDataMatrix[hour]) hourlyDataMatrix[hour][uid]++;
      });
    });
  }

  const avgLine = [],
    medianLine = [],
    p75Line = [];
  hourlyDataMatrix.forEach((hourMap) => {
    const stats = calculateStats(Object.values(hourMap));
    avgLine.push(stats.avg);
    medianLine.push(stats.median);
    p75Line.push(stats.p75);
  });

  renderActivityLineChart(labels, avgLine, medianLine, p75Line);
};

const renderActivityLineChart = (labels, avg, median, p75) => {
  const id = "activityChart";
  const ctx = document.getElementById(id);
  if (!ctx) return;
  if (chartInstances[id]) chartInstances[id].destroy();

  hasData.value[id] = true;
  chartInstances[id] = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "全班平均",
          data: avg,
          borderColor: "#4a70a9",
          backgroundColor: "#4a70a915",
          fill: true,
          tension: 0.4,
          borderWidth: 3,
        },
        {
          label: "中位數",
          data: median,
          borderColor: "#94a3b8",
          borderDash: [5, 5],
          tension: 0.4,
          pointRadius: 0,
          fill: false,
        },
        {
          label: "領先指標(P75)",
          data: p75,
          borderColor: "#fbbf24",
          borderDash: [2, 2],
          tension: 0.4,
          pointRadius: 0,
          fill: false,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      plugins: { legend: { display: true, position: "bottom" } },
      scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } },
    },
  });
};

const processMaterialChart = (materials, logs) => {
  if (!materials) return;
  const matIds = Object.keys(materials);
  const labels = Object.values(materials).map((m) => m.title);
  const counts = new Array(matIds.length).fill(0);

  if (logs) {
    Object.values(logs).forEach((userLogs) => {
      Object.values(userLogs).forEach((entry) => {
        const mId = entry.details?.materialId || entry.details?.unitId;
        const idx = matIds.indexOf(mId);
        if (idx !== -1) counts[idx]++;
      });
    });
  }
  renderChart("materialChart", labels, counts, "bar", "#2d6a4f");
};

const processSubmissionChart = (id, source, color) => {
  if (!source) return;
  const items = Object.values(source);
  const labels = items.map((i) => i.title);
  const values = items.map((item) => {
    if (!item.scores) return 0;
    return Object.values(item.scores).filter(
      (s) => s.score !== undefined || s.status === "submitted",
    ).length;
  });
  renderChart(id, labels, values, "bar", color);
};

const processDiscussionChart = (discussions) => {
  if (!discussions) return;
  const list = Object.values(discussions)
    .map((d) => ({
      title: d.title,
      count: d.messages ? Object.keys(d.messages).length : 0,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  renderChart(
    "discussionPie",
    list.map((l) => l.title),
    list.map((l) => l.count),
    "pie",
  );
};

const processProgressChart = (units) => {
  if (!units) return;
  const unitVals = Object.values(units);
  const opened = unitVals.filter((u) => u.visible).length;
  renderChart(
    "progressChart",
    ["已開放", "待開放"],
    [opened, unitVals.length - opened],
    "doughnut",
    "#5e548e",
  );
};

// --- 🖌️ 通用渲染與資源回收 ---

const renderChart = (id, labels, data, type, color) => {
  const ctx = document.getElementById(id);
  if (!ctx) return;
  if (chartInstances[id]) chartInstances[id].destroy();

  hasData.value[id] = data && data.length > 0 && data.some((d) => d > 0);
  if (!hasData.value[id]) return;

  const isPie = type === "pie" || type === "doughnut";
  chartInstances[id] = new Chart(ctx, {
    type,
    data: {
      labels,
      datasets: [
        {
          data,
          backgroundColor: isPie
            ? ["#4a70a9", "#2d6a4f", "#BF4646", "#ca6702", "#5e548e"]
            : color,
          tension: 0.3,
          fill: type === "line",
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: isPie, position: "bottom" } },
      scales: isPie ? {} : { y: { beginAtZero: true, ticks: { stepSize: 1 } } },
    },
  });
};

import { generateTeacherDashboardReport } from "../../services/aiService";

// --- 🌟 修正後的 AI 報告生成函數 ---
const generateAIReport = async (data) => {
  const total = students.value?.length || 0;
  if (total === 0) {
    aiAnalysis.value = "尚未有學生數據匯入。";
    return;
  }

  aiAnalysis.value = "AI 正在分析全班數據並撰寫報告中...";

  try {
    // 1. 處理功課數據
    const hwArray = Object.values(data?.assignments || {});
    const latestHW = hwArray[hwArray.length - 1] || { title: "無", scores: {} };
    const hwScores = latestHW.scores ? Object.values(latestHW.scores) : [];
    const hwSubCount = hwScores.filter(
      (s) => s.status === "submitted" || s.score !== undefined,
    ).length;
    const hwRate = total > 0 ? Math.round((hwSubCount / total) * 100) : 0;

    // 2. 處理測驗數據
    const examArray = Object.values(data?.exams || {});
    const latestExam = examArray[examArray.length - 1] || {
      title: "無",
      scores: {},
    };
    const examScoreEntries = latestExam.scores
      ? Object.values(latestExam.scores)
      : [];
    const examScores = examScoreEntries.map((s) => Number(s.score) || 0);
    const examAvg = examScores.length
      ? Math.round(examScores.reduce((a, b) => a + b, 0) / examScores.length)
      : 0;
    const examRate =
      total > 0 ? Math.round((examScores.length / total) * 100) : 0;

    // 3. 處理討論區 (並直接處理標題，避免調用未定義函數)
    const discussions = Object.values(data?.discussions || {});
    const hotDisc =
      discussions.length > 0
        ? [...discussions].sort(
            (a, b) =>
              Object.keys(b.messages || {}).length -
              Object.keys(a.messages || {}).length,
          )[0]
        : null;

    // 取得討論區標題
    const currentHotTopic = hotDisc ? hotDisc.title || "未命名討論" : "無";

    // 4. 計算活躍度 (今日總動作次數)
    let totalActivityCount = 0;
    if (data?.logs) {
      Object.values(data.logs).forEach((userLogs) => {
        if (userLogs) totalActivityCount += Object.keys(userLogs).length;
      });
    }

    // 5. 封裝成 Service 需要的格式
    const statsSummary = {
      totalStudents: total,
      avgActivity: total > 0 ? Math.round(totalActivityCount / total) : 0,
      hw: {
        title: latestHW.title || "無",
        rate: hwRate,
      },
      exam: {
        title: latestExam.title || "無",
        avg: examAvg,
        rate: examRate,
      },
      hotTopic: {
        title: currentHotTopic,
        msgCount: hotDisc?.messages ? Object.keys(hotDisc.messages).length : 0,
      },
    };

    // 6. 呼叫 AI Service
    const aiResult = await generateTeacherDashboardReport(statsSummary);
    aiAnalysis.value = aiResult;
  } catch (error) {
    console.error("AI Report Error:", error);
    aiAnalysis.value = "分析報告生成時發生錯誤，請稍後再試。";
  }
};

onUnmounted(() => {
  Object.values(chartInstances).forEach((instance) => instance.destroy());
});
</script>
