<template>
  <div class="TrUnit ex-form-container content-fade">
    <div class="TrUnit-layout-container">
      <div class="TrUnit-header-bar mb-4">
        <h5 class="fw-800 text-navy m-0">
          <i class="bi bi-folder2-open me-2"></i>課程單元大綱
        </h5>
        <button class="ex-btn-primary" @click="addUnit">
          <i class="bi bi-plus-lg me-1"></i> 新增單元
        </button>
      </div>

      <div class="ex-unit-scroll mb-5">
        <div
          v-if="units.length === 0"
          class="ex-empty-unit-placeholder animate__animated animate__fadeIn"
        >
          <div class="placeholder-content">
            <i class="bi bi-stack-overflow mb-3"></i>
            <h4>目前尚未建立任何單元</h4>
            <p>點擊右上方「新增單元」按鈕開始規劃您的課程大綱。</p>
          </div>
        </div>

        <div
          v-else
          v-for="(unit, index) in units"
          :key="unit.firebaseKey"
          class="ex-unit-collapse-card mb-3"
        >
          <div
            class="unit-summary-header"
            @click="unit.isExpanded = !unit.isExpanded"
          >
            <div class="d-flex align-items-center gap-3 flex-grow-1">
              <span class="ex-badge">U{{ index + 1 }}</span>
              <input
                v-model="unit.title"
                class="ex-input-clean fw-bold"
                @click.stop
                @change="saveUnit(unit)"
              />
            </div>
            <div class="d-flex align-items-center gap-3">
              <div class="unit-stats d-none d-md-flex">
                <span class="badge bg-light text-navy border">
                  {{ unit.materials?.length || 0 }} 教材
                </span>
                <span class="badge bg-light text-navy border">
                  {{ unit.assignments?.length || 0 }} 任務
                </span>
              </div>
              <i
                class="bi"
                :class="unit.isExpanded ? 'bi-chevron-up' : 'bi-chevron-down'"
              ></i>
              <button
                class="btn-delete-brick sm"
                @click.stop="deleteUnit(unit.firebaseKey)"
              >
                <span class="label-text">✕</span>
              </button>
            </div>
          </div>

          <div
            v-if="unit.isExpanded"
            class="unit-details-content animate__animated animate__fadeIn"
          >
            <div class="ex-resource-grid">
              <div
                v-for="type in ['material', 'assignment', 'exam', 'forum']"
                :key="type"
                class="ex-resource-column"
              >
                <h6 class="ex-label-small">
                  <i :class="getIcon(type)"></i> {{ getLabel(type) }}
                </h6>
                <div class="ex-resource-list">
                  <div
                    v-for="itemId in unit[type + 's']"
                    :key="itemId"
                    class="ex-item-brick"
                  >
                    <span class="text-truncate flex-grow-1 small">{{
                      getTitle(itemId, type)
                    }}</span>
                    <i
                      class="bi bi-x remove-icon"
                      @click="deleteUnitItem(unit.firebaseKey, itemId, type)"
                    ></i>
                  </div>
                  <div
                    v-if="!unit[type + 's']?.length"
                    class="ex-empty-placeholder"
                  >
                    未分配
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <hr class="ex-divider my-5" />

      <div class="ex-library-section">
        <div class="ex-library-header mb-4">
          <h5 class="ex-label m-0 fw-800">
            <i class="bi bi-database-fill me-2"></i>資源分配庫
          </h5>
          <div class="ex-mode-selector">
            <div
              v-for="tab in [
                { k: 'materials', n: '教材' },
                { k: 'assignments', n: '功課' },
                { k: 'exams', n: '考試' },
                { k: 'forums', n: '討論' },
              ]"
              :key="tab.k"
              class="ex-mode-option"
              :class="{ active: courseSettingTab === tab.k }"
              @click="courseSettingTab = tab.k"
            >
              {{ tab.n }}
            </div>
          </div>
        </div>

        <div class="ex-library-grid">
          <div
            v-for="item in currentLibraryItems"
            :key="item.id"
            class="ex-library-item-card border-dashed"
          >
            <div class="fw-800 text-dark text-truncate mb-3">
              {{ item.title }}
            </div>

            <div class="unit-assign-controls">
              <div class="input-group input-group-sm">
                <select
                  class="form-select unit-select-box"
                  v-model="item.selectedUnitKey"
                  :disabled="units.length === 0"
                >
                  <option value="" disabled selected>
                    {{ units.length > 0 ? "選擇分配單元..." : "請先建立單元" }}
                  </option>
                  <option
                    v-for="(u, idx) in units"
                    :key="u.firebaseKey"
                    :value="u.firebaseKey"
                  >
                    U{{ idx + 1 }}: {{ u.title }}
                  </option>
                </select>

                <button
                  class="ex-btn-confirm-assign"
                  type="button"
                  :disabled="!item.selectedUnitKey"
                  @click="handleAssign(item)"
                >
                  分配
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onUnmounted, computed, onMounted } from "vue";
import {
  ref as dbRef,
  push,
  set,
  onValue,
  remove,
  update,
  off,
} from "firebase/database";
import { rtdb as db } from "../../firebase/config"; // 請確保路徑正確
import Swal from "sweetalert2";
import "./TrUnit.css";

const props = defineProps({
  courseId: { type: String, required: true },
});

// --- 1. 狀態定義 (State) ---
const units = ref([]);
const materials = ref([]);
const assignments = ref([]);
const exams = ref([]);
const forums = ref([]);
const courseSettingTab = ref("materials");

// --- 2. Firebase 即時同步邏輯 ---
const startSync = (subPath, targetRef, isLibrary = false) => {
  const targetPath = dbRef(db, `courses/${props.courseId}/${subPath}`);
  onValue(targetPath, (snapshot) => {
    const data = snapshot.val();
    if (!data) {
      targetRef.value = [];
      return;
    }

    const list = Object.entries(data).map(([key, val]) => ({
      firebaseKey: key,
      id: key,
      ...val,
      // 確保單元內部的資源陣列存在，支援 TSSGs 結構
      materials: val.materials || [],
      assignments: val.assignments || [],
      exams: val.exams || [],
      forums: val.forums || [],
      isExpanded: false, // 預設摺疊，解決「全部攤開」的問題
    }));

    targetRef.value = isLibrary
      ? list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
      : list;
  });
  return targetPath;
};

// 儲存所有路徑以便在組件卸載時 off
const activePaths = [];

onMounted(() => {
  activePaths.push(startSync("units", units));
  activePaths.push(startSync("materials", materials, true));
  activePaths.push(startSync("assignments", assignments, true));
  activePaths.push(startSync("exams", exams, true));
  activePaths.push(startSync("discussions", forums, true));
});

onUnmounted(() => {
  activePaths.forEach((path) => off(path));
});

// --- 處理資源分配與狀態重置 ---
const handleAssign = async (item) => {
  // 1. 檢查是否已選取目標單元
  if (!item.selectedUnitKey) {
    Swal.fire({
      icon: "warning",
      title: "請選擇目標單元",
      toast: true,
      position: "top-end",
      timer: 2000,
      showConfirmButton: false,
    });
    return;
  }

  // 2. 呼叫原始的寫入邏輯
  await addToUnit(
    item.id,
    item.selectedUnitKey,
    courseSettingTab.value.slice(0, -1),
  );

  // 3. 🌟 重要：分配成功後重置該項目的下拉選單值
  item.selectedUnitKey = "";
};

// --- 3. 計算屬性 (Computed) ---
const currentLibraryItems = computed(() => {
  const map = {
    materials: materials.value,
    assignments: assignments.value,
    exams: exams.value,
    forums: forums.value,
  };
  return map[courseSettingTab.value] || [];
});

// --- 4. 核心管理邏輯 ---

// 新增單元 (後向教學設計的起點)
const addUnit = async () => {
  const newUnitRef = push(dbRef(db, `courses/${props.courseId}/units`));
  await set(newUnitRef, {
    title: "新學習單元",
    visible: true,
    materials: [],
    assignments: [],
    exams: [],
    forums: [],
    createdAt: Date.now(),
  });
};

// 刪除單元 (紅磚按鈕邏輯)
const deleteUnit = async (unitKey) => {
  const result = await Swal.fire({
    title: "確定要刪除單元嗎？",
    text: "這不會刪除資源庫中的原始檔案。",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#bf4646", // 紅磚色
    confirmButtonText: "確定刪除",
    cancelButtonText: "取消",
  });

  if (result.isConfirmed) {
    await remove(dbRef(db, `courses/${props.courseId}/units/${unitKey}`));
  }
};

// 將資源「寫入」特定單元 (透過選取 Bar)
const addToUnit = async (itemId, unitKey, type) => {
  const unit = units.value.find((u) => u.firebaseKey === unitKey);
  if (!unit) return;

  const typeKey = `${type}s`; // material -> materials
  const currentList = [...(unit[typeKey] || [])];

  if (!currentList.includes(itemId)) {
    currentList.push(itemId);
    const path = `courses/${props.courseId}/units/${unitKey}/${typeKey}`;
    await set(dbRef(db, path), currentList);

    // 成功提示
    Swal.fire({
      icon: "success",
      title: "分配成功",
      toast: true,
      position: "top-end",
      timer: 2000,
      showConfirmButton: false,
    });
  } else {
    Swal.fire({ icon: "info", title: "該項目已存在於此單元" });
  }
};

// 從單元移除資源 (不刪除原始數據)
const deleteUnitItem = async (unitKey, itemId, type) => {
  const unit = units.value.find((u) => u.firebaseKey === unitKey);
  if (!unit) return;

  const typeKey = `${type}s`;
  const newList = (unit[typeKey] || []).filter((id) => id !== itemId);
  const path = `courses/${props.courseId}/units/${unitKey}/${typeKey}`;
  await set(dbRef(db, path), newList);
};

// 儲存標題變更 (Inline 更新)
const saveUnit = async (unit) => {
  const { firebaseKey, title } = unit;
  await update(dbRef(db, `courses/${props.courseId}/units/${firebaseKey}`), {
    title,
  });
};

// --- 5. 視覺工具 (Helpers) ---
const getTitle = (id, type) => {
  const poolMap = {
    material: materials.value,
    assignment: assignments.value,
    exam: exams.value,
    forum: forums.value,
  };
  return (
    poolMap[type]?.find((i) => (i.firebaseKey || i.id) === id)?.title ||
    "載入中..."
  );
};

const getIcon = (type) =>
  ({
    material: "bi bi-book",
    assignment: "bi bi-pencil",
    exam: "bi bi-stopwatch",
    forum: "bi bi-chat-dots",
  })[type];

const getLabel = (type) =>
  ({
    material: "教材",
    assignment: "作業",
    exam: "考試",
    forum: "討論",
  })[type];
</script>
