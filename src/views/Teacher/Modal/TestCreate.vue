<template>
  <div class="test-create-overlay" @click.self="emitClose">
    <div
      class="test-create-modal p-4 shadow-lg bg-white overflow-hidden d-flex flex-column"
    >
      <transition name="toast-fade">
        <div v-if="toast.show" :class="['custom-toast', toast.type]">
          <i
            :class="
              toast.type === 'success'
                ? 'bi bi-check-circle-fill'
                : 'bi bi-exclamation-circle-fill'
            "
          ></i>
          {{ toast.msg }}
        </div>
      </transition>

      <div class="d-flex justify-content-between align-items-center mb-3">
        <h2 class="h4 fw-bold mb-0 modal-title-navy">
          <i class="bi bi-clipboard-pulse me-2"></i>設定實驗問卷
        </h2>
        <button type="button" class="btn-close" @click="emitClose"></button>
      </div>

      <div class="row g-3 mb-4">
        <div class="col-md-8">
          <label class="form-label small fw-bold text-muted">問卷標題</label>
          <input
            v-model="title"
            type="text"
            class="form-control custom-field"
            placeholder="例如：學習動機量表"
            :disabled="isLoading"
          />
        </div>
        <div class="col-md-4">
          <label class="form-label small fw-bold text-muted">問卷性質</label>
          <select
            v-model="testType"
            class="form-select custom-field fw-bold"
            :disabled="isLoading"
          >
            <option value="pre">Pre-test 前測</option>
            <option value="post">Post-test 後測</option>
          </select>
        </div>
      </div>

      <section class="question-list-area flex-grow-1 overflow-auto pe-2 mb-4">
        <div class="d-flex align-items-center justify-content-between mb-3">
          <h4 class="h6 fw-bold mb-0 text-secondary">
            題目清單 ({{ questions.length }})
          </h4>
        </div>

        <div
          v-if="questions.length === 0"
          class="empty-placeholder py-5 border rounded-4 bg-light text-center"
        >
          <div class="text-muted small">尚未新增題目，請點選下方按鈕</div>
        </div>

        <div
          v-for="(q, index) in questions"
          :key="index"
          class="question-card p-3 mb-3 border rounded-4 bg-white shadow-sm position-relative"
        >
          <div class="row g-2 mb-2">
            <div class="col-8">
              <input
                type="text"
                v-model="q.text"
                placeholder="輸入題目敘述..."
                class="form-control form-control-sm border-0 bg-light rounded-3"
                :disabled="isLoading"
              />
            </div>
            <div class="col-4">
              <select
                v-model="q.type"
                class="form-select form-select-sm border-0 bg-light rounded-3 fw-bold text-primary"
                :disabled="isLoading"
              >
                <option value="likert5">5 點量表</option>
                <option value="likert7">7 點量表</option>
                <option value="shortAnswer">簡答題</option>
              </select>
            </div>
          </div>
          <button
            class="btn-remove-q p-0 position-absolute"
            @click="removeQuestion(index)"
            v-if="!isLoading"
          >
            <i class="bi bi-x-circle-fill"></i>
          </button>
        </div>
      </section>

      <div class="modal-footer-custom d-flex gap-2 pt-2 border-top">
        <button
          class="btn btn-add-dashed btn-sm px-3 rounded-pill"
          @click="addQuestion"
          :disabled="isLoading"
        >
          <i class="bi bi-plus-lg me-1"></i> 新增題目
        </button>
        <div class="ms-auto d-flex gap-2">
          <button
            class="btn btn-sm btn-light rounded-pill px-4"
            @click="emitClose"
            :disabled="isLoading"
          >
            取消
          </button>
          <button
            class="btn btn-sm btn-navy rounded-pill px-4 fw-bold shadow-sm d-flex align-items-center"
            @click="saveTest"
            :disabled="isLoading"
          >
            <span
              v-if="isLoading"
              class="spinner-border spinner-border-sm me-2"
            ></span>
            {{ isLoading ? "儲存中..." : "儲存並建立" }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from "vue";
import { rtdb as db } from "../../../firebase/config";
import { ref as dbRef, push, set } from "firebase/database";
import { useRoute } from "vue-router";
import "./TestCreate.css";

const emit = defineEmits(["close", "created"]);
const route = useRoute();

// 1. 🌟 接收來自父組件的 courseId，這是解決 undefined 的最穩妥方法
const props = defineProps({
  courseId: {
    type: String,
    default: "",
  },
});

// 2. 🌟 建立一個計算屬性來確保獲取到正確的 ID
const activeCourseId = computed(() => {
  return props.courseId || route.params.id;
});

const title = ref("");
const testType = ref("pre"); // 控制 pre 或 post
const questions = ref([{ text: "", type: "likert5" }]);
const isLoading = ref(false);

const toast = reactive({ show: false, msg: "", type: "success" });

const triggerToast = (msg, type = "success") => {
  toast.msg = msg;
  toast.type = type;
  toast.show = true;
  setTimeout(() => {
    toast.show = false;
  }, 3000);
};

const addQuestion = () => {
  questions.value.push({ text: "", type: "likert5" });
};
const removeQuestion = (index) => {
  questions.value.splice(index, 1);
};

const saveTest = async () => {
  // 3. 🌟 嚴格檢查 ID 是否有效，避免再次寫入到根目錄的 undefined 節點
  if (!activeCourseId.value || activeCourseId.value === "undefined") {
    console.error("Firebase Path Error: courseId is missing.");
    return triggerToast("系統錯誤：找不到課程編號，請重新整理頁面", "error");
  }

  if (!title.value.trim()) return triggerToast("請輸入問卷標題", "error");
  if (questions.value.length === 0)
    return triggerToast("請至少新增一個題目", "error");

  isLoading.value = true;

  // 4. 🌟 根據需求格式化資料夾名稱：pretest 或 posttest
  const folderName = `${testType.value}test`;
  const dbPath = `courses/${activeCourseId.value}/experiment/test/${folderName}`;

  const examRef = push(dbRef(db, dbPath));

  try {
    await set(examRef, {
      title: title.value,
      testType: testType.value,
      questions: questions.value,
      createdAt: Date.now(),
      isExperiment: true,
      description: `${testType.value === "pre" ? "前測" : "後測"}問卷 (${questions.value.length} 題)`,
    });

    triggerToast("問卷已成功建立！", "success");

    setTimeout(() => {
      emit("created");
      emit("close");
    }, 1200);
  } catch (e) {
    console.error("Firebase 儲存錯誤:", e);
    triggerToast("儲存失敗", "error");
  } finally {
    isLoading.value = false;
  }
};

const emitClose = () => {
  if (!isLoading.value) emit("close");
};
</script>
