<template>
  <div class="StuRank card border-0 shadow-sm p-4 rounded-4">
    <div class="d-flex align-items-center justify-content-between mb-4">
      <div class="d-flex align-items-center">
        <div class="icon-box me-3 bg-soft-primary text-primary">
          <i class="bi bi-trophy-fill"></i>
        </div>
        <h5 class="fw-bold mb-0 text-navy">學習積分排行榜</h5>
      </div>
      <span class="badge bg-light text-muted border px-3 rounded-pill xx-small">
        {{ isAnonymousMode ? "匿名模式已開啟" : "實名模式" }}
      </span>
    </div>

    <div class="rank-list custom-scrollbar">
      <transition-group name="list" tag="div">
        <div
          v-for="(student, index) in sortedRank"
          :key="student.uid"
          class="rank-item d-flex align-items-center p-3 mb-3 rounded-4 shadow-sm"
          :class="{ 'is-me': student.uid === currentUser?.uid }"
        >
          <div class="rank-number me-3" :class="'top-' + (index + 1)">
            {{ index + 1 }}
          </div>

          <div class="avatar-wrapper me-3">
            <div class="avatar-circle">
              {{ getDisplayName(student).substring(0, 1) }}
            </div>
          </div>

          <div class="flex-grow-1">
            <div class="d-flex align-items-center">
              <span class="fw-bold text-navy me-2">{{
                getDisplayName(student)
              }}</span>
              <span
                v-if="student.uid === currentUser?.uid"
                class="badge bg-primary xx-small rounded-pill"
                >我</span
              >
            </div>
            <div class="progress mt-2" style="height: 6px">
              <div
                class="progress-bar bg-primary rounded-pill"
                :style="{ width: student.progress + '%' }"
              ></div>
            </div>
          </div>

          <div class="ms-3 text-end">
            <div class="fw-900 text-primary fs-5">{{ student.score || 0 }}</div>
            <div class="xx-small text-muted text-uppercase">Points</div>
          </div>
        </div>
      </transition-group>

      <div v-if="sortedRank.length === 0" class="text-center py-5 opacity-50">
        <i class="bi bi-people fs-1"></i>
        <p class="mt-2">尚無組員資料</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { rtdb, auth } from "../../../firebase/config";
import {
  ref as dbRef,
  onValue,
  query,
  orderByChild,
  equalTo,
} from "firebase/database";

const props = defineProps({
  courseId: String,
});

const currentUser = ref(auth.currentUser);
const students = ref([]);
const isAnonymousMode = ref(false); // 🌟 讀取自教師端的實驗設定

// 1. 取得顯示名稱邏輯
const getDisplayName = (student) => {
  // 如果是本人，永遠顯示實名
  if (student.uid === currentUser.value?.uid) return student.displayName;

  // 如果開啟匿名模式，隱藏他人姓名
  if (isAnonymousMode.value) {
    return `匿名的同學 (${student.uid.substring(0, 3)})`;
  }

  return student.displayName;
};

// 2. 排序邏輯
const sortedRank = computed(() => {
  return [...students.value].sort((a, b) => (b.score || 0) - (a.score || 0));
});

// 3. 監聽 Firebase 資料
onMounted(() => {
  const user = auth.currentUser;
  if (!user) return;

  // A. 先取得自己的組別與該組的匿名設定
  onValue(
    dbRef(rtdb, `courses/${props.courseId}/profiles/${user.uid}`),
    (profileSnap) => {
      const myProfile = profileSnap.val();
      if (myProfile && myProfile.groupId) {
        // B. 監聽組別的匿名開關
        onValue(
          dbRef(
            rtdb,
            `courses/${props.courseId}/experiment/groups/${myProfile.groupId}/features/isLeaderboardAnonymous`,
          ),
          (anonSnap) => {
            isAnonymousMode.value = anonSnap.val() || false;
          },
        );

        // C. 抓取同組所有同學資料
        const groupQuery = query(
          dbRef(rtdb, `courses/${props.courseId}/profiles`),
          orderByChild("groupId"),
          equalTo(myProfile.groupId),
        );

        onValue(groupQuery, (snapshot) => {
          const data = snapshot.val();
          students.value = data ? Object.values(data) : [];
        });
      }
    },
  );
});
</script>
