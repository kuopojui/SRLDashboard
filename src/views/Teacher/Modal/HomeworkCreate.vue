<template>
  <div class="ex-modal-overlay" @click.self="$emit('close')">
    <div class="ex-modal-content assignment-theme">
      <div class="ex-modal-header">
        <h3><i class="bi bi-journal-text"></i>建立作業</h3>
        <button class="btn-close" @click="$emit('close')"></button>
      </div>
      <form @submit.prevent="createHomework" class="ex-form-container">
        <div class="mb-4">
          <label class="ex-label">作業標題</label>
          <input
            v-model="form.title"
            type="text"
            class="ex-input"
            placeholder="例如：單元一 單字練習"
            required
          />
        </div>
        <div class="mb-4">
          <label class="ex-label">作業描述</label>
          <textarea
            v-model="form.description"
            class="ex-textarea"
            rows="2"
            placeholder="作業詳細說明..."
          ></textarea>
        </div>

        <div class="ex-question-card" v-for="(q, idx) in questions" :key="idx">
          <div class="d-flex justify-content-between mb-3">
            <span class="badge bg-primary rounded-pill"
              >題目 {{ idx + 1 }}</span
            >
            <button
              type="button"
              class="btn-close small"
              @click="questions.splice(idx, 1)"
            ></button>
          </div>
          <input
            v-model="q.question"
            type="text"
            class="ex-input mb-3"
            placeholder="請輸入問題內容"
          />
          <select v-model="q.type" class="ex-select mb-3">
            <option value="shortAnswer">簡答題</option>
            <option value="multipleChoice">單選題</option>
          </select>
          <div v-if="q.type === 'multipleChoice'">
            <div v-for="i in 4" :key="i" class="d-flex gap-2 mb-2">
              <input
                v-model="q.options[i - 1]"
                type="text"
                class="ex-input py-1"
                :placeholder="'選項 ' + i"
              />
              <input
                type="radio"
                :name="'ans-' + idx"
                :value="i - 1"
                v-model="q.answer"
              />
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
import "./create.css";

const props = defineProps({ courseId: String });
const emit = defineEmits(["close"]);
const form = reactive({ title: "", description: "" });
const questions = ref([]);

const addQuestion = () =>
  questions.value.push({
    type: "shortAnswer",
    question: "",
    options: ["", "", "", ""],
    answer: 0,
  });

const createHomework = async () => {
  await set(push(dbRef(db, `courses/${props.courseId}/assignments`)), {
    ...form,
    questions: questions.value,
    createdAt: Date.now(),
  });
  emit("close");
};
</script>

<style scoped>
.assignment-theme {
  --theme-color: #3a5a8a;
  --theme-soft: rgba(58, 90, 138, 0.1);
}
</style>
