<template>
  <div class="StuRank border-0">
    <div class="d-flex align-items-center justify-content-between mb-4 px-1">
      <div class="d-flex align-items-center">
        <div class="icon-box-navy me-3">
          <i class="bi bi-trophy-fill"></i>
        </div>
        <h5 class="fw-900 m-0 text-navy">學習積分排行榜</h5>
      </div>

      <span
        class="badge-anonymous-pill"
        :class="{ 'is-active': isAnonymousMode }"
      >
        <i
          :class="
            isAnonymousMode ? 'bi bi-incognito me-1' : 'bi bi-person-check me-1'
          "
        ></i>
        {{ isAnonymousMode ? "匿名模式" : "實名模式" }}
      </span>
    </div>

    <div class="rank-list custom-scrollbar">
      <transition-group name="list-stagger" tag="div">
        <div
          v-for="(student, index) in sortedRank"
          :key="student.uid"
          class="rank-item"
          :class="{ 'is-me': student.uid === currentUser?.uid }"
        >
          <div class="rank-number" :class="'top-' + (index + 1)">
            {{ index + 1 }}
          </div>

          <div class="avatar-wrapper mx-2 mx-md-3">
            <div class="avatar-circle" :class="'ring-' + (index + 1)">
              {{ getAvatarText(student) }}
            </div>
          </div>

          <div class="flex-grow-1 min-w-0">
            <div class="d-flex align-items-center gap-2 mb-1">
              <span class="fw-800 text-navy text-truncate">
                {{ getDisplayName(student) }}
              </span>
              <span v-if="student.uid === currentUser?.uid" class="badge-me">
                我
              </span>
            </div>
            <div class="progress-container">
              <div
                class="progress-fill"
                :style="{ width: student.progress + '%' }"
              ></div>
            </div>
          </div>

          <div class="ms-3 text-end score-box">
            <div class="score-value">{{ student.score || 0 }}</div>
            <div class="score-label">POINTS</div>
          </div>
        </div>
      </transition-group>

      <div v-if="sortedRank.length === 0" class="empty-state">
        <i class="bi bi-person-dash"></i>
        <p>尚無積分資料</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { rtdb as db } from "../../../firebase/config";
import { ref as dbRef, onValue } from "firebase/database";
import { getAuth } from "firebase/auth";

const props = defineProps({ courseId: String });
const auth = getAuth();
const currentUser = auth.currentUser;

const rankData = ref([]);
const isAnonymousMode = ref(true); // 預設開啟匿名以保護隱私

onMounted(() => {
  if (!props.courseId) return;

  // 1. 監聽課程設定：確認老師是否開啟了「匿名排行榜」
  onValue(
    dbRef(db, `courses/${props.courseId}/settings/isAnonymous`),
    (snap) => {
      isAnonymousMode.value = snap.val() ?? true;
    },
  );

  // 2. 監聽學生成績資料 (路徑：courses/ID/members)
  onValue(dbRef(db, `courses/${props.courseId}/members`), (snap) => {
    if (!snap.exists()) {
      rankData.value = [];
      return;
    }
    const data = snap.val();
    rankData.value = Object.entries(data).map(([uid, val]) => ({
      uid,
      // 儲存原始資料，顯示邏輯由 function 統一處理
      displayName: val.displayName || val.realName || "學習者",
      score: val.totalScore || 0,
      progress: val.learningProgress || 0,
    }));
  });
});

/**
 * 🏆 排序邏輯：根據分數從高到低排序
 */
const sortedRank = computed(() => {
  return [...rankData.value].sort((a, b) => b.score - a.score);
});

/**
 * 🔒 姓名顯示邏輯：
 * 1. 如果是本人，顯示真實姓名。
 * 2. 如果是匿名模式，顯示「隱名組員」。
 * 3. 否則顯示真實姓名。
 */
const getDisplayName = (student) => {
  if (student.uid === currentUser?.uid) return student.displayName;
  return isAnonymousMode.value ? "隱名組員" : student.displayName;
};

/**
 * 🔒 頭像文字顯示邏輯：
 * 1. 如果是本人，顯示名字首字。
 * 2. 如果是匿名模式，統一顯示「匿」。
 * 3. 否則顯示名字首字。
 */
const getAvatarText = (student) => {
  if (student.uid === currentUser?.uid)
    return student.displayName.substring(0, 1);

  return isAnonymousMode.value ? "匿" : student.displayName.substring(0, 1);
};
</script>

<style scoped>
/* 引入外部 CSS 以保持簡潔 */
@import "./StuRank.css";
</style>
