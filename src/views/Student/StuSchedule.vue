<template>
  <div class="StuSchedule animate__animated animate__fadeIn">
    <transition name="toast">
      <div v-if="submitSuccessMessage" class="success-toast">
        <i class="bi bi-check-circle-fill me-2"></i>{{ submitSuccessMessage }}
      </div>
    </transition>

    <div class="container py-4">
      <div class="schedule-timeline">
        <div
          v-if="pretestSettings.enabled"
          class="special-section-wrapper pretest-section"
        >
          <div class="special-badge">START</div>
          <div class="unit-card shadow-sm border-pretest">
            <div class="unit-card-header bg-pretest-subtle">
              <h5 class="fw-bold mb-0 text-pretest">
                <i class="bi bi-flag-fill me-2"></i>課程前測問卷 / 測驗
              </h5>
            </div>
            <div class="unit-card-body">
              <div v-if="pretestExams.length > 0" class="task-grid">
                <div
                  v-for="e in pretestExams"
                  :key="e.id"
                  class="task-card exam-card pretest-accent"
                  @click="openTaskModal('test', e.id)"
                >
                  <span class="task-title text-truncate">{{ e.title }}</span>
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
              <div v-else class="empty-hint">目前無前測內容</div>
            </div>
          </div>
        </div>

        <div v-if="schedule.length > 0">
          <div
            v-for="(unit, index) in schedule"
            :key="unit.id"
            class="unit-card-wrapper"
            :style="{ animationDelay: (index + 1) * 0.1 + 's' }"
          >
            <div class="unit-badge">UNIT {{ index + 1 }}</div>
            <div class="unit-card shadow-sm">
              <div class="unit-card-header">
                <h5 class="fw-bold mb-1 text-navy">{{ unit.title }}</h5>
                <div class="unit-meta">
                  <i class="bi bi-calendar-check me-1"></i>截止：{{
                    unit.deadline
                      ? new Date(unit.deadline).toLocaleDateString()
                      : "尚未設定"
                  }}
                </div>
              </div>

              <div class="unit-card-body">
                <div class="section-group">
                  <label class="section-label"
                    ><i class="bi bi-collection-play-fill me-2"></i
                    >單元教材</label
                  >
                  <div v-if="unit.materials?.length" class="material-list">
                    <div
                      v-for="m in unit.materials"
                      :key="m"
                      class="material-row"
                    >
                      <div
                        class="d-flex align-items-center justify-content-between w-100"
                      >
                        <span class="item-name text-truncate">
                          <i
                            class="bi"
                            :class="
                              getMaterialType(m) === 'video'
                                ? 'bi-play-circle-fill text-danger'
                                : 'bi-file-earmark-text-fill text-primary'
                            "
                          ></i>
                          {{ getMaterialTitle(m) }}
                        </span>
                        <button
                          v-if="getMaterialType(m) !== 'video'"
                          class="btn-download-sm"
                          @click="handleMaterialDownload(m)"
                        >
                          下載/查看 <i class="bi bi-download ms-1"></i>
                        </button>
                        <span
                          v-else
                          class="badge rounded-pill bg-danger-subtle text-danger px-3"
                        >
                          <i class="bi bi-eye-fill me-1"></i>線上觀看
                        </span>
                      </div>
                      <div
                        v-if="getMaterialType(m) === 'video'"
                        class="video-preview-box mt-3"
                      >
                        <iframe
                          v-if="isYoutube(getMaterialUrl(m))"
                          :src="formatYoutubeUrl(getMaterialUrl(m))"
                          frameborder="0"
                          allowfullscreen
                        ></iframe>
                        <video v-else controls controlsList="nodownload">
                          <source :src="getMaterialUrl(m)" type="video/mp4" />
                        </video>
                      </div>
                    </div>
                  </div>
                  <div v-else class="empty-hint">本單元尚無教材內容</div>
                </div>

                <div class="row">
                  <div class="col-md-6 section-group">
                    <label class="section-label"
                      ><i class="bi bi-pencil-square me-2"></i>指定功課</label
                    >
                    <div
                      v-if="unit.assignments?.length"
                      class="task-grid-single"
                    >
                      <div
                        v-for="a in unit.assignments"
                        :key="a"
                        class="task-card assignment-card"
                        @click="openTaskModal('hw', a)"
                      >
                        <span class="task-title text-truncate">{{
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
                          {{
                            isSubmitted("assignments", a) ? "已繳交" : "未繳"
                          }}
                        </span>
                      </div>
                    </div>
                    <div v-else class="empty-hint">無作業</div>
                  </div>

                  <div class="col-md-6 section-group">
                    <label class="section-label"
                      ><i class="bi bi-lightning-charge-fill me-2"></i
                      >單元測驗</label
                    >
                    <div v-if="unit.exams?.length" class="task-grid-single">
                      <div
                        v-for="e in unit.exams"
                        :key="e"
                        class="task-card exam-card"
                        @click="openTaskModal('exam', e)"
                      >
                        <span class="task-title text-truncate">{{
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
                    <div v-else class="empty-hint">無測驗</div>
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
          <div class="unit-card shadow-sm border-posttest">
            <div class="unit-card-header bg-posttest-subtle">
              <h5 class="fw-bold mb-0 text-posttest">
                <i class="bi bi-trophy-fill me-2"></i>課程後測 / 學習總結
              </h5>
            </div>
            <div class="unit-card-body">
              <div v-if="posttestExams.length > 0" class="task-grid">
                <div
                  v-for="e in posttestExams"
                  :key="e.id"
                  class="task-card exam-card posttest-accent"
                  @click="openTaskModal('test', e.id)"
                >
                  <span class="task-title text-truncate">{{ e.title }}</span>
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
              <div v-else class="empty-hint">目前無後測內容</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <transition name="modal-fade">
      <div
        v-if="showActiveModal"
        class="ScheduleModalOverlay"
        @click.self="closeTaskModal"
      >
        <div class="modal-card-custom task-modal shadow-lg">
          <div class="modal-header-custom">
            <h4 class="fw-bold mb-0 text-navy">{{ activeTaskTitle }}</h4>
            <button class="close-btn" @click="closeTaskModal">✕</button>
          </div>
          <div class="modal-body-custom">
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
  </div>
</template>

<script setup>
import { ref, onMounted, computed, markRaw } from "vue";
import { useRoute } from "vue-router";
import { rtdb as db } from "../../firebase/config";
import { ref as dbRef, onValue, update, get } from "firebase/database";
import { getAuth } from "firebase/auth";
import "./StuSchedule.css";

// 導入功能組件
import StuHW from "./Modal/StuHW.vue";
import StuExam from "./Modal/StuExam.vue";
import StuTest from "./Modal/StuTest.vue";
import StuDiscussion from "./Modal/StuDiscussion.vue";

const auth = getAuth();
const route = useRoute();
const courseId = route.params.id;

// 狀態
const schedule = ref([]);
const materials = ref([]);
const assignments = ref([]);
const allExamsData = ref({});
const submissions = ref({ assignments: {}, exams: {} });
const pretestSettings = ref({ enabled: false, examIds: [] });
const posttestSettings = ref({ enabled: false, examIds: [] });
const submitSuccessMessage = ref("");
const userProfile = ref(null);

// Modal 管理
const showActiveModal = ref(false);
const activeTaskId = ref(null);
const activeTaskType = ref(null);
const activeTaskInitialData = ref(null);

const componentMap = {
  hw: markRaw(StuHW),
  exam: markRaw(StuExam),
  test: markRaw(StuTest),
};

const currentModalComponent = computed(
  () => componentMap[activeTaskType.value],
);
const activeTaskTitle = computed(() => {
  if (activeTaskType.value === "hw") return "作業繳交";
  if (activeTaskType.value === "exam") return "單元測驗";
  if (activeTaskType.value === "test") return "問卷/測驗";
  return "載入中...";
});

// 開啟任務
const openTaskModal = (type, id) => {
  const uid = auth.currentUser?.uid;
  if ((type === "exam" || type === "test") && allExamsData.value[id]) {
    const savedRecord = allExamsData.value[id]?.answers?.[uid];
    activeTaskInitialData.value = savedRecord ? savedRecord.answers : null;
  }
  activeTaskType.value = type;
  activeTaskId.value = id;
  showActiveModal.value = true;
  recordStuAction(courseId, uid, `進入任務: ${id}`);
};

const closeTaskModal = () => {
  showActiveModal.value = false;
  activeTaskId.value = null;
  activeTaskType.value = null;
  activeTaskInitialData.value = null;
};

const onTaskSubmitted = () => {
  if (activeTaskInitialData.value) return;
  submitSuccessMessage.value = "任務已完成";
  setTimeout(() => (submitSuccessMessage.value = ""), 3000);
  closeTaskModal();
};

const handleMaterialDownload = (id) => {
  const url = getMaterialUrl(id);
  if (url) {
    window.open(url, "_blank");
    recordStuAction(courseId, auth.currentUser.uid, `點閱教材: ${id}`);
  }
};

// 資料讀取
const initData = () => {
  const uid = auth.currentUser?.uid;
  if (!uid) return;

  onValue(dbRef(db, `courses/${courseId}`), (snap) => {
    const data = snap.val();
    if (!data) return;
    allExamsData.value = {
      ...(data.exams || {}),
      ...(data.experiment?.exams || {}),
    };
    materials.value = data.materials
      ? Object.entries(data.materials).map(([id, item]) => ({ id, ...item }))
      : [];
    assignments.value = data.assignments
      ? Object.entries(data.assignments).map(([id, item]) => ({ id, ...item }))
      : [];

    // 預置前後測設定
    if (data.experiment?.settings) {
      pretestSettings.value = data.experiment.settings.pretest || {
        enabled: false,
        examIds: [],
      };
      posttestSettings.value = data.experiment.settings.posttest || {
        enabled: false,
        examIds: [],
      };
    }

    // 更新繳交狀態
    const status = { assignments: {}, exams: {} };
    if (data.assignments) {
      Object.keys(data.assignments).forEach((id) => {
        status.assignments[id] = !!data.assignments[id].answers?.[uid];
      });
    }
    Object.keys(allExamsData.value).forEach((id) => {
      status.exams[id] = !!allExamsData.value[id].answers?.[uid];
    });
    submissions.value = status;
  });

  onValue(dbRef(db, `courses/${courseId}/units`), (snap) => {
    const data = snap.val();
    schedule.value = data
      ? Object.entries(data)
          .map(([id, item]) => ({ id, ...item }))
          .sort((a, b) => (a.order || 0) - (b.order || 0))
      : [];
  });
};

// 輔助函數
const isSubmitted = (type, id) => submissions.value[type]?.[id] || false;
const getMaterialUrl = (id) =>
  materials.value.find((m) => m.id === id)?.fileUrl || "";
const getMaterialTitle = (id) =>
  materials.value.find((m) => m.id === id)?.title || "未知教材";
const getAssignmentTitle = (id) =>
  assignments.value.find((a) => a.id === id)?.title || "未知作業";
const getExamTitle = (id) => allExamsData.value[id]?.title || "未知測驗";
const getMaterialType = (id) => {
  const url = getMaterialUrl(id).toLowerCase();
  return url.includes("youtube") ||
    url.includes("youtu.be") ||
    url.endsWith(".mp4")
    ? "video"
    : "file";
};
const isYoutube = (url) =>
  url.includes("youtube.com") || url.includes("youtu.be");
const formatYoutubeUrl = (url) =>
  url
    .replace("watch?v=", "embed/")
    .replace("youtu.be/", "www.youtube.com/embed/");

onMounted(() => initData());
</script>
