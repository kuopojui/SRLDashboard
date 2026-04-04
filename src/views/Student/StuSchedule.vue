<template>
  <div class="StudentSchedule p-3">
    <div v-if="preTests.length > 0" class="mb-4 pretest-container">
      <div class="pretest-header-wrapper mb-3 ms-1">
        <h6 class="text-secondary small fw-bold pretest-title">
          <i class="bi bi-pencil-square me-2"></i>【階段一】實驗前測問卷
        </h6>

        <div v-if="preTests.length > 1" class="pretest-tabs-scroll-area">
          <div class="btn-group btn-group-sm custom-pill-group shadow-sm">
            <button
              v-for="(p, idx) in preTests"
              :key="idx"
              @click="currentPreIdx = idx"
              class="btn tab-btn"
              :class="currentPreIdx === idx ? 'btn-navy' : 'btn-outline-navy'"
            >
              問卷 {{ idx + 1 }}
            </button>
          </div>
        </div>
      </div>

      <Transition name="fade" mode="out-in">
        <div
          :key="currentPreIdx"
          class="p-3 border rounded-4 bg-white shadow-sm d-flex justify-content-between align-items-center shadow-hover-up"
          :class="[
            testRecords[preTests[currentPreIdx].id]
              ? 'border-light bg-light-subtle opacity-90'
              : 'border-primary border-2',
          ]"
          @click="handleExperimentTestClick(preTests[currentPreIdx], 'pre')"
          style="
            cursor: pointer;
            border-left: 8px solid #4a70a9 !important;
            transition: all 0.3s ease;
          "
        >
          <div class="flex-grow-1">
            <div class="d-flex align-items-center gap-2 mb-1">
              <h6
                class="fw-800 mb-0"
                :class="
                  testRecords[preTests[currentPreIdx].id]
                    ? 'text-muted'
                    : 'text-navy'
                "
              >
                {{ preTests[currentPreIdx].title }}
              </h6>
              <i
                v-if="testRecords[preTests[currentPreIdx].id]"
                class="bi bi-patch-check-fill text-success"
              ></i>
            </div>
            <p class="small text-muted mb-0">
              {{
                testRecords[preTests[currentPreIdx].id]
                  ? "點擊檢視您的回答紀錄"
                  : "完成此問卷後即可進入學習單元"
              }}
            </p>
            <div class="mt-2">
              <span
                v-if="testRecords[preTests[currentPreIdx].id]"
                class="badge rounded-pill bg-success-subtle text-success px-3 border border-success-subtle"
              >
                已完成
              </span>
              <span
                v-else
                class="badge rounded-pill bg-warning-subtle text-dark px-3 border border-warning-subtle pulse-animation"
              >
                尚未填寫
              </span>
            </div>
          </div>
          <div class="ms-3">
            <div
              class="action-icon-circle"
              :class="
                testRecords[preTests[currentPreIdx].id]
                  ? 'bg-light'
                  : 'bg-primary-subtle'
              "
            >
              <i
                class="bi fs-5"
                :class="
                  testRecords[preTests[currentPreIdx].id]
                    ? 'bi-eye-fill text-secondary'
                    : 'bi-chevron-right text-primary'
                "
              ></i>
            </div>
          </div>
        </div>
      </Transition>
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
        @click.self="closeResultModal"
      >
        <div
          class="test-result-modal shadow-lg animate__animated animate__zoomIn"
        >
          <div class="modal-header-custom border-bottom pb-3 mb-3">
            <div class="d-flex justify-content-between align-items-start w-100">
              <div>
                <h5 class="fw-bold text-navy mb-0">
                  <i class="bi bi-file-earmark-check me-2"></i>問卷回答紀錄
                </h5>

                <div
                  v-if="preTests.length > 1"
                  class="mt-3 btn-group btn-group-sm shadow-xs"
                >
                  <button
                    v-for="(p, idx) in preTests"
                    :key="p.id"
                    @click="switchResultInModal(p, idx)"
                    class="btn px-3"
                    :class="
                      currentPreIdx === idx ? 'btn-navy' : 'btn-outline-navy'
                    "
                  >
                    前測 {{ idx + 1 }}
                  </button>
                </div>
              </div>
              <button class="btn-close-minimal" @click="closeResultModal">
                <i class="bi bi-x-lg"></i>
              </button>
            </div>
          </div>

          <div
            class="modal-body-custom custom-scrollbar"
            style="max-height: 60vh; overflow-y: auto"
          >
            <div v-if="loadingResult" class="text-center py-5">
              <div class="spinner-border text-primary mb-2"></div>
              <p class="text-muted small italic">正在讀取回答紀錄...</p>
            </div>

            <div v-else>
              <div
                class="alert alert-secondary py-2 px-3 mb-4 rounded-3 border-0 d-flex align-items-center"
              >
                <i class="bi bi-info-circle-fill me-2"></i>
                <span class="small fw-bold"
                  >正在檢視：{{ resultData.title || "問卷內容" }}</span
                >
              </div>

              <div
                v-for="(q, idx) in resultData.questions"
                :key="idx"
                class="mb-4 p-3 bg-light rounded-4 border-0 shadow-xs"
              >
                <p class="fw-bold mb-2 text-dark" style="font-size: 0.95rem">
                  {{ idx + 1 }}. {{ q.text }}
                </p>
                <div
                  class="answer-box p-2 px-3 rounded-3 bg-white border-start border-4 border-primary"
                >
                  <span class="text-muted xx-small d-block mb-1">您的回答</span>
                  <div class="text-navy fw-800">
                    {{
                      resultData.answers && resultData.answers[idx]
                        ? resultData.answers[idx]
                        : "未填寫"
                    }}
                  </div>
                </div>
              </div>

              <div
                v-if="
                  !resultData.questions || resultData.questions.length === 0
                "
                class="text-center py-4"
              >
                <p class="text-muted italic">暫無題目資料</p>
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

// --- 🌟 更新後的狀態定義 ---

// 存放所有前測問卷的陣列 (支援 1~N 份)
const preTests = ref([]);

// 存放後測問卷 (通常實驗後測只有一份，維持單一物件或陣列皆可)
const postTestData = ref(null);

// 紀錄所有問卷的完成狀態，格式為 { [testId]: true/false }
const testRecords = ref({});

// 🌟 新增：目前切換到第幾份前測 (用於 UI 切換分頁)
const currentPreIdx = ref(0);

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
 * 🌟 核心私有函式：從 Firebase 抓取特定的問卷答案紀錄
 */
const fetchSubmissionRecord = async (testData) => {
  loadingResult.value = true;
  const uid = auth.currentUser?.uid || props.userId;

  try {
    const { get } = await import("firebase/database");
    const recordPath = dbRef(
      rtdb,
      `courses/${props.courseId}/experiment/submissions/${testData.id}/${uid}`,
    );
    const snap = await get(recordPath);

    if (snap.exists()) {
      resultData.value = {
        title: testData.title,
        questions: testData.questions,
        answers: snap.val().answers || [],
      };
      return true;
    } else {
      throw new Error("找不到提交紀錄");
    }
  } catch (e) {
    console.error("讀取紀錄失敗:", e);
    Swal.fire("錯誤", "無法讀取您的回答紀錄", "error");
    return false;
  } finally {
    loadingResult.value = false;
  }
};

/**
 * 🌟 實驗問卷點擊邏輯 (主畫面入口)
 */
const handleExperimentTestClick = async (testData, category = "pre") => {
  if (!testData) return;

  const isFinished = !!testRecords.value[testData.id];
  const testName = category === "pre" ? "前測" : "後測";

  // 情況 A：已經完成 -> 顯示檢視彈窗
  if (isFinished) {
    recordAction(props.courseId, `查看已完成${testName}`, {
      testId: testData.id,
      testTitle: testData.title,
      currentPreIdx: currentPreIdx.value,
    });

    showResultModal.value = true;
    await fetchSubmissionRecord(testData);
    return;
  }

  // 情況 B：後測鎖定檢查
  if (category === "post" && !canTakePostTest.value) {
    recordAction(props.courseId, "嘗試點擊尚未解鎖的後測", {
      testId: testData.id,
      reason: "units_not_completed",
    });

    Swal.fire({
      title: "尚未開放後測",
      text: "請先完成所有單元的學習與反思，系統才會自動解鎖喔！",
      icon: "warning",
      confirmButtonColor: "#4a70a9",
    });
    return;
  }

  // 情況 C：尚未填寫 -> 觸發詢問彈窗
  recordAction(props.courseId, `點擊未完成${testName}卡片`, {
    testId: testData.id,
    testTitle: testData.title,
  });

  const startResult = await Swal.fire({
    title: `開始填寫`,
    text: `即將填寫「${testData.title}」，提交後無法修改。準備好了嗎？`,
    icon: "question",
    showCancelButton: true,
    confirmButtonText: "開始回答",
    cancelButtonText: "先不要",
    confirmButtonColor: "#4a70a9",
  });

  if (startResult.isConfirmed) {
    recordAction(props.courseId, `確認進入${testName}填寫頁`, {
      testId: testData.id,
    });
    router.push(`/stutest/take/${props.courseId}/${testData.id}`);
  } else {
    recordAction(props.courseId, `取消進入${testName}填寫`, {
      testId: testData.id,
    });
  }
};

/**
 * 🌟 彈窗內切換問卷邏輯
 */
const switchResultInModal = async (testData, index) => {
  const oldIdx = currentPreIdx.value;
  currentPreIdx.value = index;

  // 紀錄切換行為（研究學生是否會跨問卷對照答案）
  recordAction(props.courseId, "彈窗內切換檢視問卷", {
    fromIdx: oldIdx,
    toIdx: index,
    testId: testData.id,
    testTitle: testData.title,
  });

  if (!testRecords.value[testData.id]) {
    recordAction(props.courseId, "彈窗內切換至未填寫問卷", {
      testId: testData.id,
    });

    resultData.value = {
      title: testData.title,
      questions: testData.questions,
      answers: [],
    };

    Swal.fire({
      title: "尚未填寫",
      text: "您還沒有完成這份問卷，無法檢視答案內容。",
      icon: "info",
      toast: true,
      position: "top-end",
      timer: 2000,
      showConfirmButton: false,
    });
    return;
  }

  await fetchSubmissionRecord(testData);
};

/**
 * 🌟 單元卡片點擊邏輯
 */
const handleUnitClick = (unit) => {
  const unitId = unit.id;
  const isFinished = !!unitTraces.value[unitId]?.isFinished;
  const hasPlan = !!unitPlans.value[unitId];

  // 情況 A：單元已總結完成
  if (isFinished) {
    recordAction(props.courseId, "點擊已結案單元", {
      unitId,
      unitTitle: unit.title,
    });
    handleRedirectToUnit(unitId);
    return;
  }

  // 情況 B：需先規劃 (實驗組且尚未規劃)
  if (activeFeatures.value.planning && !hasPlan) {
    recordAction(props.courseId, "觸發單元規劃彈窗", {
      unitId,
      unitTitle: unit.title,
      entry_point: "schedule_card",
    });

    activeTaskId.value = unitId;
    activeTaskInitialData.value = { unitTitle: unit.title };
    showActiveModal.value = true;
  }
  // 情況 C：直接進入或已規劃過
  else {
    recordAction(props.courseId, "點擊進入學習頁面", {
      unitId,
      unitTitle: unit.title,
      has_previous_plan: hasPlan,
    });
    handleRedirectToUnit(unitId);
  }
};

/**
 * 🌟 額外建議補強：關閉彈窗 Log
 */
const closeResultModal = () => {
  recordAction(props.courseId, "關閉問卷紀錄彈窗", {
    lastViewedIdx: currentPreIdx.value,
  });
  showResultModal.value = false;
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

// --- 🌟 更新：onMounted 監聽路徑校準 (支援多份前測版本) ---
onMounted(() => {
  if (!props.courseId) return;
  const uid = auth.currentUser?.uid || props.userId;
  const coursePath = `courses/${props.courseId}`;

  // 1. 監聽單元清單與可見性 (保持不變)
  onValue(dbRef(rtdb, `${coursePath}/units`), (snapshot) => {
    const data = snapshot.val() || {};
    schedule.value = Object.entries(data).map(([id, val]) => ({
      id,
      ...val,
      visible: val.visible !== false,
    }));

    // 2. 同步監聽單元執行軌跡
    const myTraces = {};
    Object.entries(data).forEach(([uId, uVal]) => {
      if (uVal.student_traces?.[uid]) {
        myTraces[uId] = uVal.student_traces[uid];
      }
    });
    unitTraces.value = myTraces;
  });

  // 3. 🌟 關鍵更新：監聽前測問卷定義 (改為支援多份陣列)
  onValue(dbRef(rtdb, `${coursePath}/experiment/test/pretest`), (s) => {
    const data = s.val();
    if (data) {
      // 將所有前測轉為陣列，不再鎖死 [0]
      preTests.value = Object.entries(data).map(([id, v]) => ({
        id,
        ...v,
      }));

      // 🌟 為每一份前測單獨建立提交紀錄監聽 (使用 testId 作為 Key)
      preTests.value.forEach((test) => {
        checkTestSubmission(test.id);
      });
    }
  });

  // 監聽後測 (通常只有一份，但同樣改為支援 ID 監聽)
  onValue(dbRef(rtdb, `${coursePath}/experiment/test/posttest`), (s) => {
    const data = s.val();
    if (data) {
      const list = Object.entries(data).map(([id, v]) => ({
        id,
        ...v,
      }));
      postTestData.value = list[0];
      if (postTestData.value) {
        checkTestSubmission(postTestData.value.id);
      }
    }
  });

  if (uid) {
    // 4. 監聽規劃紀錄 (保持不變)
    onValue(
      dbRef(rtdb, `${coursePath}/profiles/${uid}/srl/planning`),
      (snap) => {
        unitPlans.value = snap.val() || {};
      },
    );

    // 5. 監聽實驗組功能開關 (保持不變)
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

/**
 * 🌟 修正後的檢查函數：支援多份問卷獨立狀態
 * @param {string} testId - 問卷的唯一 ID
 */
const checkTestSubmission = (testId) => {
  if (!testId) return;

  const uid = auth.currentUser?.uid || props.userId;
  // 路徑校準：依據 JSON 結構，學生提交紀錄存放在 submissions/{testId}/{uid}
  const path = `courses/${props.courseId}/experiment/submissions/${testId}/${uid}`;

  onValue(dbRef(rtdb, path), (snap) => {
    // 🌟 核心修正：使用 testId 作為 Key 存入物件
    // 這樣 testRecords 就會變成 { "pre_001": true, "pre_002": false }
    testRecords.value[testId] = snap.exists();
  });
};
</script>
