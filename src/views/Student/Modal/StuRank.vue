<template>
  <div class="StuRank animate__animated animate__fadeIn">
    <nav class="rank-nav-tabs mb-4">
      <div class="d-flex flex-nowrap overflow-auto hide-scrollbar">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          @click="handleTabChange(tab.id)"
          :class="{ active: activeTab === tab.id }"
          class="rank-tab-btn"
        >
          <i :class="['bi', tab.icon, 'me-2']"></i>
          {{ tab.label }}排行
        </button>
      </div>
    </nav>

    <section v-if="activeTab !== 'discussion'" class="filter-section mb-4">
      <div class="filter-card p-3 shadow-sm">
        <label class="filter-label small fw-bold mb-2 d-block text-muted"
          >數據維度切換</label
        >
        <select v-model="selectedItemId" class="form-select rank-select">
          <option value="">加權總平均 (OVERALL)</option>
          <optgroup label="單項獨立追蹤">
            <option
              v-for="(item, id) in currentSourceData"
              :key="id"
              :value="id"
            >
              {{ item.title || "未命名項目" }}
            </option>
          </optgroup>
        </select>
      </div>
    </section>

    <div class="rank-table-card shadow-sm rounded-4 overflow-hidden">
      <div class="table-responsive">
        <table class="table modern-rank-table align-middle mb-0">
          <thead>
            <tr>
              <th class="col-rank text-center">排名</th>
              <th class="col-student text-start">學生名稱</th>
              <th class="col-score text-end pe-4">得分 / 參與度</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(student, index) in sortedRank"
              :key="student.uid"
              :class="{ 'row-me': student.uid === currentUserUid }"
              class="rank-row"
            >
              <td class="col-rank text-center">
                <span class="rank-badge" :class="'top-' + (index + 1)">
                  {{ index + 1 }}
                </span>
              </td>

              <td class="col-student text-start">
                <span class="name-text text-truncate">{{
                  student.displayName
                }}</span>
                <span v-if="student.uid === currentUserUid" class="me-tag ms-2"
                  >我</span
                >
              </td>

              <td class="col-score text-end pe-4">
                <div class="score-display">
                  <span class="score-value">{{ student.value }}</span>
                  <span class="score-unit ms-1">{{
                    activeTab === "discussion" ? "次" : "分"
                  }}</span>
                </div>
              </td>
            </tr>

            <tr v-if="sortedRank.length === 0">
              <td colspan="3" class="text-center py-5 text-muted fst-italic">
                <i class="bi bi-clipboard-x d-block fs-2 mb-2 opacity-50"></i>
                尚未偵測到相關數據紀錄
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from "vue";
import { rtdb as db } from "../../../firebase/config"; // 簡化路徑
import { ref as dbRef, onValue } from "firebase/database";
import { useRoute } from "vue-router";
import { getAuth } from "firebase/auth";
import "./StuRank.css";

const route = useRoute();
const courseId = route.params.id;
const currentUserUid = getAuth().currentUser?.uid;

const activeTab = ref("hw");
const selectedItemId = ref("");
const allStudents = ref({});
const rawData = ref({ hw: {}, exam: {}, discussions: {} });

const tabs = [
  { id: "hw", label: "作業", icon: "bi-journal-text" },
  { id: "exam", label: "考試", icon: "bi-trophy" },
  { id: "discussion", label: "討論", icon: "bi-chat-quote" },
];

onMounted(() => {
  logAction("檢視班級排行榜");

  onValue(dbRef(db, `courses/${courseId}/profiles`), (snap) => {
    if (snap.exists()) allStudents.value = snap.val();
  });
  onValue(dbRef(db, `courses/${courseId}/assignments`), (snap) => {
    if (snap.exists()) rawData.value.hw = snap.val();
  });
  onValue(dbRef(db, `courses/${courseId}/exams`), (snap) => {
    if (snap.exists()) rawData.value.exam = snap.val();
  });
  onValue(dbRef(db, `courses/${courseId}/discussions`), (snap) => {
    if (snap.exists()) rawData.value.discussions = snap.val();
  });
});

const handleTabChange = (tabId) => {
  activeTab.value = tabId;
  selectedItemId.value = "";
};

const currentSourceData = computed(() => {
  return activeTab.value === "hw" ? rawData.value.hw : rawData.value.exam;
});

const sortedRank = computed(() => {
  const studentMap = {};
  if (activeTab.value === "discussion") {
    Object.values(rawData.value.discussions).forEach((topic) => {
      if (topic.messages) {
        Object.values(topic.messages).forEach((m) => {
          if (!studentMap[m.uid]) studentMap[m.uid] = { value: 0 };
          studentMap[m.uid].value += 1;
        });
      }
    });
  } else {
    const source = currentSourceData.value;
    if (selectedItemId.value) {
      const item = source[selectedItemId.value];
      const scoresNode =
        (activeTab.value === "hw" ? item?.scores : item?.answers) || {};
      Object.entries(scoresNode).forEach(([uid, data]) => {
        if (data.score != null) studentMap[uid] = { value: Number(data.score) };
      });
    } else {
      Object.values(source).forEach((item) => {
        const scoresNode =
          (activeTab.value === "hw" ? item.scores : item.answers) || {};
        Object.entries(scoresNode).forEach(([uid, data]) => {
          if (data.score != null) {
            if (!studentMap[uid]) studentMap[uid] = { sum: 0, count: 0 };
            studentMap[uid].sum += Number(data.score);
            studentMap[uid].count += 1;
          }
        });
      });
    }
  }

  return Object.entries(studentMap)
    .map(([uid, data]) => {
      const profile = allStudents.value[uid] || {};
      const mode = profile.rankDisplayMode || "anonymous";
      let displayName = "匿名學生";

      if (uid === currentUserUid)
        displayName = profile.realName || profile.displayName || "我";
      else {
        if (mode === "realName") displayName = profile.realName || "學生";
        else if (mode === "displayName")
          displayName = profile.displayName || "學生";
        else displayName = `學生-${uid.substring(0, 4)}`;
      }

      const finalValue =
        data.value ?? (data.count > 0 ? Math.round(data.sum / data.count) : 0);
      return { uid, displayName, value: finalValue };
    })
    .sort((a, b) => b.value - a.value);
});

const logAction = (actionName, extraDetails = {}) => {
  if (!currentUserUid || !courseId) return;
  recordStudentAction(courseId, currentUserUid, actionName, {
    location: "班級排行榜",
    activeTab: activeTab.value,
    ...extraDetails,
  });
};
</script>
