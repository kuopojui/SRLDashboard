<template>
  <div
    class="TrDashboard container-fluid py-4 animate__animated animate__fadeIn"
  >
    <div class="stats-full-width mb-4">
      <div
        class="stats-card shadow-sm d-flex align-items-center justify-content-between bg-white rounded-4 overflow-hidden"
      >
        <div class="stats-main p-4">
          <div class="label text-muted fw-bold small">班級總人數</div>
          <div class="d-flex align-items-baseline gap-2 mt-2">
            <h2 class="text-navy fw-bold mb-0">{{ students.length }}</h2>
            <span class="text-muted small">位學生</span>
          </div>
        </div>

        <div class="stats-action pe-4">
          <button
            class="btn btn-navy-outline rounded-pill px-4 fw-bold d-flex align-items-center gap-2"
            @click="showStudentList = true"
          >
            <i class="bi bi-person-lines-fill"></i>
            管理名單
          </button>
        </div>
      </div>

      <TrList
        v-if="showStudentList"
        :courseId="courseId"
        :groups="experimentGroups"
        @close="showStudentList = false"
      />
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
import { ref, onMounted, computed } from "vue";
import { useRoute } from "vue-router";
import { rtdb as db, auth } from "../../firebase/config";
import { ref as dbRef, onValue, update, get } from "firebase/database";
import { Chart, registerables } from "chart.js";
import draggable from "vuedraggable";
import Swal from "sweetalert2";
import "./TrDashboard.css";
import TrList from "./Modal/TrList.vue";

Chart.register(...registerables);

const route = useRoute();
const courseId = route.params.courseId;

// --- 狀態定義 ---
const profiles = ref({});
const students = ref([]);
const experimentGroups = ref([]);
const aiAnalysis = ref("");
const searchQuery = ref("");
const isLocked = ref(true);
const courseJoinCode = ref("");

// 彈窗控制
const showStudentList = ref(false); // 控制 <TrList />
const showStudentModal = ref(false); // 控制看板 Modal

// --- 圖表配置 ---
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

// --- 1. 資料監聽邏輯 ---
onMounted(() => {
  const coursePath = `courses/${courseId}`;

  // 監聽課程基本資訊
  onValue(dbRef(db, coursePath), (snap) => {
    const d = snap.val();
    if (d?.joinCode) courseJoinCode.value = d.joinCode;
  });

  // 監聽學生名單
  onValue(dbRef(db, `${coursePath}/profiles`), (snap) => {
    const data = snap.val() || {};
    profiles.value = data;
    students.value = Object.values(data);
  });

  // 監聽實驗組別配置
  onValue(dbRef(db, `${coursePath}/experiment/groups`), (snap) => {
    const data = snap.val();
    experimentGroups.value = data ? Object.values(data) : [];
  });
});

// --- 2. 看板分組計算邏輯 ---
const studentsByGroup = computed(() => {
  const groups = { unassigned: [] };

  // 初始化組別容器
  experimentGroups.value.forEach((g) => {
    if (g.id) groups[g.id] = [];
  });

  // 分配學生
  Object.entries(profiles.value).forEach(([uid, data]) => {
    const studentObj = { uid, ...data };
    const gid = data.groupId; // 對應 Firebase 中的 groupId 欄位
    if (gid && groups[gid]) {
      groups[gid].push(studentObj);
    } else {
      groups.unassigned.push(studentObj);
    }
  });
  return groups;
});

// --- 3. 拖曳與解鎖邏輯 ---
const handleLockToggle = async () => {
  if (isLocked.value) {
    const { value: password } = await Swal.fire({
      title: "解鎖編輯模式",
      text: "請輸入課程邀請碼以開啟學生分組權限",
      input: "password",
      inputPlaceholder: "請輸入邀請碼...",
      showCancelButton: true,
      confirmButtonColor: "#1a237e",
    });

    if (password === courseJoinCode.value) {
      isLocked.value = false;
      Swal.fire("驗證成功", "已開啟自由分組模式", "success");
    } else if (password !== undefined) {
      Swal.fire("錯誤", "邀請碼不正確", "error");
    }
  } else {
    isLocked.value = true;
  }
};

const onDragEnd = async (evt, newGroupId) => {
  if (evt.added) {
    const student = evt.added.element;
    const targetGid = newGroupId === "" ? null : newGroupId;

    try {
      await update(dbRef(db, `courses/${courseId}/profiles/${student.uid}`), {
        groupId: targetGid,
      });
    } catch (error) {
      Swal.fire("同步失敗", "無法即時更新資料庫", "error");
    }
  }
};

// --- 4. 數據下載邏輯 ---
const downloadLogsCSV = async (student) => {
  const snap = await get(dbRef(db, `courses/${courseId}/logs/${student.uid}`));
  if (!snap.exists()) return Swal.fire("提示", "該學生尚無操作日誌", "info");

  const data = snap.val();
  const csvHeader = "\ufeff時間,類別,詳細內容\n";
  const csvRows = Object.values(data)
    .sort((a, b) => b.timestamp - a.timestamp)
    .map(
      (l) =>
        `${new Date(l.timestamp).toLocaleString()},${l.typeLabel || "一般"},${l.content}`,
    )
    .join("\n");

  const blob = new Blob([csvHeader + csvRows], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${student.realName || "學生"}_操作日誌.csv`;
  link.click();
  URL.revokeObjectURL(url);
};

const downloadStudentAiFullLogs = async (student) => {
  const snap = await get(
    dbRef(db, `courses/${courseId}/ai_history/${student.uid}`),
  );
  if (!snap.exists())
    return Swal.fire("提示", "該學生尚無 AI 互動紀錄", "info");

  const blob = new Blob([JSON.stringify(snap.val(), null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${student.realName || "學生"}_AI紀錄.json`;
  link.click();
  URL.revokeObjectURL(url);
};

// --- 5. 輔助函數 ---
const isMatchSearch = (s) => {
  if (!searchQuery.value) return true;
  const target = (s.realName || s.displayName || "").toLowerCase();
  return target.includes(searchQuery.value.toLowerCase());
};

const handleLogout = () => auth.signOut();
</script>
