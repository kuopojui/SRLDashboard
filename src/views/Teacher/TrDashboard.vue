<template>
  <div
    class="TrDashboard container-fluid py-4 animate__animated animate__fadeIn"
  >
    <div class="stats-full-width mb-4">
      <div
        class="stats-card shadow-sm d-flex align-items-center justify-content-between"
      >
        <div class="stats-main p-4">
          <div class="label text-muted fw-bold small">班級總人數</div>
          <div class="d-flex align-items-baseline gap-2 mt-2">
            <h2 class="text-navy fw-bold mb-0">{{ totalCount }}</h2>
            <span class="text-muted small">位學生</span>
          </div>
        </div>
      </div>
    </div>

    <div class="dashboard-grid mb-4">
      <div
        v-for="chart in chartConfigs"
        :key="chart.id"
        class="chart-card shadow-sm p-4"
      >
        <h6 class="chart-header text-navy">
          <i :class="['bi', chart.icon, 'me-2']"></i>{{ chart.title }}
        </h6>
        <div
          class="chart-container"
          :class="{
            'pie-wrapper': chart.type === 'pie' || chart.type === 'doughnut',
          }"
        >
          <canvas :id="chart.id"></canvas>
        </div>
      </div>
    </div>

    <div class="ai-analysis-full-width mb-4">
      <div class="chart-card shadow-sm p-4 ai-card">
        <h6 class="chart-header text-navy">
          <i class="bi bi-robot me-2"></i>AI 學習行為統合分析
        </h6>
        <div class="ai-analysis-box mt-3">
          <p class="mb-0 text-navy">
            {{ aiAnalysis || "分析引擎就緒中，正在掃描學生 SRL 歷程..." }}
          </p>
        </div>
      </div>
    </div>

    <Transition name="modal-fade">
      <div
        v-if="showStudentModal"
        class="modal-overlay-custom"
        @click.self="showStudentModal = false"
      >
        <div class="kanban-modal shadow-lg">
          <div class="modal-header-custom">
            <h5 class="header-title">
              <i class="bi bi-grid-3x3-gap-fill"></i>
              <span>實驗分組與數據導出</span>
            </h5>
            <div class="header-actions">
              <button
                :class="['btn-status-pill', isLocked ? 'locked' : 'unlocked']"
                @click="handleLockToggle"
              >
                {{ isLocked ? "🔒 點擊解除鎖定" : "🔓 編輯模式" }}
              </button>
              <div class="search-box-custom d-none d-md-block">
                <input
                  v-model="searchQuery"
                  type="text"
                  placeholder="搜尋學生姓名..."
                />
              </div>
              <button
                class="btn-close-custom"
                @click="showStudentModal = false"
              >
                X
              </button>
            </div>
          </div>

          <div class="kanban-wrapper">
            <div class="kanban-column unassigned-column">
              <div class="column-header">
                <span>未分組名單</span>
                <span class="count-badge">{{
                  studentsByGroup.unassigned.length
                }}</span>
              </div>
              <draggable
                :list="studentsByGroup.unassigned"
                group="students"
                item-key="uid"
                class="drag-area"
                :disabled="isLocked"
                @change="(e) => onDragEnd(e, '')"
              >
                <template #item="{ element }">
                  <div
                    v-show="isMatchSearch(element)"
                    class="student-card"
                    :class="{ locked: isLocked }"
                  >
                    <div class="student-info-main">
                      <div class="student-name">
                        {{ element.realName || "未命名" }}
                      </div>
                      <div class="student-id">{{ element.studentId }}</div>
                    </div>
                    <div class="student-actions">
                      <button
                        class="btn-action-pill logs"
                        @click.stop="downloadLogsCSV(element)"
                      >
                        <i class="bi bi-download"></i><span>日誌</span>
                      </button>
                      <button
                        class="btn-action-pill ai-chat"
                        @click.stop="downloadStudentAiFullLogs(element)"
                      >
                        <i class="bi bi-robot"></i><span>AI 紀錄</span>
                      </button>
                    </div>
                  </div>
                </template>
              </draggable>
            </div>

            <div
              v-for="group in experimentGroups"
              :key="group.id"
              class="kanban-column"
            >
              <div class="column-header">
                <span>{{ group.name }}</span>
                <span class="count-badge">{{
                  (studentsByGroup[group.id] || []).length
                }}</span>
              </div>
              <draggable
                :list="studentsByGroup[group.id] || []"
                group="students"
                item-key="uid"
                class="drag-area"
                :disabled="isLocked"
                @change="(e) => onDragEnd(e, group.id)"
              >
                <template #item="{ element }">
                  <div
                    v-show="isMatchSearch(element)"
                    class="student-card"
                    :class="{ locked: isLocked }"
                  >
                    <div class="student-info-main">
                      <div class="student-name">
                        {{ element.realName || "未命名" }}
                      </div>
                      <div class="student-id">{{ element.studentId }}</div>
                    </div>
                    <div class="student-actions">
                      <button
                        class="btn-action-pill logs"
                        @click.stop="downloadLogsCSV(element)"
                      >
                        日誌
                      </button>
                      <button
                        class="btn-action-pill ai-chat"
                        @click.stop="downloadStudentAiFullLogs(element)"
                      >
                        AI
                      </button>
                    </div>
                  </div>
                </template>
              </draggable>
            </div>
          </div>
          <div class="modal-footer-hint">
            {{
              isLocked
                ? "需輸入邀請碼解除鎖定後方可拖曳"
                : "現在可以自由拖曳學生進行分組"
            }}
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, nextTick } from "vue";
import { useRoute } from "vue-router";
import { rtdb as db, auth } from "../../firebase/config"; // ✨ 確保路徑與您的 config 一致
import { ref as dbRef, onValue, update, get } from "firebase/database";
import { Chart, registerables } from "chart.js";
import draggable from "vuedraggable";
import Swal from "sweetalert2";
import "./TrDashboard.css"; // ✨ 引入 CSS

Chart.register(...registerables);

const route = useRoute();
const courseId = route.params.courseId; // ✨ 從路由取得 ID

// 狀態定義
const totalCount = ref(0);
const aiAnalysis = ref("");
const showStudentModal = ref(false);
const searchQuery = ref("");
const isLocked = ref(true);
const courseJoinCode = ref("");
const experimentGroups = ref([]);
const profiles = ref({});

const chartConfigs = [
  {
    id: "activityChart",
    title: "活躍趨勢",
    icon: "bi-clock-history",
    type: "line",
  },
  { id: "materialChart", title: "教材閱覽", icon: "bi-book", type: "bar" },
  { id: "hwChart", title: "任務繳交", icon: "bi-journal-check", type: "bar" },
  {
    id: "progressChart",
    title: "單元開放進度",
    icon: "bi-flag-fill",
    type: "doughnut",
  },
];

// 計算屬性：分組邏輯
const studentsByGroup = computed(() => {
  const groups = { unassigned: [] };
  experimentGroups.value.forEach((g) => {
    if (g.id) groups[g.id] = [];
  });
  Object.entries(profiles.value).forEach(([uid, data]) => {
    const studentObj = { uid, ...data };
    const gid = data.group;
    if (gid && groups[gid]) groups[gid].push(studentObj);
    else groups.unassigned.push(studentObj);
  });
  return groups;
});

// 此處省略您的 Chart 渲染邏輯、CSV 下載邏輯與 Firebase 監聽邏輯 (與您提供的代碼相同)
// 請確保將原本腳本中的 `courseId = route.params.id` 改為 `courseId = route.params.courseId` 以匹配您的路由

onMounted(() => {
  // 基礎監聽邏輯...
  onValue(dbRef(db, `courses/${courseId}`), (snap) => {
    const d = snap.val();
    if (d?.joinCode) courseJoinCode.value = d.joinCode;
  });

  onValue(dbRef(db, `courses/${courseId}/profiles`), (snap) => {
    profiles.value = snap.val() || {};
    totalCount.value = Object.keys(profiles.value).length;
  });
});

const handleLogout = () => auth.signOut();
const isMatchSearch = (s) =>
  !searchQuery.value || (s.realName || "").includes(searchQuery.value);
const handleLockToggle = async () => {
  /* 您的解鎖密碼邏輯 */
};
const onDragEnd = async (e, gid) => {
  /* 您的更新分組邏輯 */
};
</script>
