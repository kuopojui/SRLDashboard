<template>
  <div class="TrList-overlay" @click.self="$emit('close')">
    <div class="kanban-modal shadow-lg wide-modal">
      <div class="modal-header-custom">
        <h5 class="header-title">
          <i class="bi bi-grid-3x3-gap-fill"></i>
          <span>實驗分組管理</span>
        </h5>

        <div class="header-actions">
          <button
            :class="['btn-status-pill', isLocked ? 'locked' : 'unlocked']"
            @click="isLocked = !isLocked"
          >
            <span class="label-text">{{
              isLocked ? "🔒 點擊切換模式" : "🔓 編輯中"
            }}</span>
          </button>

          <div class="search-box-custom">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="搜尋姓名..."
            />
          </div>

          <button class="btn-close-custom" @click="$emit('close')">
            <i class="bi bi-x-lg"></i>
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
            <span class="count-badge">{{ group.members.length }}</span>
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
                <div class="student-info-main">
                  <div class="student-name">
                    {{ element.realName || element.displayName || "未命名" }}
                  </div>
                  <div class="student-id">
                    {{ element.studentId || "無學號" }}
                  </div>
                </div>

                <div class="student-actions">
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
        {{ isLocked ? "需切換模式後方可拖曳" : "拖曳學生卡片進行分組管理" }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from "vue";
import draggable from "vuedraggable";
import { rtdb } from "../../../firebase/config";
import { ref as dbRef, onValue, update, get } from "firebase/database";
import "./TrList.css";

const props = defineProps({
  courseId: String,
  groups: Array,
});

const emit = defineEmits(["close"]);

const isLocked = ref(true);
const searchQuery = ref("");
const students = ref([]);
const localGroupedData = ref([]);

// 🌟 修正 1：搜尋過濾邏輯
const isMatchSearch = (s) => {
  const q = searchQuery.value.toLowerCase();
  if (!q) return true;
  return (
    (s.realName || s.displayName || "").toLowerCase().includes(q) ||
    (s.studentId || "").includes(q)
  );
};

// 🌟 修正 2：監聽 props 與學生資料，構建拖曳用的 localGroupedData
watch(
  [students, () => props.groups],
  () => {
    const list = [
      { id: "unassigned", name: "未分組學生", members: [], passCode: "" },
      ...(props.groups || []).map((g) => ({ ...g, members: [] })),
    ];

    students.value.forEach((s) => {
      const target = list.find((g) => g.id === (s.groupId || "unassigned"));
      if (target) target.members.push(s);
    });

    localGroupedData.value = list;
  },
  { immediate: true, deep: true },
);

// 🌟 修正 3：下載邏輯 (路徑需檢查)
const downloadLog = async (student, type) => {
  // 注意：確保 Firebase 路徑與您的資料庫結構一致
  const path =
    type === "action"
      ? `logs/operations/${student.uid}`
      : `logs/aiChat/${student.uid}`;
  const snap = await get(dbRef(rtdb, `courses/${props.courseId}/${path}`));

  if (!snap.exists()) return alert("尚無紀錄");
  const data = snap.val();

  let blob, filename;
  if (type === "action") {
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
};

// 🌟 修正 4：更新 Firebase 中的 groupId
const handleMove = (evt, newGroupId) => {
  if (evt.added) {
    const student = evt.added.element;
    const gid = newGroupId === "unassigned" ? null : newGroupId;

    update(dbRef(rtdb, `courses/${props.courseId}/profiles/${student.uid}`), {
      groupId: gid,
    }).catch((err) => console.error("分組更新失敗:", err));
  }
};

onMounted(() => {
  onValue(dbRef(rtdb, `courses/${props.courseId}/profiles`), (snap) => {
    const data = snap.val();
    students.value = data ? Object.values(data) : [];
  });
});
</script>
