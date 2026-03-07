<template>
  <div class="ExamCreate ex-modal-overlay" @click.self="$emit('close')">
    <div class="ex-modal-content">
      <div class="ex-modal-header">
        <h3><i class="bi bi-pencil-square"></i>建立單元測驗</h3>
        <button class="btn-close" @click="$emit('close')"></button>
      </div>

      <form @submit.prevent="createExam" class="ex-form-container">
        <div class="form-section">
          <label class="ex-label">測驗標題</label>
          <input
            v-model="form.title"
            class="ex-input"
            placeholder="例如：期末總複習"
            required
          />
        </div>

        <div class="exam-settings-grid">
          <div>
            <label class="ex-label">截止日期</label>
            <input
              v-model="form.deadline"
              type="datetime-local"
              class="ex-input"
              required
            />
          </div>
          <div>
            <label class="ex-label">時長 (分鐘)</label>
            <input
              v-model="form.duration"
              type="number"
              class="ex-input"
              placeholder="60"
            />
          </div>
          <div class="d-flex align-items-end">
            <div
              class="ex-input d-flex align-items-center justify-content-between py-2 bg-white"
            >
              <span class="small fw-bold">允許遲交</span>
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

        <div
          class="ex-input d-flex align-items-center justify-content-between py-2 bg-white"
          style="border-style: dashed"
        >
          <span class="fw-bold text-navy">交卷後立即顯示成績與解答內容</span>
          <div class="form-check form-switch m-0">
            <input
              class="form-check-input"
              type="checkbox"
              v-model="form.showResult"
            />
          </div>
        </div>

        <hr class="ex-divider" />

        <div class="ex-question-card" v-for="(q, idx) in questions" :key="idx">
          <div class="d-flex justify-content-between align-items-center mb-3">
            <div class="d-flex align-items-center gap-2">
              <span class="badge bg-danger">Q {{ idx + 1 }}</span>
              <input
                v-model="q.point"
                type="number"
                class="ex-input py-1"
                style="width: 80px"
              />
              <span class="small fw-bold">分</span>
            </div>
            <button
              type="button"
              class="btn-close"
              @click="questions.splice(idx, 1)"
            ></button>
          </div>

          <input
            v-model="q.question"
            class="ex-input mb-3"
            placeholder="請輸入問題內容..."
            required
          />

          <select
            v-model="q.type"
            class="ex-select mb-3"
            @change="handleTypeChange(q)"
          >
            <option value="shortAnswer">簡答題</option>
            <option value="multipleChoice">單選題 (4選1)</option>
            <option value="multiSelect">多選題 (5選項)</option>
          </select>

          <div class="ex-answer-setup">
            <label class="ex-label-small text-muted mb-2 d-block"
              >參考答案設定</label
            >

            <div v-if="q.type === 'shortAnswer'">
              <textarea
                v-model="q.refAnswer"
                class="ex-textarea"
                rows="2"
                placeholder="請輸入評分關鍵字或參考答案..."
              ></textarea>
            </div>

            <div v-else>
              <div
                v-for="i in q.type === 'multipleChoice' ? 4 : 5"
                :key="i"
                class="d-flex gap-3 mb-2 align-items-center"
              >
                <span
                  class="small fw-bold text-muted"
                  style="min-width: 20px"
                  >{{ String.fromCharCode(64 + i) }}</span
                >
                <input
                  v-model="q.options[i - 1]"
                  class="ex-input py-1"
                  placeholder="選項內容"
                  required
                />

                <input
                  v-if="q.type === 'multipleChoice'"
                  type="radio"
                  :name="'exans-' + idx"
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
            </div>
          </div>
        </div>

        <button
          type="button"
          class="ex-btn-secondary w-100 mb-4"
          style="border-style: dashed"
          @click="addQuestion"
        >
          ＋ 新增下一道題目
        </button>

        <div class="ex-modal-footer">
          <div class="score-display">總計評分：{{ totalScore }} 分</div>
          <button
            type="button"
            class="ex-btn-secondary"
            @click="$emit('close')"
          >
            取消
          </button>
          <button type="submit" class="ex-btn-primary">發佈測驗</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from "vue";
import { rtdb as db } from "../../../firebase/config";
import { ref as dbRef, push, set } from "firebase/database";
import Swal from "sweetalert2";
import "./ExamCreate.css";

const props = defineProps({ courseId: String });
const emit = defineEmits(["close"]);

// 1. 測驗基本設定：時長、截止、遲交與即時顯示
const form = reactive({
  title: "",
  duration: 60, // 測驗時長(分)
  deadline: "", // 截止時間
  allowLate: false, // 允許遲交
  showResult: true, // 提交後立即顯示成績與答案
});

const questions = ref([]);

// 🌟 自動計算總分：即時掌握評量權重
const totalScore = computed(() => {
  return questions.value.reduce((s, q) => s + (Number(q.point) || 0), 0);
});

// 2. 新增題目：初始化 5 選項以相容多選，並加入簡答欄位
const addQuestion = () => {
  questions.value.push({
    type: "multipleChoice",
    question: "",
    point: 10,
    options: ["", "", "", "", ""],
    answer: 0,
    multiAnswers: [],
    refAnswer: "", // 🌟 簡答題參考答案
  });
};

// 3. 題型切換重置邏輯：確保資料純淨
const handleTypeChange = (q) => {
  q.answer = 0;
  q.multiAnswers = [];
  q.refAnswer = "";
};

// 4. 發佈測驗
const createExam = async () => {
  if (questions.value.length === 0)
    return Swal.fire("提醒", "請至少新增一個題目", "warning");

  try {
    const examData = {
      ...form,
      totalScore: totalScore.value,
      questions: questions.value.map((q) => {
        const base = { type: q.type, question: q.question, point: q.point };

        // 🌟 根據題型過濾儲存資料
        if (q.type === "shortAnswer") {
          return { ...base, refAnswer: q.refAnswer };
        }

        return {
          ...base,
          options:
            q.type === "multipleChoice"
              ? q.options.slice(0, 4)
              : q.options.slice(0, 5),
          finalAnswer: q.type === "multipleChoice" ? q.answer : q.multiAnswers,
        };
      }),
      createdAt: Date.now(),
    };

    await set(push(dbRef(db, `courses/${props.courseId}/exams`)), examData);
    Swal.fire({
      icon: "success",
      title: "測驗已發佈",
      showConfirmButton: false,
      timer: 1500,
    });
    emit("close");
  } catch (error) {
    Swal.fire("錯誤", "發佈失敗，請稍後再試", "error");
  }
};
</script>
