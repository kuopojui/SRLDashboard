<template>
  <div class="StuRank card border-0 shadow-sm p-4 rounded-4">
    <div class="d-flex align-items-center justify-content-between mb-4">
      <div class="d-flex align-items-center justify-content-between mb-4">
        <div class="d-flex align-items-center">
          <div class="icon-box me-3 bg-soft-primary text-primary">
            <i class="bi bi-trophy-fill"></i>
          </div>
          <h5 class="fw-bold mb-0 text-navy">學習積分排行榜</h5>
        </div>

        <span
          class="badge border px-3 rounded-pill xx-small transition-all"
          :class="
            isAnonymousMode
              ? 'bg-primary text-white border-primary'
              : 'bg-light text-muted'
          "
        >
          <i
            :class="
              isAnonymousMode
                ? 'bi bi-incognito me-1'
                : 'bi bi-person-check me-1'
            "
          ></i>
          {{ isAnonymousMode ? "匿名模式已開啟" : "實名模式" }}
        </span>
      </div>
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

onMounted(() => {
  const user = auth.currentUser;
  // 增加安全檢查，確保有課程 ID 與使用者
  if (!user || !props.courseId) {
    console.error("缺少 courseId 或使用者未登入");
    return;
  }

  // A. 取得個人檔案以確認組別 (groupId)
  const myProfileRef = dbRef(
    rtdb,
    `courses/${props.courseId}/profiles/${user.uid}`,
  );

  onValue(myProfileRef, (profileSnap) => {
    const myProfile = profileSnap.val();

    // 檢查是否有 groupId (對應 JSON 中的 1772465854980 等 ID)
    if (myProfile && myProfile.groupId) {
      const gid = myProfile.groupId;
      console.log(`[系統] 偵測到使用者組別: ${gid}`);

      // B. 監聽該組別的匿名開關
      // 路徑對應: courses/{id}/experiment/groups/{gid}/features/isLeaderboardAnonymous
      const anonymousRef = dbRef(
        rtdb,
        `courses/${props.courseId}/experiment/groups/${gid}/features/isLeaderboardAnonymous`,
      );

      onValue(anonymousRef, (anonSnap) => {
        // 🌟 強化判定：確保不管是布林值 true 還是字串 "true" 都能正確驅動
        const rawVal = anonSnap.val();
        isAnonymousMode.value = rawVal === true || rawVal === "true";

        console.log(
          `[實驗設定] 匿名模式即時狀態: ${isAnonymousMode.value} (原始值: ${rawVal})`,
        );
      });

      // C. 抓取同組所有同學資料
      const profilesRef = dbRef(rtdb, `courses/${props.courseId}/profiles`);
      const groupQuery = query(
        profilesRef,
        orderByChild("groupId"),
        equalTo(gid),
      );

      onValue(groupQuery, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          // 將物件轉為陣列，補入 uid 用於 getDisplayName 的本人判定
          students.value = Object.entries(data).map(([uid, val]) => ({
            uid: uid,
            ...val,
          }));
        } else {
          students.value = [];
        }
      });
    } else {
      console.warn("該使用者尚未分配組別，無法判斷匿名模式");
    }
  });
});
</script>
