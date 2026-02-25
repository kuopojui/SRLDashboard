<template>
  <div class="StuCourseDetail d-flex flex-column min-vh-100 bg-light">
    <nav
      class="navbar navbar-expand-md navbar-light bg-white shadow-sm sticky-top"
    >
      <div class="container">
        <a
          class="navbar-brand fw-bold text-navy"
          href="#"
          @click.prevent="$router.push('/stucourse')"
        >
          <i class="bi bi-chevron-left me-1"></i>學習中心
        </a>
        <div class="ms-auto d-flex align-items-center gap-3">
          <div class="user-info d-none d-md-block text-end" v-if="currentUser">
            <div class="fw-bold small">
              {{ currentUser.displayName || "學生" }}
            </div>
            <div class="text-muted xx-small">正在進行自我調節學習</div>
          </div>
          <button
            class="btn btn-outline-danger btn-sm px-3 rounded-pill"
            @click="handleLogout"
          >
            登出
          </button>
        </div>
      </div>
    </nav>

    <header class="course-hero py-5 bg-white border-bottom mb-4">
      <div class="container">
        <div class="row justify-content-center">
          <div class="col-lg-10">
            <div
              class="d-flex flex-column flex-md-row justify-content-between align-items-md-end gap-3"
            >
              <div class="header-text-group">
                <h1 class="h2 fw-bold text-navy mb-2">
                  {{ courseInfo.title || "載入課程中..." }}
                </h1>
                <p class="text-muted mb-0">
                  {{
                    courseInfo.description ||
                    "歡迎來到本課程，請透過數據診斷與單元引導來規劃您的學習。"
                  }}
                </p>
              </div>
              <div
                class="view-indicator-badge badge rounded-pill fw-bold"
                v-if="currentView"
              >
                <i
                  :class="[
                    'bi',
                    currentView === 'dashboard'
                      ? 'bi-speedometer2'
                      : 'bi-box-seam',
                    'me-2',
                  ]"
                ></i>
                {{
                  currentView === "dashboard"
                    ? "個人學習儀表板"
                    : "學習單元導航"
                }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>

    <main class="container mb-5 flex-grow-1">
      <div class="row justify-content-center">
        <div class="col-lg-10">
          <div
            class="NavTabs d-inline-flex shadow-sm mb-4 bg-white p-1 rounded-pill"
          >
            <button
              class="SwitchButton"
              :class="{ active: currentView === 'dashboard' }"
              @click="switchView('dashboard')"
            >
              <i class="bi bi-speedometer2 me-2"></i>學習診斷
            </button>
            <button
              class="SwitchButton"
              :class="{ active: currentView === 'content' }"
              @click="switchView('content')"
            >
              <i class="bi bi-collection-play me-2"></i>單元清單
            </button>
          </div>

          <div v-if="currentView === 'dashboard'" class="view-fade-in">
            <StuDashboard :courseId="courseId" />
          </div>

          <div v-if="currentView === 'content'" class="view-fade-in">
            <div v-if="currentView === 'content'" class="view-fade-in">
              <StuSchedule :courseId="courseId" />
            </div>

            <div v-else class="row g-3">
              <div class="col-12" v-for="(unit, index) in units" :key="unit.id">
                <div
                  class="unit-card-modern p-4 d-flex align-items-center justify-content-between"
                  @click="startLearning(unit)"
                >
                  <div class="d-flex align-items-center overflow-hidden">
                    <div class="unit-index-circle me-4">{{ index + 1 }}</div>
                    <div class="text-truncate">
                      <h5 class="fw-bold mb-1 text-dark">{{ unit.title }}</h5>
                      <p class="text-muted small mb-0 text-truncate">
                        {{
                          unit.description || "點擊進入單元進行自我調節學習任務"
                        }}
                      </p>
                    </div>
                  </div>
                  <div class="ms-3">
                    <i
                      class="bi bi-arrow-right-circle fs-3 text-navy opacity-50 icon-arrow"
                    ></i>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>

    <footer class="py-4 bg-white border-top text-center text-muted smaller">
      © 2026 AI SRL Learning System · Keep Learning
    </footer>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { rtdb, auth } from "../../firebase/config";
import { ref as dbRef, onValue } from "firebase/database";
import { onAuthStateChanged, signOut } from "firebase/auth";
import Swal from "sweetalert2";

// 組件與樣式引入
import StuDashboard from "./StuDashboard.vue";
import StuSchedule from "./StuSchedule.vue";
import "./StuCourseDetail.css";

const route = useRoute();
const router = useRouter();
const courseId = route.params.courseId;

// 狀態變數
const currentView = ref("dashboard");
const currentUser = ref(null);
const courseInfo = ref({});
const units = ref([]);

onMounted(() => {
  onAuthStateChanged(auth, (user) => {
    if (!user) {
      router.replace("/login");
    } else {
      currentUser.value = user;
      loadCourseData();
    }
  });
});

const loadCourseData = () => {
  if (!courseId) return;
  onValue(dbRef(rtdb, `courses/${courseId}`), (snap) => {
    courseInfo.value = snap.val() || {};
  });
  onValue(dbRef(rtdb, `courses/${courseId}/units`), (snap) => {
    const data = snap.val();
    units.value = data
      ? Object.entries(data).map(([id, val]) => ({ id, ...val }))
      : [];
  });
};

const switchView = (view) => {
  currentView.value = view;
  if (currentUser.value) {
    recordStudentAction(courseId, currentUser.value.uid, `切換分頁至：${view}`);
  }
};

const startLearning = (unit) => {
  if (currentUser.value) {
    recordStudentAction(
      courseId,
      currentUser.value.uid,
      `準備進入單元：${unit.title}`,
    );
  }
  router.push(`/learning/${courseId}/${unit.id}`);
};

const handleLogout = async () => {
  const res = await Swal.fire({
    title: "確定登出？",
    icon: "question",
    showCancelButton: true,
    confirmButtonColor: "#3a5a8a",
    confirmButtonText: "確定登出",
    cancelButtonText: "取消",
  });
  if (res.isConfirmed) {
    await signOut(auth);
    router.replace("/login");
  }
};
</script>
