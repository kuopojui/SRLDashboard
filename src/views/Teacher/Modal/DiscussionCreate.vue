<template>
  <div class="DiscussionCreate ex-modal-overlay" @click.self="emitClose">
    <div
      class="ex-modal-content discussion-theme animate__animated animate__fadeInUp"
    >
      <div class="ex-modal-header">
        <h3 class="modal-title-navy">
          <i class="bi bi-chat-dots me-2"></i>發起討論話題
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
        @submit.prevent="createDiscussion"
        class="ex-form-container custom-scrollbar"
      >
        <div class="form-body">
          <div class="mb-4">
            <label class="ex-label-small text-secondary fw-bold mb-2"
              >討論主題</label
            >
            <input
              v-model="form.title"
              type="text"
              class="ex-input-field"
              placeholder="請輸入一個吸引人的標題..."
              required
            />
          </div>

          <div class="mb-4">
            <label class="ex-label-small text-secondary fw-bold mb-2"
              >引言描述</label
            >
            <textarea
              v-model="form.description"
              class="ex-textarea-field"
              rows="6"
              placeholder="您可以提供討論背景、參考資料，或提出關鍵問題引導學生思考..."
            ></textarea>
          </div>

          <div class="row g-3 mb-4">
            <div class="col-md-7 col-12">
              <label class="ex-label-small text-secondary fw-bold mb-2"
                >截止日期 (選填)</label
              >
              <input
                v-model="form.deadline"
                type="datetime-local"
                class="ex-input-field"
              />
            </div>
            <div class="col-md-5 col-12 d-flex align-items-end">
              <div class="toggle-box-navy">
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
        </div>

        <div class="ex-modal-footer">
          <button type="submit" class="ex-btn-navy-action">確認發佈話題</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { reactive, onMounted, onUnmounted } from "vue";
import { rtdb as db } from "../../../firebase/config";
import { ref as dbRef, push, set } from "firebase/database";
import Swal from "sweetalert2";
import "./DiscussionCreate.css";

const props = defineProps({ courseId: String });
const emit = defineEmits(["close"]);

const form = reactive({
  title: "",
  description: "",
  deadline: "",
  isPinned: false,
});

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

const createDiscussion = async () => {
  if (!form.title.trim()) return Swal.fire("提醒", "請輸入討論主題", "warning");

  try {
    const discussionData = {
      ...form,
      createdAt: Date.now(),
      status: "active",
      authorId: "teacher",
      participantCount: 0,
      courseId: props.courseId,
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

    emitClose();
  } catch (error) {
    Swal.fire("錯誤", "無法建立討論", "error");
  }
};
</script>
