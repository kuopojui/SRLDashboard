<template>
  <div
    class="TrTestAns TrTestAns-overlay animate__animated animate__fadeIn"
    @click.self="$emit('close')"
  >
    <div class="TrTestAns-container animate__animated animate__zoomIn">
      <div class="TrTestAns-header">
        <div class="d-flex align-items-center">
          <div class="TrTestAns-avatar me-3">
            {{ studentName?.substring(0, 1) }}
          </div>
          <div>
            <h5 class="fw-bold mb-0 text-navy">{{ studentName }}</h5>
            <div class="TrTestAns-xx-small text-muted">實驗測驗填答報告</div>
          </div>
        </div>
        <button class="TrTestAns-btn-close" @click="$emit('close')">
          <i class="bi bi-x-lg"></i>
        </button>
      </div>

      <div class="TrTestAns-tabs-wrapper">
        <div class="TrTestAns-tabs">
          <button
            v-for="test in allTests"
            :key="test.id"
            :class="[
              'TrTestAns-tab-btn',
              { active: currentTab === test.id },
              test.testType === 'pre' ? 'pre' : 'post',
            ]"
            @click="currentTab = test.id"
          >
            <span class="TrTestAns-type-tag">{{
              test.testType === "pre" ? "前測" : "後測"
            }}</span>
            <span class="TrTestAns-title-text" :title="test.title">{{
              test.title
            }}</span>
          </button>
        </div>
      </div>

      <div class="TrTestAns-body">
        <div
          v-if="activeTestData"
          class="animate__animated animate__fadeInFast"
        >
          <div
            :class="[
              'TrTestAns-status-banner',
              isSubmitted ? 'submitted' : 'pending',
            ]"
          >
            <i
              :class="
                isSubmitted
                  ? 'bi-check-circle-fill'
                  : 'bi-exclamation-circle-fill'
              "
            ></i>
            {{
              isSubmitted
                ? "學生已於 " +
                  formatTime(submissions[currentTab][uid].submittedAt) +
                  " 完成填答"
                : "該學生尚未完成此項測驗"
            }}
          </div>

          <div v-if="isSubmitted" class="TrTestAns-details-list">
            <div
              v-for="(q, index) in activeTestData.questions"
              :key="index"
              class="TrTestAns-row-card"
            >
              <div class="TrTestAns-q-header">
                <span class="TrTestAns-q-index">Q{{ index + 1 }}</span>
                <span class="TrTestAns-q-text">{{ q.text }}</span>
              </div>
              <div class="TrTestAns-a-content">
                <label>填答回覆：</label>
                <div class="TrTestAns-a-value">
                  {{ submissions[currentTab][uid].answers[index] }}
                </div>
              </div>
            </div>
          </div>

          <div v-else class="TrTestAns-empty-state text-center py-5">
            <i class="bi bi-journal-x display-1 text-light-emphasis"></i>
            <p class="text-muted mt-3">暫無填答數據</p>
          </div>
        </div>
      </div>

      <div class="TrTestAns-footer">
        <button
          class="btn btn-navy px-4 rounded-pill shadow-sm"
          @click="$emit('close')"
        >
          確認並關閉
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import "./Answer.css";

const props = defineProps({
  uid: String,
  studentName: String,
  preTests: Array,
  postTests: Array,
  submissions: Object,
});

defineEmits(["close"]);

// 整合前後測數據以生成標籤頁
const allTests = computed(() => {
  const pre = (props.preTests || []).map((t) => ({ ...t, testType: "pre" }));
  const post = (props.postTests || []).map((t) => ({ ...t, testType: "post" }));
  return [...pre, ...post];
});

// 預設選中第一個可用的測驗
const currentTab = ref(allTests.value.length > 0 ? allTests.value[0].id : null);

// 當前顯示的題目資料
const activeTestData = computed(() =>
  allTests.value.find((t) => t.id === currentTab.value),
);

// 檢查該學生在該測驗下的提交紀錄
const isSubmitted = computed(
  () => props.submissions[currentTab.value]?.[props.uid],
);

const formatTime = (ts) => (ts ? new Date(ts).toLocaleString() : "");
</script>
