<template>
  <div class="StudentSchedule p-3">
    <div v-for="(unit, index) in schedule" :key="unit.id" class="mb-3">
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
            <i class="bi bi-patch-check-fill me-1"></i>已完成課程
          </span>

          <template v-else>
            <span
              v-if="unitPlans[unit.id]"
              class="ms-2 badge bg-success-subtle text-success border border-success-subtle"
            >
              已預計 {{ unitPlans[unit.id].targetTime }} 分鐘
            </span>
            <span
              v-else-if="activeFeatures.planning"
              class="ms-2 badge bg-warning-subtle text-dark border border-warning-subtle"
            >
              <i class="bi bi-pencil-square me-1"></i>需先完成規劃
            </span>
          </template>
        </div>

        <i class="bi bi-arrow-right-circle text-primary opacity-75"></i>
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
    </Teleport>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { rtdb, auth } from "../../firebase/config";
import { ref as dbRef, onValue } from "firebase/database";
import StuSrlPlan from "./Modal/StuSRLPlan.vue";
import "./StuSchedule.css";

const props = defineProps({ courseId: String, userId: String });
const router = useRouter();

const schedule = ref([]);
const unitPlans = ref({});
const unitTraces = ref({}); // 🌟 新增：儲存學習軌跡完成狀態
const activeFeatures = ref({ planning: false });

const showActiveModal = ref(false);
const activeTaskId = ref("");
const activeTaskInitialData = ref({});

// 🌟 核心點擊邏輯：如果已完成，也可以直接進入
const handleUnitClick = (unit) => {
  const unitId = unit.id;
  const isFinished = !!unitTraces.value[unitId]?.isFinished;
  const hasPlan = !!(unitPlans.value && unitPlans.value[unitId]?.targetTime);

  // 1. 如果已完成：直接跳轉查看
  if (isFinished) {
    handleRedirectToUnit(unitId);
    return;
  }

  // 2. 如果需規劃且尚未填寫：彈出 Modal
  if (activeFeatures.value.planning && !hasPlan) {
    activeTaskId.value = unitId;
    activeTaskInitialData.value = { unitTitle: unit.title };
    showActiveModal.value = true;
  }
  // 3. 其他情況：直接進入
  else {
    handleRedirectToUnit(unitId);
  }
};

const handleRedirectToUnit = async (unitId) => {
  let currentUid = props.userId || auth.currentUser?.uid;
  if (!currentUid) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    currentUid = auth.currentUser?.uid;
  }

  if (!unitId || !props.courseId || !currentUid) return;

  try {
    await router.push({
      name: "StuUnit",
      params: { courseId: props.courseId, id: unitId, userId: currentUid },
    });
    if (showActiveModal.value) showActiveModal.value = false;
  } catch (err) {
    console.error("導航出錯:", err);
  }
};

const onTaskSubmitted = () => {
  showActiveModal.value = false;
};

onMounted(() => {
  if (!props.courseId) return;
  const uid = auth.currentUser?.uid || props.userId;
  const coursePath = `courses/${props.courseId}`;

  // 1. 監聽單元清單
  onValue(dbRef(rtdb, `${coursePath}/units`), (snapshot) => {
    const data = snapshot.val() || {};
    schedule.value = Object.entries(data).map(([id, val]) => ({ id, ...val }));
  });

  if (uid) {
    // 2. 監聽計畫紀錄 (Stage 1)
    onValue(dbRef(rtdb, `${coursePath}/profiles/${uid}/srl/planning`), (s) => {
      unitPlans.value = s.val() || {};
    });

    // 🌟 3. 核心新增：監聽該學生的學習軌跡 (Stage 4 完成狀態)
    // 遍歷 student_traces 找出屬於該 uid 的紀錄
    onValue(dbRef(rtdb, `student_traces`), (snapshot) => {
      const allTraces = snapshot.val() || {};
      const myTraces = {};
      Object.entries(allTraces).forEach(([key, val]) => {
        // 假設 Key 格式為 "${uid}_${unitId}"
        if (key.startsWith(uid)) {
          const unitId = key.split("_").pop(); // 取出最後一部分當 ID
          myTraces[unitId] = val;
        }
      });
      unitTraces.value = myTraces;
    });

    // 4. 監聽實驗組開關
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
</script>
