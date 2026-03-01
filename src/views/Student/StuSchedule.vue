<template>
  <div class="StudentSchedule TrUnit ex-form-container content-fade">
    <transition name="toast">
      <div v-if="submitSuccessMessage" class="success-toast">
        {{ submitSuccessMessage }}
      </div>
    </transition>

    <div class="TrUnit-layout-container">
      <div class="schedule-timeline">
        <div
          v-if="pretestSettings.enabled"
          class="special-section-wrapper pretest-section"
        >
          <div class="special-badge">START</div>
          <div class="ex-unit-collapse-card mb-4 border-pretest shadow-sm">
            <div class="unit-summary-header bg-pretest-subtle">
              <h5 class="fw-800 text-navy m-0">
                <i class="bi bi-flag-fill me-2"></i>課程前測問卷 / 測驗
              </h5>
            </div>
            <div class="unit-details-content p-4">
              <div
                v-if="pretestExams.length > 0"
                class="ex-resource-grid single-col"
              >
                <div
                  v-for="e in pretestExams"
                  :key="e.id"
                  class="ex-item-brick pretest-accent task-card"
                  @click="handleTaskOpen('test', e.id)"
                >
                  <span class="text-truncate fw-bold">{{ e.title }}</span>
                  <span
                    :class="[
                      'status-tag',
                      isSubmitted('exams', e.id) ? 'is-done' : 'is-pending',
                    ]"
                  >
                    {{ isSubmitted("exams", e.id) ? "已完成" : "未填寫" }}
                  </span>
                </div>
              </div>
              <div v-else class="ex-empty-placeholder">目前無前測內容</div>
            </div>
          </div>
        </div>

        <div v-if="schedule.length > 0">
          <div
            v-for="(unit, index) in schedule"
            :key="unit.id"
            class="unit-card-wrapper"
          >
            <div class="unit-badge">UNIT {{ index + 1 }}</div>

            <div class="ex-unit-collapse-card mb-4 shadow-sm">
              <div
                class="unit-summary-header"
                @click="openUnitIntro(unit, index)"
                style="cursor: pointer"
              >
                <div
                  class="d-flex align-items-center justify-content-between w-100"
                >
                  <div class="d-flex flex-column">
                    <h5 class="fw-800 text-navy m-0">
                      {{ unit.title }}
                      <i class="bi bi-info-circle ms-2 small opacity-50"></i>
                    </h5>
                    <div class="unit-meta xx-small text-muted mt-1">
                      <i class="bi bi-calendar-check me-1"></i>截止：{{
                        unit.deadline
                          ? new Date(unit.deadline).toLocaleDateString()
                          : "尚未設定"
                      }}
                    </div>
                  </div>
                  <i class="bi bi-chevron-expand text-muted opacity-50"></i>
                </div>
              </div>

              <div class="unit-details-content p-4">
                <div class="ex-resource-grid">
                  <div class="ex-resource-column">
                    <h6 class="ex-label-small">
                      <i class="bi bi-collection-play-fill me-2"></i>單元教材
                    </h6>
                    <div v-if="unit.materials?.length" class="ex-resource-list">
                      <div
                        v-for="mId in unit.materials"
                        :key="mId"
                        class="ex-item-brick material-row"
                        @click="handleMaterialDownload(mId)"
                      >
                        <div
                          class="d-flex align-items-center justify-content-between w-100"
                        >
                          <span class="text-truncate flex-grow-1 small">
                            <i
                              class="bi"
                              :class="
                                getMaterialType(mId) === 'video'
                                  ? 'bi-play-circle-fill text-danger'
                                  : 'bi-file-earmark-text text-primary'
                              "
                            ></i>
                            {{ getMaterialTitle(mId) }}
                          </span>
                          <i class="bi bi-download remove-icon"></i>
                        </div>
                      </div>
                    </div>
                    <div v-else class="ex-empty-placeholder">尚無教材</div>
                  </div>

                  <div class="ex-resource-column">
                    <h6 class="ex-label-small">
                      <i class="bi bi-pencil-square me-2"></i>指定功課
                    </h6>
                    <div
                      v-if="unit.assignments?.length"
                      class="ex-resource-list"
                    >
                      <div
                        v-for="aId in unit.assignments"
                        :key="aId"
                        class="ex-item-brick task-card"
                        @click="handleTaskOpen('hw', aId)"
                      >
                        <span class="text-truncate small">{{
                          getAssignmentTitle(aId)
                        }}</span>
                        <span
                          :class="[
                            'status-tag',
                            isSubmitted('assignments', aId)
                              ? 'is-done'
                              : 'is-pending',
                          ]"
                        >
                          {{
                            isSubmitted("assignments", aId) ? "已繳" : "未繳"
                          }}
                        </span>
                      </div>
                    </div>
                    <div v-else class="ex-empty-placeholder">無作業</div>
                  </div>

                  <div class="ex-resource-column">
                    <h6 class="ex-label-small">
                      <i class="bi bi-lightning-charge-fill me-2"></i>單元測驗
                    </h6>
                    <div v-if="unit.exams?.length" class="ex-resource-list">
                      <div
                        v-for="eId in unit.exams"
                        :key="eId"
                        class="ex-item-brick task-card"
                        @click="handleTaskOpen('exam', eId)"
                      >
                        <span class="text-truncate small">{{
                          getExamTitle(eId)
                        }}</span>
                        <span
                          :class="[
                            'status-tag',
                            isSubmitted('exams', eId)
                              ? 'is-done'
                              : 'is-pending',
                          ]"
                        >
                          {{ isSubmitted("exams", eId) ? "完成" : "未考" }}
                        </span>
                      </div>
                    </div>
                    <div v-else class="ex-empty-placeholder">無測驗</div>
                  </div>

                  <div class="ex-resource-column">
                    <h6 class="ex-label-small">
                      <i class="bi bi-chat-dots-fill me-2"></i>單元討論
                    </h6>
                    <div v-if="unit.forums?.length" class="ex-resource-list">
                      <div
                        v-for="fId in unit.forums"
                        :key="fId"
                        class="ex-item-brick task-card discussion-accent"
                        @click="handleDiscussionOpen(fId)"
                      >
                        <div
                          class="d-flex align-items-center justify-content-between w-100"
                        >
                          <span class="text-truncate small">
                            <i class="bi bi-chat-left-text me-2 text-info"></i>
                            {{ getForumTitle(fId) }}
                          </span>
                          <i class="bi bi-chevron-right small opacity-50"></i>
                        </div>
                      </div>
                    </div>
                    <div v-else class="ex-empty-placeholder">
                      目前無討論主題
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div
          v-if="posttestSettings.enabled"
          class="special-section-wrapper posttest-section"
        >
          <div class="special-badge">END</div>
          <div class="ex-unit-collapse-card border-posttest shadow-sm">
            <div class="unit-summary-header bg-posttest-subtle">
              <h5 class="fw-800 text-posttest m-0">
                <i class="bi bi-trophy-fill me-2"></i>課程後測 / 學習總結
              </h5>
            </div>
            <div class="unit-details-content p-4">
              <div
                v-if="posttestExams.length > 0"
                class="ex-resource-grid single-col"
              >
                <div
                  v-for="e in posttestExams"
                  :key="e.id"
                  class="ex-item-brick posttest-accent task-card"
                  @click="handleTaskOpen('test', e.id)"
                >
                  <span class="text-truncate fw-bold">{{ e.title }}</span>
                  <span
                    :class="[
                      'status-tag',
                      isSubmitted('exams', e.id) ? 'is-done' : 'is-pending',
                    ]"
                  >
                    {{ isSubmitted("exams", e.id) ? "已完成" : "未填寫" }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <Teleport to="body">
      <transition name="fade">
        <div
          v-if="showUnitIntroModal"
          class="ScheduleModalOverlay"
          @click.self="showUnitIntroModal = false"
        >
          <StuUnitModal
            :unitData="selectedUnitData"
            :badgeText="modalBadgeText"
            @close="showUnitIntroModal = false"
            @confirm="showUnitIntroModal = false"
          />
        </div>
      </transition>
    </Teleport>

    <Teleport to="body">
      <transition name="fade">
        <div
          v-if="showActiveModal"
          class="ScheduleModalOverlay"
          @click.self="closeTaskModal"
        >
          <div class="modal-card-custom shadow-lg">
            <div class="modal-header-custom border-bottom">
              <h4 class="fw-800 mb-0 text-navy">{{ activeTaskTitle }}</h4>
              <button class="close-btn" @click="closeTaskModal">
                <span class="custom-x-text">✕</span>
              </button>
            </div>
            <component
              :is="currentModalComponent"
              :courseId="courseId"
              :taskId="activeTaskId"
              :initialAnswers="activeTaskInitialData"
              @close="closeTaskModal"
              @submit-success="onTaskSubmitted"
            />
          </div>
        </div>
      </transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed, markRaw } from "vue";
import { rtdb, auth } from "../../firebase/config";
import { ref as dbRef, onValue, get } from "firebase/database";
import Swal from "sweetalert2";

// 組件引入
import StudentHW from "./Modal/StuHW.vue";
import StudentExam from "./Modal/StuExam.vue";
import StuUnitModal from "./Modal/StuUnit.vue";
import StuSrlPlan from "./Modal/StuSRLPlan.vue";
import "./StuSchedule.css";

const props = defineProps({
  courseId: { type: String, required: true },
});

// --- 狀態定義 ---
const submitSuccessMessage = ref("");
const showActiveModal = ref(false);
const showUnitIntroModal = ref(false);
const activeFeatures = ref({ planning: false });
const pretestSettings = ref({ enabled: false });
const posttestSettings = ref({ enabled: false });

// 資料暫存
const schedule = ref([]);
const userSubmissions = ref({});
const activeTaskId = ref(null);
const activeTaskType = ref(null);
const selectedUnitData = ref(null);
const selectedUnitIdx = ref(0);
const pendingAction = ref(null);
const pretestExams = ref([]);
const posttestExams = ref([]);
const activeTaskInitialData = ref(null);

// 名稱反查字典
const materialsMap = ref({});
const assignmentsMap = ref({});
const examsMap = ref({});
const forumsMap = ref({});
const customTaskTitle = ref(""); // 🌟 動態標題儲存區

const componentMap = {
  hw: markRaw(StudentHW),
  exam: markRaw(StudentExam),
  plan: markRaw(StuSrlPlan),
};

const getForumTitle = (fId) => forumsMap.value[fId]?.title || "單元討論主題";

const currentModalComponent = computed(() =>
  activeTaskType.value ? componentMap[activeTaskType.value] : null,
);

const activeTaskTitle = computed(() => {
  // 1. 如果目前是「計畫模式」，顯示由攔截器設定的詳細標題（例如：正在為 教材測試 設定計畫）
  if (activeTaskType.value === "plan") {
    return customTaskTitle.value || "📝 學習計畫設定";
  }

  // 2. 定義各個任務在進入「執行模式」時的標題
  const titles = {
    hw: "單元作業繳交",
    exam: "單元測驗",
    discussion: "單元討論區",
    test: "課程問卷 / 測驗", // 🌟 補上此行，確保前測與後測彈窗有正確標題
  };

  // 3. 回傳對應標題，若無匹配則顯示預設值
  return titles[activeTaskType.value] || "課程內容";
});

// --- 核心邏輯：計畫攔截器 ---
const checkAndRunSrl = async (taskId, taskType, callback, taskName = "") => {
  const uid = auth.currentUser?.uid;
  customTaskTitle.value = `正在為 ${taskName} 設定計畫`; // 🌟 統一在這裡設定標題

  if (!activeFeatures.value.planning) {
    callback();
    return;
  }

  const planSnap = await get(
    dbRef(
      rtdb,
      `courses/${props.courseId}/profiles/${uid}/srl/planning/${taskId}`,
    ),
  );

  if (planSnap.exists()) {
    callback();
  } else {
    pendingAction.value = callback;
    activeTaskType.value = "plan";
    activeTaskId.value = taskId;
    showActiveModal.value = true;
  }
};

// --- UI 觸發函式 ---

const handleMaterialDownload = (mId) => {
  const unitId = selectedUnitData.value?.id || "unit";
  const uniqueId = `${unitId}_${mId}`;
  const title = getMaterialTitle(mId);

  checkAndRunSrl(
    uniqueId,
    "material",
    () => {
      Swal.fire({
        title: "開始學習",
        text: `準備進入：${title}`,
        icon: "success",
        timer: 1500,
      });
      // window.open(materialsMap.value[mId]?.fileUrl); // 若有連結可開啟
    },
    title,
  ); // 🌟 傳入名稱
};

// 處理討論區點擊
const handleDiscussionOpen = (fId) => {
  const unitId = selectedUnitData.value?.id || "unit";
  const uniqueId = `discuss_${unitId}_${fId}`; // 建立唯一攔截 ID
  const title = getForumTitle(fId);

  checkAndRunSrl(
    uniqueId,
    "discussion",
    () => {
      // 這裡放入進入討論區的動作
      Swal.fire({
        title: "進入討論區",
        text: `準備參與「${title}」的討論`,
        icon: "info",
        timer: 1500,
      });
      // router.push(`/discussion/${fId}`);
    },
    title,
  );
};

const handleTaskOpen = (type, task) => {
  // 1. 取得任務 ID
  const id = typeof task === "string" ? task : task.id || task;
  let title = "";

  // 2. 🌟 根據不同類型獲取對應的標題名稱
  if (type === "test") {
    // 從前測與後測的清單中尋找匹配的標題
    const allTests = [...pretestExams.value, ...posttestExams.value];
    const targetTest = allTests.find((t) => t.id === id);
    title = targetTest?.title || "課程問卷";
  } else if (type === "hw") {
    // 從作業字典反查名稱
    title = getAssignmentTitle(id);
  } else if (type === "exam") {
    // 從測驗字典反查名稱
    title = getExamTitle(id);
  } else {
    title = "學習任務";
  }

  // 3. 執行 SRL 攔截邏輯
  checkAndRunSrl(
    id,
    type,
    () => {
      activeTaskType.value = type;
      activeTaskId.value = id;
      showActiveModal.value = true;
    },
    title, // 🌟 將獲取到的名稱傳入計畫模組顯示
  );
};

// 當計畫提交成功後的回呼
const onTaskSubmitted = () => {
  if (activeTaskType.value === "plan" && pendingAction.value) {
    const nextStep = pendingAction.value;
    pendingAction.value = null;
    showActiveModal.value = false;
    setTimeout(() => {
      nextStep();
      submitSuccessMessage.value = "計畫已儲存，開始執行任務！";
      setTimeout(() => (submitSuccessMessage.value = ""), 3000);
    }, 400);
  } else {
    closeTaskModal();
  }
};

// --- 🌟 更新後的資料監聽 (補足字典與設定) ---
const initData = () => {
  const coursePath = `courses/${props.courseId}`;

  // 1. 監聽資源字典 (解決名稱讀不到的問題)
  onValue(
    dbRef(rtdb, `${coursePath}/materials`),
    (s) => (materialsMap.value = s.val() || {}),
  );
  onValue(
    dbRef(rtdb, `${coursePath}/assignments`),
    (s) => (assignmentsMap.value = s.val() || {}),
  );
  onValue(
    dbRef(rtdb, `${coursePath}/exams`),
    (s) => (examsMap.value = s.val() || {}),
  );
  onValue(
    dbRef(rtdb, `${coursePath}/discussions`),
    (s) => (forumsMap.value = s.val() || {}),
  );

  // 2. 🌟 更新：監聽前測與後測的詳細清單
  onValue(dbRef(rtdb, `${coursePath}/experiment/test/pretest`), (snap) => {
    const data = snap.val() || {};
    // 轉換為陣列格式供 v-for 使用
    pretestExams.value = Object.entries(data).map(([id, val]) => ({
      id,
      ...val,
    }));
  });
  onValue(dbRef(rtdb, `${coursePath}/experiment/test/posttest`), (snap) => {
    const data = snap.val() || {};
    posttestExams.value = Object.entries(data).map(([id, val]) => ({
      id,
      ...val,
    }));
  });

  // 3. 監聽實驗開關設定 (解決 enabled 報錯)
  onValue(dbRef(rtdb, `${coursePath}/experiment/settings`), (snap) => {
    const s = snap.val() || {};
    pretestSettings.value = s.pretest || { enabled: false };
    posttestSettings.value = s.posttest || { enabled: false };
  });

  // 4. 監聽學習單元
  onValue(dbRef(rtdb, `${coursePath}/units`), (snap) => {
    const data = snap.val();
    schedule.value = data
      ? Object.entries(data).map(([id, val]) => ({ id, ...val }))
      : [];
  });

  const uid = auth.currentUser?.uid;
  if (uid) {
    // 5. 監聽個人繳交紀錄
    onValue(dbRef(rtdb, `${coursePath}/submissions`), (snap) => {
      userSubmissions.value = snap.val() || {};
    });

    // 6. 監聽學生實驗組別與功能權限
    onValue(dbRef(rtdb, `${coursePath}/profiles/${uid}`), (snap) => {
      const profile = snap.val();
      if (profile?.groupId) {
        onValue(
          dbRef(
            rtdb,
            `${coursePath}/experiment/groups/${profile.groupId}/features`,
          ),
          (fSnap) => {
            activeFeatures.value = fSnap.val() || { planning: false };
          },
        );
      }
    });
  }
};

// 輔助函數
const getMaterialTitle = (mId) =>
  materialsMap.value[mId]?.title || "載入中教材...";
const getAssignmentTitle = (aId) =>
  assignmentsMap.value[aId]?.title || "指定作業";
const getExamTitle = (eId) => examsMap.value[eId]?.title || "單元測驗";
const getMaterialType = (mId) => materialsMap.value[mId]?.type || "file"; // 🌟 補上缺失函數

const isSubmitted = (category, taskId) => {
  const uid = auth.currentUser?.uid;
  return !!userSubmissions.value[taskId]?.[uid];
};

const openUnitIntro = (unit, index) => {
  selectedUnitData.value = unit;
  selectedUnitIdx.value = index;
  showUnitIntroModal.value = true;
};

const closeTaskModal = () => {
  showActiveModal.value = false;
  activeTaskId.value = null;
  activeTaskType.value = null;
  pendingAction.value = null;
};

onMounted(() => initData());
</script>
