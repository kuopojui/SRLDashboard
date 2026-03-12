<template>
  <div
    class="TrLayout StuCourseDetail"
    :class="{ 'mobile-open': isSidebarOpen }"
  >
    <div
      class="mobile-overlay"
      v-if="isSidebarOpen"
      @click="isSidebarOpen = false"
    ></div>

    <aside class="TrSidebar shadow">
      <div
        class="sidebar-header"
        @click="$router.push('/stucourse')"
        style="cursor: pointer"
      >
        <div class="logo">
          <i class="bi bi-chevron-left"></i>
          <span>返回中心</span>
        </div>
      </div>

      <nav class="sidebar-nav">
        <section class="px-2 mb-4">
          <div class="course-hero-box p-3 rounded-4 shadow-sm">
            <div class="d-flex align-items-center gap-2 mb-2">
              <span
                v-if="hasPendingTest"
                class="badge-alert-pill animate__animated animate__pulse animate__infinite"
              >
                有待填寫問卷
              </span>
            </div>
            <h6 class="fw-bold mb-1 text-truncate">
              {{ courseInfo.title || "載入中..." }}
            </h6>
            <p class="text-muted xx-small mb-0 line-clamp-2">
              {{ courseInfo.description || "點擊單元開始學習" }}
            </p>
          </div>
        </section>

        <button
          class="nav-item"
          :class="{ active: currentView === 'dashboard' }"
          @click="
            currentView = 'dashboard';
            isSidebarOpen = false;
          "
        >
          <i class="bi bi-graph-up-arrow"></i>
          <span class="nav-label">學習診斷</span>
        </button>

        <button
          class="nav-item"
          :class="{ active: currentView === 'content' }"
          @click="
            currentView = 'content';
            isSidebarOpen = false;
          "
        >
          <i class="bi bi-collection-play"></i>
          <span class="nav-label">單元清單</span>
        </button>
      </nav>

      <div class="sidebar-footer">
        <div class="user-info-mini px-3 mb-3 opacity-75">
          <div class="xx-small fw-bold">{{ currentUser?.displayName }}</div>
          <div class="smaller">學生端系統</div>
        </div>
        <button class="nav-item return-btn logout-style" @click="handleLogout">
          <i class="bi bi-box-arrow-left"></i>
          <span class="nav-label">登出系統</span>
        </button>
      </div>
    </aside>

    <div class="TrMainContainer">
      <header class="TrHeader shadow-sm">
        <div class="header-left ms-3">
          <h5 class="fw-bold mb-0 text-navy">{{ courseInfo.title }}</h5>
        </div>

        <div class="header-right d-flex align-items-center me-3">
          <div class="join-code-pill d-lg-none" @click="copyJoinCode">
            <i class="bi bi-key-fill me-1"></i>
            <span class="code">{{ courseInfo.joinCode }}</span>
          </div>

          <button
            class="mobile-hamburger d-lg-none ms-2"
            @click="isSidebarOpen = !isSidebarOpen"
          >
            <i :class="['bi', isSidebarOpen ? 'bi-x-lg' : 'bi-list']"></i>
          </button>
        </div>
      </header>

      <main class="TrContent p-3 p-md-4">
        <div class="course-max-width">
          <transition name="fade" mode="out-in">
            <div :key="currentView">
              <div
                v-if="currentView === 'dashboard'"
                class="animate__animated animate__fadeIn"
              >
                <StuDashboard :courseId="courseId" />
              </div>
              <div
                v-if="currentView === 'content'"
                class="animate__animated animate__fadeIn"
              >
                <StuSchedule :courseId="courseId" />
              </div>
            </div>
          </transition>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive, onUnmounted, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { rtdb, auth } from "../../firebase/config";
import { ref as dbRef, onValue, get, off } from "firebase/database";
import { onAuthStateChanged, signOut } from "firebase/auth";
import Swal from "sweetalert2";

// 🌟 組件引入 (確保路徑正確)
import StuDashboard from "./StuDashboard.vue";
import StuSchedule from "./StuSchedule.vue";
import "./StuCourseDetail.css";

// 路由與基礎狀態
const route = useRoute();
const router = useRouter();
const courseId = route.params.courseId;
const isSidebarOpen = ref(false);
const currentView = ref("dashboard");
const currentUser = ref(null);

// 課程資料狀態
const courseInfo = ref({ title: "載入課程中...", description: "" });
const units = ref([]);

// 🌟 單元引導彈窗狀態管理 (對接 HTML 中的 v-if)
const showUnitIntroModal = ref(false);
const selectedUnitData = ref(null);
const selectedUnitIdx = ref(0);

// SRL 實驗問卷相關狀態
const hasPendingTest = ref(false);
const isCheckingTest = ref(true);

// 管理 Firebase 監聽器
let activeListeners = [];
let checkVersion = 0;

// --- 資料同步邏輯 ---
const initAllData = (uid) => {
  if (!courseId) return;

  // 監聽課程主資料
  const coursePath = dbRef(rtdb, `courses/${courseId}`);
  onValue(coursePath, (snap) => {
    if (snap.exists()) courseInfo.value = snap.val();
  });
  activeListeners.push(coursePath);

  // 執行 SRL 問卷檢查
  checkExperimentalTests(uid);
};

const checkExperimentalTests = (uid) => {
  const preTestRef = dbRef(rtdb, `courses/${courseId}/experiment/test/pretest`);
  isCheckingTest.value = true;

  onValue(preTestRef, async (snap) => {
    const currentV = ++checkVersion;
    const tests = snap.val();
    if (!tests) {
      hasPendingTest.value = false;
      isCheckingTest.value = false;
      return;
    }

    const visibleTests = Object.entries(tests).filter(
      ([id, v]) => v.visible === true,
    );

    try {
      const promises = visibleTests.map(async ([id, test]) => {
        const subSnap = await get(
          dbRef(
            rtdb,
            `courses/${courseId}/experiment/submissions/${id}/${uid}`,
          ),
        );
        return subSnap.exists();
      });
      const results = await Promise.all(promises);
      if (currentV !== checkVersion) return;
      hasPendingTest.value = results.includes(false);
    } finally {
      if (currentV === checkVersion) isCheckingTest.value = false;
    }
  });
  activeListeners.push(preTestRef);
};

// --- UI 互動函式 ---
const toggleSidebar = () => {
  isSidebarOpen.value = !isSidebarOpen.value;
};
const switchView = (view) => {
  currentView.value = view;
};
const triggerTestPopup = () => {
  /* 這裡可寫導航至問卷頁面的邏輯 */
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

// 生命週期
onMounted(() => {
  onAuthStateChanged(auth, (user) => {
    if (!user) router.replace("/login");
    else {
      currentUser.value = user;
      initAllData(user.uid);
    }
  });
});

onUnmounted(() => {
  activeListeners.forEach((path) => off(path));
  activeListeners = [];
});

// 監聽學生的組別狀態
const userSrlStatus = ref({ groupId: null, features: {} });

const watchUserGroup = (uid) => {
  const userPath = dbRef(rtdb, `courses/${courseId}/profiles/${uid}`);
  onValue(userPath, (snap) => {
    const profile = snap.val();
    if (profile?.groupId) {
      // 取得組別後，再去抓該組開啟了哪些模組 (Planning, AI Advice 等)
      const featPath = dbRef(
        rtdb,
        `courses/${courseId}/experiment/groups/${profile.groupId}`,
      );
      onValue(featPath, (gSnap) => {
        userSrlStatus.value = {
          groupId: profile.groupId,
          features: gSnap.val()?.features || {},
        };
      });
    }
  });
};
</script>
