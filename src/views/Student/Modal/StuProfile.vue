<template>
  <Transition name="modal-fade">
    <div class="StuProfile-overlay" @click.self="$emit('close')">
      <div class="StuProfile-box animate__animated animate__zoomIn">
        <div class="StuProfile-header bg-navy text-white">
          <h5 class="m-0">
            <i class="bi bi-person-badge me-2"></i>個人學習檔案
          </h5>
          <button
            @click="$emit('close')"
            class="btn-close btn-close-white"
          ></button>
        </div>

        <div class="StuProfile-content p-4 custom-scrollbar">
          <section
            class="profile-editor mb-4 p-3 rounded-4 bg-light-soft border"
          >
            <h6 class="fw-bold mb-3 text-navy small">
              <i class="bi bi-pencil-square me-2"></i>身分識別設定
            </h6>
            <div class="row g-2">
              <div class="col-6">
                <label class="xx-small fw-bold text-muted mb-1">真實姓名</label>
                <input
                  v-model="profile.realName"
                  class="form-control form-control-sm"
                  placeholder="輸入姓名"
                />
              </div>
              <div class="col-6">
                <label class="xx-small fw-bold text-muted mb-1"
                  >學號 / 座號</label
                >
                <input
                  v-model="profile.studentId"
                  class="form-control form-control-sm"
                  placeholder="輸入座號"
                />
              </div>
              <div class="col-12 mt-2">
                <label class="xx-small fw-bold text-muted mb-1">自訂暱稱</label>
                <div class="d-flex gap-2">
                  <input
                    v-model="profile.nickname"
                    class="form-control form-control-sm"
                    placeholder="給自己的代號"
                  />
                  <button
                    @click="saveProfile"
                    class="btn btn-navy btn-sm px-3 rounded-pill"
                  >
                    儲存
                  </button>
                </div>
              </div>
            </div>
          </section>

          <div class="stats-row mb-4">
            <div class="stat-card">
              <div class="stat-val">{{ totalReadTime }}</div>
              <div class="stat-label">累積學習 (分)</div>
            </div>
            <div class="stat-card">
              <div class="stat-val">{{ aiChatCount }}</div>
              <div class="stat-label">AI 諮詢次數</div>
            </div>
          </div>

          <div
            class="reflection-box p-3 rounded-3 bg-light border-start border-primary border-4"
          >
            <h6 class="fw-bold mb-2">我的 AI 學習診斷</h6>
            <p class="small text-muted mb-0">
              {{ lastAiAdvice || "點擊儀表板 AI 分析按鈕以產生成績診斷。" }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, onMounted, computed, reactive } from "vue";
import { rtdb } from "../../../firebase/config";
import {
  ref as dbRef,
  onValue,
  update,
  serverTimestamp,
} from "firebase/database";
import Swal from "sweetalert2";
import "./StuProfile.css";

const props = defineProps({
  uid: { type: String, required: true },
  courseId: { type: String, default: "system_global" },
});

const totalReadTime = ref(0);
const aiChatCount = ref(0);
const lastAiAdvice = ref("");

// 🌟 擴充個人設定狀態
const profile = reactive({
  displayName: "", // 系統預設顯示名
  nickname: "", // 自訂暱稱
  realName: "", // 真實姓名
  studentId: "", // 學號/座號
});

onMounted(() => {
  if (!props.uid) return;

  // 1. 讀取個人詳細資料
  onValue(dbRef(rtdb, `users/${props.uid}`), (snap) => {
    if (snap.exists()) {
      const data = snap.val();
      profile.displayName = data.displayName || "";
      profile.nickname = data.nickname || "";
      profile.realName = data.realName || "";
      profile.studentId = data.studentId || "";
    }
  });

  // 2. 數據路徑邏輯 (維持原有的 system_global 判斷)
  const logPath =
    props.courseId === "system_global"
      ? `system_logs/${props.uid}`
      : `courses/${props.courseId}/logs/${props.uid}`;

  const aiPath =
    props.courseId === "system_global"
      ? `system_ai_history/${props.uid}`
      : `courses/${props.courseId}/ai_history/${props.uid}`;

  // 計算統計數據 (停留時間、AI 諮詢次數)
  onValue(dbRef(rtdb, logPath), (snap) => {
    if (snap.exists()) {
      const logs = Object.values(snap.val());
      const totalSeconds = logs.reduce(
        (acc, log) =>
          acc +
          (log.details?.stay_seconds || log.details?.duration_seconds || 0),
        0,
      );
      totalReadTime.value = Math.round(totalSeconds / 60);
    }
  });

  onValue(dbRef(rtdb, aiPath), (snap) => {
    if (snap.exists()) {
      const history = Object.values(snap.val());
      aiChatCount.value = history.length;
      const lastItem = history[history.length - 1];
      lastAiAdvice.value = lastItem.response || lastItem.answer || "";
    }
  });
});

// 🌟 儲存所有個人資料
const saveProfile = async () => {
  try {
    await update(dbRef(rtdb, `users/${props.uid}`), {
      realName: profile.realName,
      studentId: profile.studentId,
      nickname: profile.nickname,
      lastUpdated: serverTimestamp(),
    });
    Swal.fire({
      icon: "success",
      title: "學習資料已儲存",
      timer: 1500,
      showConfirmButton: false,
    });
  } catch (e) {
    Swal.fire("錯誤", "儲存失敗", "error");
  }
};
</script>
