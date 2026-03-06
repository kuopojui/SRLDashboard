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

const props = defineProps({ courseId: String, userId: String });
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
const handleRedirectToUnit = async (unitId) => {
  // 1. 取得 UID 的多重防呆：優先順序為 Props > Auth > 重試機制
  let currentUid = props.userId || auth.currentUser?.uid;

  // 2. 針對非同步登入的防呆：如果剛開網頁 Auth 還沒準備好，稍等 500ms
  if (!currentUid) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    currentUid = auth.currentUser?.uid;
  }

  // 3. 完整參數校驗
  if (!unitId || !props.courseId || !currentUid) {
    const errorDetail = {
      單元ID: unitId || "遺失",
      課程ID: props.courseId || "遺失",
      用戶ID: currentUid || "未登入/遺失",
    };
    console.error("❌ 導航失敗：參數不完整", errorDetail);
    // 可加入使用者提示，例如 Swal.fire('錯誤', '讀取用戶資訊失敗，請重新整理', 'error');
    return;
  }

  // 4. 路由跳轉
  try {
    console.log("🚀 執行跳轉...", {
      courseId: props.courseId,
      id: unitId,
      userId: currentUid,
    });

    await router.push({
      name: "StuUnit",
      params: {
        courseId: props.courseId,
        id: unitId,
        userId: currentUid, // 🌟 務必確認 router/index.js 有定義 :userId
      },
    });

    // 5. 成功跳轉後才關閉 Modal，確保使用者體驗連貫
    if (showActiveModal.value) {
      showActiveModal.value = false;
    }
  } catch (err) {
    console.error("導航過程發生意外錯誤:", err);
  }
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
