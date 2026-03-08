<template>
  <div
    class="StuDiscuss h-100 d-flex flex-column animate__animated animate__fadeIn"
  >
    <header
      class="p-3 border-bottom bg-white d-flex justify-content-between align-items-center flex-shrink-0 shadow-sm"
    >
      <div class="d-flex align-items-center">
        <button
          @click="$emit('close')"
          class="btn btn-sm btn-outline-secondary rounded-pill me-3"
        >
          <i class="bi bi-arrow-left me-1"></i>返回單元
        </button>
        <h6 class="fw-bold mb-0 text-navy">單元互動討論區</h6>
      </div>
      <div
        v-if="loading"
        class="spinner-border spinner-border-sm text-primary"
      ></div>
    </header>

    <div class="flex-grow-1 overflow-hidden d-flex flex-column">
      <main class="flex-grow-1 overflow-auto p-3 p-md-4">
        <div
          v-if="forumData"
          class="topic-intro-card animate__animated animate__fadeInDown"
        >
          <div class="d-flex align-items-center mb-2">
            <span class="badge bg-navy-soft text-navy me-2">本單元話題</span>
            <small class="text-muted"
              >發起日期：{{ formatDate(forumData.createdAt) }}</small
            >
          </div>
          <h5 class="fw-bold text-dark mb-2">{{ forumData.title }}</h5>
          <p class="text-secondary small mb-0">{{ forumData.description }}</p>
        </div>

        <div class="chat-stream">
          <div
            v-for="msg in messages"
            :key="msg.id"
            :class="[
              'message-item',
              msg.userId === currentUid ? 'is-me' : 'is-other',
            ]"
          >
            <div
              class="d-flex justify-content-between align-items-center mb-1 gap-3"
            >
              <small class="fw-bold">{{ msg.userName }}</small>
              <small class="opacity-50" style="font-size: 0.65rem">{{
                formatTime(msg.timestamp)
              }}</small>
            </div>
            <div class="message-body text-break">{{ msg.content }}</div>
          </div>

          <div
            v-if="!loading && messages.length === 0"
            class="text-center py-5 opacity-50"
          >
            <img
              src="https://img.icons8.com/bubbles/100/null/ask-question.png"
              class="mb-3"
            />
            <p class="small">還沒有人發言，分享您的看法吧！</p>
          </div>
        </div>
      </main>

      <footer class="chat-footer flex-shrink-0 shadow-lg">
        <div class="d-flex gap-2">
          <input
            v-model="newMessage"
            type="text"
            class="form-control input-pill flex-grow-1"
            placeholder="在此輸入您的想法..."
            @keyup.enter="handleSend"
          />
          <button
            @click="handleSend"
            :disabled="!newMessage.trim() || sending"
            class="btn btn-navy rounded-circle d-flex align-items-center justify-content-center"
            style="width: 46px; height: 46px"
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
import { ref, onMounted, onUnmounted } from "vue";
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
import "./StuDiscussion.css"; // 🌟 引入獨立 CSS

const props = defineProps(["courseId", "unitId", "disId"]);
const emit = defineEmits(["close"]);

const forumData = ref(null);
const messages = ref([]);
const newMessage = ref("");
const loading = ref(true);
const sending = ref(false);
const currentUid = auth.currentUser?.uid;
const currentUserName = ref("學習者");

// 工具函數
const formatDate = (ts) => (ts ? new Date(ts).toLocaleDateString() : "N/A");
const formatTime = (ts) =>
  ts
    ? new Date(ts).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

onMounted(async () => {
  if (!props.disId) return;

  try {
    // 1. 獲取用戶名稱
    const userSnap = await get(dbRef(db, `users/${currentUid}/name`));
    if (userSnap.exists()) currentUserName.value = userSnap.val();

    // 2. 獲取討論主題
    const topicSnap = await get(
      dbRef(db, `courses/${props.courseId}/discussions/${props.disId}`),
    );
    if (topicSnap.exists()) forumData.value = topicSnap.val();

    // 3. 實時監聽留言流
    const msgPath = `courses/${props.courseId}/discussions/${props.disId}/messages`;
    onValue(dbRef(db, msgPath), (snapshot) => {
      const data = snapshot.val();
      if (data) {
        messages.value = Object.entries(data)
          .map(([id, val]) => ({ id, ...val }))
          .sort((a, b) => a.timestamp - b.timestamp);
      } else {
        messages.value = [];
      }
      loading.value = false;
    });
  } catch (err) {
    console.error("載入討論失敗:", err);
    loading.value = false;
  }
});

// 組件卸載時務必關閉 Firebase 監聽器
onUnmounted(() => {
  const msgPath = `courses/${props.courseId}/discussions/${props.disId}/messages`;
  off(dbRef(db, msgPath));
});

const handleSend = async () => {
  if (!newMessage.value.trim() || sending.value) return;

  sending.value = true;
  try {
    const msgPath = `courses/${props.courseId}/discussions/${props.disId}/messages`;
    const newMsgRef = push(dbRef(db, msgPath));

    await set(newMsgRef, {
      userId: currentUid,
      userName: currentUserName.value,
      content: newMessage.value,
      timestamp: serverTimestamp(),
    });

    newMessage.value = "";
    // 捲動到底部的邏輯可透過 nextTick 實作
  } catch (err) {
    Swal.fire("發送失敗", "請檢查您的網路連線", "error");
  } finally {
    sending.value = false;
  }
};
</script>
