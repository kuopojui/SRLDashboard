<template>
  <div class="StuHW h-100 d-flex flex-column animate__animated animate__fadeIn">
    <div
      v-if="loading"
      class="text-center py-5 flex-grow-1 d-flex flex-column justify-content-center"
    >
      <div class="spinner-border text-primary"></div>
      <p class="mt-3 text-muted">正在準備作業環境...</p>
    </div>

    <div v-else class="flex-grow-1 d-flex flex-column overflow-hidden">
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
          <h2 class="fw-bold text-navy mb-3">{{ hwData?.title }}</h2>

          <div
            class="intro-card p-4 rounded-4 my-4 text-start border shadow-sm bg-white"
          >
            <h6 class="fw-bold text-navy mb-3">
              <i class="bi bi-info-circle-fill me-2"></i>作業須知：
            </h6>
            <ul class="text-muted small list-unstyled mb-0 lh-lg">
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
          <button @click="$emit('close')" class="btn btn-link text-muted mt-3">
            暫時返回單元
          </button>
        </div>

        <div
          v-else
          class="hw-main-container d-flex flex-grow-1 overflow-hidden"
        >
          <aside class="answer-sidebar d-none d-md-flex flex-column">
            <div class="p-3 border-bottom bg-white shadow-sm">
              <h6 class="fw-bold mb-0 text-navy">作答進度</h6>
            </div>
            <div class="flex-grow-1 overflow-auto p-3 bg-light">
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

          <main
            class="question-workspace flex-grow-1 d-flex flex-column overflow-hidden"
          >
            <div
              class="workspace-header border-bottom p-3 d-flex justify-content-between align-items-center bg-white flex-shrink-0"
            >
              <span class="fw-bold text-navy"
                >問題 {{ currentIndex + 1 }} / {{ totalQuestions }}</span
              >
              <div
                :class="[
                  'small px-3 py-1 rounded-pill',
                  isSaving
                    ? 'bg-light text-muted'
                    : 'bg-success-subtle text-success',
                ]"
              >
                <i
                  :class="[
                    'bi',
                    isSaving
                      ? 'spinner-border spinner-border-sm me-2'
                      : 'bi-cloud-check-fill me-1',
                  ]"
                ></i>
                {{ isSaving ? "同步中..." : "進度已儲存" }}
              </div>
            </div>

            <div
              class="q-content p-4 p-md-5 flex-grow-1 overflow-auto bg-white"
            >
              <h4 class="fw-bold text-dark mb-5" style="line-height: 1.6">
                {{ currentQuestion?.question }}
              </h4>

              <div v-if="currentQuestion?.type === 'shortAnswer'">
                <textarea
                  v-model="answers[currentIndex]"
                  class="form-control border-2 rounded-4 p-3 shadow-inner"
                  rows="8"
                  placeholder="請在此輸入您的回答..."
                ></textarea>
              </div>
              <div v-else class="options-container">
                <label
                  v-for="(opt, oIdx) in currentQuestion?.options"
                  :key="oIdx"
                  class="option-pill shadow-sm"
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
                  <span class="option-text fw-medium">{{ opt }}</span>
                </label>
              </div>
            </div>

            <footer
              class="p-3 bg-light border-top d-flex justify-content-between align-items-center flex-shrink-0"
            >
              <button
                class="btn btn-outline-secondary px-4 rounded-pill"
                :disabled="currentIndex === 0"
                @click="currentIndex--"
              >
                上一題
              </button>

              <button
                v-if="currentIndex < totalQuestions - 1"
                class="btn btn-navy px-5 rounded-pill shadow"
                @click="currentIndex++"
              >
                下一題
              </button>
              <button
                v-else
                class="btn btn-success px-5 rounded-pill shadow-lg fw-bold"
                @click="submitHW"
                :disabled="submitting"
              >
                正式繳交作業
              </button>
            </footer>
          </main>
        </div>
      </transition>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from "vue";
import { rtdb as db, auth } from "../../../firebase/config";
import {
  ref as dbRef,
  set,
  get,
  update,
  serverTimestamp,
} from "firebase/database";
import Swal from "sweetalert2";
import "./StuHW.css"; // 🌟 引入新 CSS

const props = defineProps(["courseId", "taskId", "unitId"]); // 🌟 傳入 unitId 以利回傳
const emit = defineEmits(["close"]);

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
  return ans !== undefined && ans !== "" && ans !== null;
};
const hasSelected = (qIdx, oIdx) => answers.value[qIdx] === oIdx;

onMounted(async () => {
  const uid = auth.currentUser?.uid;
  if (!uid) return;
  const path = `courses/${props.courseId}/assignments/${props.taskId}`;
  const snap = await get(dbRef(db, path));
  if (snap.exists()) {
    hwData.value = snap.val();
    const draft = await get(dbRef(db, `${path}/drafts/${uid}`));
    answers.value = draft.exists() ? draft.val().answers : {};
  }
  loading.value = false;
});

// 自動儲存草稿
watch(
  answers,
  (newVal) => {
    if (isOffline.value || !isStarted.value) return;
    isSaving.value = true;
    clearTimeout(window.saveTimeout);
    window.saveTimeout = setTimeout(async () => {
      const uid = auth.currentUser.uid;
      await set(
        dbRef(
          db,
          `courses/${props.courseId}/assignments/${props.taskId}/drafts/${uid}`,
        ),
        {
          answers: JSON.parse(JSON.stringify(newVal)),
          updatedAt: serverTimestamp(),
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
  const unanswered = totalQuestions.value - Object.keys(answers.value).length;
  const result = await Swal.fire({
    title: "確定繳交作業？",
    text:
      unanswered > 0
        ? `尚有 ${unanswered} 題未填寫！`
        : "交卷後老師將收到您的成果。",
    icon: unanswered > 0 ? "warning" : "question",
    showCancelButton: true,
    confirmButtonText: "正式提交",
  });

  if (result.isConfirmed) {
    submitting.value = true;
    try {
      const uid = auth.currentUser.uid;
      // 1. 存入正式提交節點
      await set(
        dbRef(
          db,
          `courses/${props.courseId}/assignments/${props.taskId}/submissions/${uid}`,
        ),
        {
          answers: answers.value,
          submittedAt: serverTimestamp(),
          status: "completed",
        },
      );

      // 2. 更新 student_traces
      const tracePath = `student_traces/${props.courseId}_${props.unitId}`;
      await update(dbRef(db, tracePath), {
        hwStatus: "submitted",
        lastActive: serverTimestamp(),
      });

      await Swal.fire("繳交成功！", "作業已順利傳送。", "success");
      emit("close"); // 🌟 關鍵：關閉彈窗回到 StuUnit
    } catch (e) {
      Swal.fire("提交失敗", e.message, "error");
    } finally {
      submitting.value = false;
    }
  }
};

const submitOfflineHW = async () => {
  const result = await Swal.fire({
    title: "確認完成？",
    text: "您已完成線下指派的作業任務嗎？",
    icon: "question",
    showCancelButton: true,
    confirmButtonText: "已完成",
  });
  if (result.isConfirmed) {
    const uid = auth.currentUser.uid;
    await set(
      dbRef(
        db,
        `courses/${props.courseId}/assignments/${props.taskId}/submissions/${uid}`,
      ),
      {
        status: "offline_completed",
        submittedAt: serverTimestamp(),
      },
    );
    emit("close");
  }
};
</script>
