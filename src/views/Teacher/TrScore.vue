<template>
  <div class="TrScore container-fluid py-4 animate__animated animate__fadeIn">
    <div class="row mb-4">
      <div class="col-12 d-flex justify-content-center">
        <div class="ScoreNavContainer shadow-sm">
          <button
            v-for="tab in scoreTabs"
            :key="tab.id"
            class="ScoreNavButton"
            :class="{ active: currentScoreTab === tab.id }"
            @click="handleTabChange(tab.id)"
          >
            <i :class="['bi', tab.icon, 'me-2']"></i>
            <span>{{ tab.label }}</span>
          </button>
        </div>
      </div>
    </div>

    <div class="row justify-content-center">
      <div class="col-12 col-xl-11">
        <div class="ScoreContentWrapper">
          <Transition name="score-fade" mode="out-in">
            <div :key="currentScoreTab" class="content-anim">
              <TrHWScore
                v-if="currentScoreTab === 'assignments'"
                :courseId="courseId"
              />
              <TrExamScore
                v-else-if="currentScoreTab === 'exams'"
                :courseId="courseId"
              />
              <TrTestScore
                v-else-if="currentScoreTab === 'experiment'"
                :courseId="courseId"
              />
            </div>
          </Transition>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, provide } from "vue";
import { rtdb } from "../../firebase/config";
import { ref as dbRef, push, serverTimestamp } from "firebase/database";
import "./TrScore.css";
import TrExamScore from "./Modal/TrExamScore.vue";
import TrHWScore from "./Modal/TrHWScore.vue";
import TrTestScore from "./Modal/TrTestScore.vue";

const props = defineProps({
  courseId: {
    type: String,
    required: true,
  },
});

const currentScoreTab = ref("assignments");

// 🌟 定義紀錄函式，解決子組件 ReferenceError 問題
const recordStudentAction = async (action) => {
  if (!props.courseId) return;
  try {
    const logRef = dbRef(
      rtdb,
      `courses/${props.courseId}/logs/teacher_actions`,
    );
    await push(logRef, {
      action: `[教師端] ${action}`,
      tab: currentScoreTab.value,
      timestamp: serverTimestamp(),
    });
  } catch (e) {
    console.error("日誌紀錄失敗:", e);
  }
};

// 透過 provide 讓子組件 (TrExperiment等) 可以直接注入使用
provide("recordAction", recordStudentAction);

// 切換 Tab 並紀錄行為
const handleTabChange = (tabId) => {
  currentScoreTab.value = tabId;
  const tabLabel = scoreTabs.find((t) => t.id === tabId)?.label;
  recordStudentAction(`切換至 ${tabLabel} 視窗`);
};

onMounted(() => {
  // 🌟 防呆檢查：確保掛載時 courseId 存在，解決 Hook 執行錯誤
  if (props.courseId) {
    recordStudentAction("開啟成績與數據中心");
  }
});

const scoreTabs = [
  { id: "assignments", label: "功課成績", icon: "bi-journal-check" },
  { id: "exams", label: "考試成績", icon: "bi-file-earmark-bar-graph" },
  // 🌟 更新圖示：改用 clipboard-data 更符合實驗前後測問卷感
  { id: "experiment", label: "實驗數據", icon: "bi-clipboard-data" },
];
</script>
