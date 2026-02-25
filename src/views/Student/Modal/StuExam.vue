<template>
  <div
    class="StuExam h-100 d-flex flex-column animate__animated animate__fadeIn"
  >
    <div
      v-if="!isStarted"
      class="m-auto text-center py-5 px-4"
      style="max-width: 600px"
    >
      <i
        class="bi bi-clock-history text-navy display-1 mb-4 animate-bounce"
      ></i>
      <h2 class="fw-bold text-navy">{{ examData?.title }}</h2>
      <div class="d-flex justify-content-center gap-2 mb-4">
        <span
          class="badge rounded-pill bg-navy-soft text-navy border px-3 py-2"
        >
          限時 {{ examData?.settings?.duration || "無" }} 分鐘
        </span>
      </div>
      <button
        @click="handleStartExam"
        class="btn btn-navy-pill btn-lg w-100 shadow-lg fw-bold"
      >
        進入正式測驗
      </button>
    </div>

    <div v-else class="hw-main-container d-flex flex-grow-1 overflow-hidden">
      <aside class="answer-sidebar d-none d-md-flex flex-column">
        <div class="p-3 bg-dark text-white text-center">
          <div class="small opacity-75">剩餘時間</div>
          <div class="fs-3 fw-bold font-monospace">{{ formattedTime }}</div>
        </div>
        <div class="flex-grow-1 overflow-auto p-3">
          <div class="answer-grid">
            <div
              v-for="(q, idx) in examData?.questions"
              :key="idx"
              @click="currentIndex = idx"
              :class="[
                'answer-status-box',
                { active: currentIndex === idx, completed: hasAnswered(idx) },
              ]"
            >
              {{ idx + 1 }}
            </div>
          </div>
        </div>
      </aside>

      <main class="question-workspace flex-grow-1 d-flex flex-column"></main>
    </div>
  </div>
</template>

<script setup>
// 考試邏輯包含 Timer 控制、Attempt 限制、自動計分邏輯等
import "./StuTask.css";
// ...其餘邏輯同您原本代碼但套用統一變數與類別
</script>
