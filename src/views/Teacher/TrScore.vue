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
            @click="currentScoreTab = tab.id"
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
              <TrHW
                v-if="currentScoreTab === 'assignments'"
                :courseId="courseId"
              />
              <TrTest
                v-else-if="currentScoreTab === 'exams'"
                :courseId="courseId"
              />
              <TrExperiment
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
import { ref } from "vue";
import TrHW from "./Modal/TrHW.vue";
import TrTest from "./Modal/TrTest.vue";
import TrExperiment from "./Modal/TrExperiment.vue";
import "./TrScore.css"; // 引入獨立 CSS

const props = defineProps({
  courseId: {
    type: String,
    required: true,
  },
});

const currentScoreTab = ref("assignments");

const scoreTabs = [
  { id: "assignments", label: "功課成績", icon: "bi-journal-check" },
  { id: "exams", label: "考試成績", icon: "bi-file-earmark-bar-graph" },
  { id: "experiment", label: "實驗數據", icon: "bi-beaker-fill" },
];
</script>
