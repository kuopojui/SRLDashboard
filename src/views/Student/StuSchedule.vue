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
            <div
              class="group-trigger bg-pretest-subtle"
              @click="toggleSubSection('pretest_root', 'content')"
              style="cursor: pointer"
            >
              <h5 class="fw-800 text-navy m-0">
                <i class="bi bi-flag-fill me-3"></i>課程前測問卷 / 測驗
              </h5>
              <i
                class="bi bi-chevron-down"
                :class="{
                  'rotate-180': isSubSectionOpen('pretest_root', 'content'),
                }"
              ></i>
            </div>

            <transition name="slide">
              <div
                v-show="isSubSectionOpen('pretest_root', 'content')"
                class="unit-details-content p-4 border-top"
              >
                <div
                  v-if="pretestExams.length > 0"
                  class="ex-resource-grid single-col"
                >
                  <div
                    v-for="e in pretestExams"
                    :key="e.id"
                    class="ex-item-brick pretest-accent task-card mb-2"
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
            </transition>
          </div>
        </div>

        <div v-if="schedule.length > 0">
          <div
            v-for="(unit, index) in schedule"
            :key="unit.id"
            class="unit-card-wrapper"
          >
            <div class="unit-badge">UNIT {{ index + 1 }}</div>

            <div class="ex-unit-collapse-card mb-4 shadow-sm border-0 bg-white">
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
                      <span class="ms-2 badge bg-soft-navy text-navy x-small"
                        >點擊查看導引</span
                      >
                    </h5>
                    <div class="unit-meta xx-small text-muted mt-1">
                      <i class="bi bi-calendar-check me-1"></i>截止：{{
                        unit.deadline
                          ? new Date(unit.deadline).toLocaleDateString()
                          : "尚未設定"
                      }}
                    </div>
                  </div>
                  <i
                    class="bi bi-info-circle-fill text-primary opacity-75 fs-5"
                  ></i>
                </div>
              </div>

              <div class="unit-details-content p-0">
                <div class="unit-resource-accordion">
                  <div class="resource-group">
                    <div
                      class="group-trigger"
                      @click="toggleSubSection(unit.id, 'materials')"
                    >
                      <h6 class="m-0">
                        <i
                          class="bi bi-collection-play-fill me-3 text-danger"
                        ></i
                        >單元教材
                      </h6>
                      <i
                        class="bi bi-chevron-down"
                        :class="{
                          'rotate-180': isSubSectionOpen(unit.id, 'materials'),
                        }"
                      ></i>
                    </div>
                    <transition name="slide">
                      <div
                        v-show="isSubSectionOpen(unit.id, 'materials')"
                        class="group-content p-4"
                      >
                        <div
                          v-if="unit.materials?.length"
                          class="ex-resource-list"
                        >
                          <div
                            v-for="mId in unit.materials"
                            :key="mId"
                            class="ex-item-brick material-row mb-2"
                            @click="handleMaterialDownload(mId)"
                          >
                            <div
                              class="d-flex align-items-center justify-content-between w-100"
                            >
                              <span class="text-truncate flex-grow-1">
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
                              <i class="bi bi-download ms-2"></i>
                            </div>
                          </div>
                        </div>
                        <div v-else class="ex-empty-placeholder">尚無教材</div>
                      </div>
                    </transition>
                  </div>

                  <div class="resource-group">
                    <div
                      class="group-trigger"
                      @click="toggleSubSection(unit.id, 'forums')"
                    >
                      <h6 class="m-0">
                        <i class="bi bi-chat-dots-fill me-3 text-info"></i
                        >單元討論
                      </h6>
                      <i
                        class="bi bi-chevron-down"
                        :class="{
                          'rotate-180': isSubSectionOpen(unit.id, 'forums'),
                        }"
                      ></i>
                    </div>
                    <transition name="slide">
                      <div
                        v-show="isSubSectionOpen(unit.id, 'forums')"
                        class="group-content p-4"
                      >
                        <div
                          v-if="unit.forums?.length"
                          class="ex-resource-list"
                        >
                          <div
                            v-for="fId in unit.forums"
                            :key="fId"
                            class="ex-item-brick task-card discussion-accent mb-2"
                            @click="handleDiscussionOpen(fId)"
                          >
                            <div
                              class="d-flex align-items-center justify-content-between w-100"
                            >
                              <span>{{ getForumTitle(fId) }}</span>
                              <i class="bi bi-chevron-right opacity-50"></i>
                            </div>
                          </div>
                        </div>
                        <div v-else class="ex-empty-placeholder">
                          無討論主題
                        </div>
                      </div>
                    </transition>
                  </div>

                  <div class="resource-group">
                    <div
                      class="group-trigger"
                      @click="toggleSubSection(unit.id, 'assignments')"
                    >
                      <h6 class="m-0">
                        <i class="bi bi-pencil-square me-3 text-warning"></i
                        >指定功課
                      </h6>
                      <i
                        class="bi bi-chevron-down"
                        :class="{
                          'rotate-180': isSubSectionOpen(
                            unit.id,
                            'assignments',
                          ),
                        }"
                      ></i>
                    </div>
                    <transition name="slide">
                      <div
                        v-show="isSubSectionOpen(unit.id, 'assignments')"
                        class="group-content p-4"
                      >
                        <div
                          v-if="unit.assignments?.length"
                          class="ex-resource-list"
                        >
                          <div
                            v-for="aId in unit.assignments"
                            :key="aId"
                            class="ex-item-brick task-card mb-2"
                            @click="handleTaskOpen('hw', aId)"
                          >
                            <span>{{ getAssignmentTitle(aId) }}</span>
                            <span
                              :class="[
                                'status-tag',
                                isSubmitted('assignments', aId)
                                  ? 'is-done'
                                  : 'is-pending',
                              ]"
                            >
                              {{
                                isSubmitted("assignments", aId)
                                  ? "已繳"
                                  : "未繳"
                              }}
                            </span>
                          </div>
                        </div>
                      </div>
                    </transition>
                  </div>

                  <div class="resource-group">
                    <div
                      class="group-trigger"
                      @click="toggleSubSection(unit.id, 'exams')"
                    >
                      <h6 class="m-0">
                        <i
                          class="bi bi-lightning-charge-fill me-3 text-warning"
                        ></i
                        >單元測驗
                      </h6>
                      <i
                        class="bi bi-chevron-down"
                        :class="{
                          'rotate-180': isSubSectionOpen(unit.id, 'exams'),
                        }"
                      ></i>
                    </div>
                    <transition name="slide">
                      <div
                        v-show="isSubSectionOpen(unit.id, 'exams')"
                        class="group-content p-4"
                      >
                        <div v-if="unit.exams?.length" class="ex-resource-list">
                          <div
                            v-for="eId in unit.exams"
                            :key="eId"
                            class="ex-item-brick task-card mb-2"
                            @click="handleTaskOpen('exam', eId)"
                          >
                            <span>{{ getExamTitle(eId) }}</span>
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
                      </div>
                    </transition>
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
            <div
              class="group-trigger bg-posttest-subtle"
              @click="toggleSubSection('posttest_root', 'content')"
              style="cursor: pointer"
            >
              <h5 class="fw-800 text-posttest m-0">
                <i class="bi bi-trophy-fill me-3"></i>課程後測 / 學習總結
              </h5>
              <i
                class="bi bi-chevron-down"
                :class="{
                  'rotate-180': isSubSectionOpen('posttest_root', 'content'),
                }"
              ></i>
            </div>

            <transition name="slide">
              <div
                v-show="isSubSectionOpen('posttest_root', 'content')"
                class="unit-details-content p-4 border-top"
              >
                <div
                  v-if="posttestExams.length > 0"
                  class="ex-resource-grid single-col"
                >
                  <div
                    v-for="e in posttestExams"
                    :key="e.id"
                    class="ex-item-brick posttest-accent task-card mb-2"
                    @click="handleTaskOpen('test', e.id)"
                  >
                    <div
                      class="d-flex align-items-center justify-content-between w-100"
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
                <div v-else class="ex-empty-placeholder">目前無後測內容</div>
              </div>
            </transition>
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
            <div class="modal-body-custom p-0">
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

//展開
const openSubSections = reactive({
  pretest_root: [], // 預設開啟前測
  posttest_root: [], // 後測預設收合
});

// 🌟 3. 切換子章節開關的函式
const toggleSubSection = (unitId, sectionType) => {
  if (!openSubSections[unitId]) {
    openSubSections[unitId] = [];
  }

  const index = openSubSections[unitId].indexOf(sectionType);
  if (index > -1) {
    // 已開啟則移除 (收合)
    openSubSections[unitId].splice(index, 1);
  } else {
    // 未開啟則加入 (展開)
    openSubSections[unitId].push(sectionType);
  }
};

// 🌟 4. 檢查子章節是否開啟的函式 (修正報錯的關鍵)
const isSubSectionOpen = (unitId, sectionType) => {
  return openSubSections[unitId]?.includes(sectionType) || false;
};

// --- 🌟 更新後的資料監聽 (補足字典與設定) ---
const initData = () => {
  if (!props.courseId) return;
  const coursePath = `courses/${props.courseId}`;
  const uid = auth.currentUser?.uid;

  // --- 1. 資源字典監聽 (教材、作業、測驗、討論) ---
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

  // --- 2. 前測內容監聽 (experiment/test/pretest) ---
  onValue(dbRef(rtdb, `${coursePath}/experiment/test/pretest`), (snap) => {
    const data = snap.val() || {};
    const exams = Object.entries(data).map(([id, val]) => ({ id, ...val }));
    pretestExams.value = exams;

    // 只要有 visible 的前測資料，就自動開啟顯示並展開
    if (exams.some((e) => e.visible !== false)) {
      pretestSettings.value.enabled = true;
      if (!openSubSections["pretest_root"]) {
        openSubSections["pretest_root"] = ["content"];
      }
    }
  });

  // --- 3. 後測內容監聽 (experiment/test/posttest) ---
  onValue(dbRef(rtdb, `${coursePath}/experiment/test/posttest`), (snap) => {
    const data = snap.val() || {};
    const exams = Object.entries(data).map(([id, val]) => ({ id, ...val }));
    posttestExams.value = exams;

    // 只要有後測資料，就自動開啟後測區域顯示
    if (exams.length > 0) {
      posttestSettings.value.enabled = true;
    }
  });

  // --- 4. 實驗設定監聽 (用於 ID 檢查與開關) ---
  onValue(dbRef(rtdb, `${coursePath}/experiment/settings`), (snap) => {
    const s = snap.val() || {};
    // 優先檢查 preTestId，若無則依據是否有內容決定是否啟用
    pretestSettings.value.enabled =
      !!s.preTestId || pretestExams.value.length > 0;
    posttestSettings.value.enabled =
      !!s.postTestId || posttestExams.value.length > 0;
  });

  // --- 5. 普通學習單元監聽 (units) ---
  onValue(dbRef(rtdb, `${coursePath}/units`), (snap) => {
    const data = snap.val() || {};
    schedule.value = Object.entries(data).map(([id, val]) => ({ id, ...val }));
  });

  // --- 6. 使用者相關資料監聽 (繳交紀錄與權限) ---
  if (uid) {
    // 🌟 修正：同時監聽一般提交與實驗性提交路徑
    onValue(dbRef(rtdb, `${coursePath}/experiment/submissions`), (snap) => {
      // 合併或獨立處理實驗組的繳交紀錄
      userSubmissions.value = {
        ...userSubmissions.value,
        ...(snap.val() || {}),
      };
    });

    onValue(dbRef(rtdb, `${coursePath}/submissions`), (snap) => {
      userSubmissions.value = {
        ...userSubmissions.value,
        ...(snap.val() || {}),
      };
    });

    // 監聽學生實驗組別功能權限
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
