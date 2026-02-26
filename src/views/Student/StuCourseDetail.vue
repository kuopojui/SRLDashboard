<template>
  <div class="StuCourseDetail CoursePage d-flex min-vh-100">
    <aside class="CoursePage-sidebar d-none d-lg-flex flex-column py-4 shadow">
      <div
        class="sidebar-brand px-4 mb-5"
        @click="$router.push('/stucourse')"
        style="cursor: pointer"
      >
        <h5 class="fw-bold text-white mb-0">
          <i class="bi bi-chevron-left me-2"></i>返回中心
        </h5>
      </div>

      <nav class="flex-grow-1 px-2">
        <div
          class="CoursePage-nav-item"
          :class="{ active: currentView === 'dashboard' }"
          @click="switchView('dashboard')"
        >
          <i class="bi bi-speedometer2 me-3"></i>學習診斷
        </div>
        <div
          class="CoursePage-nav-item"
          :class="{ active: currentView === 'content' }"
          @click="switchView('content')"
        >
          <i class="bi bi-collection-play me-3"></i>單元清單
        </div>
      </nav>

      <div class="mt-auto px-3">
        <div class="user-profile-mini mb-3 px-2 text-white opacity-75">
          <div class="xx-small fw-bold">{{ currentUser?.displayName }}</div>
          <div class="smaller">AI 輔助學習中</div>
        </div>
        <button class="btn btn-logout w-100 rounded-pill" @click="handleLogout">
          <i class="bi bi-box-arrow-left me-2"></i>登出系統
        </button>
      </div>
    </aside>

    <main class="flex-grow-1 d-flex flex-column">
      <header class="mobile-header d-lg-none p-3 shadow-sm text-white bg-navy">
        <div class="d-flex justify-content-between align-items-center">
          <div @click="$router.push('/stucourse')">
            <i class="bi bi-chevron-left me-2"></i>
          </div>
          <h6 class="mb-0 fw-bold">{{ courseInfo.title || "課程內容" }}</h6>
          <button class="hamburger-btn" @click="toggleSidebar">
            <span class="hamburger-line"></span>
          </button>
        </div>
      </header>

      <section class="container-fluid px-4 pt-4 pb-2">
        <div
          class="course-hero-box p-4 rounded-4 bg-white shadow-sm mb-4 border-start-navy"
        >
          <div class="d-flex align-items-center gap-2 mb-2">
            <span class="badge bg-soft-navy text-navy rounded-pill px-3"
              >我的課程</span
            >
            <span
              v-if="hasPendingTest"
              class="badge bg-soft-warning text-warning rounded-pill px-3 animate__animated animate__pulse animate__infinite"
              >有待填寫問卷</span
            >
          </div>
          <h2 class="fw-bold text-dark mb-2">
            {{ courseInfo.title || "載入課程中..." }}
          </h2>
          <p class="text-muted small mb-0">
            {{
              courseInfo.description ||
              "歡迎來到本課程，請點擊「單元清單」開始學習。"
            }}
          </p>
        </div>

        <div
          class="d-lg-none NavTabs d-flex shadow-sm mb-4 bg-white p-1 rounded-pill w-fit-content mx-auto"
        >
          <button
            class="SwitchButton px-4"
            :class="{ active: currentView === 'dashboard' }"
            @click="switchView('dashboard')"
          >
            診斷
          </button>
          <button
            class="SwitchButton px-4"
            :class="{ active: currentView === 'content' }"
            @click="switchView('content')"
          >
            單元
          </button>
        </div>
      </section>

      <section class="course-scroll-area container-fluid px-4 pb-5">
        <transition name="fade" mode="out-in">
          <div :key="currentView">
            <div v-if="currentView === 'dashboard'">
              <StuDashboard :courseId="courseId" />
            </div>

            <div v-if="currentView === 'content'">
              <div
                v-if="hasPendingTest"
                class="card border-0 shadow-sm rounded-4 p-4 text-center mb-4 bg-soft-warning"
              >
                <div
                  class="icon-box-lg mx-auto mb-3 bg-white text-warning shadow-sm"
                >
                  <i class="bi bi-exclamation-triangle-fill"></i>
                </div>
                <h5 class="fw-bold text-navy">開始學習前的準備</h5>
                <p class="text-muted small mb-4">
                  完成老師準備的前測問卷，即可解鎖後續學習單元。
                </p>
                <button
                  class="btn btn-navy px-5 rounded-pill fw-bold"
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
                    class="unit-card-modern p-3 p-md-4 bg-white rounded-4 shadow-sm d-flex align-items-center justify-content-between"
                    @click="startLearning(unit)"
                  >
                    <div class="d-flex align-items-center overflow-hidden">
                      <div class="unit-index-circle-navy me-3">
                        {{ index + 1 }}
                      </div>
                      <div class="text-truncate">
                        <h6 class="fw-bold mb-1 text-dark">{{ unit.title }}</h6>
                        <p class="text-muted xx-small mb-0 text-truncate">
                          {{ unit.description || "點擊進入單元進行任務" }}
                        </p>
                      </div>
                    </div>
                    <i
                      class="bi bi-arrow-right-circle fs-4 text-navy opacity-50"
                    ></i>
                  </div>
                </div>

                <div
                  v-if="units.length === 0"
                  class="text-center py-5 text-muted"
                >
                  <i
                    class="bi bi-box-seam display-4 d-block mb-3 opacity-25"
                  ></i
                  >目前尚無開放單元
                </div>
              </div>
            </div>
          </div>
        </transition>
      </section>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive, onUnmounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { rtdb, auth } from "../../firebase/config";
import { ref as dbRef, onValue, get, off } from "firebase/database";
import { onAuthStateChanged, signOut } from "firebase/auth";
import Swal from "sweetalert2";

// 組件引入
import StuDashboard from "./StuDashboard.vue";
import StuSchedule from "./StuSchedule.vue";
import "./StuCourseDetail.css";

const route = useRoute();
const router = useRouter();
const courseId = route.params.courseId;

// 狀態變數
const currentView = ref("dashboard");
const currentUser = ref(null);
const courseInfo = ref({ title: "載入課程中...", description: "" }); // 預設值防止白屏
const units = ref([]);

// 實驗問卷相關狀態
const hasPendingTest = ref(false);
const isCheckingTest = ref(true); // 新增載入狀態
const testModal = reactive({
  show: false,
  data: null,
});

// 用於追蹤異步檢查版本，防止 Race Condition
let checkVersion = 0;

// 管理監聽器，防止重複掛載或記憶體洩漏
let activeListeners = [];

onMounted(() => {
  onAuthStateChanged(auth, (user) => {
    if (!user) {
      router.replace("/login");
    } else {
      currentUser.value = user;
      initAllData(user.uid);
    }
  });
});

// 組件卸載時清除監聽
onUnmounted(() => {
  activeListeners.forEach((refPath) => off(refPath));
  activeListeners = [];
});

/**
 * 🌟 初始化所有課程相關資料
 */
const initAllData = (uid) => {
  if (!courseId) {
    console.error("[initAllData] Course ID 缺失");
    return;
  }

  // 1. 徹底清除舊監聽器，防止鎖定狀態衝突
  activeListeners.forEach((refPath) => {
    try {
      off(refPath);
    } catch (e) {
      console.warn(e);
    }
  });
  activeListeners = [];

  // 2. 監聽課程基本資訊
  const coursePath = dbRef(rtdb, `courses/${courseId}`);
  onValue(
    coursePath,
    (snap) => {
      if (snap.exists()) {
        // 使用解構賦值觸發 Vue 響應式更新
        courseInfo.value = { ...snap.val() };
      }
    },
    (err) => console.error("課程資訊失敗:", err),
  );
  activeListeners.push(coursePath);

  // 3. 監聽單元清單
  const unitsPath = dbRef(rtdb, `courses/${courseId}/units`);
  onValue(unitsPath, (snap) => {
    const data = snap.val();
    units.value = data
      ? Object.entries(data).map(([id, val]) => ({ id, ...val }))
      : [];
  });
  activeListeners.push(unitsPath);

  // 4. 檢查問卷狀態
  checkExperimentalTests(uid);
};

/**
 * 🌟 檢查問卷邏輯（解決卡住與點不進去的關鍵）
 */
const checkExperimentalTests = (uid) => {
  const preTestRef = dbRef(rtdb, `courses/${courseId}/experiment/test/pretest`);
  isCheckingTest.value = true;

  onValue(preTestRef, async (snap) => {
    // 增加版本號，確保只處理最後一次的檢查請求
    const currentV = ++checkVersion;
    const tests = snap.val();

    if (!tests) {
      hasPendingTest.value = false;
      isCheckingTest.value = false;
      return;
    }

    const visibleTests = Object.entries(tests)
      .filter(([id, val]) => val.visible === true)
      .map(([id, val]) => ({ id, ...val }));

    if (visibleTests.length === 0) {
      hasPendingTest.value = false;
      isCheckingTest.value = false;
      return;
    }

    // 並行檢查所有問卷提交紀錄
    try {
      const checkPromises = visibleTests.map(async (test) => {
        const submissionRef = dbRef(
          rtdb,
          `courses/${courseId}/experiment/submissions/${test.id}/${uid}`,
        );
        const subSnap = await get(submissionRef);
        return { id: test.id, data: test, exists: subSnap.exists() };
      });

      const results = await Promise.all(checkPromises);

      // 如果版本號對不上，代表背景已有更新的請求，直接跳過更新
      if (currentV !== checkVersion) return;

      const pending = results.find((r) => !r.exists);
      if (pending) {
        hasPendingTest.value = true;
        testModal.data = pending.data;
      } else {
        hasPendingTest.value = false;
        testModal.data = null;
      }
    } catch (error) {
      console.error("檢查問卷時出錯:", error);
    } finally {
      if (currentV === checkVersion) isCheckingTest.value = false;
    }
  });
  activeListeners.push(preTestRef);
};

const triggerTestPopup = () => {
  // 此處您可以根據需要彈出 Modal
  testModal.show = true;
};

const startLearning = (unit) => {
  console.log("嘗試進入單元:", unit.id, "鎖定狀態:", hasPendingTest.value);

  if (hasPendingTest.value) {
    Swal.fire({
      title: "學習鎖定",
      text: "請先完成前測問卷再開始學習單元內容",
      icon: "info",
      confirmButtonColor: "#4a70a9",
    });
    return;
  }

  if (isCheckingTest.value) {
    console.log("資料檢查中，請稍候...");
    return;
  }

  // 跳轉至學習頁面
  router.push(`/learning/${courseId}/${unit.id}`);
};

const switchView = (view) => {
  currentView.value = view;
};

const handleLogout = async () => {
  const res = await Swal.fire({
    title: "確定登出？",
    icon: "question",
    showCancelButton: true,
    confirmButtonColor: "#4a70a9",
    confirmButtonText: "確定登出",
  });
  if (res.isConfirmed) {
    await signOut(auth);
    router.replace("/login");
  }
};
</script>
