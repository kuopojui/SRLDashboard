<template>
  <div class="TrTest score-view-container animate__animated animate__fadeIn">
    <div
      class="score-filter-bar d-flex justify-content-between align-items-center mb-4 rounded-4 shadow-sm"
    >
      <h4 class="fw-bold text-navy mb-0">
        <i class="bi bi-clipboard-data me-2"></i>實驗數據監控
      </h4>
      <div class="badge bg-soft-primary text-primary px-3 py-2 rounded-pill">
        參與學生：{{ studentUids.length }} 人
      </div>
    </div>

    <div class="student-list-wrapper">
      <div
        v-for="uid in studentUids"
        :key="uid"
        class="student-card mb-3 shadow-sm border-0 bg-white rounded-4 p-3 d-flex justify-content-between align-items-center"
        :class="{ 'has-group-border': profiles[uid]?.groupId }"
      >
        <div class="d-flex align-items-center gap-3">
          <div class="avatar-circle">
            {{ profiles[uid]?.displayName?.substring(0, 1) || "?" }}
          </div>
          <div>
            <div class="fw-bold text-navy fs-5">
              {{ profiles[uid]?.displayName || "未具名" }}
            </div>
            <div class="xx-small text-muted">ID: {{ uid.substring(0, 8) }}</div>
          </div>
        </div>

        <div class="d-flex align-items-center gap-4">
          <div class="d-none d-md-flex align-items-center gap-2">
            <span
              class="status-indicator"
              :class="getCompletionStatus(uid).class"
            ></span>
            <span class="small fw-bold text-secondary">{{
              getCompletionStatus(uid).text
            }}</span>
          </div>

          <button
            class="btn btn-navy btn-sm rounded-pill px-3"
            @click="selectedStudent = uid"
          >
            查看答題內容
          </button>
        </div>

        <div class="d-flex align-items-center gap-2">
          <select
            v-model="profiles[uid].groupId"
            class="ex-select-sm"
            :class="{ 'selected-group': profiles[uid].groupId }"
            @change="updateGroup(uid, profiles[uid].groupId)"
          >
            <option value="">未分組</option>
            <option v-for="g in groups" :key="g.id" :value="g.id">
              {{ g.name }}
            </option>
          </select>
        </div>
      </div>
    </div>

    <TrTestAns
      v-if="selectedStudent"
      :uid="selectedStudent"
      :studentName="profiles[selectedStudent]?.displayName"
      :preTests="preTests"
      :postTests="postTests"
      :submissions="submissions"
      @close="selectedStudent = null"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { rtdb as db } from "../../../firebase/config";
import { ref as dbRef, onValue, update } from "firebase/database";
import Swal from "sweetalert2";
import TrTestAns from "./TrTestAns.vue"; // 🌟 引入新組件

const props = defineProps({ courseId: String });
const profiles = ref({});
const studentUids = ref([]);
const groups = ref([]);
const preTests = ref([]);
const postTests = ref([]);
const submissions = ref({});

// 狀態管理：目前選中的學生 UID (null 代表關閉彈窗)
const selectedStudent = ref(null);

onMounted(() => {
  if (!props.courseId) return;

  onValue(dbRef(db, `courses/${props.courseId}/profiles`), (s) => {
    profiles.value = s.val() || {};
    studentUids.value = Object.keys(profiles.value);
  });

  onValue(dbRef(db, `courses/${props.courseId}/experiment/groups`), (s) => {
    const data = s.val();
    groups.value = data
      ? Object.entries(data).map(([id, val]) => ({ id, ...val }))
      : [];
  });

  onValue(
    dbRef(db, `courses/${props.courseId}/experiment/test/pretest`),
    (s) => {
      const data = s.val() || {};
      preTests.value = Object.entries(data).map(([id, val]) => ({
        id,
        ...val,
      }));
    },
  );

  onValue(
    dbRef(db, `courses/${props.courseId}/experiment/test/posttest`),
    (s) => {
      const data = s.val() || {};
      postTests.value = Object.entries(data).map(([id, val]) => ({
        id,
        ...val,
      }));
    },
  );

  onValue(
    dbRef(db, `courses/${props.courseId}/experiment/submissions`),
    (s) => {
      submissions.value = s.val() || {};
    },
  );
});

const getCompletionStatus = (uid) => {
  const allTids = [
    ...preTests.value.map((t) => t.id),
    ...postTests.value.map((t) => t.id),
  ];
  if (allTids.length === 0) return { text: "無測驗", class: "bg-secondary" };
  const doneCount = allTids.filter(
    (tid) => submissions.value[tid]?.[uid],
  ).length;
  if (doneCount === 0) return { text: "尚未開始", class: "bg-danger" };
  if (doneCount < allTids.length)
    return { text: `進度 ${doneCount}/${allTids.length}`, class: "bg-warning" };
  return { text: "全部完成", class: "bg-success" };
};

const updateGroup = async (uid, gid) => {
  try {
    await update(dbRef(db, `courses/${props.courseId}/profiles/${uid}`), {
      groupId: gid,
    });
    Swal.fire({
      icon: "success",
      title: "組別已變更",
      timer: 1000,
      showConfirmButton: false,
    });
  } catch (e) {
    Swal.fire("錯誤", "更新失敗", "error");
  }
};
</script>
