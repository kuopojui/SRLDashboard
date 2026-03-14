<template>
  <div class="StuHW animate__animated animate__fadeIn">
    <div v-if="!isStarted" class="d-flex w-100 h-100">
      <div class="prepare-info text-center m-auto">
        <i
          class="bi bi-journal-check text-navy-deep display-1 mb-4 animate-float"
        ></i>
        <h2 class="fw-bold text-navy-deep mb-3">
          {{ hwData?.title || "載入中..." }}
        </h2>

        <div class="d-flex justify-content-center gap-2 mb-4">
          <span class="badge rounded-pill bg-navy-solid">
            <i class="bi bi-list-ol me-1"></i>共
            {{ hwData?.questions?.length || 0 }} 題
          </span>
          <span class="badge rounded-pill bg-light text-muted border px-3 py-2">
            <i class="bi bi-calendar-event me-1"></i>截止日：{{
              hwData?.deadline
                ? new Date(hwData.deadline).toLocaleDateString()
                : "無限制"
            }}
          </span>
        </div>

        <button
          @click="isStarted = true"
          class="btn btn-navy-pill btn-lg w-100 shadow-lg fw-bold"
        >
          開始線上作業
        </button>
        <button
          @click="$emit('close')"
          class="btn btn-link text-muted mt-3 text-decoration-none"
        >
          暫時返回單元
        </button>
      </div>
    </div>

    <div v-else class="hw-main-container overflow-hidden">
      <aside class="answer-sidebar d-none d-md-flex">
        <div class="p-4 bg-navy-deep text-white text-center shadow">
          <h6 class="fw-bold mb-0">作業進度</h6>
          <div class="small opacity-75 mt-1">
            {{ Object.keys(userAnswers).length }} /
            {{ hwData?.questions?.length }}
          </div>
        </div>
        <div class="flex-grow-1 overflow-auto p-4 bg-light">
          <div class="answer-grid">
            <div
              v-for="(q, idx) in hwData?.questions"
              :key="idx"
              @click="currentIndex = idx"
              :class="[
                'answer-status-box',
                {
                  active: currentIndex === idx,
                  completed: isQuestionAnswered(idx),
                },
              ]"
            >
              {{ idx + 1 }}
            </div>
          </div>
        </div>
        <div class="p-4 border-top">
          <button
            @click="confirmSubmit"
            class="btn btn-navy-deep w-100 rounded-pill py-2 fw-bold text-white"
          >
            繳交作業
          </button>
        </div>
      </aside>

      <main class="question-workspace">
        <header
          class="p-3 border-bottom d-flex justify-content-between align-items-center bg-white flex-shrink-0"
        >
          <span class="fw-bold text-navy-deep"
            >題目 {{ currentIndex + 1 }} / {{ hwData?.questions?.length }}</span
          >
          <button @click="$emit('close')" class="btn-close"></button>
        </header>

        <div class="q-content custom-scrollbar">
          <h4 class="fw-bold mb-5">{{ currentQuestion?.question }}</h4>

          <div class="answer-area">
            <div
              v-if="currentQuestion?.type === 'multipleChoice'"
              class="d-grid gap-3"
            >
              <label
                v-for="(opt, oIdx) in currentQuestion.options"
                :key="oIdx"
                class="option-item shadow-sm"
                :class="{ 'active-option': userAnswers[currentIndex] === oIdx }"
              >
                <input
                  type="radio"
                  class="d-none"
                  v-model="userAnswers[currentIndex]"
                  :value="oIdx"
                />
                <div class="d-flex align-items-center">
                  <span class="option-label">{{
                    String.fromCharCode(65 + oIdx)
                  }}</span>
                  <span>{{ opt }}</span>
                </div>
              </label>
            </div>

            <div
              v-else-if="currentQuestion?.type === 'multiSelect'"
              class="d-grid gap-3"
            >
              <label
                v-for="(opt, oIdx) in currentQuestion.options"
                :key="oIdx"
                class="option-item shadow-sm"
                :class="{
                  'active-option': (userAnswers[currentIndex] || []).includes(
                    oIdx,
                  ),
                }"
              >
                <input
                  type="checkbox"
                  class="d-none"
                  :checked="(userAnswers[currentIndex] || []).includes(oIdx)"
                  @change="handleMultiSelect(oIdx)"
                />
                <div class="d-flex align-items-center">
                  <span class="option-label">{{
                    String.fromCharCode(65 + oIdx)
                  }}</span>
                  <span>{{ opt }}</span>
                </div>
              </label>
            </div>

            <div v-else-if="currentQuestion?.type === 'shortAnswer'">
              <textarea
                v-model="userAnswers[currentIndex]"
                class="form-control border-2 rounded-4 p-3 shadow-inner"
                rows="8"
                placeholder="請輸入您的答案..."
              ></textarea>
            </div>
          </div>
        </div>

        <footer class="p-4 border-top d-flex justify-content-between bg-light">
          <button
            @click="currentIndex--"
            :disabled="currentIndex === 0"
            class="btn btn-outline-secondary px-4 rounded-pill"
          >
            上一題
          </button>
          <button
            v-if="currentIndex < hwData?.questions?.length - 1"
            @click="currentIndex++"
            class="btn btn-navy-deep px-4 rounded-pill text-white"
          >
            下一題
          </button>
          <button
            v-else
            @click="confirmSubmit"
            class="btn btn-success px-5 rounded-pill shadow-lg text-white"
          >
            正式繳交作業
          </button>
        </footer>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { rtdb, auth } from "../../../firebase/config";
import { ref as dbRef, get, update, serverTimestamp } from "firebase/database";
import Swal from "sweetalert2";
import "./StuHW.css";
// 🌟 匯入 Logger
import { recordStudentAction as recordAction } from "../../../utils/logger.js";

const props = defineProps({
  isOpen: Boolean,
  courseId: String,
  unitId: String,
  taskId: String,
});
const emit = defineEmits(["close"]);

const hwData = ref(null);
const isStarted = ref(false);
const currentIndex = ref(0);
const userAnswers = ref({});
const isLoading = ref(false);

const currentQuestion = computed(
  () => hwData.value?.questions?.[currentIndex.value],
);

const isQuestionAnswered = (idx) => {
  const ans = userAnswers.value[idx];
  return (
    ans !== undefined &&
    ans !== "" &&
    (Array.isArray(ans) ? ans.length > 0 : true)
  );
};

const handleMultiSelect = (oIdx) => {
  if (!Array.isArray(userAnswers.value[currentIndex.value]))
    userAnswers.value[currentIndex.value] = [];
  const ansArr = userAnswers.value[currentIndex.value];
  const pos = ansArr.indexOf(oIdx);
  pos > -1 ? ansArr.splice(pos, 1) : ansArr.push(oIdx);
};

// 🌟 處理開始作業
const handleStartHw = () => {
  isStarted.value = true;
  // 紀錄：學生開始寫作業
  recordAction(props.courseId, "開始單元功課任務", {
    unitId: props.unitId,
    taskId: props.taskId,
    taskTitle: hwData.value?.title,
  });
};

const fetchHWDetail = async () => {
  if (!props.taskId) return;
  isLoading.value = true;
  try {
    const path = `courses/${props.courseId}/assignments/${props.taskId}`;
    const snap = await get(dbRef(rtdb, path));
    if (snap.exists()) {
      hwData.value = snap.val();
    }
  } catch (error) {
    console.error("🔥 讀取作業失敗:", error);
  } finally {
    isLoading.value = false;
  }
};

const submitHW = async () => {
  let rawScore = 0;
  let errorCount = 0;
  const uid = auth.currentUser?.uid;
  const questions = hwData.value?.questions || [];

  questions.forEach((q, idx) => {
    const uAns = userAnswers.value[idx];
    const qPoint = q.point || 100 / questions.length;
    const correct = q.answer !== undefined ? q.answer : q.refAnswer;

    if (!isQuestionAnswered(idx)) {
      errorCount++;
      return;
    }

    if (q.type === "multiSelect") {
      const multiCorrect = q.finalAnswer || [];
      let matchCount = 0;
      q.options.forEach((_, oIdx) => {
        if (multiCorrect.includes(oIdx) === uAns.includes(oIdx)) matchCount++;
      });
      rawScore += (matchCount / q.options.length) * qPoint;
      if (matchCount !== q.options.length) errorCount++;
    } else {
      if (uAns === correct) rawScore += qPoint;
      else errorCount++;
    }
  });

  const finalScore = Math.round(rawScore);

  try {
    // 🌟 1. 更新課程內的學生 Trace (狀態追蹤)
    // 路徑移入課程內部：courses/{courseId}/users/{uid}/trace/{unitId}
    const tracePath = `courses/${props.courseId}/users/${uid}/trace/${props.unitId}`;
    await update(dbRef(rtdb, tracePath), {
      hwScore: finalScore,
      hwStatus: "submitted",
      lastActive: serverTimestamp(),
    });

    // 🌟 2. 紀錄 Log
    recordAction(props.courseId, "提交單元功課結果", {
      unitId: props.unitId,
      taskId: props.taskId,
      taskTitle: hwData.value?.title,
      score: finalScore,
      errors: errorCount,
    });

    await Swal.fire("作業提交成功", `得分：${finalScore} 分`, "success");
    emit("close");
  } catch (error) {
    console.error("🔥 存檔失敗:", error);
    Swal.fire("錯誤", "繳交失敗，請檢查網路", "error");
  }
};

const confirmSubmit = async () => {
  const unanswered =
    (hwData.value?.questions?.length || 0) -
    Object.keys(userAnswers.value).length;
  const res = await Swal.fire({
    title: "確定繳交作業？",
    text:
      unanswered > 0
        ? `尚有 ${unanswered} 題未完成！提交後老師將收到您的成果。`
        : "提交後老師將收到您的成果。",
    icon: "question",
    showCancelButton: true,
    confirmButtonColor: "#4a70a9",
  });
  if (res.isConfirmed) submitHW();
};

onMounted(() => {
  if (props.isOpen) fetchHWDetail();
});
</script>
