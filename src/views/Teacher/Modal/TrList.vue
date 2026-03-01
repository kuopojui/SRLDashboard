<template>
  <div class="TrList-overlay" @click.self="$emit('close')">
    <div class="TrList-card shadow-lg">
      <div class="TrList-header">
        <div class="d-flex align-items-center">
          <div class="TrList-icon-box me-3">
            <i class="bi bi-person-lines-fill"></i>
          </div>
          <div>
            <h4 class="TrList-title">實驗組別與學生管理</h4>
            <div class="d-flex align-items-center mt-1">
              <span class="TrList-badge-count"
                >共 {{ students.length }} 人</span
              >
              <button
                @click="isLocked = !isLocked"
                class="TrList-lock-btn"
                :class="{ 'is-unlocked': !isLocked }"
              >
                <i
                  :class="isLocked ? 'bi bi-lock-fill' : 'bi bi-unlock-fill'"
                ></i>
                {{ isLocked ? "點擊解鎖拖曳" : "拖曳模式已開啟" }}
              </button>
            </div>
          </div>
        </div>
        <button class="TrList-close-btn" @click="$emit('close')">✕</button>
      </div>

      <div class="TrList-body custom-scrollbar">
        <div class="row g-4">
          <div
            v-for="group in groupedStudents"
            :key="group.id"
            class="col-md-6 col-lg-4"
          >
            <div class="TrList-group-zone" :class="{ 'is-locked': isLocked }">
              <div class="TrList-group-header">
                <h6>
                  {{ group.name }} <small>({{ group.members.length }})</small>
                </h6>
                <span v-if="group.id !== 'unassigned'" class="TrList-passcode">
                  代碼: {{ group.passCode }}
                </span>
              </div>

              <draggable
                v-model="group.members"
                group="students"
                item-key="uid"
                :disabled="isLocked"
                class="TrList-drag-area"
                :component-data="{
                  tag: 'div',
                  type: 'transition-group',
                  name: !isLocked ? 'flip-list' : null,
                }"
                @change="(evt) => handleMove(evt, group.id)"
              >
                <template #item="{ element }">
                  <div class="TrList-student-item">
                    <div
                      class="d-flex justify-content-between align-items-center"
                    >
                      <div class="d-flex align-items-center">
                        <i
                          v-if="!isLocked"
                          class="bi bi-grid-3x3-gap-fill me-2 text-muted move-handle"
                        ></i>
                        <span class="fw-bold text-navy">{{
                          element.displayName
                        }}</span>
                      </div>
                      <span class="TrList-id-text text-muted small">
                        {{ element.studentId || "無學號" }}
                      </span>
                    </div>

                    <div class="TrList-btn-group mt-3">
                      <button
                        @click.stop="downloadLog(element, 'action')"
                        class="btn-action-log"
                        title="下載學生操作歷程 CSV"
                      >
                        <i class="bi bi-activity me-1"></i> 操作紀錄
                      </button>
                      <button
                        @click.stop="downloadLog(element, 'ai')"
                        class="btn-ai-log"
                        title="下載 AI 生成對話紀錄 JSON"
                      >
                        <i class="bi bi-chat-dots me-1"></i> AI 生成
                      </button>
                    </div>
                  </div>
                </template>
              </draggable>

              <div v-if="group.members.length === 0" class="TrList-empty">
                暫無學生
              </div>
            </div>
          </div>
        </div>
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

const isLocked = ref(true);
const students = ref([]);

// 🌟 核心改動：將 groupedStudents 改為普通的 ref，以利 draggable 直接操作
const localGroupedData = ref([]);

// 監聽原始資料，當 Firebase 有變動或 props 更新時，重新構建本地結構
watch(
  [students, () => props.groups],
  () => {
    const list = [
      { id: "unassigned", name: "未分組學生", members: [], passCode: "" },
      ...props.groups.map((g) => ({ ...g, members: [] })),
    ];

    students.value.forEach((s) => {
      const target = list.find((g) => g.id === (s.groupId || "unassigned"));
      if (target) target.members.push(s);
    });

    localGroupedData.value = list;
  },
  { immediate: true, deep: true },
);

// 下載紀錄邏輯 (CSV / JSON)
const downloadLog = async (student, type) => {
  const path = type === "action" ? `logs` : `ai_history`;
  const snap = await get(
    dbRef(rtdb, `courses/${props.courseId}/${path}/${student.uid}`),
  );

  if (!snap.exists()) return alert("尚無紀錄");

  const data = snap.val();
  let blob, filename;

  if (type === "action") {
    // 加上 BOM \ufeff 解決 Excel 中文亂碼
    const csv =
      "時間,類別,內容\n" +
      Object.values(data)
        .sort((a, b) => b.timestamp - a.timestamp)
        .map(
          (l) =>
            `${new Date(l.timestamp).toLocaleString()},${l.typeLabel || "動作"},${l.content}`,
        )
        .join("\n");
    blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
    filename = `${student.displayName}_操作紀錄.csv`;
  } else {
    blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    filename = `${student.displayName}_AI對話.json`;
  }

  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
};

// 🌟 完整拖曳處理邏輯
const handleMove = (evt, newGroupId) => {
  // 只有當元素「被加入」新組別時才觸發資料庫更新
  if (evt.added) {
    const student = evt.added.element;
    const gid = newGroupId === "unassigned" ? null : newGroupId;

    // 立即同步回 Firebase
    update(dbRef(rtdb, `courses/${props.courseId}/profiles/${student.uid}`), {
      groupId: gid,
    }).catch((err) => {
      console.error("分組更新失敗:", err);
      alert("儲存失敗，請檢查網路連線");
    });
  }
};

onMounted(() => {
  onValue(dbRef(rtdb, `courses/${props.courseId}/profiles`), (snap) => {
    const data = snap.val();
    students.value = data ? Object.values(data) : [];
  });
});
</script>
