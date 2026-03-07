<template>
  <div class="HomeworkCreate ex-modal-overlay" @click.self="$emit('close')">
    <div class="ex-modal-content">
      <div class="ex-modal-header">
        <h3><i class="bi bi-journal-text"></i>建立作業</h3>
        <button class="btn-close" @click="$emit('close')"></button>
      </div>

      <form @submit.prevent="createHomework" class="ex-form-container">
        <div class="form-section">
          <label class="ex-label">作業標題</label>
          <input
            v-model="form.title"
            type="text"
            class="ex-input"
            placeholder="例如：單元一 單字練習"
            required
          />
        </div>

        <div class="form-section">
          <label class="ex-label">作業描述</label>
          <textarea
            v-model="form.description"
            class="ex-textarea"
            rows="2"
            placeholder="作業詳細說明..."
          ></textarea>
        </div>

        <div class="row g-3">
          <div class="col-md-8">
            <label class="ex-label">截止日期與時間</label>
            <input
              v-model="form.deadline"
              type="datetime-local"
              class="ex-input"
              required
            />
          </div>
          <div class="col-md-4 d-flex align-items-end">
            <div
              class="ex-input d-flex align-items-center justify-content-between py-2"
            >
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

        <hr class="ex-divider" />

        <div class="ex-question-card" v-for="(q, idx) in questions" :key="idx">
          <div class="d-flex justify-content-between align-items-center mb-3">
            <span class="badge bg-primary rounded-pill"
              >題目 {{ idx + 1 }}</span
            >
            <button
              type="button"
              class="btn-close small"
              @click="questions.splice(idx, 1)"
            ></button>
          </div>

          <label class="ex-label-small">題目內容</label>
          <input
            v-model="q.question"
            type="text"
            class="ex-input mb-3"
            placeholder="請輸入問題"
            required
          />

          <label class="ex-label-small">題型設定</label>
          <select v-model="q.type" class="ex-select mb-3">
            <option value="shortAnswer">簡答題</option>
            <option value="multipleChoice">單選題</option>
            <option value="multiSelect">多選題</option>
          </select>

          <div class="ex-answer-setup p-3 bg-light rounded-3">
            <label class="ex-label-small text-muted">
              <i class="bi bi-key-fill me-1"></i>參考答案設定
            </label>

            <div v-if="q.type === 'shortAnswer'">
              <input
                v-model="q.refAnswer"
                type="text"
                class="ex-input"
                placeholder="請輸入參考關鍵字 (學生端不可見)"
              />
            </div>

            <div v-else>
              <div
                v-for="i in q.type === 'multipleChoice' ? 4 : 5"
                :key="i"
                class="d-flex gap-3 mb-2 align-items-center"
              >
                <span class="small fw-bold text-muted" style="min-width: 20px">
                  {{ String.fromCharCode(64 + i) }}
                </span>

                <input
                  v-model="q.options[i - 1]"
                  type="text"
                  class="ex-input py-1"
                  :placeholder="'輸入選項 ' + i + ' 內容...'"
                  required
                />

                <input
                  v-if="q.type === 'multipleChoice'"
                  type="radio"
                  :name="'ans-' + idx"
                  :value="i - 1"
                  v-model="q.answer"
                  class="form-check-input"
                />

                <input
                  v-else
                  type="checkbox"
                  :value="i - 1"
                  v-model="q.multiAnswers"
                  class="form-check-input"
                />
              </div>

              <p
                class="text-muted mt-2 mb-0"
                style="font-size: 0.75rem; font-style: italic"
              >
                * 請勾選正確答案以供系統自動批改參考
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          class="ex-btn-secondary w-100 mb-4"
          @click="addQuestion"
        >
          ＋ 新增題目
        </button>

        <div class="ex-modal-footer">
          <button
            type="button"
            class="ex-btn-secondary"
            @click="$emit('close')"
          >
            取消
          </button>
          <button type="submit" class="ex-btn-primary">確認發佈</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from "vue";
import { rtdb as db } from "../../../firebase/config";
import { ref as dbRef, push, set } from "firebase/database";
import Swal from "sweetalert2";
import "./HomeworkCreate.css";

const props = defineProps({ courseId: String });
const emit = defineEmits(["close"]);

// 1. 表單基本設定
const form = reactive({
  title: "",
  description: "",
  deadline: "", // 截止時間
  allowLate: false, // 是否允許遲交
});

const questions = ref([]);

// 2. 新增題目：初始化所有必要欄位
const addQuestion = () => {
  questions.value.push({
    type: "shortAnswer",
    question: "",
    options: ["", "", "", "", ""], // 支援最大 5 個選項
    answer: 0, // 單選索引
    multiAnswers: [], // 多選索引陣列
    refAnswer: "", // 簡答題答案
  });
};

// 🌟 3. 題型切換重置邏輯：改用主動呼叫，避免 watch 無限迴圈
const handleTypeChange = (q) => {
  // 僅重置與目前題型無關的數據，確保資料純淨
  q.answer = 0;
  q.multiAnswers = [];
  q.refAnswer = "";

  // 統一選項長度，維持強迫症等級的資料整潔
  if (q.options.length < 5) {
    q.options = ["", "", "", "", ""];
  }
};

// 4. 發佈作業邏輯
const createHomework = async () => {
  if (questions.value.length === 0) {
    Swal.fire("提醒", "請至少新增一個題目", "warning");
    return;
  }

  try {
    // 整理儲存結構：根據題型過濾不必要的欄位
    const processedQuestions = questions.value.map((q) => {
      const base = {
        type: q.type,
        question: q.question,
      };

      if (q.type === "shortAnswer") {
        return { ...base, refAnswer: q.refAnswer };
      }

      if (q.type === "multipleChoice") {
        return {
          ...base,
          options: q.options.slice(0, 4), // 單選強制取前 4 項
          answer: q.answer,
        };
      }

      // 多選題邏輯
      return {
        ...base,
        options: q.options.slice(0, 5), // 多選取 5 項
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

    emit("close");
  } catch (error) {
    console.error("發佈失敗:", error);
    Swal.fire("錯誤", "發佈失敗，請稍後再試", "error");
  }
};
</script>
