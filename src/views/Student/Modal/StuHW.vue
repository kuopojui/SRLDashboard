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
        <div
          v-if="hasSubmitted"
          class="mb-4 animate__animated animate__bounceIn"
        >
          <span class="status-badge success">
            <i class="bi bi-check-circle-fill me-2"></i>作業任務已達成
          </span>
          <div class="mt-2 text-muted small">
            狀態：已於 {{ submissionDate }} 繳交
          </div>
        </div>

        <div v-if="isLockedByDeadline" class="alert alert-custom-danger mb-4">
          <i class="bi bi-exclamation-triangle-fill me-2"></i>
          已截止且不開放補交 ({{ formattedDeadline }})
        </div>
        <div v-else-if="isExpired" class="alert alert-custom-warning mb-4">
          <i class="bi bi-clock-history me-2"></i>
          逾期繳交模式：紀錄將標記為「遲交」
        </div>

        <h2 class="fw-bold mb-4" style="color: var(--primary-navy)">
          {{ hwData?.title || "載入作業中..." }}
        </h2>

        <div class="info-group d-flex justify-content-center gap-3 mb-5">
          <div class="info-item">
            <i class="bi bi-list-ol"></i>
            {{ hwData?.questions?.length || 0 }} 題
          </div>
          <div class="info-item" :class="{ 'text-danger': isExpired }">
            <i class="bi bi-calendar-event"></i> 截止：{{ formattedDeadline }}
          </div>
        </div>

        <div v-if="canAttempt">
          <button
            @click="handleStartHw"
            class="btn btn-primary-navy btn-lg w-100 mb-3"
          >
            {{ hasSubmitted ? "再次查看/修改" : "開始線上作業" }}
          </button>
        </div>
        <div v-else class="locked-text mb-3">
          <i class="bi bi-lock-fill me-1"></i> 逾期繳交功能已關閉
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
          {{ hwData?.title }}
        </div>
        <div class="d-flex align-items-center gap-3">
          <span
            class="badge bg-light text-primary-navy border px-3 py-2 rounded-pill"
          >
            <i class="bi bi-pencil-square me-2"></i>作業模式
          </span>
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
              v-for="(q, idx) in hwData?.questions"
              :key="idx"
              @click="currentIndex = idx"
              :class="[
                'nav-dot-sm',
                {
                  active: currentIndex === idx,
                  done: isQuestionAnswered(idx),
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
            提交作業
          </button>

          <button
            v-if="currentIndex < hwData?.questions?.length - 1"
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
import { rtdb, auth } from "../../../firebase/config";
import { ref as dbRef, get, update, serverTimestamp } from "firebase/database";
import Swal from "sweetalert2";
import "./StuHW.css";
import { recordStudentAction as recordAction } from "../../../utils/logger.js";

const props = defineProps({
  isOpen: Boolean,
  courseId: String,
  unitId: String,
  taskId: String,
});
const emit = defineEmits(["close"]);

// --- 狀態管理 ---
const hwData = ref(null);
const traceData = ref(null);
const isStarted = ref(false);
const currentIndex = ref(0);
const userAnswers = ref({});
const now = ref(Date.now());
let nowInterval = null;

// --- 計算屬性 ---
const currentQuestion = computed(
  () => hwData.value?.questions?.[currentIndex.value],
);

const hasSubmitted = computed(() => traceData.value?.hwStatus === "submitted");

const submissionDate = computed(() => {
  if (!traceData.value?.lastActive) return "";
  return new Date(traceData.value.lastActive).toLocaleDateString();
});

const formattedDeadline = computed(() => {
  if (!hwData.value?.deadline) return "無期限";
  return new Date(hwData.value.deadline).toLocaleString("zh-TW", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
});

const isExpired = computed(() => {
  if (!hwData.value?.deadline) return false;
  return now.value > new Date(hwData.value.deadline).getTime();
});

const isLockedByDeadline = computed(
  () => isExpired.value && !hwData.value?.allowLate,
);

const canAttempt = computed(() => {
  if (isLockedByDeadline.value) return false;
  return true; // 作業通常不鎖次數，除非老師另有設定
});

const isQuestionAnswered = (idx) => {
  const ans = userAnswers.value[idx];
  return (
    ans !== undefined &&
    ans !== "" &&
    (Array.isArray(ans) ? ans.length > 0 : true)
  );
};

// --- 邏輯函數 ---
const fetchHWDetail = async () => {
  if (!props.taskId) return;
  const uid = auth.currentUser?.uid;

  try {
    // 1. 讀取作業題目 (assignments 節點)
    const hwPath = `courses/${props.courseId}/assignments/${props.taskId}`;
    const hwSnap = await get(dbRef(rtdb, hwPath));
    if (hwSnap.exists()) {
      hwData.value = hwSnap.val();
    }

    // 2. 讀取個人學習軌跡
    if (uid) {
      const tracePath = `courses/${props.courseId}/units/${props.unitId}/student_traces/${uid}`;
      const traceSnap = await get(dbRef(rtdb, tracePath));
      if (traceSnap.exists()) {
        traceData.value = traceSnap.val();
      }
    }
  } catch (error) {
    console.error("🔥 讀取作業失敗:", error);
  }
};

const handleStartHw = () => {
  isStarted.value = true;
  recordAction(props.courseId, `開始執行作業：${hwData.value?.title}`, {
    unitId: props.unitId,
    taskId: props.taskId,
  });
};

const handleMultiSelect = (oIdx) => {
  if (!Array.isArray(userAnswers.value[currentIndex.value]))
    userAnswers.value[currentIndex.value] = [];
  const ansArr = userAnswers.value[currentIndex.value];
  const pos = ansArr.indexOf(oIdx);
  pos > -1 ? ansArr.splice(pos, 1) : ansArr.push(oIdx);
};

const submitHW = async () => {
  let rawScore = 0;
  let errorCount = 0;
  const uid = auth.currentUser?.uid;
  const questions = hwData.value?.questions || [];

  // 自動評分邏輯 (與 Exam 一致)
  questions.forEach((q, idx) => {
    const uAns = userAnswers.value[idx];
    const qPoint = q.point || 100 / questions.length;
    if (!isQuestionAnswered(idx)) {
      errorCount++;
      return;
    }

    if (q.type === "multiSelect") {
      const correct = q.finalAnswer || [];
      const isMatch =
        JSON.stringify([...uAns].sort()) ===
        JSON.stringify([...correct].sort());
      if (isMatch) rawScore += qPoint;
      else errorCount++;
    } else if (q.type === "multipleChoice") {
      if (uAns === q.finalAnswer) rawScore += qPoint;
      else errorCount++;
    } else {
      // 簡答題暫以有填寫即給分，或依 refAnswer 判定
      if (uAns?.trim()) rawScore += qPoint;
      else errorCount++;
    }
  });

  try {
    if (uid) {
      const tracePath = `courses/${props.courseId}/units/${props.unitId}/student_traces/${uid}`;
      await update(dbRef(rtdb, tracePath), {
        hwScore: Math.round(rawScore),
        hwStatus: "submitted",
        lastActive: serverTimestamp(),
      });

      recordAction(props.courseId, "提交單元作業結果", {
        unitId: props.unitId,
        taskId: props.taskId,
        score: Math.round(rawScore),
        isLate: isExpired.value,
      });
    }

    await Swal.fire({
      title: isExpired.value ? "作業已繳交 (遲交)" : "作業已繳交",
      text: "老師將會閱覽您的作答內容。",
      icon: "success",
      confirmButtonColor: "#4a70a9",
    });
    emit("close");
  } catch (error) {
    Swal.fire("錯誤", "存檔失敗", "error");
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
        ? `尚有 ${unanswered} 題未完成。`
        : "提交後老師將收到您的成果。",
    icon: "question",
    showCancelButton: true,
    confirmButtonColor: "#4a70a9",
    confirmButtonText: "正式繳交",
  });
  if (res.isConfirmed) submitHW();
};

onMounted(() => {
  if (props.isOpen) fetchHWDetail();
  nowInterval = setInterval(() => {
    now.value = Date.now();
  }, 60000);
});

onUnmounted(() => {
  if (nowInterval) clearInterval(nowInterval);
});
</script>
