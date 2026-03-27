<template>
  <div class="Strank-container">
    <!-- 1. 頂部控制區 (移除模式標籤，僅保留選單) -->
    <div class="Strank-header-section mb-3">
      <div class="row g-2">
        <div class="col-6">
          <div class="Strank-select-group">
            <label class="Strank-select-label">數據類別</label>
            <select v-model="filter.category" class="Strank-custom-select">
              <option value="assignment">📝 作業成績</option>
              <option value="exam">⏱️ 考試成績</option>
              <option value="time">⌛ 學習時數</option>
            </select>
          </div>
        </div>
        <div class="col-6">
          <div class="Strank-select-group">
            <label class="Strank-select-label">特定項目</label>
            <select
              v-model="filter.subItem"
              class="Strank-custom-select highlight"
            >
              <option value="average">整體平均</option>
              <optgroup label="單項內容">
                <option
                  v-for="item in subItemOptions"
                  :key="item.id"
                  :value="item.id"
                >
                  {{ item.title }}
                </option>
              </optgroup>
            </select>
          </div>
        </div>
      </div>
    </div>

    <!-- 2. 排行榜列表 (具備自動定位) -->
    <div class="Strank-scroll-area custom-scrollbar" ref="scrollContainer">
      <div v-if="loading" class="Strank-loading-box">
        <div class="spinner-border Strank-spinner"></div>
      </div>

      <transition-group
        v-else
        name="Strank-list"
        tag="div"
        class="Strank-list-group"
      >
        <div
          v-for="(student, index) in sortedRank"
          :key="student.uid"
          :ref="
            (el) => {
              if (student.uid === currentUser?.uid) myRankEl = el;
            }
          "
          class="Strank-card"
          :class="{
            'is-me': student.uid === currentUser?.uid,
            'is-top3': index < 3,
          }"
        >
          <!-- 排名序號 -->
          <div class="Strank-rank-badge" :class="'rank-' + (index + 1)">
            <span v-if="index === 0">🥇</span>
            <span v-else-if="index === 1">🥈</span>
            <span v-else-if="index === 2">🥉</span>
            <span v-else>{{ index + 1 }}</span>
          </div>

          <!-- 頭像 -->
          <div class="Strank-avatar-wrapper">
            <div class="Strank-avatar" :class="'tier-' + (index + 1)">
              {{ getAvatarText(student) }}
            </div>
          </div>

          <!-- 中間資訊 -->
          <div class="Strank-info-box">
            <div class="Strank-name-row">
              <span class="Strank-user-name">{{
                getDisplayName(student)
              }}</span>
              <span
                v-if="student.uid === currentUser?.uid"
                class="Strank-me-tag"
                >本人</span
              >
            </div>
            <!-- 使用 Bootstrap 內建類別：背景灰色、高度、圓角、手機版隱藏 (d-sm-block) -->
            <div
              class="progress d-none d-sm-flex mt-2"
              style="
                height: 6px;
                background-color: #e2e8f0;
                border-radius: 10px;
              "
            >
              <div
                class="progress-bar"
                role="progressbar"
                :style="{
                  width: getProgressWidth(student.displayValue) + '%',
                  backgroundColor: '#4a70a9',
                  transition: 'width 0.8s ease',
                }"
                :aria-valuenow="student.displayValue"
                aria-valuemin="0"
                aria-valuemax="100"
              ></div>
            </div>
          </div>

          <!-- 分數數值 -->
          <div class="Strank-value-box">
            <div class="Strank-value-number">{{ student.displayValue }}</div>
            <div class="Strank-value-unit">
              {{ filter.category === "time" ? "MINS" : "PTS" }}
            </div>
          </div>
        </div>
      </transition-group>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from "vue";
import { rtdb as db } from "../../../firebase/config";
import { ref as dbRef, onValue, get } from "firebase/database";
import { getAuth } from "firebase/auth";
import "./StuRank.css";

const props = defineProps({ courseId: String });
const auth = getAuth();
const currentUser = auth.currentUser;

// 定義 emit
const emit = defineEmits(["update-is-anonymous"]);

const loading = ref(true);
const isAnonymousMode = ref(true);
const filter = ref({ category: "assignment", subItem: "average" });

const scrollContainer = ref(null);
const myRankEl = ref(null);

const rawData = ref({ profiles: {}, assignments: {}, exams: {}, units: {} });

const scrollToMe = async () => {
  await nextTick();
  if (myRankEl.value && scrollContainer.value) {
    myRankEl.value.scrollIntoView({ behavior: "smooth", block: "center" });
  }
};

const subItemOptions = computed(() => {
  const dataMap = {
    assignment: rawData.value.assignments || {},
    exam: rawData.value.exams || {},
    time: rawData.value.units || {},
  };
  return Object.entries(dataMap[filter.value.category] || {}).map(
    ([id, d]) => ({ id, title: d.title }),
  );
});

watch(
  () => filter.value.category,
  () => {
    filter.value.subItem = "average";
  },
);

watch([() => filter.value.subItem, loading], ([sub, load]) => {
  if (!load) setTimeout(scrollToMe, 500);
});

const fetchData = async () => {
  if (!props.courseId || !currentUser) return;
  loading.value = true;

  try {
    // 1. 獲取個人 Profile 以取得組別 ID
    const myProfileSnap = await get(
      dbRef(db, `courses/${props.courseId}/profiles/${currentUser.uid}`),
    );

    const myProfileData = myProfileSnap.val();
    const myGroupId = myProfileData?.groupId;

    // 🌟 修正：將匿名設定監聽移入 fetchData 內部，確保 myGroupId 已定義
    if (myGroupId) {
      const anonPath = `courses/${props.courseId}/experiment/groups/${myGroupId}/features/isLeaderboardAnonymous`;
      onValue(dbRef(db, anonPath), (snap) => {
        const val = snap.val() ?? true;
        isAnonymousMode.value = val;
        // 將狀態傳給父組件 StuDashboard
        emit("update-is-anonymous", val);
      });
    } else {
      // 若無組別資訊，預設傳回匿名
      emit("update-is-anonymous", true);
    }

    // 2. 抓取所有資料庫節點
    const [pSnap, aSnap, eSnap, uSnap] = await Promise.all([
      get(dbRef(db, `courses/${props.courseId}/profiles`)),
      get(dbRef(db, `courses/${props.courseId}/assignments`)),
      get(dbRef(db, `courses/${props.courseId}/exams`)),
      get(dbRef(db, `courses/${props.courseId}/units`)),
    ]);

    rawData.value = {
      profiles: pSnap.val() || {},
      assignments: aSnap.val() || {},
      exams: eSnap.val() || {},
      units: uSnap.val() || {},
    };
  } catch (err) {
    console.error("排行榜抓取失敗:", err);
  } finally {
    loading.value = false;
  }
};

const sortedRank = computed(() => {
  // 1. 基礎防護：若 filter 或 rawData 尚未準備好，直接回傳空陣列
  if (!filter.value || !rawData.value) return [];

  const { category, subItem } = filter.value;
  const profiles = rawData.value.profiles || {};

  return (
    Object.entries(profiles)
      .map(([uid, p]) => {
        let value = 0;

        // 🌟 作業成績處理
        if (category === "assignment") {
          const assignments = rawData.value.assignments || {};
          if (subItem === "average") {
            const scores = Object.values(assignments)
              .map((a) => a.scores?.[uid]?.score)
              .filter((v) => v !== undefined && v !== null);
            value = scores.length
              ? scores.reduce((a, b) => a + b, 0) / scores.length
              : 0;
          } else {
            value = assignments[subItem]?.scores?.[uid]?.score || 0;
          }
        }

        // 🌟 考試成績處理
        else if (category === "exam") {
          const exams = rawData.value.exams || {};
          if (subItem === "average") {
            const scores = Object.values(exams)
              .map((e) => e.scores?.[uid]?.score)
              .filter((v) => v !== undefined && v !== null);
            value = scores.length
              ? scores.reduce((a, b) => a + b, 0) / scores.length
              : 0;
          } else {
            value = exams[subItem]?.scores?.[uid]?.score || 0;
          }
        }

        // 🌟 學習時間處理
        else if (category === "time") {
          const units = rawData.value.units || {};
          if (subItem === "average") {
            value = Object.values(units).reduce(
              (acc, u) =>
                acc + (u.student_traces?.[uid]?.totalElapsedTimeMins || 0),
              0,
            );
          } else {
            value =
              units[subItem]?.student_traces?.[uid]?.totalElapsedTimeMins || 0;
          }
        }

        // 回傳標準化對象
        return {
          uid,
          displayName: p?.displayName || "學習者",
          displayValue: Math.round(value),
        };
      })
      // 排序：分數高者在前
      .sort((a, b) => b.displayValue - a.displayValue)
  );
});

const getProgressWidth = (val) => {
  const max =
    filter.value.category === "time"
      ? filter.value.subItem === "average"
        ? 300
        : 60
      : 100;
  return Math.min((val / max) * 100, 100);
};

const getDisplayName = (s) => {
  if (s.uid === currentUser?.uid) return s.displayName;
  return isAnonymousMode.value
    ? `匿名同學 (${s.uid.substring(s.uid.length - 4).toUpperCase()})`
    : s.displayName;
};

const getAvatarText = (s) =>
  s.uid === currentUser?.uid || !isAnonymousMode.value
    ? s.displayName.charAt(0)
    : "?";

onMounted(fetchData);

defineExpose({ scrollContainer, myRankEl });
</script>
