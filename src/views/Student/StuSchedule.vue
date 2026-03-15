<template>
  <div class="StudentSchedule p-3">
    <div v-if="preTestData" class="mb-4">
      <div
        class="p-3 border rounded bg-white shadow-sm d-flex justify-content-between align-items-center"
        :class="
          testRecords.pre
            ? 'border-light bg-light-subtle'
            : 'border-primary shadow-hover'
        "
        @click="handleExperimentTestClick('pre')"
        style="cursor: pointer; border-left: 6px solid #4a70a9 !important"
      >
        <div>
          <h6
            class="fw-bold mb-1"
            :class="testRecords.pre ? 'text-muted' : 'text-navy'"
          >
            <i class="bi bi-pencil-square me-2"></i>【階段一】實驗前測問卷
          </h6>
          <p class="small text-muted mb-0">{{ preTestData.title }}</p>
          <span v-if="testRecords.pre" class="badge bg-success mt-2">
            <i class="bi bi-check-circle-fill me-1"></i>已完成 (點擊檢視答案)
          </span>
          <span v-else class="badge bg-warning text-dark mt-2">
            <i class="bi bi-exclamation-triangle-fill me-1"></i>尚未填寫
          </span>
        </div>
        <i class="bi bi-chevron-right text-primary"></i>
      </div>
    </div>

    <h6 class="text-secondary small fw-bold mb-3 ms-1">
      <i class="bi bi-collection-play me-2"></i>學習單元清單
    </h6>

    <div v-for="(unit, index) in schedule" :key="unit.id">
      <div v-if="unit.visible === true" class="mb-3">
        <div
          class="p-3 border rounded bg-white shadow-sm d-flex justify-content-between align-items-center"
          @click="handleUnitClick(unit)"
          style="cursor: pointer"
        >
          <div>
            <span class="fw-bold">單元 {{ index + 1 }}: {{ unit.title }}</span>

            <span
              v-if="unitTraces[unit.id]?.isFinished"
              class="ms-2 badge bg-primary text-white border-0 px-2"
            >
              <i class="bi bi-patch-check-fill me-1"></i>單元已完成
            </span>

            <template v-else>
              <span
                v-if="unitPlans[unit.id]"
                class="ms-2 badge bg-success-subtle text-success border border-success-subtle"
              >
                <i class="bi bi-calendar-check me-1"></i>已規劃
              </span>
              <span
                v-else-if="activeFeatures.planning"
                class="ms-2 badge bg-warning-subtle text-dark border border-warning-subtle"
              >
                <i class="bi bi-pencil me-1"></i>需先完成規劃
              </span>
            </template>
          </div>

          <i class="bi bi-arrow-right-circle text-primary opacity-75"></i>
        </div>
      </div>
    </div>

    <div v-if="postTestData" class="mt-5">
      <div
        class="p-3 border rounded shadow-sm d-flex justify-content-between align-items-center"
        :class="[
          testRecords.post
            ? 'bg-light-subtle border-light'
            : canTakePostTest
              ? 'bg-white border-primary shadow-hover'
              : 'bg-light opacity-50',
        ]"
        @click="handleExperimentTestClick('post')"
        style="cursor: pointer; border-left: 6px solid #6c757d !important"
        :style="
          canTakePostTest || testRecords.post
            ? 'border-left-color: #4a70a9 !important;'
            : ''
        "
      >
        <div>
          <h6
            class="fw-bold mb-1"
            :class="
              canTakePostTest || testRecords.post ? 'text-navy' : 'text-muted'
            "
          >
            <i class="bi bi-clipboard-check me-2"></i>【階段三】實驗後測問卷
          </h6>
          <p class="small text-muted mb-0">{{ postTestData.title }}</p>

          <span v-if="testRecords.post" class="badge bg-secondary mt-2">
            <i class="bi bi-check-circle-fill me-1"></i>後測已完成 (點擊檢視)
          </span>
          <span
            v-else-if="!canTakePostTest"
            class="badge bg-light text-muted border mt-2"
          >
            <i class="bi bi-lock-fill me-1"></i>完成所有單元後解鎖
          </span>
          <span v-else class="badge bg-success mt-2 pulse-animation">
            <i class="bi bi-unlock-fill me-1"></i>已解鎖，請開始填寫
          </span>
        </div>
        <i
          v-if="canTakePostTest || testRecords.post"
          class="bi bi-chevron-right text-primary"
        ></i>
        <i v-else class="bi bi-lock text-muted"></i>
      </div>
    </div>

    <Teleport to="body">
      <div
        v-if="showActiveModal"
        class="ScheduleModalOverlay"
        @click.self="showActiveModal = false"
      >
        <StuSrlPlan
          :courseId="courseId"
          :taskId="activeTaskId"
          :unitData="schedule.find((u) => u.id === activeTaskId)"
          :initialAnswers="activeTaskInitialData"
          @submit-success="onTaskSubmitted"
          @start-unit="handleRedirectToUnit"
          @close="showActiveModal = false"
        />
      </div>

      <div
        v-if="showResultModal"
        class="ScheduleModalOverlay"
        @click.self="showResultModal = false"
      >
        <div
          class="test-result-modal shadow-lg animate__animated animate__zoomIn"
        >
          <div class="modal-header-custom border-bottom pb-3 mb-3">
            <h5 class="fw-bold text-navy mb-0">
              <i class="bi bi-file-earmark-check me-2"></i>問卷回答紀錄
            </h5>
            <button class="btn-close" @click="showResultModal = false"></button>
          </div>

          <div
            class="modal-body-custom custom-scrollbar"
            style="max-height: 65vh; overflow-y: auto"
          >
            <div v-if="loadingResult" class="text-center py-5">
              <div class="spinner-border text-primary"></div>
            </div>
            <div v-else>
              <div
                v-for="(q, idx) in resultData.questions"
                :key="idx"
                class="mb-4 p-3 bg-light rounded-3"
              >
                <p class="fw-bold mb-2">{{ idx + 1 }}. {{ q.text }}</p>
                <div class="text-primary fw-bold">
                  您的回答：{{ resultData.answers[idx] || "未填寫" }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import { useRouter } from "vue-router";
import { rtdb, auth } from "../../firebase/config";
import { ref as dbRef, onValue } from "firebase/database";
import Swal from "sweetalert2";
import StuSrlPlan from "./Modal/StuSRLPlan.vue";
import "./StuSchedule.css";
import { recordStudentAction as recordAction } from "../../utils/logger.js";

const props = defineProps({ courseId: String, userId: String });
const router = useRouter();

const schedule = ref([]);
const unitPlans = ref({});
const unitTraces = ref({});
const activeFeatures = ref({ planning: false });

const preTestData = ref(null);
const postTestData = ref(null);
const testRecords = ref({ pre: false, post: false });

// 🌟 需新增的狀態
const showResultModal = ref(false); // 控制檢視彈窗顯示
const loadingResult = ref(false); // 讀取答案中的狀態
const resultData = ref({ questions: [], answers: [] }); // 存放檢視用的資料

const showActiveModal = ref(false);
const activeTaskId = ref("");
const activeTaskInitialData = ref({});

// 🌟 核心修正：檢查是否完成「資料庫中所有已創建」的課程單元
const canTakePostTest = computed(() => {
  // 1. 取得資料庫中所有的單元清單 (不論隱藏與否)
  const allUnits = schedule.value;

  // 2. 如果單元清單還是空的，代表資料尚未載入或真的沒單元，不解鎖
  if (allUnits.length === 0) return false;

  // 3. 檢查「每一個」在 schedule 裡的單元是否都在 unitTraces 標記為 isFinished
  // 這樣就算單元被隱藏 (visible: false)，學生若沒進去完成，後測就不會開
  return allUnits.every(
    (unit) => unitTraces.value[unit.id]?.isFinished === true,
  );
});

/**
 * 🌟 實驗問卷點擊與彈窗邏輯 (已更新為彈窗檢視模式)
 */
const handleExperimentTestClick = async (type) => {
  const isFinished = testRecords.value[type];
  const testData = type === "pre" ? preTestData.value : postTestData.value;

  if (!testData) return;

  // 情況 A：已經填寫過了 -> 彈窗顯示紀錄 (不跳轉頁面)
  if (isFinished) {
    recordAction(
      props.courseId,
      `觸發已完成的${type === "pre" ? "前" : "後"}測檢視`,
      {
        testId: testData.id,
      },
    );

    // 開啟彈窗並進入載入狀態
    showResultModal.value = true;
    loadingResult.value = true;

    const uid = auth.currentUser?.uid || props.userId;

    try {
      // 🌟 根據 JSON 結構讀取紀錄：courses/{courseId}/experiment/submissions/{testId}/{uid}
      const { get } = await import("firebase/database"); // 動態匯入 get
      const recordPath = dbRef(
        rtdb,
        `courses/${props.courseId}/experiment/submissions/${testData.id}/${uid}`,
      );
      const snap = await get(recordPath);

      if (snap.exists()) {
        resultData.value = {
          questions: testData.questions,
          answers: snap.val().answers || [],
        };
      } else {
        throw new Error("找不到提交紀錄");
      }
    } catch (e) {
      console.error("讀取紀錄失敗:", e);
      showResultModal.value = false;
      Swal.fire("錯誤", "無法讀取您的回答紀錄，請稍後再試", "error");
    } finally {
      loadingResult.value = false;
    }
    return;
  }

  // 情況 B：後測被鎖定 (保持原樣)
  if (type === "post" && !canTakePostTest.value) {
    recordAction(props.courseId, "嘗試進入後測但被鎖定", {
      reason: "units_incomplete",
    });
    Swal.fire({
      title: "尚未開放後測",
      text: "請先完成所有學習單元的「課程學習」與「自我反思」，系統才會自動解鎖後測問卷喔！",
      icon: "warning",
      confirmButtonColor: "#4a70a9",
    });
    return;
  }

  // 情況 C：尚未填寫 -> 跳轉填寫頁面
  const testName = type === "pre" ? "前測" : "後測";
  const startResult = await Swal.fire({
    title: `開始填寫${testName}`,
    text: `您即將開始填寫「${testData.title}」，提交後將無法修改。準備好了嗎？`,
    icon: "question",
    showCancelButton: true,
    confirmButtonText: "開始回答",
    cancelButtonText: "稍後再說",
    confirmButtonColor: "#4a70a9",
  });

  if (startResult.isConfirmed) {
    recordAction(props.courseId, `進入${type === "pre" ? "前" : "後"}測填寫`, {
      testId: testData.id,
    });
    router.push(`/stutest/take/${props.courseId}/${testData.id}`);
  }
};

const handleUnitClick = (unit) => {
  const unitId = unit.id;
  // 1. 檢查是否已完成總結（結案）
  const isFinished = !!unitTraces.value[unitId]?.isFinished;
  // 2. 檢查是否已有規劃數據
  const hasPlan = !!unitPlans.value[unitId];

  // 情況 A：單元已總結完成 -> 直接進入單元檢視
  if (isFinished) {
    recordAction(props.courseId, "查看已完成單元", {
      unitId,
      unitTitle: unit.title,
    });
    handleRedirectToUnit(unitId);
    return;
  }

  // 情況 B：實驗組功能開啟且「尚未完成規劃」 -> 顯示規劃彈窗
  if (activeFeatures.value.planning && !hasPlan) {
    recordAction(props.courseId, "觸發學習規劃引導", {
      unitId,
      unitTitle: unit.title,
    });
    activeTaskId.value = unitId;
    activeTaskInitialData.value = { unitTitle: unit.title };
    showActiveModal.value = true;
  }
  // 情況 C：已經規劃過 或 非實驗組 -> 直接進入單元
  else {
    recordAction(props.courseId, "點擊進入學習單元", {
      unitId,
      unitTitle: unit.title,
      status: hasPlan ? "already_planned" : "normal_entry",
    });
    handleRedirectToUnit(unitId);
  }
};

// 🌟 補回跳轉至單元頁面的邏輯
const handleRedirectToUnit = (unitId) => {
  const currentUid = auth.currentUser?.uid || props.userId;
  if (!unitId || !props.courseId || !currentUid) {
    console.error("❌ 無法跳轉：缺少必要的參數", {
      courseId: props.courseId,
      unitId,
      userId: currentUid,
    });
    return;
  }

  // 執行跳轉至 StuUnit 頁面
  router.push({
    name: "StuUnit",
    params: {
      courseId: props.courseId,
      id: unitId,
      userId: currentUid,
    },
  });
};

// --- 🌟 更新：onMounted 監聽路徑校準 ---
onMounted(() => {
  if (!props.courseId) return;
  const uid = auth.currentUser?.uid || props.userId;
  const coursePath = `courses/${props.courseId}`;

  // 1. 監聽單元清單與可見性 (對標 JSON: courses/ID/units)
  onValue(dbRef(rtdb, `${coursePath}/units`), (snapshot) => {
    const data = snapshot.val() || {};
    // 🌟 修正：確保 visible 欄位被正確解析 (JSON 中 visible: true)
    schedule.value = Object.entries(data).map(([id, val]) => ({
      id,
      ...val,
      visible: val.visible !== false, // 只要不是明確寫 false，就預設為 true
    }));

    // 2. 同步監聽單元執行軌跡 (對標 JSON: units/ID/student_traces/UID)
    const myTraces = {};
    Object.entries(data).forEach(([uId, uVal]) => {
      if (uVal.student_traces?.[uid]) {
        myTraces[uId] = uVal.student_traces[uid];
      }
    });
    unitTraces.value = myTraces;
  });

  // 3. 監聽前/後測問卷定義 (對標 JSON: experiment/test/pretest)
  onValue(dbRef(rtdb, `${coursePath}/experiment/test/pretest`), (s) => {
    const data = s.val();
    if (data) {
      preTestData.value = Object.entries(data).map(([id, v]) => ({
        id,
        ...v,
      }))[0];
      // 🌟 關鍵修正：一拿到前測 ID，立刻去抓提交紀錄
      checkTestSubmission(preTestData.value.id, "pre");
    }
  });

  onValue(dbRef(rtdb, `${coursePath}/experiment/test/posttest`), (s) => {
    const data = s.val();
    if (data) {
      postTestData.value = Object.entries(data).map(([id, v]) => ({
        id,
        ...v,
      }))[0];
      checkTestSubmission(postTestData.value.id, "post");
    }
  });

  if (uid) {
    // 4. 監聽規劃紀錄 (對標 JSON: profiles/UID/srl/planning)
    onValue(
      dbRef(rtdb, `${coursePath}/profiles/${uid}/srl/planning`),
      (snap) => {
        unitPlans.value = snap.val() || {};
      },
    );

    // 5. 監聽實驗組功能開關 (對標 JSON: experiment/groups/ID/features)
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
});

// 🌟 新增輔助函數：解決前測顯示「未填寫」的時序問題
const checkTestSubmission = (testId, type) => {
  const uid = auth.currentUser?.uid || props.userId;
  const path = `courses/${props.courseId}/experiment/submissions/${testId}/${uid}`;
  onValue(dbRef(rtdb, path), (snap) => {
    testRecords.value[type] = snap.exists();
  });
};
</script>
