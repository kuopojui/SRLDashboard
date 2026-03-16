<template>
  <div class="TrSRL modal-overlay-custom" @click.self="$emit('close')">
    <div class="TrSRL-detail-modal shadow-lg animate__animated animate__zoomIn">
      <div class="TrSRL-modal-header border-bottom-0">
        <h5 class="TrSRL-header-title">
          <i class="bi bi-clipboard-data-history"></i>
          <span>{{ student?.realName || "未具名" }} - SRL 學習歷程</span>
        </h5>
        <button type="button" class="TrSRL-btn-close" @click="$emit('close')">
          ✕
        </button>
      </div>

      <div class="TrSRL-modal-body custom-scrollbar">
        <div v-if="loading" class="TrSRL-loading-box">
          <div class="spinner-border text-primary" role="status"></div>
          <p class="mt-2 text-muted">正在對齊單元數據...</p>
        </div>

        <div v-else-if="combinedSRLData.length === 0" class="TrSRL-empty-box">
          <i class="bi bi-folder2-open display-4 text-muted"></i>
          <p class="mt-3">該學生目前尚無任何單元填寫紀錄</p>
        </div>

        <div v-else class="TrSRL-timeline">
          <div
            v-for="item in combinedSRLData"
            :key="item.unitId"
            class="TrSRL-unit-card shadow-sm"
          >
            <div class="TrSRL-unit-header">
              <span class="TrSRL-unit-badge">單元</span>
              <h6 class="TrSRL-unit-title">{{ item.unitTitle }}</h6>
              <span
                :class="[
                  'TrSRL-status-tag',
                  item.isFinished ? 'done' : 'ongoing',
                ]"
              >
                {{ item.isFinished ? "已完成" : "學習中" }}
              </span>
            </div>

            <div class="TrSRL-content-grid">
              <div class="TrSRL-section TrSRL-plan">
                <div class="TrSRL-section-label">
                  <i class="bi bi-compass"></i> 學習規劃 (Plan)
                </div>
                <div v-if="item.plan" class="TrSRL-content-box">
                  <div class="TrSRL-data-item">
                    <span class="TrSRL-label">預計目標：</span>
                    <span class="TrSRL-value">{{
                      item.plan.targetGoal || "未填寫"
                    }}</span>
                  </div>
                  <div class="TrSRL-data-item">
                    <span class="TrSRL-label">預計時間：</span>
                    <span class="TrSRL-value"
                      >{{ item.plan.targetTime || 0 }} 分鐘</span
                    >
                  </div>
                  <div class="TrSRL-data-item">
                    <span class="TrSRL-label">選用策略：</span>
                    <div class="TrSRL-tag-group">
                      <span
                        v-for="s in item.plan.strategies"
                        :key="s"
                        class="TrSRL-tag-blue"
                        >{{ s }}</span
                      >
                    </div>
                  </div>
                </div>
                <div v-else class="TrSRL-empty-hint">尚未進行單元規劃</div>
              </div>

              <div class="TrSRL-section TrSRL-eval">
                <div class="TrSRL-section-label">
                  <i class="bi bi-arrow-repeat"></i> 自我反思 (Eval)
                </div>
                <div v-if="item.eval" class="TrSRL-content-box">
                  <div class="TrSRL-data-item">
                    <span class="TrSRL-label">學習心得：</span>
                    <span class="TrSRL-value TrSRL-comment">{{
                      item.eval.userComment || "未填寫"
                    }}</span>
                  </div>
                  <div class="TrSRL-data-item">
                    <span class="TrSRL-label">成效歸因：</span>
                    <div class="TrSRL-tag-group">
                      <span
                        v-for="attr in item.eval.attribution"
                        :key="attr"
                        class="TrSRL-tag-orange"
                      >
                        {{ translateAttr(attr) }}
                      </span>
                    </div>
                  </div>
                  <div class="TrSRL-data-item mt-2">
                    <span class="TrSRL-label">AI 建議：</span>
                    <p class="TrSRL-ai-advice">
                      {{ item.eval.aiAdvice || "尚無建議" }}
                    </p>
                  </div>
                </div>
                <div v-else class="TrSRL-empty-hint">尚未完成單元反思</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { rtdb } from "../../../firebase/config";
import { ref as dbRef, get } from "firebase/database";
import "./TrSRL.css"; // 引入下方獨立 CSS

const props = defineProps({
  student: Object,
  courseId: String,
});

const loading = ref(true);
const combinedSRLData = ref([]);

const translateAttr = (key) => {
  const map = {
    strategy: "學習策略",
    effort: "投入程度",
    difficulty: "內容難度",
    distraction: "環境干擾",
    interest: "學習興趣",
    other: "其他原因",
  };
  return map[key] || key;
};

const fetchSRLHistory = async () => {
  loading.value = true;
  try {
    const courseId = props.courseId;
    const uid = props.student.uid;

    const unitsSnap = await get(dbRef(rtdb, `courses/${courseId}/units`));
    const unitsData = unitsSnap.val() || {};

    const planSnap = await get(
      dbRef(rtdb, `courses/${courseId}/profiles/${uid}/srl/planning`),
    );
    const plans = planSnap.val() || {};

    const results = [];
    for (const [unitId, unitInfo] of Object.entries(unitsData)) {
      const trace = unitInfo.student_traces?.[uid] || {};
      const reflection = trace.reflection || null;
      const plan = plans[unitId] || null;

      if (plan || reflection) {
        results.push({
          unitId,
          unitTitle: unitInfo.title || "未知單元",
          isFinished: trace.isFinished || false,
          plan: plan,
          eval: reflection,
        });
      }
    }
    combinedSRLData.value = results.sort((a, b) => (b.isFinished ? 1 : -1));
  } catch (err) {
    console.error("TrSRL Fetch Error:", err);
  } finally {
    loading.value = false;
  }
};

// TrList.vue 中的正確做法
const openSRLDetail = (student) => {
  if (!student) return;
  selectedStudent.value = student; // 1. 先賦值
  showSRLModal.value = true; // 2. 再開啟彈窗
};

onMounted(fetchSRLHistory);
</script>
