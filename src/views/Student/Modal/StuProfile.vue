<template>
  <Transition name="modal-fade">
    <div class="StuProfile-overlay" @click.self="$emit('close')">
      <div class="StuProfile-box animate__animated animate__zoomIn">
        <div
          class="StuProfile-header d-flex justify-content-between align-items-center text-white"
        >
          <h5 class="m-0 fw-bold">
            <i class="bi bi-person-badge-fill me-2"></i>個人學習檔案
          </h5>
          <button
            @click="$emit('close')"
            class="btn-close btn-close-white"
          ></button>
        </div>

        <div class="StuProfile-content p-4 custom-scrollbar overflow-auto">
          <section class="profile-editor mb-4 p-4 rounded-4">
            <h6 class="fw-bold mb-3 text-navy small">
              <i class="bi bi-pencil-square me-2"></i>身分識別設定
            </h6>
            <div class="row g-3">
              <div class="col-6">
                <label class="xx-small fw-bold text-muted mb-1">真實姓名</label>
                <input
                  v-model="profile.realName"
                  class="form-control form-control-sm rounded-3 shadow-none border-light-deep"
                  placeholder="您的姓名"
                />
              </div>
              <div class="col-6">
                <label class="xx-small fw-bold text-muted mb-1"
                  >學號 / 座號</label
                >
                <input
                  v-model="profile.studentId"
                  class="form-control form-control-sm rounded-3 shadow-none border-light-deep"
                  placeholder="座號"
                />
              </div>
              <div class="col-12 mt-2">
                <label class="xx-small fw-bold text-muted mb-1"
                  >自訂暱稱 (討論區顯示)</label
                >
                <div class="d-flex gap-2">
                  <input
                    v-model="profile.nickname"
                    class="form-control form-control-sm rounded-3 shadow-none border-light-deep"
                    placeholder="想被稱呼的代號"
                  />
                  <button
                    @click="handleSave"
                    class="btn btn-navy btn-sm px-4 rounded-pill text-white fw-bold"
                  >
                    儲存
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { rtdb, auth } from "../../../firebase/config";
import { ref as dbRef, get, update } from "firebase/database";
import Swal from "sweetalert2";
import "./StuProfile.css";

// 接收父組件傳入的 uid
const props = defineProps({
  uid: String,
  courseId: String, // 保留以相容父組件傳參，但不再用於存檔路徑判斷
});
const emit = defineEmits(["close"]);

// 學生資料狀態
const profile = ref({
  realName: "",
  studentId: "",
  nickname: "",
});

/**
 * 1. 從最外層 users 節點讀取身分資料
 */
const fetchProfile = async () => {
  // 優先使用 props.uid，若無則嘗試從 auth 抓取
  const uid = props.uid || auth.currentUser?.uid;
  if (!uid) return;

  try {
    // 🌟 修正路徑：指向最外層 users/${uid}/profile
    const snap = await get(dbRef(rtdb, `users/${uid}/profile`));
    if (snap.exists()) {
      profile.value = { ...profile.value, ...snap.val() };
    }
  } catch (err) {
    console.error("讀取全域個人資料失敗:", err);
  }
};

/**
 * 2. 儲存資料到最外層 users 節點
 */
const handleSave = async () => {
  const uid = props.uid || auth.currentUser?.uid;

  // 🌟 修正檢查邏輯：移除對 courseId 的檢查，只要有 uid 即可儲存
  if (!uid) {
    Swal.fire("錯誤", "無法識別使用者身分", "error");
    return;
  }

  try {
    // 🌟 修正寫入路徑：儲存於全域使用者節點
    const savePath = `users/${uid}/profile`;

    await update(dbRef(rtdb, savePath), {
      realName: profile.value.realName,
      studentId: profile.value.studentId,
      nickname: profile.value.nickname,
      lastUpdated: Date.now(),
    });

    Swal.fire({
      icon: "success",
      title: "資料已儲存",
      toast: true,
      position: "top-end",
      timer: 2000,
      showConfirmButton: false,
    });
  } catch (err) {
    console.error("儲存失敗:", err);
    Swal.fire("錯誤", "儲存失敗，請檢查網路連線", "error");
  }
};

onMounted(() => {
  fetchProfile();
});
</script>
