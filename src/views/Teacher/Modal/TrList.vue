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

          <button type="button" class="btn-close-red" @click="$emit('close')">
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
                    {{ element.realName || "未具名" }}
                  </div>
                  <div class="student-id-tag">
                    <i class="bi bi-hash"></i>
                    <span>{{ element.studentId || "無學號" }}</span>
                  </div>
                </div>

                <div class="student-action-section">
                  <button
                    v-if="hasSRLPermission(element.groupId)"
                    class="btn-action-pill srl"
                    @click.stop="openSRLDetail(element)"
                  >
                    <i class="bi bi-clipboard-data"></i>
                    <span>SRL 歷程</span>
                  </button>

                  <button
                    class="btn-action-pill logs"
                    @click.stop="downloadOperationLog(element)"
                  >
                    <i class="bi bi-file-earmark-arrow-down"></i>
                    <span>操作紀錄</span>
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

    <TrSRL
      v-if="showSRLModal"
      :student="selectedStudent"
      :courseId="courseId"
      @close="showSRLModal = false"
    />
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from "vue";
import draggable from "vuedraggable";
import { rtdb } from "../../../firebase/config";
import { ref as dbRef, onValue, update, get } from "firebase/database";
import Swal from "sweetalert2";
import TrSRL from "./TrSRL.vue";
import "./TrList.css";

const props = defineProps({
  courseId: String,
  groups: [Array, Object],
});

const emit = defineEmits(["close"]);

// --- 狀態定義 ---
const isLocked = ref(true);
const isUpdating = ref(false); // 🌟 防呆：防止重複點擊/拖拽寫入
const searchQuery = ref("");
const students = ref([]);
const localGroupedData = ref([]);
const groupConfigs = ref({});

const showSRLModal = ref(false);
const selectedStudent = ref(null);

// --- 🌟 封裝一個重組函數，加入多層防呆機制 ---
const refreshLocalGroupedData = () => {
  // 1. 正規化組別資料 (處理 props.groups 可能為空或格式不對的情況)
  const groupsArray = !props.groups
    ? []
    : Array.isArray(props.groups)
      ? props.groups
      : Object.entries(props.groups).map(([id, g]) => ({
          id: String(id).trim(),
          ...g,
        }));

  // 2. 初始化看板結構 (確保結構固定，避免渲染閃爍)
  const list = [
    { id: "unassigned", name: "未分組學生", members: [] },
    ...groupsArray.map((g) => ({
      id: g.id ? String(g.id).trim() : "error_id",
      name: g.name || "未命名組別",
      members: [],
    })),
  ];

  // 3. 將學生分配到組別 (加入 sid 防呆)
  students.value.forEach((s) => {
    // 強制轉換為字串比對，排除 undefined/null
    const sid = s.groupId ? String(s.groupId).trim() : "unassigned";
    const target = list.find((g) => g.id === sid);

    if (target) {
      target.members.push(s);
    } else {
      list[0].members.push(s);
    }
  });

  localGroupedData.value = list;
};

// --- 1. 跨節點資料整合監聽 ---
onMounted(() => {
  if (!props.courseId) {
    console.error("未傳入 courseId");
    return;
  }

  // 監聽組別配置 (加入安全檢查)
  onValue(
    dbRef(rtdb, `courses/${props.courseId}/experiment/groups`),
    (snap) => {
      const data = snap.val();
      groupConfigs.value = data || {};
      refreshLocalGroupedData();
    },
  );

  // 同時抓取課程名單與全域使用者資料
  onValue(dbRef(rtdb, `courses/${props.courseId}/profiles`), async (snap) => {
    const courseProfiles = snap.val() || {};
    try {
      // 🌟 防呆：一次性獲取 users 以減少 Request 次數並處理報錯
      const usersSnap = await get(dbRef(rtdb, `users`));
      const allUsers = usersSnap.val() || {};

      const studentList = Object.entries(courseProfiles).map(([uid, data]) => {
        const userGlobal = allUsers[uid] || {};
        const userProfile = userGlobal.profile || {};

        return {
          uid,
          groupId: data.groupId ? String(data.groupId).trim() : "unassigned",
          realName: userProfile.realName || userGlobal.displayName || "未具名",
          studentId: userProfile.studentId || "無學號",
        };
      });
      students.value = studentList;
      refreshLocalGroupedData();
    } catch (err) {
      console.error("載入名單錯誤:", err);
      // 可視需求加入 Swal 提示
    }
  });
});

// --- 監聽器 (加入深度監聽防呆) ---
watch(
  [students, () => props.groups],
  () => {
    refreshLocalGroupedData();
  },
  { immediate: true, deep: true },
);

// --- SRL 權限判斷 (加入 config 存在性檢查) ---
const hasSRLPermission = (groupId) => {
  if (!groupId || groupId === "unassigned") return false;
  const config = groupConfigs.value[groupId];
  if (!config || !config.features) return false;
  return config.features.planning || config.features.reflection;
};

// --- 🌟 拖拽存檔 (加入狀態鎖定，防止網路延遲導致的重複寫入) ---
const handleMove = async (evt, newGroupId) => {
  if (evt.added && !isUpdating.value) {
    isUpdating.value = true;
    const student = evt.added.element;
    const gid = newGroupId === "unassigned" ? null : String(newGroupId);

    try {
      await update(
        dbRef(rtdb, `courses/${props.courseId}/profiles/${student.uid}`),
        { groupId: gid },
      );
      // 本地同步，確保 UI 不跳動
      student.groupId = gid || "unassigned";
    } catch (err) {
      console.error("更新失敗:", err);
      Swal.fire("同步失敗", "網路異常，請稍後再試", "error");
      refreshLocalGroupedData(); // 復原本地狀態
    } finally {
      isUpdating.value = false;
    }
  }
};

// --- 🌟 操作紀錄下載 (優化：處理 null 資料與特殊字元) ---
const downloadOperationLog = async (student) => {
  const path = `courses/${props.courseId}/logs/${student.uid}`;
  try {
    const snap = await get(dbRef(rtdb, path));
    if (!snap.exists()) return Swal.fire("提示", "該學員目前尚無紀錄", "info");

    const data = snap.val();
    const studentName = student.realName || "未知學員";

    const csvHeader = "\ufeff人物,時間,做了什麼\n";
    const csvRows = Object.values(data)
      .filter((l) => l && l.timestamp) // 🌟 防呆：排除髒資料
      .sort((a, b) => b.timestamp - a.timestamp)
      .map((l) => {
        const time = new Date(l.timestamp).toLocaleString();
        const action = l.action || "執行動作";
        let detailStr = "";

        // 安全存取細節內容
        if (l.details) {
          const detail = l.details;
          if (detail.unitTitle) detailStr = ` (單元: ${detail.unitTitle})`;
          else if (detail.materialTitle)
            detailStr = ` (教材: ${detail.materialTitle})`;
        }
        return `"${studentName}","${time}","${action}${detailStr}"`;
      })
      .join("\n");

    const blob = new Blob([csvHeader + csvRows], {
      type: "text/csv;charset=utf-8",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);

    // 🌟 防呆：過濾檔名特殊字元
    const safeName = studentName.replace(/[\\/:*?"<>|]/g, "_");
    link.download = `${safeName}_操作紀錄.csv`;

    link.click();
    URL.revokeObjectURL(link.href); // 釋放記憶體
  } catch (err) {
    console.error("下載報錯:", err);
    Swal.fire("錯誤", "下載過程中發生問題", "error");
  }
};

const isMatchSearch = (s) => {
  const q = searchQuery.value.toLowerCase().trim();
  if (!q) return true;
  const name = (s.realName || "").toLowerCase();
  const id = (s.studentId || "").toLowerCase();
  return name.includes(q) || id.includes(q);
};

const openSRLDetail = (student) => {
  if (!student || !student.uid) return;
  selectedStudent.value = student;
  showSRLModal.value = true;
};
</script>
