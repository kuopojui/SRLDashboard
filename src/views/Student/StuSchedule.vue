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
            <i class="bi bi-pencil-square me-1"></i>點擊開始規劃
          </span>
        </div>

        <i
          class="bi"
          :class="
            isOpen(unit.id)
              ? 'bi-chevron-up text-primary'
              : 'bi-chevron-down opacity-50'
          "
        ></i>
      </div>

      <div
        v-if="isOpen(unit.id)"
        class="p-3 bg-light border-start border-end border-bottom rounded-bottom"
      >
        <div v-if="unit.materials?.length">
          <p class="small text-muted mb-1 fw-bold">教材：</p>
          <div
            v-for="mId in unit.materials"
            :key="mId"
            class="p-2 border bg-white mb-1 rounded small shadow-xs"
          >
            ID: {{ mId }}
          </div>
        </div>
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
          @close="showActiveModal = false"
        />
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, onMounted, markRaw } from "vue";
import { rtdb, auth } from "../../firebase/config";
import { ref as dbRef, onValue } from "firebase/database";
import StuSrlPlan from "./Modal/StuSRLPlan.vue"; // 🌟 引入計畫組件
import "./StuSchedule.css";

const props = defineProps({ courseId: String });

const schedule = ref([]);
const unitPlans = ref({}); // 存放學生已填寫的計畫
const activeFeatures = ref({ planning: false }); // 🌟 組別功能開關
const openUnits = ref([]);

// 彈窗控制
const showActiveModal = ref(false);
const activeTaskId = ref("");
const activeTaskInitialData = ref({});

// 1. 核心點擊邏輯：判斷攔截或展開
const handleUnitClick = (unit) => {
  const unitId = unit.id;
  const hasPlan = !!(unitPlans.value && unitPlans.value[unitId]?.targetTime);

  // 🌟 若組別有開啟規劃功能且尚未填過，則攔截
  if (activeFeatures.value.planning && !hasPlan) {
    activeTaskId.value = unitId;
    activeTaskInitialData.value = { unitTitle: unit.title };
    showActiveModal.value = true;
  } else {
    toggleUnit(unitId);
  }
};

const toggleUnit = (id) => {
  const index = openUnits.value.indexOf(id);
  if (index > -1) openUnits.value.splice(index, 1);
  else openUnits.value.push(id);
};

const isOpen = (id) => openUnits.value.includes(id);

// 2. 計畫提交成功：關閉彈窗並自動展開單元
const onTaskSubmitted = () => {
  showActiveModal.value = false;
  if (activeTaskId.value) toggleUnit(activeTaskId.value);
};

onMounted(() => {
  if (!props.courseId) return;
  const uid = auth.currentUser?.uid;
  const coursePath = `courses/${props.courseId}`;

  // 監聽單元清單
  onValue(dbRef(rtdb, `${coursePath}/units`), (snapshot) => {
    const data = snapshot.val() || {};
    schedule.value = Object.entries(data).map(([id, val]) => ({ id, ...val }));
  });

  if (uid) {
    // 🌟 監聽學生已填寫的計畫紀錄
    onValue(dbRef(rtdb, `${coursePath}/profiles/${uid}/srl/planning`), (s) => {
      unitPlans.value = s.val() || {};
    });

    // 🌟 監聽學生組別並讀取功能開關
    onValue(dbRef(rtdb, `${coursePath}/profiles/${uid}`), (snap) => {
      const profile = snap.val();
      if (profile?.groupId) {
        // 讀取對應組別的 features 設定
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
