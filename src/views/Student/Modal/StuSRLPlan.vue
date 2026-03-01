<template>
  <div class="StuSrlPlan shadow-sm">
    <div class="plan-header">
      <div class="icon-circle">
        <i class="bi bi-calendar2-check"></i>
      </div>
      <div>
        <h5 class="fw-bold mb-0">學習計畫與目標設定</h5>
        <p class="text-muted xx-small mb-0">好的開始是成功的一半</p>
      </div>
    </div>

    <div class="plan-body">
      <div class="form-group mb-4">
        <label class="form-label fw-bold"
          ><i class="bi bi-clock me-2"></i>預計學習時間 (分鐘)</label
        >
        <input
          type="number"
          v-model="planData.targetTime"
          class="form-control-custom"
          placeholder="例如：30"
        />
      </div>

      <div class="form-group mb-4">
        <label class="form-label fw-bold"
          ><i class="bi bi-pencil-square me-2"></i>本單元學習重點</label
        >
        <textarea
          v-model="planData.targetGoal"
          class="form-control-custom"
          rows="3"
          placeholder="例如：掌握過去完成式的用法"
        ></textarea>
      </div>

      <button @click="handleSavePlan" class="btn-save-plan">
        <i class="bi bi-check-circle-fill me-2"></i>確認並開始學習
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { rtdb, auth } from "../../../firebase/config";
import { ref as dbRef, update, push } from "firebase/database";

const props = defineProps(["courseId"]);
const planData = ref({ targetTime: "", targetGoal: "" });

const handleSavePlan = async () => {
  const user = auth.currentUser;
  if (!user) return;

  const path = `courses/${props.courseId}`;

  // 1. 儲存至個人資料
  await update(dbRef(rtdb, `${path}/profiles/${user.uid}/srl/planning`), {
    ...planData.value,
    timestamp: Date.now(),
  });

  // 2. 寫入行為 Log 供教師端 TrList 下載
  await push(dbRef(rtdb, `${path}/logs/${user.uid}`), {
    type: "planning",
    typeLabel: "任務計畫",
    content: `設定目標時間：${planData.targetTime}分，目標：${planData.targetGoal}`,
    timestamp: Date.now(),
  });

  alert("計畫已儲存，開始學習吧！");
};
</script>

<style src="./StuSrlPlan.css" scoped></style>
