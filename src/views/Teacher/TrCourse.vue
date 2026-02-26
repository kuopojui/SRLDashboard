<template>
  <div class="CoursePage d-flex flex-column min-vh-100 bg-light">
    <nav
      class="navbar navbar-expand-md navbar-light bg-white shadow-sm sticky-top"
    >
      <div class="container">
        <a class="navbar-brand fw-bold text-primary" href="#"
          >教師課程管理系統</a
        >

        <div class="ms-auto d-flex align-items-center gap-3">
          <button
            class="btn btn-outline-secondary btn-sm"
            @click="showProfileModal = true"
          >
            個人設定
          </button>
          <button class="btn btn-danger btn-sm px-3" @click="handleLogout">
            登出
          </button>
        </div>
      </div>
    </nav>

    <main class="container my-4 flex-grow-1">
      <div class="row justify-content-center">
        <div class="col-12 col-lg-10">
          <div class="d-flex justify-content-between align-items-center mb-4">
            <h2 class="h4 mb-0 fw-bold text-dark">我的所有課程</h2>
            <button
              class="btn btn-primary shadow-sm px-4 rounded-pill"
              @click="showModal = true"
            >
              <i class="bi bi-plus-lg me-1"></i> 新建課程
            </button>
          </div>

          <div class="row g-4">
            <div
              class="col-12 col-md-6 col-lg-4"
              v-for="course in filteredCourses"
              :key="course.id"
            >
              <div
                class="card h-100 border-0 shadow-sm course-card-hover"
                @click="goToCourse(course)"
              >
                <div class="card-body d-flex flex-column">
                  <h5 class="card-title fw-bold text-dark mb-2">
                    {{ course.title }}
                  </h5>
                  <p class="card-text text-muted small mb-3 text-truncate-2">
                    {{ course.description || "暫無課程描述" }}
                  </p>

                  <div
                    class="mt-auto pt-3 border-top d-flex justify-content-between align-items-center"
                  >
                    <div class="small text-muted">
                      邀請碼:
                      <span
                        class="fw-bold text-primary font-monospace fs-5 ms-1"
                        >{{ course.joinCode }}</span
                      >
                    </div>
                    <i
                      v-if="course.creatorId === auth.currentUser?.uid"
                      class="bi bi-person-check-fill text-success fs-5"
                      title="我管理的課程"
                    ></i>
                  </div>
                </div>
              </div>
            </div>

            <div
              v-if="filteredCourses.length === 0"
              class="col-12 text-center py-5"
            >
              <div class="text-muted py-5">
                <i class="bi bi-journal-x display-4"></i>
                <p class="mt-3 fs-5">
                  目前沒有任何課程，點擊「新建課程」開始吧！
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>

    <div
      v-if="showModal"
      class="modal fade show d-block"
      style="background: rgba(0, 0, 0, 0.5); backdrop-filter: blur(4px)"
    >
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content border-0 shadow-lg rounded-4">
          <div class="modal-header border-0 pb-0 pt-4 px-4">
            <h5 class="modal-title fw-bold">建立新課程單元</h5>
            <button
              type="button"
              class="btn-close"
              @click="showModal = false"
            ></button>
          </div>
          <div class="modal-body p-4">
            <div class="mb-4">
              <label class="form-label small fw-bold text-secondary"
                >課程名稱</label
              >
              <input
                v-model="form.title"
                class="form-control form-control-lg bg-light border-0"
                placeholder="例如：基礎英語自我調節學習單元"
              />
            </div>
            <div class="mb-0">
              <label class="form-label small fw-bold text-secondary"
                >課程描述</label
              >
              <textarea
                v-model="form.description"
                class="form-control bg-light border-0"
                rows="3"
                placeholder="簡短介紹此單元的學習目標..."
              ></textarea>
            </div>
          </div>
          <div class="modal-footer border-0 p-4 pt-0">
            <button class="btn btn-light px-4" @click="showModal = false">
              取消
            </button>
            <button class="btn btn-primary px-4 fw-bold" @click="createCourse">
              確認建立
            </button>
          </div>
        </div>
      </div>
    </div>

    <footer
      class="py-4 mt-auto bg-white border-top text-center text-muted small"
    >
      © 2026 AI SRL Learning System
    </footer>
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
