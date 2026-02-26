<template>
  <div
    class="TrExperiment score-view-container animate__animated animate__fadeIn"
  >
    <div
      class="score-filter-bar d-flex justify-content-between align-items-center mb-4 rounded-4 shadow-sm"
    >
      <h4 class="fw-bold text-navy mb-0">
        <i class="bi bi-layout-split me-2"></i>實驗對照數據
      </h4>
      <div class="status-pill badge-pre">
        實驗參與：{{ studentUids.length }} 人
      </div>
    </div>

    <div class="ex-table-wrapper">
      <table class="ex-score-table">
        <thead>
          <tr>
            <th class="ps-4">學生資訊</th>
            <th class="text-center">前測 (Pre)</th>
            <th class="text-center">後測 (Post)</th>
            <th class="pe-4 text-center">實驗分組</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="uid in studentUids" :key="uid">
            <td class="ps-4 stu-info">
              <span class="name">{{ profiles[uid]?.realName }}</span>
              <span class="id">{{ profiles[uid]?.studentId }}</span>
            </td>
            <td class="text-center">
              <span
                :class="[
                  'status-pill',
                  hasPre(uid) ? 'badge-done' : 'badge-pending',
                ]"
              >
                {{ hasPre(uid) ? "已測" : "缺考" }}
              </span>
            </td>
            <td class="text-center">
              <span
                :class="[
                  'status-pill',
                  hasPost(uid) ? 'badge-done' : 'badge-pending',
                ]"
              >
                {{ hasPost(uid) ? "已測" : "缺考" }}
              </span>
            </td>
            <td class="pe-4 text-center">
              <select
                v-model="profiles[uid].group"
                class="ex-select py-1"
                @change="updateGroup(uid, profiles[uid].group)"
              >
                <option value="">未分組</option>
                <option v-for="g in groups" :key="g.id" :value="g.id">
                  {{ g.name }}
                </option>
              </select>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { rtdb as db } from "../../../firebase/config";
import { ref as dbRef, onValue, set } from "firebase/database";
import "./score.css";

const props = defineProps({ courseId: String });
const profiles = ref({});
const studentUids = ref([]);
const groups = ref([]);
const expExams = ref({});

onMounted(() => {
  onValue(dbRef(db, `courses/${props.courseId}/profiles`), (s) => {
    profiles.value = s.val() || {};
    studentUids.value = Object.keys(profiles.value);
  });
  onValue(
    dbRef(db, `courses/${props.courseId}/experiment/settings/groups`),
    (s) => (groups.value = s.val() || []),
  );
  onValue(
    dbRef(db, `courses/${props.courseId}/experiment/exams`),
    (s) => (expExams.value = s.val() || {}),
  );
});

const hasPre = (uid) =>
  Object.values(expExams.value).some(
    (e) => e.bindType === "pretest" && e.answers?.[uid],
  );
const hasPost = (uid) =>
  Object.values(expExams.value).some(
    (e) => e.bindType === "posttest" && e.answers?.[uid],
  );

const updateGroup = async (uid, gid) => {
  await set(dbRef(db, `courses/${props.courseId}/profiles/${uid}/group`), gid);
};
</script>
