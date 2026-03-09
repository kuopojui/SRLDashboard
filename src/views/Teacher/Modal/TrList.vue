<template>
  <div class="TrList modal-overlay-custom" @click.self="$emit('close')">
    <div class="kanban-modal shadow-lg">
      <div class="modal-header-custom">
        <h5 class="header-title">
          <i class="bi bi-people-fill"></i>
          <span>實驗分組管理看板</span>
        </h5>

        <div class="header-actions">
          <button
            :class="['btn-status-pill', isLocked ? 'locked' : 'unlocked']"
            @click="isLocked = !isLocked"
          >
            <span>{{ isLocked ? "🔒 鎖定" : "🔓 編輯" }}</span>
          </button>

          <div class="search-box-custom">
            <i class="bi bi-search position-absolute ms-3 text-muted"></i>
            <input
              v-model="searchQuery"
              type="text"
              placeholder="搜尋姓名或學號..."
            />
          </div>

          <button
            type="button"
            class="btn-close-red"
            @click="$emit('close')"
            title="關閉"
          >
            ✕
          </button>
        </div>
      </div>

      <div class="kanban-wrapper custom-scrollbar">
        <div
          v-for="group in localGroupedData"
          :key="group.id"
          class="kanban-column"
        >
          <div class="column-header">
            <span class="title-text">{{ group.name }}</span>
            <span class="count-badge">{{ group.members.length }} 人</span>
          </div>

          <draggable
            v-model="group.members"
            group="students"
            item-key="uid"
            class="drag-area"
            :disabled="isLocked"
            ghost-class="sortable-ghost"
            @change="(e) => handleMove(e, group.id)"
          >
            <template #item="{ element }">
              <div
                v-show="isMatchSearch(element)"
                class="student-card"
                :class="{ locked: isLocked }"
              >
                <div class="student-info-section">
                  <div class="student-name">
                    {{ element.realName || element.displayName || "未命名" }}
                  </div>
                  <div class="student-id-tag">
                    <i class="bi bi-hash"></i>
                    <span>{{ element.studentId || "無學號" }}</span>
                  </div>
                </div>

                <div class="student-action-section">
                  <button
                    class="btn-action-pill logs"
                    @click.stop="downloadLog(element, 'action')"
                  >
                    <i class="bi bi-file-earmark-arrow-down"></i>
                    <span>操作紀錄</span>
                  </button>
                  <button
                    class="btn-action-pill ai-chat"
                    @click.stop="downloadLog(element, 'ai')"
                  >
                    <i class="bi bi-robot"></i>
                    <span>AI 對話</span>
                  </button>
                </div>
              </div>
            </template>
          </draggable>
        </div>
      </div>

      <div class="modal-footer-hint">
        {{
          isLocked ? "模式鎖定中：僅供查閱數據" : "編輯模式：可自由拖曳調整組別"
        }}
      </div>
    </div>
  </div>
</template>
<script setup>
import { ref, watch, onMounted } from "vue";
import draggable from "vuedraggable";
import { rtdb } from "../../../firebase/config";
import { ref as dbRef, onValue, update, get } from "firebase/database";
import Swal from "sweetalert2"; // 🌟 引入 Swal 以對應你的全域質感
import "./TrList.css";

const props = defineProps({
  courseId: String,
  groups: Array,
});

const emit = defineEmits(["close"]);

// --- 狀態定義 ---
const isLocked = ref(true);
const searchQuery = ref("");
const students = ref([]);
const localGroupedData = ref([]);

// --- 邏輯 1：搜尋過濾 ---
const isMatchSearch = (s) => {
  const q = searchQuery.value.toLowerCase().trim();
  if (!q) return true;
  const name = (s.realName || s.displayName || "").toLowerCase();
  const id = (s.studentId || "").toLowerCase();
  return name.includes(q) || id.includes(q);
};

// --- 邏輯 2：數據重組 (將學生分配到組別) ---
watch(
  [students, () => props.groups],
  () => {
    // 初始化列表：確保包含「未分組」
    const list = [
      { id: "unassigned", name: "未分組學生", members: [] },
      ...(props.groups || []).map((g) => ({ ...g, members: [] })),
    ];

    // 分配學生到各組
    students.value.forEach((s) => {
      const target = list.find((g) => g.id === (s.groupId || "unassigned"));
      if (target) target.members.push(s);
    });

    localGroupedData.value = list;
  },
  { immediate: true, deep: true },
);

// --- 邏輯 3：即時更新 Firebase 分組狀態 ---
const handleMove = async (evt, newGroupId) => {
  // 僅處理「加入」某個組別的事件
  if (evt.added) {
    const student = evt.added.element;
    const gid = newGroupId === "unassigned" ? null : newGroupId;

    try {
      await update(
        dbRef(rtdb, `courses/${props.courseId}/profiles/${student.uid}`),
        {
          groupId: gid,
        },
      );
      // 成功時不一定要彈窗，保持流暢感，或使用小型 Toast
    } catch (err) {
      Swal.fire("更新失敗", "無法儲存分組異動", "error");
    }
  }
};

// --- 邏輯 4：資料監聽 ---
onMounted(() => {
  if (!props.courseId) return;

  onValue(dbRef(rtdb, `courses/${props.courseId}/profiles`), (snap) => {
    const data = snap.val();
    if (data) {
      students.value = Object.values(data);
    } else {
      students.value = [];
    }
  });
});

// --- 邏輯 5：日誌下載 (CSV/JSON) ---
const downloadLog = async (student, type) => {
  const path =
    type === "action"
      ? `logs/operations/${student.uid}`
      : `logs/aiChat/${student.uid}`;

  try {
    const snap = await get(dbRef(rtdb, `courses/${props.courseId}/${path}`));

    if (!snap.exists()) {
      return Swal.fire({
        icon: "info",
        title: "提示",
        text: "該學生目前尚無相關紀錄",
        confirmButtonColor: "#3a5a8a",
      });
    }

    const data = snap.val();
    let blob, filename;

    if (type === "action") {
      // 操作紀錄：轉為 CSV
      const csv =
        "\ufeff時間,類別,內容\n" +
        Object.values(data)
          .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
          .map(
            (l) =>
              `${new Date(l.timestamp || l.time).toLocaleString()},${l.action || "動作"},${l.content || l.typeLabel || ""}`,
          )
          .join("\n");
      blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
      filename = `${student.realName || student.displayName}_操作紀錄.csv`;
    } else {
      // AI 對話：轉為 JSON
      blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      filename = `${student.realName || student.displayName}_AI對話.json`;
    }

    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
  } catch (err) {
    Swal.fire("下載失敗", "讀取資料庫時發生錯誤", "error");
  }
};
</script>
