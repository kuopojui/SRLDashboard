<template>
  <div class="TrHW score-view-container animate__animated animate__fadeIn">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h4 class="fw-bold text-navy mb-0">
        <i class="bi bi-journal-check me-2"></i>功課評分
      </h4>
    </div>

    <div
      v-for="a in assignments"
      :key="a.id"
      class="score-list-card d-flex justify-content-between align-items-center"
    >
      <div>
        <span class="status-pill badge-pre mb-2">{{
          a.unit || "一般作業"
        }}</span>
        <h5 class="fw-bold text-navy mb-1">{{ a.title }}</h5>
        <small class="text-muted">截止：{{ a.deadline || "不限時" }}</small>
      </div>
      <button class="btn btn-navy-pill btn-sm px-4" @click="openModal(a)">
        查看繳交
      </button>
    </div>

    <div
      v-if="showModal"
      class="ex-modal-overlay"
      @click.self="showModal = false"
    >
      <div class="ex-modal-content" style="max-width: 800px">
        <div class="ex-modal-header">
          <h3>批改：{{ currentItem?.title }}</h3>
          <button class="btn-close" @click="showModal = false"></button>
        </div>
        <div class="ex-form-container">
          <div class="ex-table-wrapper">
            <table class="ex-score-table">
              <thead>
                <tr>
                  <th class="ps-4">學生</th>
                  <th class="text-center">狀態</th>
                  <th class="text-center">分數</th>
                  <th class="text-center">操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="stu in studentList" :key="stu.uid">
                  <td class="ps-4 stu-info">
                    <span class="name">{{ stu.realName }}</span>
                  </td>
                  <td class="text-center">
                    <span
                      :class="[
                        'status-pill',
                        stu.submitted ? 'badge-done' : 'badge-pending',
                      ]"
                    >
                      {{ stu.submitted ? "已繳" : "未繳" }}
                    </span>
                  </td>
                  <td class="text-center">
                    <div class="quick-score-box">
                      <input
                        v-model="stu.score"
                        type="number"
                        @change="saveScore(stu.uid, stu.score)"
                      />
                      <span class="smaller text-muted">分</span>
                    </div>
                  </td>
                  <td class="text-center">
                    <button
                      class="btn btn-sm btn-outline-secondary rounded-pill"
                    >
                      內容
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { rtdb as db } from "../../../firebase/config";
import { ref as dbRef, onValue, set } from "firebase/database";
import "./score.css";

const props = defineProps({ courseId: String });
const assignments = ref([]);
const showModal = ref(false);
const currentItem = ref(null);
const studentList = ref([]);

onMounted(() => {
  onValue(dbRef(db, `courses/${props.courseId}/assignments`), (snap) => {
    assignments.value = snap.val()
      ? Object.entries(snap.val()).map(([id, d]) => ({ id, ...d }))
      : [];
  });
});

const openModal = (item) => {
  currentItem.value = item;
  showModal.value = true;
  // 建立學生清單邏輯...
};

const saveScore = async (uid, score) => {
  const path = `courses/${props.courseId}/assignments/${currentItem.value.id}/scores/${uid}`;
  await set(dbRef(db, path), { score: Number(score), updatedAt: Date.now() });
};
</script>
