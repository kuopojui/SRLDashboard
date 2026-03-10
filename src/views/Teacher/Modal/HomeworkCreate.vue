<template>
  <div class="HomeworkCreate ex-modal-overlay" @click.self="emitClose">
    <div
      class="ex-modal-content homework-theme animate__animated animate__fadeInUp"
    >
      <div class="ex-modal-header">
        <h3 class="modal-title-navy">
          <i class="bi bi-journal-text me-2"></i>建立新作業
        </h3>
        <button
          type="button"
          class="btn-close-red"
          @click="emitClose"
          title="關閉"
        >
          ✕
        </button>
      </div>

      <form
        @submit.prevent="createHomework"
        class="ex-form-container custom-scrollbar"
      >
        <div class="form-body">
          <div class="mb-4">
            <label class="ex-label-small text-secondary fw-bold mb-2"
              >作業標題</label
            >
            <input
              v-model="form.title"
              type="text"
              class="ex-input-field"
              placeholder="例如：單元一 單字練習"
              required
            />
          </div>

          <div class="row g-3 mb-4">
            <div class="col-md-7 col-12">
              <label class="ex-label-small text-secondary fw-bold mb-2"
                >截止日期與時間</label
              >
              <input
                v-model="form.deadline"
                type="datetime-local"
                class="ex-input-field"
                required
              />
            </div>
            <div class="col-md-5 col-12 d-flex align-items-end">
              <div class="late-toggle-box">
                <span class="small fw-bold text-navy">允許遲交</span>
                <div class="form-check form-switch m-0">
                  <input
                    class="form-check-input"
                    type="checkbox"
                    v-model="form.allowLate"
                  />
                </div>
              </div>
            </div>
          </div>

          <hr class="ex-divider my-4" />

          <div class="ex-question-list">
            <div
              v-for="(q, idx) in questions"
              :key="idx"
              class="ex-question-card shadow-sm border mb-4"
            >
              <div class="q-card-header">
                <span class="badge-index">題目 {{ idx + 1 }}</span>
                <button
                  type="button"
                  class="btn-remove-q"
                  @click="questions.splice(idx, 1)"
                >
                  <i class="bi bi-trash3"></i>
                </button>
              </div>

              <div class="q-card-body">
                <div class="mb-3">
                  <label class="xx-small fw-bold text-muted">題目敘述</label>
                  <input
                    v-model="q.question"
                    type="text"
                    class="ex-input-field sm"
                    placeholder="請輸入問題內容"
                    required
                  />
                </div>

                <div class="mb-3">
                  <label class="xx-small fw-bold text-muted">題型設定</label>
                  <select
                    v-model="q.type"
                    class="ex-select-field sm"
                    @change="handleTypeChange(q)"
                  >
                    <option value="shortAnswer">簡答題</option>
                    <option value="multipleChoice">單選題</option>
                    <option value="multiSelect">多選題</option>
                  </select>
                </div>

                <div class="ex-answer-setup p-3 rounded-4">
                  <div v-if="q.type === 'shortAnswer'">
                    <label class="xx-small fw-bold text-navy mb-2 d-block"
                      >參考答案關鍵字</label
                    >
                    <input
                      v-model="q.refAnswer"
                      type="text"
                      class="ex-input-field sm bg-white"
                      placeholder="輸入關鍵字以供 AI 批改參考"
                    />
                  </div>

                  <div v-else class="options-container">
                    <label class="xx-small fw-bold text-navy mb-2 d-block"
                      >選項與正確答案設定</label
                    >
                    <div
                      v-for="i in q.type === 'multipleChoice' ? 4 : 5"
                      :key="i"
                      class="option-row"
                    >
                      <span class="opt-label">{{
                        String.fromCharCode(64 + i)
                      }}</span>
                      <input
                        v-model="q.options[i - 1]"
                        type="text"
                        class="ex-input-field sm flex-grow-1"
                        :placeholder="'選項 ' + i"
                        required
                      />

                      <input
                        v-if="q.type === 'multipleChoice'"
                        type="radio"
                        :name="'ans-' + idx"
                        :value="i - 1"
                        v-model="q.answer"
                        class="form-check-input ms-2"
                      />
                      <input
                        v-else-if="q.type === 'multiSelect'"
                        type="checkbox"
                        :value="i - 1"
                        v-model="q.multiAnswers"
                        class="form-check-input ms-2"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <button
            type="button"
            class="btn-add-dashed-full mb-4"
            @click="addQuestion"
          >
            <i class="bi bi-plus-lg me-2"></i> 新增題目
          </button>
        </div>

        <div class="ex-modal-footer">
          <button type="submit" class="ex-btn-navy-action">確認發佈作業</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted } from "vue";
import { rtdb as db } from "../../../firebase/config";
import { ref as dbRef, push, set } from "firebase/database";
import Swal from "sweetalert2";
import "./HomeworkCreate.css";

const props = defineProps({ courseId: String });
const emit = defineEmits(["close"]);

const form = reactive({
  title: "",
  description: "",
  deadline: "",
  allowLate: false,
});

const questions = ref([]);

// 🌟 鎖定背景捲動
onMounted(() => {
  document.body.style.overflow = "hidden";
  if (window.innerWidth < 768) {
    document.body.style.position = "fixed";
    document.body.style.width = "100%";
  }
});

onUnmounted(() => {
  document.body.style.overflow = "";
  document.body.style.position = "";
  document.body.style.width = "";
});

const emitClose = () => emit("close");

const addQuestion = () => {
  questions.value.push({
    type: "shortAnswer",
    question: "",
    options: ["", "", "", "", ""],
    answer: 0,
    multiAnswers: [],
    refAnswer: "",
  });
};

const handleTypeChange = (q) => {
  q.answer = 0;
  q.multiAnswers = [];
  q.refAnswer = "";
};

const createHomework = async () => {
  if (questions.value.length === 0) {
    Swal.fire("提醒", "請至少新增一個題目", "warning");
    return;
  }

  try {
    const processedQuestions = questions.value.map((q) => {
      const base = { type: q.type, question: q.question };
      if (q.type === "shortAnswer") return { ...base, refAnswer: q.refAnswer };
      if (q.type === "multipleChoice")
        return { ...base, options: q.options.slice(0, 4), answer: q.answer };
      return {
        ...base,
        options: q.options.slice(0, 5),
        multiAnswers: q.multiAnswers,
      };
    });

    const homeworkData = {
      ...form,
      questions: processedQuestions,
      createdAt: Date.now(),
      courseId: props.courseId,
    };

    const newAssignmentRef = push(
      dbRef(db, `courses/${props.courseId}/assignments`),
    );
    await set(newAssignmentRef, homeworkData);

    Swal.fire({
      icon: "success",
      title: "作業發佈成功",
      showConfirmButton: false,
      timer: 1500,
    });
    emitClose();
  } catch (error) {
    Swal.fire("錯誤", "發佈失敗", "error");
  }
};
</script>
