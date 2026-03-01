<template>
  <div class="StuSrlMonitor card border-0 shadow-sm p-4 rounded-4">
    <div class="d-flex align-items-center mb-4">
      <div class="icon-box bg-soft-primary text-primary">
        <i class="bi bi-speedometer2"></i>
      </div>
      <h5 class="fw-bold mb-0 ms-3">組內學習進度監控</h5>
    </div>

    <div class="progress-section mb-4">
      <div class="d-flex justify-content-between mb-2">
        <span class="small fw-bold text-secondary">我的完成進度</span>
        <span class="small text-primary fw-bold">{{ myProgress }}%</span>
      </div>
      <div class="progress" style="height: 10px">
        <div
          class="progress-bar bg-primary"
          :style="{ width: myProgress + '%' }"
        ></div>
      </div>
    </div>

    <div class="leaderboard-mini-box">
      <h6 class="xx-small fw-bold text-muted text-uppercase mb-3">
        小組成員狀態
      </h6>
      <div
        v-for="(stu, index) in groupStudents"
        :key="stu.uid"
        class="mini-rank-item"
      >
        <span class="rank-num">{{ index + 1 }}</span>
        <span class="stu-name">{{ stu.displayName }}</span>
        <span class="stu-status ms-auto">{{ stu.score }} pts</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { rtdb, auth } from "../../firebase/config";
import {
  ref as dbRef,
  onValue,
  query,
  orderByChild,
  equalTo,
} from "firebase/database";

const props = defineProps(["courseId"]);
const groupStudents = ref([]);
const myProgress = ref(0);

onMounted(() => {
  const user = auth.currentUser;
  if (!user) return;

  // 1. 取得自己的組別與進度
  onValue(
    dbRef(rtdb, `courses/${props.courseId}/profiles/${user.uid}`),
    (snap) => {
      const profile = snap.val();
      if (profile) {
        myProgress.value = profile.progress || 0;

        // 2. 抓取同組成員資料進行監控
        const q = query(
          dbRef(rtdb, `courses/${props.courseId}/profiles`),
          orderByChild("groupId"),
          equalTo(profile.groupId),
        );
        onValue(q, (groupSnap) => {
          const data = groupSnap.val();
          groupStudents.value = data
            ? Object.values(data).sort((a, b) => b.score - a.score)
            : [];
        });
      }
    },
  );
});
</script>

<style src="./StuSrlMonitor.css" scoped></style>
