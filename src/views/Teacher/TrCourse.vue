<template>
  <div class="CoursePage d-flex min-vh-100">
    <aside class="CoursePage-sidebar d-none d-lg-flex flex-column py-4 shadow">
      <div class="sidebar-brand px-4 mb-5">
        <h5 class="fw-bold text-white mb-0">
          <i class="bi bi-shield-check me-2"></i>課程管理中心
        </h5>
      </div>

      <nav class="flex-grow-1 px-2">
        <div class="CoursePage-nav-item active">
          <i class="bi bi-grid-fill me-3"></i>我的課程
        </div>
        <div class="CoursePage-nav-item" @click="showProfileModal = true">
          <i class="bi bi-person-circle me-3"></i>帳號設定
        </div>
      </nav>

      <div class="mt-auto px-3">
        <button class="btn btn-logout w-100 rounded-pill" @click="handleLogout">
          <i class="bi bi-box-arrow-left me-2"></i>登出系統
        </button>
      </div>
    </aside>

    <main class="flex-grow-1 d-flex flex-column">
      <header class="mobile-header d-lg-none p-3 shadow-sm text-white">
        <div class="d-flex justify-content-between align-items-center">
          <h6 class="mb-0 fw-bold">課程管理中心</h6>
          <button class="hamburger-btn" @click="toggleSidebar">
            <span class="hamburger-line"></span>
          </button>
        </div>
      </header>

      <section class="container-fluid px-4 pt-4 pb-2">
        <div
          class="d-flex flex-column flex-md-row justify-content-between align-items-md-end gap-3 mb-4"
        >
          <div>
            <h2 class="fw-bold text-dark mb-1">所有單元課程</h2>
            <p class="text-muted small mb-0">
              歡迎回來，您目前管理 {{ filteredCourses.length }} 門課程
            </p>
          </div>
          <button
            class="btn btn-navy shadow-sm rounded-pill px-4 py-2"
            @click="showModal = true"
          >
            <i class="bi bi-plus-lg me-2"></i>新建課程單元
          </button>
        </div>
      </section>

      <section class="course-scroll-area container-fluid px-4 pb-5">
        <div class="row g-4">
          <div
            class="col-12 col-md-6 col-xl-4"
            v-for="course in filteredCourses"
            :key="course.id"
          >
            <div
              class="course-card shadow-sm border-0 bg-white p-3 rounded-4"
              @click="goToCourse(course)"
            >
              <div class="d-flex align-items-center gap-3 mb-3">
                <div class="avatar-circle-navy">
                  {{ course.title?.substring(0, 1) || "?" }}
                </div>
                <div class="flex-grow-1">
                  <h5 class="fw-bold text-navy mb-0 text-truncate">
                    {{ course.title }}
                  </h5>
                  <div class="xx-small text-muted">
                    課程 ID: {{ course.id?.substring(0, 8) }}
                  </div>
                </div>
              </div>

              <div class="text-line-clamp text-secondary small mb-3">
                {{
                  course.description ||
                  "點擊進入查看數據看板、任務繳交及單元開放進度。"
                }}
              </div>

              <div
                class="d-flex justify-content-between align-items-center border-top pt-3"
              >
                <div class="invite-badge">
                  <small>邀請碼</small>
                  <span class="font-monospace fw-bold text-primary">{{
                    course.joinCode
                  }}</span>
                </div>
                <div
                  v-if="course.creatorId === auth.currentUser?.uid"
                  class="status-indicator-done"
                >
                  <i class="bi bi-check2-circle me-1"></i>管理中
                </div>
              </div>
            </div>
          </div>

          <div
            v-if="filteredCourses.length === 0"
            class="col-12 text-center py-5 mt-5"
          >
            <div class="opacity-50">
              <i class="bi bi-journal-x display-1"></i>
              <p class="mt-3 fs-5">
                目前沒有任何課程，點擊「新建課程」開始吧！
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>

    <div
      v-if="showModal"
      class="modal-overlay d-flex align-items-center justify-content-center fixed-top w-100 h-100"
      style="z-index: 2000"
    >
      <div
        class="modal-content-custom bg-white p-4 rounded-4 shadow-lg animate__animated animate__zoomIn"
        style="width: 90%; max-width: 500px"
      >
        <div class="d-flex justify-content-between align-items-center mb-4">
          <h5 class="fw-bold mb-0 text-navy">建立新課程單元</h5>
          <button class="btn-close" @click="showModal = false"></button>
        </div>
        <div class="mb-3">
          <label class="small fw-bold text-muted mb-2">課程名稱</label>
          <input
            v-model="form.title"
            class="form-control border-0 bg-light-soft py-2"
            placeholder="輸入單元名稱..."
          />
        </div>
        <div class="mb-4">
          <label class="small fw-bold text-muted mb-2">課程描述</label>
          <textarea
            v-model="form.description"
            class="form-control border-0 bg-light-soft"
            rows="3"
            placeholder="簡短介紹此單元的學習目標..."
          ></textarea>
        </div>
        <div class="d-flex gap-2">
          <button
            class="btn btn-light flex-grow-1 rounded-pill"
            @click="showModal = false"
          >
            取消
          </button>
          <button
            class="btn btn-navy flex-grow-1 rounded-pill fw-bold"
            @click="createCourse"
          >
            確認建立
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { ref as dbRef, push, set, onValue } from "firebase/database";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth, rtdb } from "../../firebase/config";
import { useRouter } from "vue-router";
import Swal from "sweetalert2";
import "./TrCourse.css";

// 如果檔案已建立，取消下方註解
// import TrProfile from "./TrProfile.vue";

const router = useRouter();
const showModal = ref(false);
const showProfileModal = ref(false);
const courses = ref([]);

const form = ref({
  title: "",
  description: "",
  visibility: "public",
});

/* --- 計算屬性：簡化邏輯，直接顯示抓取的課程 --- */
const filteredCourses = computed(() => {
  return courses.value;
});

onMounted(() => {
  onAuthStateChanged(auth, (user) => {
    if (!user) router.replace("/login");
  });

  // 監聽 Firebase 數據
  onValue(dbRef(rtdb, "courses"), (snap) => {
    const data = snap.val();
    courses.value = data
      ? Object.entries(data).map(([id, val]) => ({ id, ...val }))
      : [];
  });
});

const createCourse = async () => {
  if (!form.value.title.trim()) {
    return Swal.fire("提醒", "請填寫課程名稱", "warning");
  }

  const code = Math.random().toString(36).substring(2, 8).toUpperCase();
  const newRef = push(dbRef(rtdb, "courses"));

  try {
    await set(newRef, {
      title: form.value.title,
      description: form.value.description || "",
      id: newRef.key,
      creatorId: auth.currentUser.uid,
      joinCode: code,
      createdAt: Date.now(),
      subject: "General", // 預設值以維持數據結構一致
    });

    showModal.value = false;
    Swal.fire({
      icon: "success",
      title: "課程建立成功！",
      html: `學生邀請碼：<b class="text-primary fs-3">${code}</b>`,
      confirmButtonColor: "#4a70a9",
    });

    form.value = { title: "", description: "", visibility: "public" };
  } catch (e) {
    console.error("寫入錯誤:", e);
    Swal.fire("錯誤", "無法寫入資料庫", "error");
  }
};

const goToCourse = (course) => {
  const path =
    course.creatorId === auth.currentUser.uid ? "trdashboard" : "stdashboard";
  router.push(`/${path}/${course.id}`);
};

const handleLogout = async () => {
  const result = await Swal.fire({
    title: "確定要登出嗎？",
    icon: "question",
    showCancelButton: true,
    confirmButtonText: "確定登出",
    cancelButtonText: "取消",
  });

  if (result.isConfirmed) {
    await signOut(auth);
    router.replace("/login");
  }
};
</script>
