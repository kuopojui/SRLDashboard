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
                  @click="openTaskModal('test', e.id)"
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
                        v-for="m in unit.materials"
                        :key="m"
                        class="ex-item-brick material-row"
                        @click="handleMaterialDownload(m)"
                      >
                        <div
                          class="d-flex align-items-center justify-content-between w-100"
                        >
                          <span class="text-truncate flex-grow-1 small">
                            <i
                              class="bi"
                              :class="
                                getMaterialType(m) === 'video'
                                  ? 'bi-play-circle-fill text-danger'
                                  : 'bi-file-earmark-text text-primary'
                              "
                            ></i>
                            {{ getMaterialTitle(m) }}
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
                        v-for="a in unit.assignments"
                        :key="a"
                        class="ex-item-brick task-card"
                        @click="openTaskModal('hw', a)"
                      >
                        <span class="text-truncate small">{{
                          getAssignmentTitle(a)
                        }}</span>
                        <span
                          :class="[
                            'status-tag',
                            isSubmitted('assignments', a)
                              ? 'is-done'
                              : 'is-pending',
                          ]"
                        >
                          {{ isSubmitted("assignments", a) ? "已繳" : "未繳" }}
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
                        v-for="e in unit.exams"
                        :key="e"
                        class="ex-item-brick task-card"
                        @click="openTaskModal('exam', e)"
                      >
                        <span class="text-truncate small">{{
                          getExamTitle(e)
                        }}</span>
                        <span
                          :class="[
                            'status-tag',
                            isSubmitted('exams', e) ? 'is-done' : 'is-pending',
                          ]"
                        >
                          {{ isSubmitted("exams", e) ? "完成" : "未考" }}
                        </span>
                      </div>
                    </div>
                    <div v-else class="ex-empty-placeholder">無測驗</div>
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
                  @click="openTaskModal('test', e.id)"
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
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed, markRaw } from "vue";
import { rtdb, auth } from "../../firebase/config";
import { ref as dbRef, onValue, get } from "firebase/database";

// 🌟 引入任務相關組件 (用於 <component :is="...">)
import StudentHW from "./Modal/StuHW.vue";
import StudentExam from "./Modal/StuExam.vue";
//import StudentTest from "./Modal/StuTest.vue";
import StuUnitModal from "./Modal/StuUnit.vue";

// 定義 Props
const props = defineProps({
  courseId: { type: String, required: true },
});

// 🌟 補回報錯缺失的響應式變數
const submitSuccessMessage = ref("");
const showActiveModal = ref(false);
const showUnitIntroModal = ref(false);

// 資料狀態
const schedule = ref([]);
const userSubmissions = ref({});
const pretestSettings = reactive({ enabled: false });
const posttestSettings = reactive({ enabled: false });
const pretestExams = ref([]);
const posttestExams = ref([]);

// 任務彈窗相關
const activeTaskId = ref(null);
const activeTaskType = ref(null);
const activeTaskInitialData = ref(null);
const selectedUnitData = ref(null);
const selectedUnitIdx = ref(0);

// 🌟 動態組件映射表
const componentMap = {
  hw: markRaw(StudentHW),
  exam: markRaw(StudentExam),
};

const currentModalComponent = computed(() =>
  activeTaskType.value ? componentMap[activeTaskType.value] : null,
);

const activeTaskTitle = computed(() => {
  if (activeTaskType.value === "hw") return "單元作業繳交";
  if (activeTaskType.value === "exam") return "單元測驗";
  return "課程問卷";
});

const modalBadgeText = computed(
  () => `UNIT ${selectedUnitIdx.value + 1} / 單元導引`,
);

// --- 邏輯函式 ---

// 1. 初始化資料監聽
const initData = () => {
  const coursePath = `courses/${props.courseId}`;

  // 監聽單元時程
  onValue(dbRef(rtdb, `${coursePath}/units`), (snap) => {
    const data = snap.val();
    schedule.value = data
      ? Object.entries(data).map(([id, val]) => ({ id, ...val }))
      : [];
  });

  // 監聽使用者繳交狀況 (用於 status-tag)
  const uid = auth.currentUser?.uid;
  if (uid) {
    onValue(dbRef(rtdb, `courses/${props.courseId}/submissions`), (snap) => {
      userSubmissions.value = snap.val() || {};
    });
  }
};

// 2. 判斷是否已繳交
const isSubmitted = (category, taskId) => {
  const uid = auth.currentUser?.uid;
  if (!uid || !userSubmissions.value[taskId]) return false;
  return !!userSubmissions.value[taskId][uid];
};

// 3. 開啟任務彈窗 (作業/測驗)
const openTaskModal = (type, id) => {
  activeTaskType.value = type;
  activeTaskId.value = id;
  showActiveModal.value = true;
};

const closeTaskModal = () => {
  showActiveModal.value = false;
  activeTaskId.value = null;
  activeTaskType.value = null;
};

// 4. 開啟單元引導彈窗 (點擊單元標頭)
const openUnitIntro = (unit, index) => {
  selectedUnitData.value = unit;
  selectedUnitIdx.value = index;
  showUnitIntroModal.value = true;
};

// 模擬標題抓取函式 (實際應從後端或 props 取得)
const getMaterialTitle = (m) => m.title || "學習教材";
const getMaterialType = (m) => m.type || "file";
const getAssignmentTitle = (a) => "指定作業";
const getExamTitle = (e) => "單元小測驗";

onMounted(() => {
  initData();
});
</script>
