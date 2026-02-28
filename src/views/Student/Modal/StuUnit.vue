<template>
  <div
    class="modal-card-custom shadow-lg animate__animated animate__zoomIn"
    style="max-width: 550px; width: 95%"
  >
    <div
      class="modal-header-custom border-bottom d-flex justify-content-between align-items-center p-3"
    >
      <h4 class="fw-800 mb-0 text-navy">單元學習引導</h4>
      <button class="close-btn border-0 bg-transparent" @click="$emit('close')">
        <span class="custom-x-text fs-4">✕</span>
      </button>
    </div>

    <div class="modal-body-custom p-4">
      <header class="text-center mb-4">
        <div class="unit-tag mb-2">{{ badgeText }}</div>
        <h3 class="fw-800 text-dark">{{ unitData?.title || "載入中..." }}</h3>
        <p class="text-muted small px-3">
          {{
            unitData?.description ||
            "本單元暫無詳細描述，請點擊下方按鈕開始學習任務。"
          }}
        </p>
      </header>

      <section class="row g-3 mb-4 text-center">
        <div class="col-4">
          <div class="resource-stat-mini p-2 rounded-3 border">
            <div class="xx-small text-muted">學習教材</div>
            <div class="fw-bold text-primary">
              {{ unitData?.materials?.length || 0 }}
            </div>
          </div>
        </div>
        <div class="col-4">
          <div class="resource-stat-mini p-2 rounded-3 border">
            <div class="xx-small text-muted">指定任務</div>
            <div class="fw-bold text-warning">
              {{ unitData?.assignments?.length || 0 }}
            </div>
          </div>
        </div>
        <div class="col-4">
          <div class="resource-stat-mini p-2 rounded-3 border">
            <div class="xx-small text-muted">單元測驗</div>
            <div class="fw-bold text-success">
              {{ unitData?.exams?.length || 0 }}
            </div>
          </div>
        </div>
      </section>

      <div
        class="unit-notice-box mb-4 p-3 rounded-3 bg-light border-start border-4 border-primary"
      >
        <h6 class="ex-label-small mb-2 text-navy">
          <i class="bi bi-info-circle-fill me-2"></i>學習提醒
        </h6>
        <ul class="notice-list-clean small text-muted mb-0">
          <li>開始任務後，請盡量保持網路連線穩定。</li>
          <li>點擊下方確認按鈕後即可開始操作時程表任務。</li>
        </ul>
      </div>

      <footer class="unit-intro-footer">
        <button
          class="ex-btn-primary w-100 py-3 rounded-pill fw-bold"
          @click="$emit('confirm')"
        >
          確認進入單元任務 <i class="bi bi-chevron-right ms-2"></i>
        </button>
      </footer>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits } from "vue";
import "./StuUnit.css";

// 🌟 接收來自父組件的資料
const props = defineProps({
  unitData: {
    type: Object,
    default: () => ({}),
  },
  badgeText: {
    type: String,
    default: "UNIT",
  },
});

// 🌟 定義通知父組件的動作
defineEmits(["close", "confirm"]);
</script>

<style scoped>
/* 可以在這裡微調彈窗專用的 CSS */
.resource-stat-mini {
  background-color: #f8fafc;
  transition: all 0.2s ease;
}
.unit-tag {
  display: inline-block;
  background: rgba(74, 112, 169, 0.1);
  color: #4a70a9;
  padding: 4px 16px;
  border-radius: 50px;
  font-size: 0.75rem;
  font-weight: 900;
}
.notice-list-clean {
  list-style: none;
  padding-left: 0;
}
.notice-list-clean li::before {
  content: "•";
  color: #4a70a9;
  font-weight: bold;
  display: inline-block;
  width: 1em;
}
</style>
