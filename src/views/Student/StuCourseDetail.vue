<template>
  <div class="StuCourseDetail d-flex flex-column min-vh-100 bg-light-soft">
    <nav
      class="navbar navbar-expand-md navbar-light bg-white shadow-sm sticky-top py-2 py-md-3"
    >
      <div class="container">
        <a
          class="navbar-brand fw-bold text-navy d-flex align-items-center"
          href="#"
          @click.prevent="$router.push('/stucourse')"
        >
          <i class="bi bi-chevron-left me-2"></i>
          <span class="d-none d-sm-inline">學習中心</span>
          <span class="d-inline d-sm-none">返回</span>
        </a>

        <div class="ms-auto d-flex align-items-center gap-2 gap-md-3">
          <div class="user-info text-end" v-if="currentUser">
            <div class="fw-bold small lh-1">
              {{ currentUser.displayName || "學生" }}
            </div>
            <div class="text-muted xx-small d-none d-sm-block mt-1">
              AI 輔助自我調節學習中
            </div>
          </div>
          <button
            class="btn btn-soft-danger btn-sm px-3 rounded-pill fw-bold"
            @click="handleLogout"
          >
            登出
          </button>
        </div>
      </div>
    </nav>

    <header class="course-hero py-4 py-md-5 bg-white border-bottom mb-4">
      <div class="container">
        <div class="row justify-content-center">
          <div class="col-lg-10">
            <div
              class="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3"
            >
              <div class="header-text-group w-100">
                <div class="d-flex align-items-center gap-2 mb-2">
                  <span class="badge bg-soft-navy text-navy rounded-pill px-3"
                    >我的課程</span
                  >
                  <span
                    v-if="hasPendingTest"
                    class="badge bg-soft-warning text-warning rounded-pill px-3 animate__animated animate__pulse animate__infinite"
                    >有待完成的問卷</span
                  >
                </div>
                <h1 class="h3 h2-md fw-bold text-navy mb-2">
                  {{ courseInfo.title || "載入課程中..." }}
                </h1>
                <p class="text-muted mb-0 small-md">
                  {{
                    courseInfo.description ||
                    "歡迎來到本課程，請透過數據診斷與單元引導來規劃您的學習。"
                  }}
                </p>
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
            class="NavTabs d-flex shadow-sm mb-4 bg-white p-1 rounded-pill w-fit-content mx-auto mx-md-0"
          >
            <button
              class="SwitchButton flex-fill"
              :class="{ active: currentView === 'dashboard' }"
              @click="switchView('dashboard')"
            >
              <i class="bi bi-speedometer2 me-1 me-md-2"></i>學習診斷
            </button>
            <button
              class="SwitchButton flex-fill"
              :class="{ active: currentView === 'content' }"
              @click="switchView('content')"
            >
              <i class="bi bi-collection-play me-1 me-md-2"></i>單元清單
            </button>
          </div>

          <transition name="fade" mode="out-in">
            <div :key="currentView" class="view-content">
              <div v-if="currentView === 'dashboard'">
                <StuDashboard :courseId="courseId" />
              </div>

              <div v-if="currentView === 'content'">
                <div
                  v-if="hasPendingTest"
                  class="card border-0 shadow-sm rounded-4 p-4 text-center mb-4 bg-soft-warning border-warning-subtle"
                >
                  <div
                    class="icon-box-lg mx-auto mb-3 bg-white text-warning shadow-sm"
                  >
                    <i class="bi bi-exclamation-triangle-fill"></i>
                  </div>
                  <h5 class="fw-bold text-navy">開始學習前的準備</h5>
                  <p class="text-muted small mb-4">
                    老師已為您準備了實驗前測問卷，完成後即可解鎖學習單元。
                  </p>
                  <button
                    class="btn btn-warning px-5 rounded-pill fw-bold text-white shadow-sm"
                    @click="triggerTestPopup"
                  >
                    前往填寫問卷
                  </button>
                </div>

                <div v-else class="row g-3">
                  <div
                    class="col-12"
                    v-for="(unit, index) in units"
                    :key="unit.id"
                  >
                    <div
                      class="unit-card-modern p-3 p-md-4 d-flex align-items-center justify-content-between"
                      @click="startLearning(unit)"
                    >
                      <div class="d-flex align-items-center overflow-hidden">
                        <div class="unit-index-circle me-3 me-md-4">
                          {{ index + 1 }}
                        </div>
                        <div class="text-truncate">
                          <h5 class="fw-bold mb-1 text-dark fs-6 fs-md-5">
                            {{ unit.title }}
                          </h5>
                          <p
                            class="text-muted xx-small d-none d-md-block mb-0 text-truncate"
                          >
                            {{
                              unit.description ||
                              "點擊進入單元進行自我調節學習任務"
                            }}
                          </p>
                        </div>
                      </div>
                      <div class="ms-2">
                        <i
                          class="bi bi-arrow-right-circle fs-4 fs-md-3 text-navy opacity-50 icon-arrow"
                        ></i>
                      </div>
                    </div>
                  </div>
                  <div
                    v-if="units.length === 0"
                    class="text-center py-5 text-muted"
                  >
                    <i class="bi bi-box-seam fs-1 d-block mb-3 opacity-25"></i>
                    目前尚無開放的單元
                  </div>
                </div>
              </div>
            </div>
          </transition>
        </div>
      </div>
    </main>

    <footer class="py-4 bg-white border-top text-center text-muted smaller">
      © 2026 AI SRL Learning System · Keep Learning
    </footer>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive } from "vue";
import { useRoute, useRouter } from "vue-router";
import { rtdb, auth } from "../../firebase/config";
import { ref as dbRef, onValue, get } from "firebase/database";
import { onAuthStateChanged, signOut } from "firebase/auth";
import Swal from "sweetalert2";

// 組件引入
import StuDashboard from "./StuDashboard.vue";
import StuSchedule from "./StuSchedule.vue";
//import StuTestModal from "./Modal/StuTestModal.vue"; // 這是稍後要建立的問卷組件
import "./StuCourseDetail.css";

const route = useRoute();
const router = useRouter();
const courseId = route.params.courseId;

// 狀態變數
const currentView = ref("dashboard");
const currentUser = ref(null);
const courseInfo = ref({});
const units = ref([]);

// 實驗問卷相關狀態
const hasPendingTest = ref(false);
const testModal = reactive({
  show: false,
  data: null,
});

onMounted(() => {
  onAuthStateChanged(auth, (user) => {
    if (!user) {
      router.replace("/login");
    } else {
      currentUser.value = user;
      loadCourseData();
      checkExperimentalTests(user.uid);
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

// 🌟 核心：檢查是否有「可見且尚未填寫」的前測
const checkExperimentalTests = async (uid) => {
  const preTestRef = dbRef(rtdb, `courses/${courseId}/experiment/test/pretest`);

  onValue(preTestRef, async (snap) => {
    const tests = snap.val();
    if (!tests) return;

    // 1. 找出所有老師設定為 visible: true 的前測
    const visibleTests = Object.entries(tests)
      .filter(([id, val]) => val.visible === true)
      .map(([id, val]) => ({ id, ...val }));

    if (visibleTests.length > 0) {
      // 2. 檢查學生是否已填寫過這些測驗 (儲存在 submissions)
      for (const test of visibleTests) {
        const submissionRef = dbRef(
          rtdb,
          `courses/${courseId}/experiment/submissions/${test.id}/${uid}`,
        );
        const subSnap = await get(submissionRef);

        if (!subSnap.exists()) {
          // 發現有可見且未填寫的問卷
          hasPendingTest.value = true;
          testModal.data = test;
          return; // 只要有一個沒寫，就鎖定單元
        }
      }
    }
    hasPendingTest.value = false;
  });
};

const triggerTestPopup = () => {
  testModal.show = true;
};

const handleTestSubmitted = () => {
  testModal.show = false;
  hasPendingTest.value = false;
  Swal.fire({
    icon: "success",
    title: "問卷提交成功",
    text: "您可以開始進行單元學習了！",
    timer: 2000,
    showConfirmButton: false,
  });
};

const switchView = (view) => {
  currentView.value = view;
};

const startLearning = (unit) => {
  if (hasPendingTest.value) {
    Swal.fire("提醒", "請先完成前測問卷再開始學習", "info");
    return;
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
  });
  if (res.isConfirmed) {
    await signOut(auth);
    router.replace("/login");
  }
};
</script>
