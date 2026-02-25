<template>
  <div class="StuHW h-100 d-flex flex-column animate__animated animate__fadeIn">
    <div
      v-if="loading"
      class="text-center py-5 flex-grow-1 d-flex flex-column justify-content-center"
    >
      <div class="spinner-border text-primary"></div>
      <p class="mt-3 text-muted">資料載入中...</p>
    </div>

    <div v-else class="flex-grow-1 d-flex flex-column">
      <transition name="fade-slide" mode="out-in">
        <div
          v-if="!isStarted"
          class="m-auto text-center py-5 px-4"
          style="max-width: 600px"
        >
          <i
            :class="[
              'bi',
              isOffline
                ? 'bi-person-workspace text-success'
                : 'bi-journal-check text-navy',
              'display-1 mb-4 animate-float',
            ]"
          ></i>
          <h2 class="fw-bold text-navy">{{ hwData?.title }}</h2>

          <div
            class="intro-card bg-light p-4 rounded-4 my-4 text-start border-0"
          >
            <h6 class="fw-bold text-navy mb-3">
              <i class="bi bi-info-circle-fill me-2"></i>作業須知：
            </h6>
            <ul class="text-muted small list-unstyled mb-0">
              <li v-if="isOffline">
                ● 請依照教師課堂指派之線下任務進行，完成後回報。
              </li>
              <li v-else>
                ● 總計題數：{{ totalQuestions }} 題，系統會即時儲存進度。
              </li>
              <li>
                ● 截止日期：{{
                  hwData?.deadline
                    ? new Date(hwData.deadline).toLocaleString()
                    : "未設定"
                }}
              </li>
            </ul>
          </div>

          <button
            @click="handleStart"
            class="btn btn-navy-pill btn-lg w-100 py-3 shadow-lg fw-bold"
          >
            {{ isOffline ? "確認完成線下作業" : "開始線上作答" }}
          </button>
        </div>

        <div
          v-else
          class="hw-main-container d-flex flex-grow-1 overflow-hidden"
        >
          <aside class="answer-sidebar d-none d-md-flex flex-column">
            <div class="p-3 border-bottom bg-white">
              <h6 class="fw-bold mb-0 text-navy">作答進度</h6>
            </div>
            <div class="flex-grow-1 overflow-auto p-3">
              <div class="answer-grid">
                <div
                  v-for="(q, idx) in hwData?.questions"
                  :key="idx"
                  @click="currentIndex = idx"
                  :class="[
                    'answer-status-box',
                    {
                      active: currentIndex === idx,
                      completed: hasAnswered(idx),
                    },
                  ]"
                >
                  {{ idx + 1 }}
                </div>
              </div>
            </div>
          </aside>

          <main class="question-workspace flex-grow-1 d-flex flex-column">
            <div
              class="workspace-header border-bottom p-3 d-flex justify-content-between align-items-center bg-white sticky-top"
            >
              <span class="fw-bold text-navy"
                >問題 {{ currentIndex + 1 }} / {{ totalQuestions }}</span
              >
              <div :class="['small', isSaving ? 'text-muted' : 'text-success']">
                <i
                  :class="[
                    'bi',
                    isSaving
                      ? 'spinner-border spinner-border-sm me-2'
                      : 'bi-cloud-check-fill me-1',
                  ]"
                ></i>
                {{ isSaving ? "同步中" : "進度已儲存" }}
              </div>
            </div>

            <div class="p-4 flex-grow-1 overflow-auto">
              <h4 class="fw-bold text-dark mb-4">
                {{ currentQuestion?.question }}
              </h4>
              <div v-if="currentQuestion?.type === 'shortAnswer'">
                <textarea
                  v-model="answers[currentIndex]"
                  class="form-control border-2 rounded-4"
                  rows="8"
                  placeholder="輸入回答..."
                ></textarea>
              </div>
              <div v-else class="options-container">
                <label
                  v-for="(opt, oIdx) in currentQuestion?.options"
                  :key="oIdx"
                  class="option-pill"
                  :class="{ selected: hasSelected(currentIndex, oIdx) }"
                >
                  <input
                    type="radio"
                    :value="oIdx"
                    v-model="answers[currentIndex]"
                    class="d-none"
                  />
                  <span class="option-marker">{{
                    String.fromCharCode(65 + oIdx)
                  }}</span>
                  <span class="option-text">{{ opt }}</span>
                </label>
              </div>
            </div>

            <div class="p-3 bg-light border-top d-flex justify-content-between">
              <button
                class="btn btn-outline-secondary px-4 rounded-pill"
                :disabled="currentIndex === 0"
                @click="currentIndex--"
              >
                上一題
              </button>
              <button
                v-if="currentIndex < totalQuestions - 1"
                class="btn btn-navy px-5 rounded-pill"
                @click="currentIndex++"
              >
                下一題
              </button>
              <button
                v-else
                class="btn btn-success px-5 rounded-pill shadow-lg"
                @click="submitHW"
                :disabled="submitting"
              >
                正式繳交
              </button>
            </div>
          </main>
        </div>
      </transition>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from "vue";
import { rtdb as db, auth } from "../../../firebase/config";
import { ref as dbRef, set, get } from "firebase/database";
import Swal from "sweetalert2";
import "./StuTask.css";

const props = defineProps(["courseId", "taskId"]);
const emit = defineEmits(["submit-success", "close"]);

const hwData = ref(null);
const answers = ref({});
const loading = ref(true);
const submitting = ref(false);
const isSaving = ref(false);
const isStarted = ref(false);
const currentIndex = ref(0);

const isOffline = computed(() => !hwData.value?.questions?.length);
const totalQuestions = computed(() => hwData.value?.questions?.length || 0);
const currentQuestion = computed(
  () => hwData.value?.questions?.[currentIndex.value],
);

const hasAnswered = (idx) => {
  const ans = answers.value[idx];
  return Array.isArray(ans) ? ans.length > 0 : ans !== "" && ans !== null;
};
const hasSelected = (qIdx, oIdx) => answers.value[qIdx] === oIdx;

onMounted(async () => {
  const uid = auth.currentUser?.uid;
  if (!uid) return;
  const snap = await get(
    dbRef(db, `courses/${props.courseId}/assignments/${props.taskId}`),
  );
  if (snap.exists()) {
    hwData.value = snap.val();
    const draft = await get(
      dbRef(
        db,
        `courses/${props.courseId}/assignments/${props.taskId}/drafts/${uid}`,
      ),
    );
    answers.value = draft.exists() ? draft.val().answers : {};
  }
  loading.value = false;
});

watch(
  answers,
  (newVal) => {
    if (isOffline.value || !isStarted.value) return;
    isSaving.value = true;
    clearTimeout(window.saveTimeout);
    window.saveTimeout = setTimeout(async () => {
      await set(
        dbRef(
          db,
          `courses/${props.courseId}/assignments/${props.taskId}/drafts/${auth.currentUser.uid}`,
        ),
        {
          answers: JSON.parse(JSON.stringify(newVal)),
          updatedAt: Date.now(),
        },
      );
      isSaving.value = false;
    }, 1000);
  },
  { deep: true },
);

const handleStart = () => {
  if (isOffline.value) submitOfflineHW();
  else isStarted.value = true;
};
const submitHW = async () => {
  /* 提交邏輯... */
};
const logAction = (name, details = {}) =>
  recordStuAction(props.courseId, auth.currentUser.uid, name, details);
</script>
