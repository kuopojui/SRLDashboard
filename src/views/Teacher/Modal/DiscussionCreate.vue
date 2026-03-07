<template>
  <div class="DiscussionCreate ex-modal-overlay" @click.self="$emit('close')">
    <div class="ex-modal-content">
      <div class="ex-modal-header">
        <h3><i class="bi bi-chat-dots"></i>發起討論話題</h3>
        <button class="btn-close" @click="$emit('close')"></button>
      </div>

      <form @submit.prevent="createDiscussion" class="ex-form-container">
        <div class="form-section">
          <label class="ex-label">討論主題</label>
          <input
            v-model="form.title"
            type="text"
            class="ex-input"
            placeholder="請輸入一個吸引人的標題..."
            required
          />
        </div>

        <div class="form-section">
          <label class="ex-label">引言描述</label>
          <textarea
            v-model="form.description"
            class="ex-textarea"
            rows="5"
            placeholder="您可以提供討論背景、參考資料，或提出關鍵問題引導學生思考..."
          ></textarea>
        </div>

        <div class="setting-grid">
          <div>
            <label class="ex-label">截止日期 (選填)</label>
            <input
              v-model="form.deadline"
              type="datetime-local"
              class="ex-input"
            />
          </div>
          <div>
            <label class="ex-label">話題規範</label>
            <div class="toggle-box">
              <span class="small fw-bold text-navy">置頂話題</span>
              <div class="form-check form-switch m-0">
                <input
                  class="form-check-input"
                  type="checkbox"
                  v-model="form.isPinned"
                />
              </div>
            </div>
          </div>
        </div>

        <div class="ex-modal-footer">
          <button
            type="button"
            class="ex-btn-secondary"
            @click="$emit('close')"
          >
            取消
          </button>
          <button type="submit" class="ex-btn-primary">確認發佈話題</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { reactive } from "vue";
import { rtdb as db } from "../../../firebase/config";
import { ref as dbRef, push, set } from "firebase/database";
import Swal from "sweetalert2";
import "./DiscussionCreate.css"; // 建議將 CSS 命名改為更具體

const props = defineProps({ courseId: String });
const emit = defineEmits(["close"]);

// 1. 討論區基本設定：包含置頂選項與截止時間
const form = reactive({
  title: "",
  description: "",
  deadline: "", // 截止時間
  isPinned: false, // 額外新增：是否置頂話題，方便管理
});

// 2. 發起討論邏輯
const createDiscussion = async () => {
  if (!form.title.trim()) return Swal.fire("提醒", "請輸入討論主題", "warning");

  try {
    const discussionData = {
      ...form,
      createdAt: Date.now(),
      status: "active",
      authorId: "teacher", // 或根據您的系統邏輯帶入 UID
      participantCount: 0,
    };

    const newDiscussionRef = push(
      dbRef(db, `courses/${props.courseId}/discussions`),
    );
    await set(newDiscussionRef, discussionData);

    Swal.fire({
      icon: "success",
      title: "話題已發佈",
      showConfirmButton: false,
      timer: 1500,
    });

    emit("close");
  } catch (error) {
    console.error("發佈失敗:", error);
    Swal.fire("錯誤", "無法建立討論，請稍後再試", "error");
  }
};
</script>
