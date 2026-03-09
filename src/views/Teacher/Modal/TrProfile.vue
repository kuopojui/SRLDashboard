<template>
  <Transition name="modal-fade">
    <div class="TrProfile TrProfile-overlay" @click.self="$emit('close')">
      <div class="TrProfile-card shadow-lg animate__animated animate__zoomIn">
        <div
          class="TrProfile-header text-white"
          style="background-color: #4a70a9"
        >
          <div class="d-flex align-items-center justify-content-between w-100">
            <div class="d-flex align-items-center">
              <div>
                <h5 class="mb-0 fw-bold">帳號與教學設定</h5>
              </div>
            </div>
            <button
              type="button"
              class="btn-close-red p-0 border-0 fs-4"
              @click="$emit('close')"
            >
              ✕
            </button>
          </div>
        </div>

        <div
          class="TrProfile-body custom-scrollbar p-4"
          style="background-color: #efece3"
        >
          <section class="mb-4 pb-4 border-bottom border-secondary-subtle">
            <h6 class="section-title fw-bold mb-3" style="color: #4a70a9">
              <i class="bi bi-person-gear me-2"></i>基本資料
            </h6>
            <div class="row g-3">
              <div class="col-12 col-md-6">
                <label class="form-label small fw-bold text-muted"
                  >真實姓名</label
                >
                <input
                  v-model="profile.realName"
                  class="form-control border-0 shadow-sm py-2"
                  placeholder="請輸入姓名"
                />
              </div>
              <div class="col-12 col-md-6">
                <label class="form-label small fw-bold text-muted"
                  >教學暱稱</label
                >
                <input
                  v-model="profile.displayName"
                  class="form-control border-0 shadow-sm py-2"
                  placeholder="例如：王小明老師"
                />
              </div>
            </div>
          </section>

          <section class="mb-5">
            <h6 class="section-title fw-bold mb-3" style="color: #4a70a9">
              <i class="bi bi-eye me-2"></i>學生名單顯示方式
            </h6>
            <p class="xx-small text-muted mb-3">
              設定班級列表與數據看板中學生的名稱格式
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

          <div class="d-grid gap-2">
            <button
              class="btn py-2 rounded-pill fw-bold text-white shadow-sm"
              style="background-color: #4a70a9"
              @click="saveProfile"
            >
              <i class="bi bi-check-lg me-2"></i>儲存所有設定
            </button>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { reactive, onMounted } from "vue";
import { rtdb } from "../../../firebase/config";
import { ref as dbRef, onValue, update } from "firebase/database";
import Swal from "sweetalert2";

const props = defineProps({
  student: Object,
  courseId: String,
});

const profile = reactive({
  realName: "",
  displayName: "",
  studentNameDisplay: "name",
});

/* 學生顯示配置：已移除暱稱 */
const displayConfigs = [
  { label: "僅姓名", value: "name" },
  { label: "姓名 (座號)", value: "name_id" },
  { label: "完整 UID", value: "uid" },
];

onMounted(() => {
  const teacherId = props.student.uid;
  onValue(dbRef(rtdb, `users/${teacherId}`), (snap) => {
    if (snap.exists()) {
      const data = snap.val();
      profile.realName = data.realName || "";
      profile.displayName = data.displayName || "";
      profile.studentNameDisplay = data.studentNameDisplay || "name";
    }
  });
});

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
      timer: 1200,
      showConfirmButton: false,
    });
  } catch (e) {
    Swal.fire("錯誤", "儲存失敗", "error");
  }
};
</script>
