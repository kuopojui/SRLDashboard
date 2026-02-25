<template>
  <div class="TrTest score-view-container animate__animated animate__fadeIn">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h4 class="fw-bold text-navy mb-0">
        <i class="bi bi-file-earmark-bar-graph me-2"></i>測驗管理
      </h4>
    </div>

    <div
      v-for="e in exams"
      :key="e.id"
      class="score-list-card d-flex justify-content-between align-items-center"
    >
      <div>
        <span class="status-pill badge-post mb-2">測驗</span>
        <h5 class="fw-bold text-navy mb-1">{{ e.title }}</h5>
        <small class="text-muted">{{ e.questions?.length || 0 }} 題</small>
      </div>
      <button class="btn btn-navy-pill btn-sm px-4" @click="openModal(e)">
        成績總覽
      </button>
    </div>

    <div
      v-if="showModal"
      class="ex-modal-overlay"
      @click.self="showModal = false"
    >
      <div class="ex-modal-content" style="max-width: 800px">
        <div class="ex-modal-header bg-navy text-white">
          <h3 class="text-white">成績表：{{ currentItem?.title }}</h3>
          <button
            class="btn-close btn-close-white"
            @click="showModal = false"
          ></button>
        </div>
        <div class="ex-form-container">
          <div class="ex-table-wrapper">
            <table class="ex-score-table">
              <thead>
                <tr>
                  <th class="ps-4">學生</th>
                  <th class="text-center">交卷</th>
                  <th class="text-center" style="width: 150px">最終分數</th>
                  <th class="text-center">細項</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="uid in studentUids" :key="uid">
                  <td class="ps-4 stu-info">
                    <span class="name">{{ profiles[uid]?.realName }}</span>
                  </td>
                  <td class="text-center">
                    <span
                      :class="[
                        'status-pill',
                        answers[uid] ? 'badge-done' : 'badge-pending',
                      ]"
                    >
                      {{ answers[uid] ? "已交" : "未交" }}
                    </span>
                  </td>
                  <td class="text-center">
                    <div class="quick-score-box">
                      <input
                        v-model="scores[uid]"
                        type="number"
                        @change="saveTestScore(uid, scores[uid])"
                      />
                    </div>
                  </td>
                  <td class="text-center">
                    <button
                      class="btn btn-sm btn-light border rounded-pill"
                      :disabled="!answers[uid]"
                    >
                      查看
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
const exams = ref([]);
const showModal = ref(false);
const currentItem = ref(null);
const profiles = ref({});
const answers = ref({});
const scores = ref({});
const studentUids = ref([]);

onMounted(() => {
  onValue(dbRef(db, `courses/${props.courseId}/profiles`), (snap) => {
    profiles.value = snap.val() || {};
    studentUids.value = Object.keys(profiles.value);
  });
  onValue(dbRef(db, `courses/${props.courseId}/exams`), (snap) => {
    exams.value = snap.val()
      ? Object.entries(snap.val()).map(([id, d]) => ({ id, ...d }))
      : [];
  });
});

const saveTestScore = async (uid, score) => {
  const path = `courses/${props.courseId}/exams/${currentItem.value.id}/answers/${uid}/score`;
  await set(dbRef(db, path), Number(score));
};
</script>
