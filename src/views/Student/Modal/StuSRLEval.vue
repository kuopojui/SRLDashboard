<template>
  <div class="StuSrlEval card border-0 shadow-sm p-4 rounded-4">
    <div class="eval-header mb-4 text-center">
      <h5 class="fw-bold">課後學習反思</h5>
      <p class="text-muted small">
        回顧一下今天的表現，這能幫助你下次做得更好！
      </p>
    </div>

    <div class="eval-body">
      <div class="question-item mb-4">
        <label class="fw-bold d-block mb-3"
          >1. 你覺得今天的學習目標達成了嗎？</label
        >
        <div class="rating-group">
          <button
            v-for="n in 5"
            :key="n"
            @click="evalData.achievement = n"
            :class="['btn-rating', { active: evalData.achievement === n }]"
          >
            {{ n }}
          </button>
        </div>
        <div
          class="d-flex justify-content-between px-1 mt-1 text-muted xx-small"
        >
          <span>完全沒達成</span>
          <span>完全達成</span>
        </div>
      </div>

      <div class="question-item mb-4">
        <label class="fw-bold d-block mb-2"
          >2. 哪一部分讓你覺得最有挑戰性？</label
        >
        <textarea
          v-model="evalData.reflection"
          class="form-control-custom"
          rows="2"
        ></textarea>
      </div>

      <button @click="submitEvaluation" class="btn-submit-eval">
        提交反思紀錄
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { rtdb, auth } from "../../firebase/config";
import { ref as dbRef, update, push } from "firebase/database";
import Swal from "sweetalert2";

const props = defineProps(["courseId"]);
const evalData = ref({ achievement: 3, reflection: "" });

const submitEvaluation = async () => {
  const user = auth.currentUser;
  const path = `courses/${props.courseId}`;

  try {
    // 儲存反思結果
    await update(dbRef(rtdb, `${path}/profiles/${user.uid}/srl/evaluation`), {
      ...evalData.value,
      timestamp: Date.now(),
    });

    // 寫入 Log 供教師端下載 CSV
    await push(dbRef(rtdb, `${path}/logs/${user.uid}`), {
      type: "evaluation",
      typeLabel: "課後反思",
      content: `達成度：${evalData.achievement}，心得：${evalData.reflection}`,
      timestamp: Date.now(),
    });

    Swal.fire("做得好！", "你的反思已儲存，繼續保持學習習慣。", "success");
  } catch (error) {
    Swal.fire("錯誤", "提交失敗，請稍後再試。", "error");
  }
};
</script>

<style src="./StuSrlEval.css" scoped></style>
