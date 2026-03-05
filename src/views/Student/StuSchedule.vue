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
import { useRouter } from "vue-router"; // 🌟 引入路由
import { rtdb, auth } from "../../firebase/config";
import { ref as dbRef, onValue } from "firebase/database";
import StuSrlPlan from "./Modal/StuSRLPlan.vue";
import "./StuSchedule.css";

const props = defineProps({ courseId: String });
const router = useRouter(); // 🌟 宣告路由實例

const schedule = ref([]);
const unitPlans = ref({});
const activeFeatures = ref({ planning: false });

const showActiveModal = ref(false);
const activeTaskId = ref("");
const activeTaskInitialData = ref({});

// 🌟 核心點擊邏輯更新
const handleUnitClick = (unit) => {
  const unitId = unit.id;
  // 檢查是否有計畫紀錄 (確保 unitPlans.value 存在且有該 unitId 的 targetTime)
  const hasPlan = !!(unitPlans.value && unitPlans.value[unitId]?.targetTime);

  // 1. 如果組別【開啟】規劃功能 且 【尚未】填寫計畫：彈出 Modal
  if (activeFeatures.value.planning && !hasPlan) {
    activeTaskId.value = unitId;
    activeTaskInitialData.value = { unitTitle: unit.title };
    showActiveModal.value = true;
  }
  // 2. 如果是控制組 (無規劃功能) 或 已填寫計畫：直接跳轉 StuUnit
  else {
    handleRedirectToUnit(unitId);
  }
};

// 🌟 執行跳轉的函式
const handleRedirectToUnit = (unitId) => {
  console.log("執行跳轉，單元ID:", unitId);
  router.push({
    name: "StuUnit",
    params: {
      courseId: props.courseId,
      id: unitId,
    },
  });
  // 如果是從 Modal 觸發的，記得關閉
  showActiveModal.value = false;
};

// 計畫提交成功後的動作 (如果只是存檔而不直接進入)
const onTaskSubmitted = () => {
  showActiveModal.value = false;
  // 可在此加入 Swal 提示
};

onMounted(() => {
  if (!props.courseId) return;
  const uid = auth.currentUser?.uid;
  const coursePath = `courses/${props.courseId}`;

  onValue(dbRef(rtdb, `${coursePath}/units`), (snapshot) => {
    const data = snapshot.val() || {};
    schedule.value = Object.entries(data).map(([id, val]) => ({ id, ...val }));
  });

  if (uid) {
    onValue(dbRef(rtdb, `${coursePath}/profiles/${uid}/srl/planning`), (s) => {
      unitPlans.value = s.val() || {};
    });

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
