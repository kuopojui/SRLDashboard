<template>
  <Transition name="modal-fade">
    <div class="TrProfile-overlay" @click.self="$emit('close')">
      <div class="TrProfile-card shadow-lg">
        <div class="TrProfile-header bg-navy text-white">
          <div class="d-flex align-items-center">
            <div class="avatar-circle-white me-3">
              {{ profile.displayName?.charAt(0) || "T" }}
            </div>
            <div>
              <h5 class="mb-0 fw-bold">帳號與教學設定</h5>
              <small class="opacity-75">UID: {{ student.uid }}</small>
            </div>
          </div>
          <button class="btn-close-custom text-white" @click="$emit('close')">
            ✕
          </button>
        </div>

        <div class="TrProfile-body custom-scrollbar p-4">
          <section class="mb-4 pb-4 border-bottom">
            <h6 class="section-title text-navy mb-3">
              <i class="bi bi-person-gear me-2"></i>基本資料
            </h6>
            <div class="row g-3">
              <div class="col-md-6">
                <label class="form-label small fw-bold">真實姓名</label>
                <input
                  v-model="profile.realName"
                  class="form-control"
                  placeholder="請輸入姓名"
                />
              </div>
              <div class="col-md-6">
                <label class="form-label small fw-bold">教學暱稱</label>
                <input
                  v-model="profile.displayName"
                  class="form-control"
                  placeholder="例如：王小明老師"
                />
              </div>
            </div>
          </section>

          <section class="mb-4 pb-4 border-bottom">
            <h6 class="section-title text-navy mb-3">
              <i class="bi bi-eye me-2"></i>學生名單顯示選項
            </h6>
            <p class="xx-small text-muted mb-3">
              此設定將影響您在班級列表與數據看板中看到的學生名稱格式。
            </p>
            <div class="display-options d-flex flex-wrap gap-2">
              <button
                v-for="opt in displayConfigs"
                :key="opt.value"
                :class="[
                  'btn-option',
                  profile.studentNameDisplay === opt.value ? 'active' : '',
                ]"
                @click="profile.studentNameDisplay = opt.value"
              >
                {{ opt.label }}
              </button>
            </div>
          </section>

          <section class="mt-4">
            <div class="d-flex justify-content-between align-items-center mb-3">
              <h6 class="section-title mb-0">
                <i class="bi bi-clock-history me-2"></i>近期系統紀錄
              </h6>
              <button class="btn btn-navy btn-sm py-1" @click="saveProfile">
                保存所有設定
              </button>
            </div>
            <div class="log-list mini-log">
              <div v-for="log in actionLogs" :key="log.id" class="log-item">
                <small class="text-muted">{{
                  new Date(log.timestamp).toLocaleDateString()
                }}</small>
                <span class="ms-2">{{ log.action }}</span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, onMounted, reactive } from "vue";
import { rtdb } from "../../../firebase/config";
import {
  ref as dbRef,
  onValue,
  query,
  limitToLast,
  update,
} from "firebase/database";
import Swal from "sweetalert2";
import "./TrProfile.css";

const props = defineProps({
  student: Object, // 這裡傳入的是當前登入的教師資料
  courseId: String,
});

// 教師設定狀態
const profile = reactive({
  realName: "",
  displayName: "",
  studentNameDisplay: "name", // 預設：僅顯示姓名
});

const displayConfigs = [
  { label: "僅姓名", value: "name" },
  { label: "僅暱稱", value: "nickname" },
  { label: "姓名 (座號)", value: "name_id" },
  { label: "UID", value: "uid" },
];

const actionLogs = ref([]);

onMounted(() => {
  const teacherId = props.student.uid;

  // 🌟 讀取教師個人設定 (對接 Firebase 路徑: users/{uid})
  onValue(dbRef(rtdb, `users/${teacherId}`), (snap) => {
    if (snap.exists()) {
      const data = snap.val();
      profile.realName = data.realName || "";
      profile.displayName = data.displayName || "";
      profile.studentNameDisplay = data.studentNameDisplay || "name";
    }
  });

  // 🌟 讀取系統紀錄 (原有功能)
  onValue(
    query(dbRef(rtdb, `system_logs/${teacherId}`), limitToLast(10)),
    (snap) => {
      actionLogs.value = snap.exists()
        ? Object.values(snap.val()).reverse()
        : [];
    },
  );
});

// 保存設定至 Firebase
const saveProfile = async () => {
  try {
    await update(dbRef(rtdb, `users/${props.student.uid}`), {
      realName: profile.realName,
      displayName: profile.displayName,
      studentNameDisplay: profile.studentNameDisplay,
      updatedAt: Date.now(),
    });

    Swal.fire({
      icon: "success",
      title: "設定已儲存",
      timer: 1500,
      showConfirmButton: false,
    });
  } catch (e) {
    Swal.fire("錯誤", "儲存失敗", "error");
  }
};
</script>
