<template>
  <div
    class="StuExam h-100 d-flex flex-column animate__animated animate__fadeIn"
  >
    <div
      v-if="!isStarted"
      class="m-auto py-5 px-4 w-100"
      style="max-width: 550px"
    >
      <div class="prepare-card p-5 text-center shadow-sm">
        <div v-if="hasSubmitted" class="mb-4">
          <span class="status-badge success">
            <i class="bi bi-check-circle-fill me-2"></i>測驗任務已達成
          </span>
          <div class="mt-2 text-muted small">
            嘗試次數：{{ submissionHistory?.attempts || 1 }} /
            {{ examData?.maxAttempts || 1 }}
          </div>
        </div>

        <div v-if="isLockedByDeadline" class="alert alert-custom-danger mb-4">
          <i class="bi bi-exclamation-triangle-fill me-2"></i>
          已截止且不開放遲交 ({{ formattedDeadline }})
        </div>
        <div v-else-if="isExpired" class="alert alert-custom-warning mb-4">
          <i class="bi bi-clock-history me-2"></i>
          逾期作答模式：作答將標記為「遲交」
        </div>

        <h2 class="fw-bold mb-4" style="color: var(--primary-navy)">
          {{ examData?.title || "載入測驗中..." }}
        </h2>

        <div class="info-group d-flex justify-content-center gap-3 mb-5">
          <div class="info-item">
            <i class="bi bi-clock"></i> {{ examData?.duration || 0 }} 分鐘
          </div>
          <div class="info-item">
            <i class="bi bi-list-ol"></i>
            {{ examData?.questions?.length || 0 }} 題
          </div>
          <div class="info-item" :class="{ 'text-danger': isExpired }">
            <i class="bi bi-calendar-event"></i> {{ formattedDeadline }}
          </div>
        </div>

        <div v-if="canAttempt">
          <button
            v-if="examData?.isOffline"
            @click="confirmOfflineSubmit"
            class="btn btn-success btn-lg w-100 mb-3 shadow-sm"
          >
            <i class="bi bi-file-earmark-check me-2"></i>我已完成線下測驗
          </button>

          <button
            v-else
            @click="handleStartExam"
            class="btn btn-primary-navy btn-lg w-100 mb-3"
          >
            {{ hasSubmitted ? "再次挑戰" : "開始正式測驗" }}
          </button>
        </div>
        <div v-else class="locked-text mb-3">
          <i class="bi bi-lock-fill me-1"></i>
          {{ isLockedByDeadline ? "逾期作答功能已關閉" : "已達到最大作答次數" }}
        </div>
        <button @click="$emit('close')" class="btn btn-outline-link btn-sm">
          暫時返回教材
        </button>
      </div>
    </div>

    <div
      v-else
      class="exam-workspace d-flex flex-column flex-grow-1 overflow-hidden"
    >
      <header
        class="exam-top-bar px-4 py-4 border-bottom d-flex justify-content-between align-items-center bg-white shadow-sm"
      >
        <div class="exam-title fw-bold text-primary-navy fs-4 truncate-text">
          {{ examData?.title }}
        </div>
        <div class="d-flex align-items-center gap-3">
          <div
            class="timer-pill big-timer"
            :class="{ warning: remainingTime < 60 }"
          >
            <i class="bi bi-clock-history me-2"></i>{{ formattedTime }}
          </div>
          <button @click="$emit('close')" class="btn-close fs-5"></button>
        </div>
      </header>

      <main
        class="exam-main-content flex-grow-1 overflow-auto bg-white custom-scrollbar d-flex flex-column"
      >
        <div class="container py-5 flex-grow-1" style="max-width: 800px">
          <div class="q-label mb-2">Question {{ currentIndex + 1 }}</div>
          <h4 class="question-text mb-5">{{ currentQuestion?.question }}</h4>

          <div class="answer-area">
            <div
              v-if="currentQuestion?.type === 'multipleChoice'"
              class="options-list"
            >
              <div
                v-for="(opt, oIdx) in currentQuestion.options"
                :key="oIdx"
                class="option-item d-flex align-items-center mb-3"
                :class="{ 'active-option': userAnswers[currentIndex] === oIdx }"
                @click="userAnswers[currentIndex] = oIdx"
              >
                <div class="option-label me-3">
                  {{ String.fromCharCode(65 + oIdx) }}
                </div>
                <div class="option-text flex-grow-1">{{ opt }}</div>
                <i
                  v-if="userAnswers[currentIndex] === oIdx"
                  class="bi bi-check-lg text-primary-navy ms-2"
                ></i>
              </div>
            </div>

            <div
              v-else-if="currentQuestion?.type === 'multiSelect'"
              class="options-list"
            >
              <div
                v-for="(opt, oIdx) in currentQuestion.options"
                :key="oIdx"
                class="option-item d-flex align-items-center mb-3"
                :class="{
                  'active-option': (userAnswers[currentIndex] || []).includes(
                    oIdx,
                  ),
                }"
                @click="handleMultiSelect(oIdx)"
              >
                <div class="option-label me-3">
                  {{ String.fromCharCode(65 + oIdx) }}
                </div>
                <div class="option-text flex-grow-1">{{ opt }}</div>
                <div class="ms-2">
                  <i
                    v-if="(userAnswers[currentIndex] || []).includes(oIdx)"
                    class="bi bi-check-square-fill text-primary-navy fs-5"
                  ></i>
                  <i v-else class="bi bi-square text-muted fs-5"></i>
                </div>
              </div>
            </div>

            <div
              v-else-if="currentQuestion?.type === 'shortAnswer'"
              class="short-answer-box"
            >
              <textarea
                v-model="userAnswers[currentIndex]"
                class="form-control custom-textarea"
                rows="6"
                placeholder="請在此輸入您的回答..."
              ></textarea>
            </div>
          </div>
        </div>

        <div class="question-nav-minimal border-top bg-light-subtle">
          <div
            class="question-nav-scroll d-flex justify-content-center gap-1 py-2"
          >
            <div
              v-for="(q, idx) in examData?.questions"
              :key="idx"
              @click="currentIndex = idx"
              :class="[
                'nav-dot-sm',
                {
                  active: currentIndex === idx,
                  done:
                    userAnswers[idx] !== undefined &&
                    userAnswers[idx] !== '' &&
                    (Array.isArray(userAnswers[idx])
                      ? userAnswers[idx].length > 0
                      : true),
                },
              ]"
            >
              {{ idx + 1 }}
            </div>
          </div>
        </div>
      </main>

      <footer class="exam-bottom-bar border-top bg-light p-3">
        <div
          class="container-fluid d-flex justify-content-between align-items-center"
          style="max-width: 800px"
        >
          <button
            @click="currentIndex--"
            :disabled="currentIndex === 0"
            class="btn btn-nav-pill-outline"
          >
            <i class="bi bi-chevron-left me-1"></i
            ><span class="d-none d-sm-inline">上一題</span>
          </button>

          <button
            @click="confirmSubmit"
            class="btn btn-submit-navy px-5 py-2 fw-bold shadow-sm"
          >
            提交測驗
          </button>

          <button
            v-if="currentIndex < examData?.questions?.length - 1"
            @click="currentIndex++"
            class="btn btn-nav-pill-outline"
          >
            <span class="d-none d-sm-inline me-1">下一題</span
            ><i class="bi bi-chevron-right"></i>
          </button>
          <div v-else style="width: 90px"></div>
        </div>
      </footer>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";
import { rtdb } from "../../../firebase/config";
import { ref as dbRef, get, update, serverTimestamp } from "firebase/database";
import { getAuth } from "firebase/auth";
import Swal from "sweetalert2";
import "./StuExam.css";
import { recordStudentAction as recordAction } from "../../../utils/logger.js";

const props = defineProps({
  isOpen: Boolean,
  courseId: String,
  unitId: String,
  examId: String,
});
const emit = defineEmits(["close"]);

// --- 1. 狀態管理 ---
const examData = ref(null);
const submissionHistory = ref(null);
const isLoading = ref(false);
const isStarted = ref(false);
const currentIndex = ref(0);
const userAnswers = ref({});
const remainingTime = ref(0);
const now = ref(Date.now());
let timer = null;
let nowInterval = null;

// --- 2. 計算屬性 (含截止與遲交邏輯) ---
const formattedTime = computed(() => {
  const m = Math.floor(remainingTime.value / 60);
  const s = remainingTime.value % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
});

const currentQuestion = computed(
  () => examData.value?.questions?.[currentIndex.value],
);

// 格式化截止日期
const formattedDeadline = computed(() => {
  if (!examData.value?.deadline) return "無期限";
  return new Date(examData.value.deadline).toLocaleString("zh-TW", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
});

// 判斷是否過期
const isExpired = computed(() => {
  if (!examData.value?.deadline) return false;
  return now.value > new Date(examData.value.deadline).getTime();
});

// 🌟 判斷是否鎖定 (過期且教師「不允許」遲交)
const isLockedByDeadline = computed(() => {
  return isExpired.value && !examData.value?.allowLate;
});

const hasSubmitted = computed(() => !!submissionHistory.value);

// 綜合判斷是否可以開始測驗
const canAttempt = computed(() => {
  if (isLockedByDeadline.value) return false; // 逾期且不准遲交則鎖定
  if (!hasSubmitted.value) return true;
  const max = examData.value?.maxAttempts || 1;
  const current = submissionHistory.value?.attempts || 1;
  return current < max;
});

// 🌟 新增：線下測驗確認邏輯
const confirmOfflineSubmit = async () => {
  const result = await Swal.fire({
    title: "確認完成線下測驗？",
    text: "點擊確認後，系統將標記您已參與此項實體任務，請等待老師評分。",
    icon: "info",
    showCancelButton: true,
    confirmButtonColor: "#28a745",
    confirmButtonText: "是的，我已完成",
    cancelButtonText: "取消",
  });

  if (result.isConfirmed) {
    submitExam(); // 線下測驗不需要進入 isStarted = true，直接執行提交
  }
};

// --- 3. 初始化讀取 ---
const fetchExamDetail = async () => {
  if (!props.examId) return;
  isLoading.value = true;
  const uid = getAuth().currentUser?.uid;

  try {
    const examPath = `courses/${props.courseId}/exams/${props.examId}`;
    const examSnap = await get(dbRef(rtdb, examPath));
    if (examSnap.exists()) {
      examData.value = examSnap.val();
      remainingTime.value = (examData.value.duration || 10) * 60;
    }

    if (uid) {
      // 確保路徑與 StuUnit 一致：courses/{courseId}/units/{unitId}/student_traces/{uid}
      const tracePath = `courses/${props.courseId}/units/${props.unitId}/student_traces/${uid}`;
      const traceSnap = await get(dbRef(rtdb, tracePath));
      if (traceSnap.exists()) {
        const data = traceSnap.val();
        if (data.examId === props.examId && data.status === "submitted") {
          submissionHistory.value = data;
        }
      }
    }
  } catch (error) {
    console.error("🔥 讀取測驗環境失敗:", error);
  } finally {
    isLoading.value = false;
  }
};

// --- 4. 執行與提交邏輯 ---
const handleStartExam = () => {
  isStarted.value = true;
  recordAction(props.courseId, `開始執行單元測驗：${examData.value?.title}`, {
    unitId: props.unitId,
    examId: props.examId,
  });

  timer = setInterval(() => {
    if (remainingTime.value > 0) remainingTime.value--;
    else autoSubmit();
  }, 1000);
};

const submitExam = async () => {
  if (timer) clearInterval(timer);

  let totalScore = 0;
  let totalErrorCount = 0;
  const uid = getAuth().currentUser?.uid;

  // 🌟 修正重點 1：判斷是否為線上測驗且有題目，才執行計分迴圈
  // 這樣如果是線下測驗 (isOffline: true)，就不會執行 questions.forEach 導致報錯
  if (!examData.value?.isOffline && examData.value?.questions) {
    const questions = examData.value.questions;
    questions.forEach((q, idx) => {
      const userAnswer = userAnswers.value[idx];
      const point = q.point || 100 / questions.length;

      if (
        userAnswer === undefined ||
        userAnswer === null ||
        (Array.isArray(userAnswer) && userAnswer.length === 0)
      ) {
        totalErrorCount++;
        return;
      }

      if (q.type === "multipleChoice") {
        if (userAnswer === q.finalAnswer) totalScore += point;
        else totalErrorCount++;
      } else if (q.type === "multiSelect") {
        const correct = q.finalAnswer || [];
        const isCorrect =
          JSON.stringify([...userAnswer].sort()) ===
          JSON.stringify([...correct].sort());
        if (isCorrect) totalScore += point;
        else totalErrorCount++;
      } else if (q.type === "shortAnswer") {
        if (userAnswer?.trim() === q.refAnswer?.trim()) totalScore += point;
        else totalErrorCount++;
      }
    });
  }

  const finalScore = Math.round(totalScore);

  try {
    if (uid) {
      // 🌟 定義路徑
      const tracePath = `courses/${props.courseId}/units/${props.unitId}/student_traces/${uid}`;
      const examScorePath = `courses/${props.courseId}/exams/${props.examId}/scores/${uid}`;

      // 準備存檔內容
      const updateData = {
        score: finalScore,
        errorCount: totalErrorCount,
        lastActive: serverTimestamp(),
        status: "submitted",
        examId: props.examId,
        answers: userAnswers.value || {}, // 🌟 避免 undefined
        isLate: isExpired.value,
        isOffline: examData.value?.isOffline || false, // 🌟 紀錄是否為線下
        updatedAt: serverTimestamp(),
      };

      // 🌟 同時寫入兩處
      await Promise.all([
        update(dbRef(rtdb, tracePath), {
          currentScore: finalScore,
          errorCount: totalErrorCount,
          lastActive: serverTimestamp(),
          status: "submitted",
          examId: props.examId,
          attempts: (submissionHistory.value?.attempts || 0) + 1,
        }),
        update(dbRef(rtdb, examScorePath), updateData),
      ]);

      // 紀錄 Log 行為
      await recordAction(
        props.courseId,
        `提交${examData.value?.isOffline ? "線下" : "單元"}測驗結果`,
        {
          unitId: props.unitId,
          examId: props.examId,
          score: finalScore,
          isLate: isExpired.value,
        },
      );
    }

    await Swal.fire({
      title: "提交成功",
      text: examData.value?.isOffline
        ? "已紀錄您的線下作業完成狀態，請等待老師評分。"
        : "您的作答結果已成功分別存儲，老師將可查閱您的獨立成績。",
      icon: "success",
      confirmButtonColor: "#4a70a9",
    });

    emit("close");
  } catch (error) {
    console.error("🔥 成績存儲失敗:", error);
    Swal.fire("錯誤", "成績儲存失敗，請檢查網路連線", "error");
  }
};

const handleMultiSelect = (oIdx) => {
  if (!Array.isArray(userAnswers.value[currentIndex.value])) {
    userAnswers.value[currentIndex.value] = [];
  }
  const answers = userAnswers.value[currentIndex.value];
  const foundIdx = answers.indexOf(oIdx);
  if (foundIdx > -1) answers.splice(foundIdx, 1);
  else answers.push(oIdx);
};

const confirmSubmit = async () => {
  // 🌟 核心修正：新增防呆檢查
  // 如果 examData 還沒載入（null）或是沒有 questions 屬性，直接攔截不執行
  if (!examData.value || !examData.value.questions) {
    console.error("測驗資料尚未載入完成");
    return;
  }

  // 使用選擇性鏈結 ?. 確保安全讀取，並處理 userAnswers 可能為空的狀況
  const totalQuestions = examData.value.questions.length;
  const answeredCount = Object.keys(userAnswers.value || {}).length;
  const unanswered = totalQuestions - answeredCount;

  const result = await Swal.fire({
    title: "確定提交？",
    text:
      unanswered > 0
        ? `尚有 ${unanswered} 題未作答！`
        : "提交後將完成紀錄，無法再次修改答案。",
    icon: "question",
    showCancelButton: true,
    confirmButtonColor: "#4a70a9",
    confirmButtonText: "正式提交",
    cancelButtonText: "繼續檢查",
  });

  if (result.isConfirmed) {
    submitExam();
  }
};

const autoSubmit = () => {
  Swal.fire("時間到！", "系統已自動提交試卷。", "info");
  submitExam();
};

onMounted(() => {
  if (props.isOpen) fetchExamDetail();
  nowInterval = setInterval(() => {
    now.value = Date.now();
  }, 60000);
});

onUnmounted(() => {
  if (timer) clearInterval(timer);
  if (nowInterval) clearInterval(nowInterval);
});
</script>
