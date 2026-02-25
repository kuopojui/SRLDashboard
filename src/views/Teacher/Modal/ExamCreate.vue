<template>
  <div class="ex-modal-overlay" @click.self="$emit('close')">
    <div class="ex-modal-content exam-theme">
      <div class="ex-modal-header">
        <h3><i class="bi bi-pencil-square"></i>建立測驗</h3>
        <button class="btn-close" @click="$emit('close')"></button>
      </div>
      <form @submit.prevent="createExam" class="ex-form-container">
        <div class="row">
          <div class="col-md-8 mb-4">
            <label class="ex-label">測驗名稱</label
            ><input v-model="form.title" class="ex-input" required />
          </div>
          <div class="col-md-4 mb-4">
            <label class="ex-label">時長(分)</label
            ><input v-model="form.duration" type="number" class="ex-input" />
          </div>
        </div>

        <div class="ex-question-card" v-for="(q, idx) in questions" :key="idx">
          <div class="d-flex justify-content-between mb-3">
            <div class="d-flex align-items-center gap-2">
              <span class="badge bg-danger rounded-pill">Q {{ idx + 1 }}</span>
              <input
                v-model="q.point"
                type="number"
                class="ex-input py-1"
                style="width: 70px"
                placeholder="分數"
              />
            </div>
            <button
              type="button"
              class="btn-close"
              @click="questions.splice(idx, 1)"
            ></button>
          </div>
          <input
            v-model="q.question"
            class="ex-input mb-2"
            placeholder="題目內容"
          />
          <div v-for="i in 4" :key="i" class="d-flex gap-2 mb-1">
            <input
              v-model="q.options[i - 1]"
              class="ex-input py-1"
              :placeholder="'選項 ' + i"
            />
            <input
              type="radio"
              :name="'exans-' + idx"
              :value="i - 1"
              v-model="q.answer"
            />
          </div>
        </div>

        <button
          type="button"
          class="ex-btn-secondary w-100 mb-4"
          @click="addQuestion"
        >
          ＋ 新增單選題
        </button>

        <div class="ex-modal-footer">
          <div class="me-auto fw-bold text-danger">總分: {{ totalScore }}</div>
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
import { ref, reactive, computed } from "vue";
import { rtdb as db } from "../../../firebase/config";
import { ref as dbRef, push, set } from "firebase/database";
import "./create.css";

const props = defineProps({ courseId: String });
const emit = defineEmits(["close"]);
const form = reactive({ title: "", duration: 0 });
const questions = ref([]);
const totalScore = computed(() =>
  questions.value.reduce((s, q) => s + (q.point || 0), 0),
);

const addQuestion = () =>
  questions.value.push({
    question: "",
    options: ["", "", "", ""],
    answer: 0,
    point: 10,
  });

const createExam = async () => {
  await set(push(dbRef(db, `courses/${props.courseId}/exams`)), {
    ...form,
    questions: questions.value,
    createdAt: Date.now(),
  });
  emit("close");
};
</script>

<style scoped>
.exam-theme {
  --theme-color: #e11d48;
  --theme-soft: rgba(225, 29, 72, 0.1);
}
</style>
