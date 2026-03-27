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
            <div class="d-flex align-items-center gap-2 gap-md-3">
              <div
                class="unit-stats-group d-flex align-items-center gap-1 gap-md-2"
              >
                <div class="stat-pill" title="教材數量">
                  <i class="bi bi-file-earmark-text"></i>
                  <span class="count">{{ unit.materials?.length || 0 }}</span>
                  <span class="label d-none d-lg-inline">教材</span>
                </div>
                <div class="stat-pill" title="作業數量">
                  <i class="bi bi-journal-check"></i>
                  <span class="count">{{ unit.assignments?.length || 0 }}</span>
                  <span class="label d-none d-lg-inline">功課</span>
                </div>
                <div class="stat-pill" title="測驗數量">
                  <i class="bi bi-pencil-square"></i>
                  <span class="count">{{ unit.exams?.length || 0 }}</span>
                  <span class="label d-none d-lg-inline">考試</span>
                </div>
                <div class="stat-pill" title="討論話題">
                  <i class="bi bi-chat-dots"></i>
                  <span class="count">{{ unit.forums?.length || 0 }}</span>
                  <span class="label d-none d-lg-inline">討論</span>
                </div>
              </div>

              <div
                class="d-flex align-items-center gap-2 border-start ps-2 ps-md-3"
              >
                <i
                  class="bi fs-5 text-secondary cursor-pointer"
                  :class="unit.isExpanded ? 'bi-chevron-up' : 'bi-chevron-down'"
                ></i>
                <button
                  class="btn-delete-brick"
                  @click.stop="deleteUnit(unit.firebaseKey)"
                  title="刪除單元"
                >
                  ✕
                </button>
              </div>
            </div>
          </div>

          <div
            v-if="unit.isExpanded"
            class="unit-details-content animate__animated animate__fadeIn"
          >
            <div
              class="unit-management-panel mb-4 p-4 rounded-4 bg-light border shadow-sm"
            >
              <div class="row g-4">
                <div class="col-md-6">
                  <label
                    class="ex-label-small text-navy fw-bold mb-2 d-flex align-items-center"
                  >
                    <i class="bi bi-bullseye me-2"></i> 單元學習目標
                    <span
                      class="ms-2 badge bg-white text-muted border fw-normal"
                      style="font-size: 0.65rem"
                      >學生規劃參考</span
                    >
                  </label>
                  <textarea
                    v-model="unit.goals"
                    class="form-control form-control-sm border-0 shadow-sm p-3"
                    placeholder="例如：1. 掌握現在完成式 2. 能夠描述旅遊經歷..."
                    rows="3"
                    style="border-radius: 12px"
                  ></textarea>
                </div>

                <div class="col-md-6">
                  <label
                    class="ex-label-small text-navy fw-bold mb-2 d-flex align-items-center"
                  >
                    <i class="bi bi-info-circle me-2"></i> 單元學習引導
                    <span
                      class="ms-2 badge bg-white text-muted border fw-normal"
                      style="font-size: 0.65rem"
                      >建議學習路徑</span
                    >
                  </label>
                  <textarea
                    v-model="unit.description"
                    class="form-control form-control-sm border-0 shadow-sm p-3"
                    placeholder="請輸入給學生的引導語或提示..."
                    rows="3"
                    style="border-radius: 12px"
                  ></textarea>
                </div>

                <div class="col-md-8 col-lg-9">
                  <label class="ex-label-small text-secondary fw-bold mb-2">
                    <i class="bi bi-clock-history me-1"></i> 標竿建議時長 (日 /
                    時 / 分)
                  </label>
                  <div class="d-flex gap-2">
                    <div
                      class="input-group input-group-sm shadow-sm"
                      style="max-width: 120px"
                    >
                      <input
                        type="number"
                        :value="Math.floor((unit.targetTime || 0) / 1440)"
                        @input="
                          (e) => updateTimeParts(unit, 'd', e.target.value)
                        "
                        class="form-control border-0"
                        placeholder="0"
                      />
                      <span
                        class="input-group-text border-0 bg-white text-muted xx-small"
                        >日</span
                      >
                    </div>
                    <div
                      class="input-group input-group-sm shadow-sm"
                      style="max-width: 120px"
                    >
                      <input
                        type="number"
                        :value="
                          Math.floor(((unit.targetTime || 0) % 1440) / 60)
                        "
                        @input="
                          (e) => updateTimeParts(unit, 'h', e.target.value)
                        "
                        class="form-control border-0"
                        placeholder="0"
                      />
                      <span
                        class="input-group-text border-0 bg-white text-muted xx-small"
                        >時</span
                      >
                    </div>
                    <div
                      class="input-group input-group-sm shadow-sm"
                      style="max-width: 120px"
                    >
                      <input
                        type="number"
                        :value="(unit.targetTime || 0) % 60"
                        @input="
                          (e) => updateTimeParts(unit, 'm', e.target.value)
                        "
                        class="form-control border-0"
                        placeholder="0"
                      />
                      <span
                        class="input-group-text border-0 bg-white text-muted xx-small"
                        >分</span
                      >
                    </div>
                  </div>
                </div>

                <div
                  class="col-md-4 col-lg-3 d-flex flex-column justify-content-end align-items-md-end"
                >
                  <label class="ex-label-small text-secondary fw-bold mb-2"
                    >發佈狀態</label
                  >
                  <div
                    class="form-check form-switch custom-switch-lg p-0 m-0 d-flex align-items-center"
                  >
                    <input
                      class="form-check-input ms-0 me-2"
                      type="checkbox"
                      role="switch"
                      v-model="unit.visible"
                      :id="'visibleSwitch' + unit.firebaseKey"
                    />
                    <label
                      class="form-check-label small fw-800 text-navy"
                      :for="'visibleSwitch' + unit.firebaseKey"
                    >
                      {{ unit.visible ? "學生可見" : "暫不公開" }}
                    </label>
                  </div>
                </div>

                <div class="col-12 text-end border-top mt-2 pt-3">
                  <button
                    class="btn btn-navy btn-sm px-4 rounded-pill shadow-sm py-2"
                    @click="saveUnit(unit)"
                  >
                    <i class="bi bi-cloud-arrow-up-fill me-1"></i> 更新單元配置
                  </button>
                </div>
              </div>
            </div>

            <div class="ex-resource-grid">...</div>
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

  try {
    await set(newUnitRef, {
      title: "新學習單元",
      goals: "", // 🌟 新增：單元學習目標 (供學生前瞻計畫規劃時參考)
      description: "", // 單元學習引導/簡介
      targetTime: 30, // 教師標竿時常 (預設 30 分鐘)
      visible: true, // 單元開放狀態
      materials: [],
      assignments: [],
      exams: [],
      forums: [],
      createdAt: Date.now(),
    });

    // 成功提示
    Swal.fire({
      icon: "success",
      title: "單元已建立",
      text: "您可以開始設定學習目標與引導囉！",
      timer: 1500,
      showConfirmButton: false,
      toast: true,
      position: "top-end",
    });
  } catch (error) {
    console.error("建立單元失敗:", error);
    Swal.fire("錯誤", "無法建立新單元", "error");
  }
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
// 將資源「寫入」特定單元
const addToUnit = async (itemId, unitKey, type) => {
  const unit = units.value.find((u) => u.firebaseKey === unitKey);
  if (!unit) return;

  const typeKey = `${type}s`; // material -> materials
  const currentList = [...(unit[typeKey] || [])];

  if (!currentList.includes(itemId)) {
    currentList.push(itemId);

    // 1. 在單元節點增加資源 ID
    const unitPath = `courses/${props.courseId}/units/${unitKey}/${typeKey}`;

    // 🌟 2. 新增：在資源節點 (exams 或 assignments) 補上 unitId 定位
    // 這樣老師端打開成績表時，才能精準定位到這個單元的 student_traces
    const resourcePath = `courses/${props.courseId}/${typeKey}/${itemId}`;

    try {
      await Promise.all([
        // 更新單元內容
        set(dbRef(db, unitPath), currentList),
        // 🌟 核心修正：讓資源知道自己屬於哪個單元
        update(dbRef(db, resourcePath), { unitId: unitKey }),
      ]);

      Swal.fire({
        icon: "success",
        title: "分配成功",
        toast: true,
        position: "top-end",
        timer: 2000,
        showConfirmButton: false,
        backdrop: false,
      });
    } catch (error) {
      console.error("分配失敗:", error);
      Swal.fire("錯誤", "分配資源失敗", "error");
    }
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

//時間
// 🌟 核心修正：將介面上的「日時分」合併回資料庫所需的「總分鐘數」
const updateTimeParts = (unit, part, value) => {
  // 1. 先拆解目前的總分鐘數 (確保有預設值 0)
  const currentTime = Number(unit.targetTime) || 0;
  let d = Math.floor(currentTime / 1440);
  let h = Math.floor((currentTime % 1440) / 60);
  let m = currentTime % 60;

  // 2. 根據修改的欄位 (d, h, m) 更新數值
  const val = parseInt(value) || 0;
  if (part === "d") d = val;
  if (part === "h") h = val;
  if (part === "m") m = val;

  // 3. 🌟 合併計算總分鐘數並寫回 unit 物件
  unit.targetTime = d * 1440 + h * 60 + m;

  // 4. 觸發您已寫好的儲存邏輯
  saveUnit(unit);
};

// 儲存標題變更 (Inline 更新)
// 儲存標題、目標、簡介、標竿時常與顯示狀態
const saveUnit = async (unit) => {
  // 🌟 1. 加入 goals 到解構清單中
  const { firebaseKey, title, goals, description, targetTime, visible } = unit;

  if (!firebaseKey) return;

  try {
    // 🌟 2. 在 update 物件中包含 goals
    await update(dbRef(db, `courses/${props.courseId}/units/${firebaseKey}`), {
      title: title || "新學習單元",
      goals: goals || "", // 🌟 儲存單元學習目標
      description: description || "", // 儲存單元學習引導
      targetTime: Number(targetTime) || 0,
      visible: visible !== undefined ? visible : true,
    });

    // 成功提示
    Swal.fire({
      icon: "success",
      title: "單元設定已儲存",
      toast: true,
      position: "top-end",
      timer: 1500,
      showConfirmButton: false,
      // 避免老師連續儲存時畫面閃爍
      backdrop: false,
      showClass: {
        popup: "animate__animated animate__fadeInRight animate__faster",
      },
    });
  } catch (error) {
    console.error("儲存單元失敗:", error);
    Swal.fire("錯誤", "無法儲存單元設定", "error");
  }
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
