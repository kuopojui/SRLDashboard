<template>
  <div class="PrePost-Container PreTest d-flex flex-column min-vh-100">
    <div class="test-header shadow-sm sticky-top bg-white p-3">
      <div class="container d-flex justify-content-between align-items-center">
        <h5 class="fw-bold text-navy mb-0">
          <i class="bi bi-file-earmark-medical me-2"></i>實驗前測問卷
        </h5>
        <div class="small text-muted fw-bold">
          已完成：<span class="text-navy">{{ answeredCount }}</span> /
          {{ questions.length }}
        </div>
      </div>
      <div
        class="progress mt-3 mx-auto container p-0"
        style="height: 8px; border-radius: 10px"
      >
        <div
          class="progress-bar bg-navy progress-bar-striped progress-bar-animated"
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
            class="question-card p-4 mb-4 rounded-4 shadow-sm bg-white"
            :class="{
              'answered-card':
                answers[idx] !== '' && answers[idx] !== undefined,
            }"
          >
            <h6 class="fw-bold mb-4 text-dark d-flex">
              <span class="me-2 text-navy">Q{{ idx + 1 }}.</span>
              <span>{{ q.text }}</span>
            </h6>

            <div
              v-if="q.type && q.type.startsWith('likert')"
              class="likert-wrapper"
            >
              <div
                class="likert-label-row d-flex justify-content-between mb-3 px-1"
              >
                <span class="scale-guide">1 非常不同意</span>
                <span class="scale-guide">5 非常同意</span>
              </div>

              <div
                class="likert-container d-flex justify-content-between px-md-4"
              >
                <div
                  v-for="n in q.scale ||
                  parseInt(q.type.replace('likert', '')) ||
                  5"
                  :key="n"
                  class="likert-option text-center"
                >
                  <label class="option-label">
                    <input
                      type="radio"
                      :name="'pre' + idx"
                      v-model="answers[idx]"
                      :value="n"
                      class="form-check-input mb-2"
                    />
                    <span class="d-block small text-muted fw-bold">{{
                      n
                    }}</span>
                  </label>
                </div>
              </div>
            </div>

            <div v-else class="essay-wrapper mt-2">
              <textarea
                v-model="answers[idx]"
                class="form-control custom-textarea"
                rows="4"
                placeholder="請點擊此處輸入您的回答內容..."
              ></textarea>
            </div>
          </div>

          <div class="submit-section pb-5">
            <button
              class="btn btn-navy w-100 py-3 rounded-pill fw-bold shadow-lg mt-4"
              :disabled="!isComplete || loading"
              @click="submit"
            >
              <i class="bi bi-check-circle me-2"></i>
              {{ isComplete ? "提交前測並開始學習" : "請填寫所有題目以繼續" }}
            </button>
            <p v-if="!isComplete" class="text-center text-muted mt-3 small">
              還有 {{ questions.length - answeredCount }} 題尚未回答
            </p>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { rtdb, auth } from "../../firebase/config";
import { ref as dbRef, get, set } from "firebase/database";
import { onAuthStateChanged } from "firebase/auth";
import Swal from "sweetalert2";
import "./PrePost.css";

const route = useRoute();
const router = useRouter();
const courseId = route.params.courseId;
// 從路由獲取特定的問卷 ID
const testIdFromUrl = route.params.testId;

const questions = ref([]);
const answers = ref([]);
const testId = ref("");
const loading = ref(false);
const testTitle = ref("載入中...");

const answeredCount = computed(
  () => answers.value.filter((a) => a !== "" && a !== undefined).length,
);
const progress = computed(
  () => (answeredCount.value / (questions.value.length || 1)) * 100,
);
const isComplete = computed(
  () =>
    questions.value.length > 0 &&
    answeredCount.value === questions.value.length,
);

onMounted(() => {
  // 確保使用者已登入後再抓取資料
  onAuthStateChanged(auth, (user) => {
    if (user) {
      fetchTestData();
    } else {
      router.replace("/login");
    }
  });
});

// 根據 URL 的 testId 抓取特定問卷內容
const fetchTestData = async () => {
  loading.value = true;
  try {
    const snap = await get(
      dbRef(
        rtdb,
        `courses/${courseId}/experiment/test/pretest/${testIdFromUrl}`,
      ),
    );

    if (snap.exists()) {
      const data = snap.val();
      testId.value = testIdFromUrl;
      testTitle.value = data.title;
      questions.value = data.questions || [];
      // 初始化答案陣列
      answers.value = new Array(questions.value.length).fill("");
    } else {
      // 若找不到該 ID，嘗試返回課程主頁重新觸發攔截邏輯
      router.push(`/studashboard/${courseId}`);
    }
  } catch (e) {
    console.error("抓取問卷失敗:", e);
    Swal.fire("錯誤", "無法載入問卷內容", "error");
  } finally {
    loading.value = false;
  }
};

const submit = async () => {
  if (!isComplete.value) return;

  loading.value = true;
  try {
    // 儲存至 experiment/submissions 節點
    await set(
      dbRef(
        rtdb,
        `courses/${courseId}/experiment/submissions/${testId.value}/${auth.currentUser.uid}`,
      ),
      {
        answers: answers.value,
        submittedAt: Date.now(),
        userName: auth.currentUser.displayName || auth.currentUser.email,
        type: "pre",
      },
    );

    await Swal.fire({
      icon: "success",
      title: "本份問卷已完成",
      text: "正在檢查是否有其他任務...",
      timer: 1500,
      showConfirmButton: false,
    });

    // 提交後不直接進儀表板，而是重新進入份」問卷
    router.push("/stucourse");
  } catch (e) {
    console.error("提交失敗:", e);
    Swal.fire("錯誤", "提交失敗，請檢查網路連線", "error");
  } finally {
    loading.value = false;
  }
};
</script>
