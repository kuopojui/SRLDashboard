<template>
  <div class="TrExperiment animate__animated animate__fadeIn">
    <div class="row g-4">
      <div class="col-lg-8">
        <div class="card border-0 shadow-sm p-4 mb-4">
          <div class="d-flex align-items-center mb-4">
            <div class="icon-box me-3 bg-soft-primary text-primary">
              <i class="bi bi-robot"></i>
            </div>
            <h5 class="fw-bold mb-0 text-navy">
              AI 學習引導方針 (System Prompt)
            </h5>
          </div>

          <div class="mb-4">
            <label class="form-label small fw-bold text-secondary"
              >全域教學指令 (定義 AI 的核心邏輯與診斷口吻)</label
            >
            <textarea
              v-model="aiSettings.teacherPrompt"
              class="form-control bg-light border-0 rounded-4 p-3"
              rows="5"
              placeholder="範例：你是一位 SRL 學習教練。請遵循 Zimmerman 的 SRL 循環進行分析..."
            ></textarea>
          </div>

          <div class="d-flex justify-content-end">
            <button
              class="btn btn-navy px-5 rounded-pill fw-bold"
              @click="saveAiSettings"
              :disabled="loading"
            >
              <span
                v-if="loading"
                class="spinner-border spinner-border-sm me-2"
              ></span>
              儲存全域方針
            </button>
          </div>
        </div>

        <div class="card border-0 shadow-sm p-4 mb-4">
          <div class="d-flex align-items-center mb-4">
            <div class="icon-box me-3 bg-soft-success text-success">
              <i class="bi bi-people-fill"></i>
            </div>
            <h5 class="fw-bold mb-0 text-navy">實驗組別功能配置</h5>
          </div>

          <p class="text-muted small mb-4">
            在此定義各組的 SRL 以及排行榜設定
            權限與<b>通行碼</b>。學生輸入正確代碼後將自動分配組別。
          </p>

          <div class="group-config-list">
            <template v-for="(group, idx) in experimentGroups" :key="group.id">
              <div
                v-if="group && group.features"
                class="group-config-card mb-4 rounded-4 border p-3 shadow-sm"
              >
                <div class="d-flex align-items-center flex-wrap gap-2 mb-3">
                  <span class="badge group-index-tag">#{{ idx + 1 }}</span>
                  <input
                    v-model="group.name"
                    type="text"
                    class="form-control form-control-sm border-0 fw-bold text-navy flex-grow-1 min-width-200"
                    placeholder="組別名稱"
                  />

                  <div
                    class="passcode-badge d-flex align-items-center bg-light rounded-pill px-3 py-1 shadow-sm border border-opacity-10"
                  >
                    <i class="bi bi-key-fill text-muted me-2 small"></i>
                    <span class="xx-small text-secondary fw-bold me-2"
                      >代碼:</span
                    >
                    <input
                      v-model="group.passCode"
                      type="text"
                      class="form-control form-control-sm border-0 bg-transparent p-0 xx-small fw-bold text-primary"
                      style="width: 60px; outline: none; box-shadow: none"
                      placeholder="如: AAA"
                    />
                  </div>

                  <div class="ms-2 d-flex align-items-center">
                    <div class="form-check form-switch custom-srl-switch mb-0">
                      <input
                        class="form-check-input anonymous-switch"
                        type="checkbox"
                        v-model="group.features.isLeaderboardAnonymous"
                        :id="'anon' + idx"
                        @change="saveGroups"
                      />
                      <label
                        class="form-check-label xx-small fw-bold text-secondary ms-1"
                        :for="'anon' + idx"
                      >
                        <i class="bi bi-incognito"></i> 匿名排行
                      </label>
                    </div>
                  </div>

                  <button
                    class="btn btn-link text-danger p-0 ms-auto delete-btn"
                    @click="removeGroup(idx)"
                  >
                    <i class="bi bi-trash3"></i>
                  </button>
                </div>

                <hr class="my-2 opacity-10" />

                <div class="row g-3 mt-1">
                  <div
                    class="col-6 col-md-3"
                    v-for="(label, key) in srlSteps"
                    :key="key"
                  >
                    <div class="form-check form-switch custom-srl-switch">
                      <input
                        class="form-check-input"
                        type="checkbox"
                        v-model="group.features[key]"
                        :id="key + idx"
                      />
                      <label
                        class="form-check-label small fw-bold text-nowrap"
                        :for="key + idx"
                        >{{ label.title }}</label
                      >
                    </div>
                  </div>
                </div>

                <transition name="slide-fade">
                  <div
                    v-if="group.features.aiAdvice"
                    class="mt-4 p-3 rounded-4 bg-soft-navy border border-primary-subtle"
                  >
                    <div class="d-flex align-items-center mb-2">
                      <i class="bi bi-magic text-navy me-2"></i>
                      <label class="small fw-bold text-navy"
                        >組別專屬 AI 指令 (Individual Prompt)</label
                      >
                    </div>
                    <textarea
                      v-model="group.aiCustomPrompt"
                      class="form-control form-control-sm border-0 bg-white rounded-3 p-2"
                      rows="2"
                    ></textarea>
                  </div>
                </transition>
              </div>
            </template>
          </div>

          <div class="d-flex justify-content-between mt-2 flex-wrap gap-2">
            <button
              type="button"
              class="btn-add-group-custom"
              @click="addGroup"
            >
              <div class="plus-icon-wrapper">
                <i class="bi bi-plus-lg"></i>
              </div>
              <span>增加實驗組別</span>
            </button>
            <button
              class="btn btn-navy px-5 rounded-pill fw-bold text-white shadow-sm"
              @click="saveGroups"
            >
              儲存組別配置
            </button>
          </div>
        </div>

        <div class="card border-0 shadow-sm p-4">
          <div
            class="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-2"
          >
            <div class="d-flex align-items-center">
              <div class="icon-box me-3 bg-soft-warning text-warning">
                <i class="bi bi-clipboard2-check-fill"></i>
              </div>
              <h5 class="fw-bold mb-0 text-navy">實驗評量工具管理</h5>
            </div>
            <button
              class="btn btn-navy btn-sm rounded-pill fw-bold"
              @click="showCreateModal = true"
            >
              <i class="bi bi-plus-lg me-1"></i> 新建問卷內容
            </button>

            <TestCreate
              v-if="showCreateModal"
              :courseId="courseId"
              @close="showCreateModal = false"
              @created="handleExamCreated"
            />
          </div>

          <div class="row g-4">
            <div class="col-md-6" v-for="type in ['pre', 'post']" :key="type">
              <h6 class="fw-bold text-secondary mb-3">
                <i
                  :class="
                    type === 'pre'
                      ? 'bi-arrow-right-circle'
                      : 'bi-arrow-left-circle'
                  "
                  class="bi me-2"
                ></i>
                {{
                  type === "pre" ? "Pre-test 前測清單" : "Post-test 後測清單"
                }}
              </h6>
              <div class="test-list-container">
                <div
                  v-if="(type === 'pre' ? preExams : postExams).length === 0"
                  class="text-muted small p-4 border rounded-4 border-dashed text-center bg-light"
                >
                  尚未建立{{ type === "pre" ? "前" : "後" }}測
                </div>
                <div
                  v-for="test in type === 'pre' ? preExams : postExams"
                  :key="test.id"
                  class="test-item-card d-flex align-items-center p-3 mb-2 rounded-4 border shadow-sm bg-white"
                >
                  <div class="flex-grow-1">
                    <div
                      class="fw-bold text-navy small text-truncate"
                      style="max-width: 150px"
                    >
                      {{ test.title }}
                    </div>
                    <div class="xx-small text-muted">
                      題目: {{ test.questions?.length || 0 }}
                    </div>
                  </div>
                  <button
                    @click="toggleVisibility(type, test.id, test.visible)"
                    class="btn btn-sm rounded-pill me-2"
                    :class="
                      test.visible ? 'btn-soft-success' : 'btn-soft-secondary'
                    "
                  >
                    <i
                      :class="
                        test.visible ? 'bi-eye-fill' : 'bi-eye-slash-fill'
                      "
                      class="bi"
                    ></i>
                  </button>
                  <button
                    @click="deleteTest(type, test.id)"
                    class="btn btn-sm btn-soft-danger rounded-pill"
                  >
                    <i class="bi bi-trash"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="col-lg-4">
        <div
          class="card border-0 shadow-sm p-4 sticky-top sidebar-card"
          style="top: 100px; z-index: 10"
        >
          <h5 class="fw-bold mb-4 text-navy border-bottom pb-2">
            實驗參數即時控制
          </h5>
          <div
            v-for="(opt, key) in parameterOptions"
            :key="key"
            class="form-check form-switch mb-4 custom-switch"
          >
            <input
              class="form-check-input"
              type="checkbox"
              v-model="aiSettings[key]"
              @change="saveAiSettings"
            />
            <label class="form-check-label fw-bold">{{ opt.title }}</label>
            <div class="form-text xx-small">{{ opt.desc }}</div>
          </div>
          <div class="alert alert-info border-0 rounded-4 small mb-0 mt-2">
            <i class="bi bi-info-circle-fill me-2"></i> 變動將即時同步至學生端。
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { rtdb as db } from "../../firebase/config";
import { ref as dbRef, onValue, set, update } from "firebase/database";
import Swal from "sweetalert2";
import "./TrExperiment.css";
// 引入剛才建立的獨立問卷建立組件
import TestCreate from "./Modal/TestCreate.vue";

const props = defineProps({ courseId: String });
const courseId = props.courseId;

const loading = ref(false);
const availableExams = ref([]);
const showCreateModal = ref(false);
const preExams = ref([]);
const postExams = ref([]);

// 1. 初始化 AI 設定：包含教師/學生雙維度 Prompt 與 前後測問卷 ID
const aiSettings = ref({
  teacherPrompt: "", // 教師教學邏輯
  studentPrompt: "", // 學生溝通风格
  preTestId: "", // 前測問卷連結
  postTestId: "", // 後測問卷連結
  allowVoice: false,
  enableSrlGuide: true,
});

const experimentGroups = ref([]);

// SRL 四階段配置描述
const srlSteps = {
  planning: { title: "任務計畫", desc: "進入單元前設定目標" },
  monitoring: { title: "學習監控", desc: "顯示進度與時間提醒" },
  aiAdvice: { title: "AI 策略建議", desc: "顯示個人化學習指引" },
  reflection: { title: "自我反思", desc: "任務後的成敗歸因" },
};

// 右側實驗控制參數
const parameterOptions = {
  enableSrlGuide: {
    title: "強制 SRL 引導流程",
    desc: "必須完成計畫與反思才能結束。",
  },
  showActivityLog: {
    title: "行為紀錄監控",
    desc: "紀錄學生行為檔案",
  },
};

// 🌟 初始化資料讀取與自動清洗
onMounted(() => {
  if (!courseId) return;

  // A. 監聽全域 AI 設定 (保持不變)
  onValue(dbRef(db, `courses/${courseId}/experiment/settings`), (snap) => {
    if (snap.exists()) {
      aiSettings.value = { ...aiSettings.value, ...snap.val() };
    }
  });

  // B. 監聽前測與後測完整路徑 (保持不變)
  onValue(dbRef(db, `courses/${courseId}/experiment/test/pretest`), (snap) => {
    const data = snap.val();
    preExams.value = data
      ? Object.entries(data).map(([id, val]) => ({ id, ...val }))
      : [];
  });

  onValue(dbRef(db, `courses/${courseId}/experiment/test/posttest`), (snap) => {
    const data = snap.val();
    postExams.value = data
      ? Object.entries(data).map(([id, val]) => ({ id, ...val }))
      : [];
  });

  // C. 🌟 監聽組別配置：修正通行碼消失問題
  onValue(dbRef(db, `courses/${courseId}/experiment/groups`), (snap) => {
    const data = snap.val();
    if (data) {
      experimentGroups.value = Object.entries(data).map(([id, val]) => ({
        id,
        name: val.name || "",
        // 🌟 核心更新：正確回填通行碼
        passCode: val.passCode || "",
        aiCustomPrompt: val.aiCustomPrompt || "",
        features: val.features || {
          planning: false,
          monitoring: false,
          aiAdvice: false,
          reflection: false,
        },
      }));
    } else {
      // 若資料庫為空，重置陣列
      experimentGroups.value = [];
    }
  });
});

// 🌟 處理問卷建立成功的回調
const handleExamCreated = () => {
  showCreateModal.value = false; // 關閉 Modal
  // 由於 B 步驟正在監聽 Firebase，下拉選單會自動更新，無需手動刷資料
};

// A. 更新新增組別的預設資料結構
const addGroup = () => {
  experimentGroups.value.push({
    id: Date.now().toString(),
    name: "新實驗組別",
    passCode: "", // 🌟 初始化通行碼欄位
    aiCustomPrompt: "",
    features: {
      planning: true,
      monitoring: true,
      aiAdvice: true,
      reflection: true,
      isLeaderboardAnonymous: false,
    },
  });
};

// B. 移除組別保持不變
const removeGroup = (index) => {
  experimentGroups.value.splice(index, 1);
};

// C. 儲存組別配置（包含通行碼）
// C. 儲存組別配置（確保包含所有 SRL 階段與匿名設定）
const saveGroups = async () => {
  loading.value = true;
  try {
    const groupData = {};

    experimentGroups.value.forEach((g) => {
      // 確保 features 下的所有欄位都有預設值，防止寫入 undefined
      const features = {
        planning: g.features?.planning ?? false,
        monitoring: g.features?.monitoring ?? false,
        aiAdvice: g.features?.aiAdvice ?? false,
        reflection: g.features?.reflection ?? false,
        isLeaderboardAnonymous: g.features?.isLeaderboardAnonymous ?? false, // 🌟 確保寫入匿名排行榜設定
      };

      // 構建上傳至 Firebase 的物件結構
      groupData[g.id] = {
        name: g.name || "未命名組別",
        passCode: g.passCode || "",
        aiCustomPrompt: g.aiCustomPrompt || "",
        features: features, // 使用清理後的 features
      };
    });

    // 執行寫入 (使用 set 會覆蓋該路徑下的舊資料，確保與列表同步)
    await set(dbRef(db, `courses/${courseId}/experiment/groups`), groupData);

    Swal.fire({
      icon: "success",
      title: "組別配置已儲存",
      text: "學生端將即時套用新的 SRL 功能與排行榜設定",
      timer: 1500,
      showConfirmButton: false,
    });
  } catch (e) {
    console.error("儲存失敗:", e);
    Swal.fire("錯誤", "儲存失敗，請檢查網路連線或權限設定", "error");
  } finally {
    loading.value = false;
  }
};

// 儲存 AI 與 參數設定
const saveAiSettings = async () => {
  loading.value = true;
  try {
    await update(
      dbRef(db, `courses/${courseId}/experiment/settings`),
      aiSettings.value,
    );
    Swal.fire({ icon: "success", title: "實驗參數與連結已更新", timer: 1000 });
  } catch (e) {
    Swal.fire("錯誤", "更新失敗", "error");
  } finally {
    loading.value = false;
  }
};

// --- 🌟 新增：測驗管理操作函式 ---

/**
 * 切換測驗的顯示/隱藏狀態
 * @param {string} type - 'pre' 或 'post'
 * @param {string} testId - 測驗的 UID
 * @param {boolean} currentStatus - 目前的 visible 狀態
 */
const toggleVisibility = async (type, testId, currentStatus) => {
  const folder = type === "pre" ? "pretest" : "posttest";
  const testRef = dbRef(
    db,
    `courses/${courseId}/experiment/test/${folder}/${testId}`,
  );

  try {
    // 切換狀態，若原本無 visible 屬性則預設改為 true
    const newStatus = currentStatus === undefined ? true : !currentStatus;
    await update(testRef, { visible: newStatus });
  } catch (e) {
    Swal.fire("錯誤", "更新狀態失敗", "error");
  }
};

/**
 * 刪除測驗
 */
const deleteTest = async (type, testId) => {
  const result = await Swal.fire({
    title: "確定刪除？",
    text: "這將會永久移除此測驗及其設定",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#d33",
    confirmButtonText: "確定刪除",
    cancelButtonText: "取消",
  });

  if (result.isConfirmed) {
    const folder = type === "pre" ? "pretest" : "posttest";
    try {
      await remove(
        dbRef(db, `courses/${courseId}/experiment/test/${folder}/${testId}`),
      );
      Swal.fire({
        icon: "success",
        title: "已刪除",
        timer: 1000,
        showConfirmButton: false,
      });
    } catch (e) {
      Swal.fire("錯誤", "刪除失敗", "error");
    }
  }
};
</script>
