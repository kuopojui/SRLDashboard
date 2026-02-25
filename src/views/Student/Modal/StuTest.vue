<template>
  <div class="StuTest p-4 animate__animated animate__fadeIn">
    <div class="container mx-auto" style="max-width: 800px">
      <div class="card border-0 shadow-sm rounded-4 mb-4 overflow-hidden">
        <div class="bg-navy py-2"></div>
        <div class="card-body p-5 text-center">
          <h3 class="fw-bold text-navy">{{ testData?.title }}</h3>
          <p class="text-muted mb-0">{{ testData?.description }}</p>
        </div>
      </div>

      <div
        v-for="(q, idx) in normalizedQuestions"
        :key="idx"
        class="card border-0 shadow-sm rounded-4 mb-4 p-4"
      >
        <div class="mb-3">
          <span class="badge bg-navy-soft text-navy px-3 rounded-pill"
            >Q{{ idx + 1 }}</span
          >
        </div>
        <h5 class="fw-bold mb-4 text-dark">{{ q.displayTitle }}</h5>

        <div v-if="q.type === 'shortAnswer'">
          <textarea
            v-model="answers[idx]"
            class="form-control border-2 rounded-4"
            rows="3"
          ></textarea>
        </div>
        <div
          v-else
          class="likert-row d-flex justify-content-between align-items-center"
        >
          <label
            v-for="(opt, oIdx) in q.displayOptions"
            :key="oIdx"
            class="likert-circle-item"
            :class="{ selected: hasSelected(idx, oIdx) }"
          >
            <input
              type="radio"
              :value="oIdx"
              v-model="answers[idx]"
              class="d-none"
            />
            <div class="circle-btn">{{ oIdx + 1 }}</div>
            <small class="mt-2 text-muted">{{ opt }}</small>
          </label>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import "./StuTask.css";
// ...問卷讀取與實驗路徑寫入邏輯
</script>
