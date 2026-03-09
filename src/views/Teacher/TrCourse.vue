<template>
  <div class="CoursePage d-flex min-vh-100" style="background-color: #efece3">
    <aside
      class="sidebar d-lg-flex flex-column py-4 shadow"
      :class="{ 'sidebar-open': sidebarOpen, 'd-none': !sidebarOpen }"
    >
      <div class="sidebar-brand px-4 mb-5 text-white">
        <h5 class="fw-bold mb-0">
          <i class="bi bi-shield-check me-2"></i>課程管理中心
        </h5>
      </div>

      <nav class="flex-grow-1 px-2">
        <div class="nav-item active">
          <i class="bi bi-grid-fill me-3"></i>我的課程
        </div>
        <div class="nav-item" @click="handleOpenProfile">
          <i class="bi bi-person-circle me-3"></i>帳號設定
        </div>
      </nav>

      <div class="mt-auto px-3">
        <button
          class="btn btn-logout-outline w-100 rounded-pill"
          @click="handleLogout"
        >
          <i class="bi bi-box-arrow-left me-2"></i>登出系統
        </button>
      </div>
    </aside>

    <main class="flex-grow-1 d-flex flex-column">
      <header class="mobile-header d-lg-none p-3 shadow-sm text-white">
        <div class="d-flex justify-content-between align-items-center">
          <h6 class="mb-0 fw-bold">課程管理中心</h6>
          <button class="btn text-white p-0" @click="toggleSidebar">
            <i class="bi bi-list fs-2"></i>
          </button>
        </div>
      </header>

      <section class="container-fluid px-4 pt-4 pb-2">
        <div
          class="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4"
        >
          <div>
            <h2 class="fw-bold text-dark mb-1">所有單元課程</h2>
            <p class="text-muted small mb-0">
              您目前管理 {{ filteredCourses.length }} 門課程
            </p>
          </div>
          <button
            class="btn btn-primary-custom shadow-sm rounded-pill px-4 py-2"
            @click="showModal = true"
          >
            <i class="bi bi-plus-lg me-2"></i>新建課程單元
          </button>
        </div>
      </section>

      <section class="container-fluid px-4 pb-5">
        <div class="row g-4 justify-content-start">
          <div
            class="col-12 col-md-6 col-xl-4"
            v-for="course in filteredCourses"
            :key="course.id"
            style="max-width: 380px"
          >
            <div
              class="course-card shadow-sm border-0 p-3 rounded-4 bg-white position-relative"
              @click="goToCourse(course)"
            >
              <button
                v-if="course.creatorId === auth.currentUser?.uid"
                type="button"
                class="btn-close-red position-absolute top-0 end-0 m-2 fs-5"
                @click.stop="deleteCourse(course.id)"
              >
                ✕
              </button>

              <div class="d-flex align-items-center gap-3 mb-3">
                <div class="avatar-circle-navy">
                  {{ course.title?.substring(0, 1) || "?" }}
                </div>
                <div class="flex-grow-1 overflow-hidden pe-3">
                  <h5 class="fw-bold text-navy mb-0 text-truncate">
                    {{ course.title }}
                  </h5>
                  <div class="xx-small text-muted text-truncate">
                    ID: {{ course.id?.substring(0, 8) }}
                  </div>
                </div>
              </div>

              <p class="text-secondary small mb-3 description-text">
                {{
                  course.description ||
                  "點擊進入查看數據看板、任務繳交及單元開放進度。"
                }}
              </p>

              <div
                class="d-flex justify-content-between align-items-center border-top pt-3"
              >
                <div class="invite-badge p-2 px-3 rounded-3">
                  <small class="d-block text-muted" style="font-size: 10px"
                    >邀請碼</small
                  >
                  <span class="font-monospace fw-bold text-navy fs-6">
                    {{ course.joinCode }}
                  </span>
                </div>
                <div class="text-navy opacity-50">
                  <i class="bi bi-chevron-right"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>

    <div
      v-if="showModal"
      class="CoursePage modal-overlay d-flex align-items-center justify-content-center"
    >
      <div
        class="modal-content-custom bg-white p-4 rounded-4 shadow-lg animate__animated animate__zoomIn"
      >
        <div class="d-flex justify-content-between align-items-center mb-4">
          <h5 class="fw-bold mb-0 text-navy">建立新課程單元</h5>
          <button
            type="button"
            class="btn-close-red p-0 border-0 fs-4"
            @click="showModal = false"
          >
            ✕
          </button>
        </div>

        <div class="mb-3">
          <label class="small fw-bold text-muted mb-2">課程名稱</label>
          <input
            v-model="form.title"
            class="form-control custom-input"
            placeholder="輸入單元名稱..."
          />
        </div>

        <div class="mb-4">
          <label class="small fw-bold text-muted mb-2">課程描述</label>
          <textarea
            v-model="form.description"
            class="form-control custom-input"
            rows="3"
            placeholder="簡短描述單元內容..."
          ></textarea>
        </div>

        <div class="d-flex gap-2">
          <button
            class="btn btn-light-custom flex-grow-1 rounded-pill"
            @click="showModal = false"
          >
            取消
          </button>
          <button
            class="btn btn-primary-custom flex-grow-1 rounded-pill fw-bold"
            @click="createCourse"
          >
            確認建立
          </button>
        </div>
      </div>
    </div>

    <TrProfile
      v-if="showProfileModal"
      :student="teacherData"
      courseId="system_admin"
      @close="showProfileModal = false"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { auth, rtdb } from "../../firebase/config";
// 🌟 匯入必要的 Firebase 方法
import {
  ref as dbRef,
  push,
  set,
  onValue,
  serverTimestamp,
} from "firebase/database";
import { onAuthStateChanged, signOut } from "firebase/auth";
import Swal from "sweetalert2";

// 🌟 匯入 Modal 組件
import TrProfile from "./Modal/TrProfile.vue";
import "./TrCourse.css";

const router = useRouter();

// --- 狀態定義 ---
const courses = ref([]);
const showModal = ref(false);
const showProfileModal = ref(false);
const sidebarOpen = ref(false);

const form = ref({
  title: "",
  description: "",
});

// --- 計算屬性 ---
// 確保 filteredCourses 始終回傳陣列，避免 HTML 中的 .length 報錯
const filteredCourses = computed(() => {
  return courses.value || [];
});

// 準備給 TrProfile 的教師資料
const teacherData = computed(() => ({
  uid: auth.currentUser?.uid,
  displayName: auth.currentUser?.displayName || "管理者",
  email: auth.currentUser?.email,
}));

// --- 生命週期與數據監聽 ---
onMounted(() => {
  onAuthStateChanged(auth, (user) => {
    if (!user) {
      router.replace("/login");
    } else {
      // 監聽所有課程數據
      const coursesPath = dbRef(rtdb, "courses");
      onValue(coursesPath, (snap) => {
        const data = snap.val();
        if (data) {
          // 將物件格式轉為陣列供 v-for 使用
          courses.value = Object.entries(data).map(([id, val]) => ({
            id,
            ...val,
          }));
        } else {
          courses.value = [];
        }
      });
    }
  });
});

// --- 行為方法 ---

// 1. 開啟帳號設定並紀錄鉅細靡遺 Log
const handleOpenProfile = async () => {
  showProfileModal.value = true;
  const uid = auth.currentUser?.uid;
  if (!uid) return;

  try {
    // 紀錄教師點擊行為，支援後續教學調節分析
    const logPath = `system_logs/${uid}`;
    await push(dbRef(rtdb, logPath), {
      action: "開啟教師帳號設定",
      timestamp: serverTimestamp(),
      details: { page: "TrCourse" },
    });
  } catch (e) {
    console.error("Log 紀錄失敗:", e);
  }
};

// 2. 建立新課程單元
const createCourse = async () => {
  if (!form.value.title.trim()) {
    return Swal.fire("提醒", "請填寫課程名稱", "warning");
  }

  // 生成隨機 6 位邀請碼
  const code = Math.random().toString(36).substring(2, 8).toUpperCase();
  const newRef = push(dbRef(rtdb, "courses"));

  try {
    await set(newRef, {
      id: newRef.key,
      title: form.value.title,
      description: form.value.description || "",
      creatorId: auth.currentUser.uid,
      joinCode: code,
      createdAt: serverTimestamp(),
      subject: "General",
    });

    showModal.value = false;
    form.value = { title: "", description: "" };

    Swal.fire({
      icon: "success",
      title: "課程建立成功！",
      html: `學生邀請碼：<b class="text-primary fs-3">${code}</b>`,
      confirmButtonColor: "#4a70a9",
    });
  } catch (e) {
    Swal.fire("錯誤", "無法建立課程", "error");
  }
};

// 3. 路由導向
const goToCourse = (course) => {
  // 判斷身分導向不同看板
  const path =
    course.creatorId === auth.currentUser.uid ? "trdashboard" : "stdashboard";
  router.push(`/${path}/${course.id}`);
};

// 4. 登出邏輯
const handleLogout = async () => {
  const result = await Swal.fire({
    title: "確定要登出嗎？",
    icon: "question",
    showCancelButton: true,
    confirmButtonText: "確定登出",
    cancelButtonText: "取消",
    confirmButtonColor: "#4a70a9",
  });

  if (result.isConfirmed) {
    await signOut(auth);
    router.replace("/login");
  }
};

// 5. 行動端側邊欄切換
const toggleSidebar = () => {
  sidebarOpen.value = !sidebarOpen.value;
};

//刪除課程
/* --- 刪除課程邏輯 --- */
const deleteCourse = async (courseId) => {
  const result = await Swal.fire({
    title: "確定要刪除此課程？",
    text: "刪除後所有學生數據與教材將無法復原！",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#BF4646", // 主要紅色
    cancelButtonColor: "#4a70a9", // 主要深藍
    confirmButtonText: "確定刪除",
    cancelButtonText: "取消",
    reverseButtons: true,
  });

  if (result.isConfirmed) {
    try {
      // 🌟 執行 Firebase 刪除動作 (courses/{id})
      const { remove } = await import("firebase/database");
      await remove(dbRef(rtdb, `courses/${courseId}`));

      Swal.fire({
        icon: "success",
        title: "已刪除",
        timer: 1000,
        showConfirmButton: false,
      });
    } catch (e) {
      Swal.fire("錯誤", "無法刪除課程，請稍後再試", "error");
    }
  }
};
</script>
