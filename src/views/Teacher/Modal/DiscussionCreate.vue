<template>
  <div class="ex-modal-overlay" @click.self="$emit('close')">
    <div class="ex-modal-content discussion-theme">
      <div class="ex-modal-header">
        <h3><i class="bi bi-chat-dots"></i>發起討論話題</h3>
        <button class="btn-close" @click="$emit('close')"></button>
      </div>
      <form @submit.prevent="createDiscussion" class="ex-form-container">
        <div class="mb-4">
          <label class="ex-label">討論主題</label>
          <input
            v-model="form.title"
            type="text"
            class="ex-input"
            placeholder="輸入話題標題"
            required
          />
        </div>
        <div class="mb-4">
          <label class="ex-label">引言描述</label>
          <textarea
            v-model="form.description"
            class="ex-textarea"
            rows="5"
            placeholder="輸入討論背景或引導問題..."
          ></textarea>
        </div>
        <div class="mb-4">
          <label class="ex-label">截止日期 (選填)</label>
          <input v-model="form.deadline" type="date" class="ex-input" />
        </div>
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
import { reactive } from "vue";
import { rtdb as db } from "../../../firebase/config";
import { ref as dbRef, push, set } from "firebase/database";
import "./create.css";

const props = defineProps({ courseId: String });
const emit = defineEmits(["close"]);
const form = reactive({ title: "", description: "", deadline: "" });

const createDiscussion = async () => {
  await set(push(dbRef(db, `courses/${props.courseId}/discussions`)), {
    ...form,
    createdAt: Date.now(),
    status: "active",
  });
  emit("close");
};
</script>

<style scoped>
.discussion-theme {
  --theme-color: #9333ea;
  --theme-soft: rgba(147, 51, 234, 0.1);
}
</style>
