<template>
  <div class="StuDiscuss animate__animated animate__fadeIn">
    <div class="discuss-modal-content">
      <header
        class="p-3 bg-white border-bottom d-flex justify-content-between align-items-center flex-shrink-0"
      >
        <div class="d-flex align-items-center">
          <div class="rounded-pill p-2 me-3" style="background-color: #efece3">
            <i class="bi bi-chat-dots-fill" style="color: #4a70a9"></i>
          </div>
          <h6 class="fw-bold mb-0" style="color: #35507d">單元互動討論</h6>
        </div>
        <button @click="$emit('close')" class="btn-close"></button>
      </header>

      <main
        class="flex-grow-1 overflow-auto p-4 custom-scrollbar"
        id="discussScroller"
      >
        <div
          v-if="forumData"
          class="mb-5 p-4 rounded-4"
          style="background-color: #ffffff; border-top: 4px solid #4a70a9"
        >
          <h5 class="fw-bold" style="color: #4a70a9">{{ forumData.title }}</h5>
          <p class="text-muted small mb-0">{{ forumData.description }}</p>
        </div>

        <div class="comment-stream">
          <div
            v-for="(msg, idx) in messages"
            :key="msg.id"
            :class="[
              'comment-card',
              {
                'is-me': msg.userId === currentUid,
                'is-reply': msg.content.startsWith('@'), // 🌟 自動辨識是否為回覆
              },
            ]"
          >
            <div class="d-flex justify-content-between align-items-start mb-2">
              <div class="d-flex align-items-center gap-2">
                <span class="author-name">{{ msg.userName }}</span>
                <span class="role-badge">{{
                  msg.role === "teacher" ? "教師" : "學生"
                }}</span>
              </div>
              <span class="comment-time"
                >#{{ idx + 1 }} · {{ formatTime(msg.timestamp) }}</span
              >
            </div>

            <div v-if="msg.content.startsWith('@')" class="reply-quote">
              <i class="bi bi-quote me-1"></i>
              <span class="quote-author">{{ msg.content.split(" ")[0] }}</span>
              <span class="small">的回覆：</span>
            </div>

            <div class="comment-text">
              {{
                msg.content.startsWith("@")
                  ? msg.content.split(" ").slice(1).join(" ")
                  : msg.content
              }}
            </div>

            <button class="reply-trigger" @click="handleReply(msg.userName)">
              <i class="bi bi-reply-fill me-1"></i>回覆
            </button>
          </div>
        </div>

        <div v-if="messages.length === 0" class="text-center py-5 opacity-50">
          <p class="small">暫無討論內容，發表第一則留言吧！</p>
        </div>
      </main>

      <footer class="discuss-footer shadow-lg">
        <div class="input-container shadow-sm">
          <textarea
            v-model="newMessage"
            ref="replyInput"
            class="form-control"
            rows="1"
            placeholder="發表回覆... (Ctrl+Enter 發送)"
            @keyup.ctrl.enter="handleSend"
          ></textarea>
          <button
            @click="handleSend"
            :disabled="!newMessage.trim() || sending"
            class="btn btn-send ms-2"
          >
            <i v-if="!sending" class="bi bi-send-fill"></i>
            <span v-else class="spinner-border spinner-border-sm"></span>
          </button>
        </div>
      </footer>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from "vue";
import { rtdb as db, auth } from "../../../firebase/config";
import {
  ref as dbRef,
  get,
  push,
  set,
  onValue,
  off,
  serverTimestamp,
} from "firebase/database";
import Swal from "sweetalert2";
import "./StuDiscussion.css";
// 🌟 引入 Logger 工具
import { recordStudentAction as recordAction } from "../../../utils/logger.js";

const props = defineProps(["courseId", "unitId", "disId"]);
const emit = defineEmits(["close"]);

const forumData = ref(null);
const messages = ref([]);
const newMessage = ref("");
const loading = ref(true);
const sending = ref(false);
const replyInput = ref(null);

const currentUid = auth.currentUser?.uid;
const userProfile = ref({ name: "學習者", role: "student" });

const formatTime = (ts) => {
  if (!ts) return "";
  const d = new Date(ts);
  return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
};

// 🌟 修正：回覆功能並紀錄行為
const handleReply = (name) => {
  newMessage.value = `@${name} `;
  replyInput.value?.focus();

  // 紀錄行為：點擊回覆按鈕（代表有社交互動意圖）
  recordAction(props.courseId, "點擊回覆他人留言", {
    unitId: props.unitId,
    targetUserName: name,
    discussId: props.disId,
  });
};

onMounted(async () => {
  if (!props.disId) return;

  // 🌟 紀錄 1：進入討論視窗
  recordAction(props.courseId, "進入單元討論區視窗", {
    unitId: props.unitId,
    discussId: props.disId,
  });

  try {
    // 1. 讀取使用者真實姓名與角色
    const userSnap = await get(dbRef(db, `users/${currentUid}`));
    if (userSnap.exists()) {
      const data = userSnap.val();
      userProfile.value = {
        name: data.displayName || data.realName || "學習者",
        role: data.role || "student",
      };
    }

    // 2. 獲取討論話題
    const topicSnap = await get(
      dbRef(db, `courses/${props.courseId}/discussions/${props.disId}`),
    );
    if (topicSnap.exists()) forumData.value = topicSnap.val();

    // 3. 監聽留言流
    onValue(
      dbRef(
        db,
        `courses/${props.courseId}/discussions/${props.disId}/messages`,
      ),
      (snapshot) => {
        const data = snapshot.val();
        if (data) {
          messages.value = Object.entries(data)
            .map(([id, val]) => ({ id, ...val }))
            .sort((a, b) => a.timestamp - b.timestamp);

          nextTick(() => {
            const el = document.getElementById("discussScroller");
            if (el) el.scrollTop = el.scrollHeight;
          });
        }
        loading.value = false;
      },
    );
  } catch (err) {
    loading.value = false;
  }
});

onUnmounted(() => {
  off(
    dbRef(db, `courses/${props.courseId}/discussions/${props.disId}/messages`),
  );
});

const handleSend = async () => {
  if (!newMessage.value.trim() || sending.value) return;

  const messageText = newMessage.value; // 暫存用於紀錄
  sending.value = true;

  try {
    const path = `courses/${props.courseId}/discussions/${props.disId}/messages`;
    await set(push(dbRef(db, path)), {
      userId: currentUid,
      userName: userProfile.value.name,
      role: userProfile.value.role,
      content: messageText,
      timestamp: serverTimestamp(),
    });

    // 🌟 紀錄 2：正式發送留言
    recordAction(props.courseId, "發送討論區留言", {
      unitId: props.unitId,
      discussId: props.disId,
      contentLength: messageText.length,
      isReply: messageText.startsWith("@"),
    });

    newMessage.value = "";
  } catch (err) {
    Swal.fire("發言失敗", "請檢查網路連線", "error");
  } finally {
    sending.value = false;
  }
};
</script>
