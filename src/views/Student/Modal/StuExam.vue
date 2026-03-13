<template>
  <div
    class="StuExam h-100 d-flex flex-column animate__animated animate__fadeIn"
  >
    <div
      v-if="!isStarted"
      class="m-auto text-center py-5 px-4"
      style="max-width: 600px"
    >
      <div class="prepare-info border">
        <i class="bi bi-patch-question text-navy display-1 mb-4"></i>
        <h2 class="fw-bold text-navy mb-3">
          {{ examData?.title || "載入中..." }}
        </h2>
        <div class="d-flex justify-content-center gap-2 mb-4">
          <span class="badge rounded-pill bg-navy text-navy border px-3 py-2">
            <i class="bi bi-clock me-1"></i>限時
            {{ examData?.duration || 0 }} 分鐘
          </span>
          <span class="badge rounded-pill bg-light text-muted border px-3 py-2">
            <i class="bi bi-list-ol me-1"></i>共
            {{ examData?.questions?.length || 0 }} 題
          </span>
        </div>
        <button
          @click="handleStartExam"
          class="btn btn-navy-pill btn-lg w-100 shadow-lg fw-bold"
        >
          進入正式測驗
        </button>
        <button @click="$emit('close')" class="btn btn-link text-muted mt-3">
          暫時返回教材
        </button>
      </div>
    </div>

    <div v-else class="hw-main-container d-flex flex-grow-1 overflow-hidden">
      <aside class="answer-sidebar d-none d-md-flex">
        <div class="p-4 bg-dark text-white text-center shadow">
          <div class="small opacity-75 mb-1">剩餘時間</div>
          <div
            class="fs-2 fw-bold font-monospace"
            :class="{ 'text-danger animate-pulse': remainingTime < 60 }"
          >
            {{ formattedTime }}
          </div>
        </div>
        <div class="flex-grow-1 overflow-auto p-4">
          <div class="d-flex justify-content-between align-items-center mb-3">
            <label class="small fw-bold text-muted">題目導覽</label>
            <span class="badge bg-light text-navy"
              >{{ Object.keys(userAnswers).length }} /
              {{ examData?.questions?.length }}</span
            >
          </div>
          <div class="answer-grid">
            <div
              v-for="(q, idx) in examData?.questions"
              :key="idx"
              @click="currentIndex = idx"
              :class="[
                'answer-status-box',
                {
                  active: currentIndex === idx,
                  completed: userAnswers[idx] !== undefined,
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
            class="btn btn-navy w-100 rounded-pill py-2 fw-bold"
          >
            提交試卷
          </button>
        </div>
      </aside>

      <main
        class="question-workspace flex-grow-1 d-flex flex-column overflow-hidden"
      >
        <div
          class="d-md-none p-2 bg-dark text-white d-flex justify-content-between align-items-center px-3 flex-shrink-0"
        >
          <span class="small"
            ><i class="bi bi-clock me-1"></i>{{ formattedTime }}</span
          >
          <span class="small"
            >{{ currentIndex + 1 }} / {{ examData?.questions?.length }}</span
          >
        </div>

        <header
          class="p-3 border-bottom d-flex justify-content-between align-items-center bg-white flex-shrink-0"
        >
          <div class="d-flex align-items-center">
            <span class="fw-bold text-navy me-3"
              >題目 {{ currentIndex + 1 }}</span
            >
            <div
              class="progress d-none d-sm-flex"
              style="height: 6px; width: 120px"
            >
              <div
                class="progress-bar bg-navy"
                :style="{
                  width:
                    ((currentIndex + 1) / (examData?.questions?.length || 1)) *
                      100 +
                    '%',
                }"
              ></div>
            </div>
          </div>
          <button @click="$emit('close')" class="btn-close"></button>
        </header>

        <div
          class="q-content p-4 p-md-5 flex-grow-1 overflow-auto bg-white custom-scrollbar"
        >
          <h4 class="fw-bold mb-4 text-dark" style="line-height: 1.6">
            {{ currentQuestion?.question }}
          </h4>

          <div class="answer-area">
            <div
              v-if="currentQuestion?.type === 'multipleChoice'"
              class="options-list d-grid gap-3 mb-4"
            >
              <label
                v-for="(opt, oIdx) in currentQuestion?.options"
                :key="oIdx"
                class="option-item card p-3 border-2 transition-all cursor-pointer shadow-sm"
                :class="{ 'active-option': userAnswers[currentIndex] === oIdx }"
              >
                <input
                  type="radio"
                  class="d-none"
                  v-model="userAnswers[currentIndex]"
                  :value="oIdx"
                />
                <div class="d-flex align-items-center">
                  <span class="option-label me-3">{{
                    String.fromCharCode(65 + oIdx)
                  }}</span>
                  <span class="fw-medium text-secondary-emphasis text-wrap">{{
                    opt
                  }}</span>
                </div>
              </label>
            </div>

            <div
              v-else-if="currentQuestion?.type === 'multiSelect'"
              class="options-list d-grid gap-3 mb-4"
            >
              <label
                v-for="(opt, oIdx) in currentQuestion?.options"
                :key="oIdx"
                class="option-item card p-3 border-2 transition-all cursor-pointer shadow-sm"
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
                  <span class="option-label me-3">{{
                    String.fromCharCode(65 + oIdx)
                  }}</span>
                  <span class="fw-medium text-secondary-emphasis text-wrap">{{
                    opt
                  }}</span>
                </div>
              </label>
            </div>

            <div
              v-else-if="currentQuestion?.type === 'shortAnswer'"
              class="short-answer-area mb-4"
            >
              <textarea
                v-model="userAnswers[currentIndex]"
                class="form-control border-2 p-3 rounded-4 shadow-sm"
                rows="6"
                placeholder="請輸入您的答案..."
              ></textarea>
            </div>
          </div>
        </div>

        <footer
          class="p-3 p-md-4 border-top d-flex justify-content-between align-items-center bg-light flex-shrink-0"
        >
          <button
            @click="currentIndex--"
            :disabled="currentIndex === 0"
            class="btn btn-outline-secondary px-4 rounded-pill"
          >
            <i class="bi bi-chevron-left me-1"></i>上一題
          </button>

          <div class="d-flex gap-2">
            <button
              v-if="currentIndex < examData?.questions?.length - 1"
              @click="currentIndex++"
              class="btn btn-primary px-4 rounded-pill shadow"
            >
              下一題<i class="bi bi-chevron-right ms-1"></i>
            </button>

            <button
              v-else
              @click="confirmSubmit"
              class="btn btn-success px-5 rounded-pill shadow-sm"
            >
              提交正式測驗
            </button>
          </div>
        </footer>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";
import { rtdb } from "../../../firebase/config";
import { ref as dbRef, get, update, serverTimestamp } from "firebase/database";
import Swal from "sweetalert2";
import "./StuExam.css"; // 🌟 引入獨立的 CSS

const props = defineProps({
  isOpen: Boolean,
  courseId: String,
  unitId: String,
  examId: String,
});
const emit = defineEmits(["close"]);

// 狀態管理
const examData = ref(null);
const isLoading = ref(false);
const isStarted = ref(false);
const currentIndex = ref(0);
const userAnswers = ref({});
const remainingTime = ref(0);
let timer = null;

const formattedTime = computed(() => {
  const m = Math.floor(remainingTime.value / 60);
  const s = remainingTime.value % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
});

const currentQuestion = computed(
  () => examData.value?.questions?.[currentIndex.value],
);

const fetchExamDetail = async () => {
  if (!props.examId) return;
  isLoading.value = true;
  try {
    const path = `courses/${props.courseId}/exams/${props.examId}`;
    const snap = await get(dbRef(rtdb, path));
    if (snap.exists()) {
      examData.value = snap.val();
      remainingTime.value = (examData.value.duration || 10) * 60;
    }
  } catch (error) {
    console.error("🔥 讀取失敗:", error);
  } finally {
    isLoading.value = false;
  }
};

const handleStartExam = () => {
  isStarted.value = true;
  timer = setInterval(() => {
    if (remainingTime.value > 0) remainingTime.value--;
    else autoSubmit();
  }, 1000);
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
  const unanswered =
    examData.value.questions.length - Object.keys(userAnswers.value).length;
  const result = await Swal.fire({
    title: "確定提交？",
    text:
      unanswered > 0 ? `尚有 ${unanswered} 題未作答！` : "提交後將紀錄成績。",
    icon: "question",
    showCancelButton: true,
    confirmButtonText: "正式提交",
    cancelButtonText: "繼續檢查",
  });
  if (result.isConfirmed) submitExam();
};

const autoSubmit = () => {
  Swal.fire("時間到！", "系統已自動提交試卷。", "info");
  submitExam();
};

const submitExam = async () => {
  if (timer) clearInterval(timer);

  let totalScore = 0;
  let totalErrorCount = 0;
  const questions = examData.value.questions;

  questions.forEach((q, idx) => {
    const userAnswer = userAnswers.value[idx];
    const questionPoint = q.point || 100 / questions.length; // 取得該題配分

    // 如果完全沒寫或沒選，該題 0 分並計入錯誤
    if (
      userAnswer === undefined ||
      userAnswer === null ||
      (Array.isArray(userAnswer) && userAnswer.length === 0)
    ) {
      totalErrorCount++;
      return;
    }

    if (q.type === "multipleChoice") {
      // --- 單選題判定 ---
      if (userAnswer === q.finalAnswer) {
        totalScore += questionPoint;
      } else {
        totalErrorCount++;
      }
    } else if (q.type === "multiSelect") {
      // --- 多選題按比例給分判定 ---
      // 邏輯：比對每一個選項，答對（該選有選、不該選沒選）則拿分
      const correctAnswers = q.finalAnswer || []; // 正確答案索引陣列
      const optionsCount = q.options.length; // 總選項數
      let correctOptionsInTask = 0;

      for (let i = 0; i < optionsCount; i++) {
        const shouldBeSelected = correctAnswers.includes(i);
        const isActuallySelected = userAnswer.includes(i);

        // 判定：該選的有選，或是不該選的沒選，皆算對一個選項
        if (shouldBeSelected === isActuallySelected) {
          correctOptionsInTask++;
        }
      }

      // 計算比例得分：(對的選項數 / 總選項數) * 該題配分
      const earnedPoint = (correctOptionsInTask / optionsCount) * questionPoint;
      totalScore += earnedPoint;

      // 如果沒有全對，計入錯誤題數（視為未完全掌握）
      if (correctOptionsInTask !== optionsCount) {
        totalErrorCount++;
      }
    } else if (q.type === "shortAnswer") {
      // --- 簡答題判定 ---
      if (userAnswer?.trim() === q.refAnswer?.trim()) {
        totalScore += questionPoint;
      } else {
        totalErrorCount++;
      }
    }
  });

  // 全部計算完畢後才進行四捨五入
  const finalRoundedScore = Math.round(totalScore);

  try {
    // 這裡建議加上使用者 ID 以免覆蓋他人數據
    const tracePath = `student_traces/${props.courseId}_${props.unitId}`;
    await update(dbRef(rtdb, tracePath), {
      currentScore: finalRoundedScore,
      errorCount: totalErrorCount,
      lastActive: serverTimestamp(),
    });

    await Swal.fire({
      title: "測驗完成！",
      html: `您的得分：<b style="font-size: 1.5rem; color: #1a237e;">${finalRoundedScore}</b> 分<br>錯誤或未完全答對：${totalErrorCount} 題`,
      icon: "success",
      confirmButtonText: "回到單元內容",
    });

    emit("close");
  } catch (error) {
    console.error("🔥 同步失敗:", error);
    Swal.fire("錯誤", "成績儲存失敗，請檢查網路連線。", "error");
  }
};

onMounted(() => {
  if (props.isOpen) fetchExamDetail();
});
onUnmounted(() => {
  if (timer) clearInterval(timer);
});
</script>
