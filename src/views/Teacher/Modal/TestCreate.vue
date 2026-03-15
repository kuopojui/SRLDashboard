<template>
  <div class="TestCreate test-create-overlay" @click.self="emitClose">
    <div class="test-create-modal shadow-lg">
      <div class="modal-header-custom">
        <h2 class="h5 fw-bold mb-0 text-navy">
          <i class="bi bi-clipboard-pulse me-2"></i>設定實驗問卷
        </h2>
        <button
          type="button"
          class="btn-close-red"
          @click="emitClose"
          title="關閉"
        >
          ✕
        </button>
      </div>

      <div class="modal-body-custom custom-scrollbar">
        <div class="row g-3 mb-4">
          <div class="col-md-8 col-12">
            <label class="form-label small fw-bold text-secondary"
              >問卷標題</label
            >
            <input
              v-model="title"
              type="text"
              class="form-control custom-field"
              placeholder="例如：學習動機量表"
              :disabled="isLoading"
            />
          </div>
          <div class="col-md-4 col-12">
            <label class="form-label small fw-bold text-secondary"
              >問卷性質</label
            >
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

        <section class="question-list-area">
          <div class="d-flex align-items-center justify-content-between mb-3">
            <h4 class="h6 fw-bold mb-0 text-navy">
              題目清單 ({{ questions.length }})
            </h4>
          </div>

          <div v-if="questions.length === 0" class="empty-placeholder">
            <div class="text-muted small">尚未新增題目，請點選下方按鈕</div>
          </div>

          <div
            v-for="(q, index) in questions"
            :key="index"
            class="question-card shadow-sm border"
          >
            <div class="q-content">
              <div class="q-input-group">
                <span class="q-index">#{{ index + 1 }}</span>
                <input
                  type="text"
                  v-model="q.text"
                  placeholder="輸入題目敘述..."
                  class="q-text-field"
                  :disabled="isLoading"
                />
              </div>
              <select
                v-model="q.type"
                class="q-type-select"
                :disabled="isLoading"
              >
                <option value="likert5">5 點量表</option>
                <option value="likert7">7 點量表</option>
                <option value="shortAnswer">簡答題</option>
              </select>
            </div>
            <button
              class="btn-remove-q"
              @click="removeQuestion(index)"
              v-if="!isLoading"
            >
              <i class="bi bi-trash3-fill"></i>
            </button>
          </div>
        </section>
      </div>

      <div class="modal-footer-custom">
        <button
          class="btn-add-dashed"
          @click="addQuestion"
          :disabled="isLoading"
        >
          <i class="bi bi-plus-lg me-1"></i> 新增題目
        </button>

        <div class="footer-actions">
          <button class="btn-save-navy" @click="saveTest" :disabled="isLoading">
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
import { ref, computed } from "vue";
import { rtdb as db } from "../../../firebase/config";
import { ref as dbRef, push, set } from "firebase/database";
import { useRoute } from "vue-router";
import Swal from "sweetalert2"; // 🌟 引入 SweetAlert2
import "./TestCreate.css";

const emit = defineEmits(["close", "created"]);
const route = useRoute();

const props = defineProps({
  courseId: {
    type: String,
    default: "",
  },
});

const activeCourseId = computed(() => {
  return props.courseId || route.params.id;
});

const title = ref("");
const testType = ref("pre");
const questions = ref([{ text: "", type: "likert5" }]);
const isLoading = ref(false);

const addQuestion = () => {
  questions.value.push({ text: "", type: "likert5" });
};
const removeQuestion = (index) => {
  questions.value.splice(index, 1);
};

const saveTest = async () => {
  // 檢查 ID
  if (!activeCourseId.value || activeCourseId.value === "undefined") {
    return Swal.fire({
      icon: "error",
      title: "系統錯誤",
      text: "找不到課程編號，請重新整理頁面",
      confirmButtonColor: "#4a70a9",
    });
  }

  // 驗證欄位
  if (!title.value.trim()) {
    return Swal.fire({
      icon: "warning",
      title: "請輸入問卷標題",
      confirmButtonColor: "#4a70a9",
    });
  }

  if (questions.value.length === 0) {
    return Swal.fire({
      icon: "warning",
      title: "請至少新增一個題目",
      confirmButtonColor: "#4a70a9",
    });
  }

  isLoading.value = true;

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

    // 🌟 成功提示
    await Swal.fire({
      icon: "success",
      title: "問卷已成功建立！",
      timer: 1500,
      showConfirmButton: false,
    });

    emit("created");
    emit("close");
  } catch (e) {
    console.error("Firebase 儲存錯誤:", e);
    Swal.fire({
      icon: "error",
      title: "儲存失敗",
      text: "請檢查網路連線或權限設定",
      confirmButtonColor: "#4a70a9",
    });
  } finally {
    isLoading.value = false;
  }
};

const emitClose = () => {
  if (!isLoading.value) emit("close");
};
</script>
