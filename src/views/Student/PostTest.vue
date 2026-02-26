<template>
  <div class="PrePost-Container PostTest d-flex flex-column min-vh-100">
    <div class="test-header shadow-sm sticky-top bg-white p-3">
      <div class="container d-flex justify-content-between align-items-center">
        <h5 class="fw-bold text-success mb-0">
          <i class="bi bi-award me-2"></i>學習後測問卷
        </h5>
        <div class="small text-muted">完成度：{{ progress.toFixed(0) }}%</div>
      </div>
      <div class="progress mt-3 mx-auto container p-0" style="height: 6px">
        <div
          class="progress-bar bg-success"
          :style="{ width: progress + '%' }"
        ></div>
      </div>
    </div>

    <main class="container py-5 flex-grow-1">
      <div class="row justify-content-center">
        <div class="col-lg-8">
          <div
            v-for="(q, idx) in questions"
            :key="idx"
            class="question-card p-4 mb-4 rounded-4 shadow-sm bg-light"
            :class="{ 'answered-card': answers[idx] }"
          >
            <h6 class="fw-bold mb-4">{{ idx + 1 }}. {{ q.text }}</h6>
            <div
              v-if="q.type === 'likert5'"
              class="likert-container d-flex justify-content-between px-md-5"
            >
              <div v-for="n in 5" :key="n" class="likert-option text-center">
                <input
                  type="radio"
                  v-model="answers[idx]"
                  :value="n"
                  class="form-check-input mb-2"
                />
                <label class="d-block small text-muted">{{ n }}</label>
              </div>
            </div>
            <textarea
              v-else
              v-model="answers[idx]"
              class="form-control border-0 rounded-3"
              rows="3"
            ></textarea>
          </div>

          <button
            class="btn btn-success w-100 py-3 rounded-pill fw-bold shadow mt-4 text-white"
            :disabled="!isComplete || loading"
            @click="submit"
          >
            完成學習任務並提交
          </button>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
// 邏輯與 PreTest 相似，僅路徑改為 posttest 並返回首頁
import { ref, onMounted, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { rtdb, auth } from "../../firebase/config";
import { ref as dbRef, get, set } from "firebase/database";
import Swal from "sweetalert2";
import "./PrePost.css";

const route = useRoute();
const router = useRouter();
const courseId = route.params.courseId;

const questions = ref([]);
const answers = ref([]);
const testId = ref("");
const loading = ref(false);

const answeredCount = computed(() => answers.value.filter((a) => a).length);
const progress = computed(
  () => (answeredCount.value / (questions.value.length || 1)) * 100,
);
const isComplete = computed(
  () => answeredCount.value === questions.value.length,
);

onMounted(async () => {
  const snap = await get(
    dbRef(rtdb, `courses/${courseId}/experiment/test/posttest`),
  );
  const data = snap.val();
  if (data) {
    const active = Object.entries(data).find(
      ([id, val]) => val.visible === true,
    );
    if (active) {
      testId.value = active[0];
      questions.value = active[1].questions;
      answers.value = new Array(questions.value.length).fill("");
    }
  }
});

const submit = async () => {
  loading.value = true;
  try {
    await set(
      dbRef(
        rtdb,
        `courses/${courseId}/experiment/submissions/${testId.value}/${auth.currentUser.uid}`,
      ),
      {
        answers: answers.value,
        submittedAt: Date.now(),
        type: "post",
      },
    );
    await Swal.fire({
      icon: "success",
      title: "恭喜完成課程",
      text: "測驗已提交",
      timer: 2000,
    });
    router.push("/stucourse");
  } catch (e) {
    Swal.fire("錯誤", "提交失敗", "error");
  }
  loading.value = false;
};
</script>
