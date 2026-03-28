<template>
  <div class="StuCourse CoursePage d-flex min-vh-100">
    <!-- 1. 側邊欄：移除 d-none，改用 :class 控制移動端滑入 -->
    <aside
      class="CoursePage-sidebar d-flex flex-column py-4 shadow"
      :class="{ 'mobile-open': isSidebarOpen }"
    >
      <div class="sidebar-brand px-4 mb-5">
        <h5 class="fw-bold text-white mb-0 text-nowrap">
          <i class="bi bi-mortarboard me-2"></i>學生學習中心
        </h5>
      </div>

      <nav class="flex-grow-1 px-2">
        <!-- 1. 我的課程：直接設為 false 關閉側邊欄即可 -->
        <div
          class="CoursePage-nav-item active"
          @click="isSidebarOpen = false"
          style="cursor: pointer"
        >
          <i class="bi bi-book-half me-3"></i>我的課程
        </div>

        <!-- 2. 帳號設定：傳入 'profile' 觸發 Script 中的 handleOpenProfile -->
        <div
          class="CoursePage-nav-item"
          @click="handleNavAction('profile')"
          style="cursor: pointer"
        >
          <i class="bi bi-person-circle me-3"></i>帳號設定
        </div>
      </nav>

      <div class="mt-auto px-3">
        <!-- 3. 登出系統：傳入 'logout' 觸發 Script 中的 handleLogout -->
        <button
          class="btn btn-logout w-100 rounded-pill"
          @click="handleNavAction('logout')"
        >
          <i class="bi bi-box-arrow-left me-2"></i>登出系統
        </button>
      </div>
    </aside>

    <!-- 2. 手機版遮罩：選單開啟時顯示，點擊遮罩關閉選單 -->
    <div
      v-if="isSidebarOpen"
      class="sidebar-overlay d-lg-none"
      @click="toggleSidebar"
    ></div>

    <main class="flex-grow-1 d-flex flex-column">
      <!-- 3. Mobile Header (僅在 lg 以下寬度顯示) -->
      <header
        class="mobile-header d-lg-none p-3 shadow-sm text-white sticky-top"
      >
        <div class="d-flex justify-content-between align-items-center">
          <h6 class="mb-0 fw-bold">學生學習中心</h6>
          <button
            class="hamburger-btn border-0 bg-transparent"
            :class="{ active: isSidebarOpen }"
            @click="toggleSidebar"
          >
            <span class="hamburger-line"></span>
            <span class="hamburger-line"></span>
            <span class="hamburger-line"></span>
          </button>
        </div>
      </header>

      <!-- 主要標題區域 -->
      <section class="container-fluid px-4 pt-4 pb-2">
        <div
          class="d-flex flex-column flex-md-row justify-content-between align-items-md-end gap-3 mb-4"
        >
          <div>
            <h2 class="fw-bold text-dark mb-1">我的學習課程</h2>
            <p class="text-muted small mb-0">
              歡迎回來，今天也要繼續加油學習喔！
            </p>
          </div>
          <!-- 桌機版顯示加入課程按鈕 -->
          <button
            class="btn btn-navy shadow-sm rounded-pill px-4 py-2 d-none d-md-block"
            @click="promptJoinCode"
          >
            <i class="bi bi-plus-circle-fill me-2"></i>加入新課程
          </button>
        </div>
      </section>

      <!-- 課程列表滾動區域 -->
      <section class="course-scroll-area container-fluid px-4 pb-5">
        <div class="row g-4">
          <!-- 課程卡片循環 -->
          <div
            class="col-12 col-md-6 col-xl-4"
            v-for="course in joinedCourses"
            :key="course.id"
          >
            <div
              class="course-card shadow-sm border-0 bg-white p-3 rounded-4"
              @click="goToDashboard(course.id)"
            >
              <div class="d-flex align-items-center gap-3 mb-3">
                <div class="avatar-circle-navy">
                  {{ course.title?.substring(0, 1) || "?" }}
                </div>
                <div class="flex-grow-1 overflow-hidden">
                  <h5 class="fw-bold text-navy mb-0 text-truncate">
                    {{ course.title }}
                  </h5>
                  <div class="xx-small text-muted">
                    <i class="bi bi-person-fill me-1"></i>指導教師：{{
                      course.creatorName || "系統教師"
                    }}
                  </div>
                </div>
              </div>
              <div class="text-line-clamp text-secondary small mb-3">
                {{ course.description || "開始你的自我調節學習旅程。" }}
              </div>
              <div
                class="d-flex justify-content-between align-items-center border-top pt-3"
              >
                <div class="joined-date-badge">
                  <small>加入日期</small>
                  <span class="fw-bold text-primary">{{
                    formatDate(course.joinedAt)
                  }}</span>
                </div>
                <div class="btn-enter-course">
                  進入課程 <i class="bi bi-chevron-right"></i>
                </div>
              </div>
            </div>
          </div>

          <!-- 空狀態：尚未加入任何課程 -->
          <div
            v-if="joinedCourses.length === 0"
            class="col-12 text-center py-5 mt-5 opacity-50"
          >
            <i class="bi bi-journal-plus display-1"></i>
            <p class="mt-3 fs-5">尚未加入任何課程，請向老師索取 6 位代碼</p>
            <button
              class="btn btn-navy rounded-pill px-4"
              @click="promptJoinCode"
            >
              立即加入
            </button>
          </div>
        </div>
      </section>
    </main>

    <!-- 個人設定 Modal 放在最外層，確保 z-index 層級能正確覆蓋所有組件 -->
    <StuProfile
      v-if="showProfileModal && studentData.uid"
      :uid="studentData.uid"
      :courseId="null"
      @close="showProfileModal = false"
    />

    <!-- 手機版右下角懸浮按鈕：方便快速加入新課程 -->
    <button class="create-course-btn d-md-none" @click="promptJoinCode">
      <i class="bi bi-plus-lg fs-3"></i>
    </button>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import { rtdb, auth } from "../../firebase/config";
// 修正後的匯入
import {
  ref as dbRef,
  onValue,
  get,
  set,
  push,
  serverTimestamp,
} from "firebase/database";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { useRouter } from "vue-router";
import Swal from "sweetalert2";
import "./StuCourse.css";
import StuProfile from "./Modal/StuProfile.vue";

const router = useRouter();
const joinedCourses = ref([]);
const isSidebarOpen = ref(false);

const toggleSidebar = () => {
  isSidebarOpen.value = !isSidebarOpen.value;
  // 防止手機版選單開啟時背景頁面還能捲動
  if (isSidebarOpen.value) {
    document.body.style.overflow = "hidden";
  } else {
    document.body.style.overflow = "";
  }
};

const handleNavAction = (type) => {
  // 1. 關閉側邊欄
  isSidebarOpen.value = false;
  document.body.style.overflow = "";

  // 2. 執行對應動作
  if (type === "profile") {
    handleOpenProfile();
  } else if (type === "logout") {
    handleLogout();
  }
};

/* --- 1. 核心處理：兩階段驗證課程碼與分組碼 --- */
// 🌟 必須先定義此函式，避免 promptJoinCode 呼叫時出現 ReferenceError
const processJoin = async (inputJoinCode, inputPassCode) => {
  const user = auth.currentUser;
  try {
    // 取得所有課程資料進行比對
    const snap = await get(dbRef(rtdb, "courses"));
    const courses = snap.val();

    // A. 驗證課程邀請碼
    const targetCourseId = Object.keys(courses || {}).find(
      (k) => courses[k].joinCode === inputJoinCode,
    );

    if (!targetCourseId) {
      Swal.fire("錯誤", "找不到該邀請碼對應的課程", "error");
      return;
    }

    // B. 驗證該課程內的分組驗證碼
    const groups = courses[targetCourseId].experiment?.groups;
    if (!groups) {
      Swal.fire("警告", "該課程尚未設定實驗組別，請聯繫老師", "warning");
      return;
    }

    // 尋找匹配 passCode 的組別 ID
    const matchedGroup = Object.entries(groups).find(
      ([id, g]) => g.passCode?.toUpperCase() === inputPassCode,
    );

    if (!matchedGroup) {
      Swal.fire("錯誤", "分組驗證碼不正確，請重新確認", "error");
      return;
    }

    const [groupId, groupVal] = matchedGroup;

    // C. 寫入學生資料 (同步寫入組別資訊實現自動分組)
    await set(dbRef(rtdb, `courses/${targetCourseId}/profiles/${user.uid}`), {
      uid: user.uid,
      displayName: user.displayName || user.email.split("@")[0],
      joinedAt: Date.now(),
      groupId: groupId, // 🌟 直接分配組別
      groupCodeUsed: inputPassCode, // 紀錄使用的驗證碼
    });

    Swal.fire({
      icon: "success",
      title: "加入成功",
      text: `您已成功加入並分發至：${groupVal.name}`,
      timer: 2000,
    });
  } catch (e) {
    console.error("Join Error:", e);
    Swal.fire("錯誤", "系統連線失敗", "error");
  }
};

/* --- 2. 彈窗顯示：整合雙代碼輸入介面 --- */
const promptJoinCode = async () => {
  const { value: formValues } = await Swal.fire({
    title: "加入新課程",
    /* --- 修改 Swal.fire 中的 html 部分 --- */
    html: `
  <div class="swal-form-container px-2">
    <div class="mb-4 text-start">
      <div class="d-flex align-items-center mb-2">
        <div class="badge bg-primary rounded-circle me-2 d-flex justify-content-center align-items-center" style="width: 24px; height: 24px;">1</div>
        <label class="small fw-bold text-navy mb-0">課程邀請碼 (6位代碼)</label>
      </div>
      <input id="swal-input-joincode"
             class="form-control form-control-lg rounded-pill border-2 shadow-sm passcode-input"
             placeholder="例如: K89X2P"
             style="text-align: center; letter-spacing: 2px;">
    </div>

    <div class="text-start">
      <div class="d-flex align-items-center mb-2">
        <div class="badge bg-success rounded-circle me-2 d-flex justify-content-center align-items-center" style="width: 24px; height: 24px;">2</div>
        <label class="small fw-bold text-navy mb-0">組別通行碼 (班級代碼)</label>
      </div>
      <input id="swal-input-passcode"
             class="form-control form-control-lg rounded-pill border-2 shadow-sm passcode-input"
             placeholder="例如: AAA"
             style="text-align: center; letter-spacing: 2px;">
    </div>

    <div class="mt-3 p-2 bg-light rounded-4 small text-muted">
      <i class="bi bi-info-circle me-1"></i> 請向授課教師索取以上代碼
    </div>
  </div>
`,
    focusConfirm: false,
    showCancelButton: true,
    confirmButtonColor: "#3a5a8a",
    preConfirm: () => {
      const joinCode = document
        .getElementById("swal-input-joincode")
        .value.trim()
        .toUpperCase();
      const passCode = document
        .getElementById("swal-input-passcode")
        .value.trim()
        .toUpperCase();

      if (!joinCode || joinCode.length < 6) {
        Swal.showValidationMessage("請輸入有效的 6 位課程邀請碼");
        return false;
      }
      if (!passCode) {
        Swal.showValidationMessage("請輸入分組驗證碼");
        return false;
      }
      return { joinCode, passCode };
    },
  });

  if (formValues) {
    processJoin(formValues.joinCode, formValues.passCode);
  }
};

/* --- 3. 讀取邏輯與進入課程檢查 --- */
const fetchMyCourses = (uid) => {
  onValue(dbRef(rtdb, "courses"), (snapshot) => {
    const data = snapshot.val();
    const list = [];
    if (data) {
      Object.entries(data).forEach(([id, course]) => {
        if (course.profiles && course.profiles[uid]) {
          list.push({
            id,
            ...course,
            joinedAt: course.profiles[uid].joinedAt,
          });
        }
      });
    }
    joinedCourses.value = list;
  });
};

const goToDashboard = async (courseId) => {
  const user = auth.currentUser;
  if (!user) return;

  try {
    const pretestSnap = await get(
      dbRef(rtdb, `courses/${courseId}/experiment/test/pretest`),
    );
    const pretests = pretestSnap.val();

    if (pretests) {
      const visibleTests = Object.entries(pretests)
        .filter(([id, val]) => val.visible === true)
        .map(([id, val]) => ({ id, ...val }));

      const pendingTests = [];
      for (const test of visibleTests) {
        const subSnap = await get(
          dbRef(
            rtdb,
            `courses/${courseId}/experiment/submissions/${test.id}/${user.uid}`,
          ),
        );
        if (!subSnap.exists()) {
          pendingTests.push(test);
        }
      }

      if (pendingTests.length > 0) {
        const currentTest = pendingTests[0];
        await Swal.fire({
          title: "實驗前測任務",
          html: `進入課程前，請先完成前測問卷。<br><b class="text-primary">${currentTest.title}</b><br><small class="text-muted">(剩餘 ${pendingTests.length} 份待完成)</small>`,
          icon: "info",
          confirmButtonText: "開始填寫",
          confirmButtonColor: "#3a5a8a",
          allowOutsideClick: false,
        });
        router.push(`/pretest/${courseId}/${currentTest.id}`);
        return;
      }
    }
    router.push(`/studashboard/${courseId}`);
  } catch (e) {
    router.push(`/studashboard/${courseId}`);
  }
};

const handleLogout = async () => {
  await signOut(auth);
  router.replace("/login");
};

const formatDate = (ts) => (ts ? new Date(ts).toLocaleDateString() : "");

onMounted(() => {
  onAuthStateChanged(auth, (user) => {
    if (!user) router.replace("/login");
    else fetchMyCourses(user.uid);
  });
});

/* --- 在狀態定義區塊新增 --- */
const showProfileModal = ref(false);

// 準備傳遞給 StuProfile 的個人資料
const studentData = computed(() => {
  const user = auth.currentUser;
  return {
    uid: user?.uid,
    displayName: user?.displayName || user?.email?.split("@")[0],
    email: user?.email,
  };
});

// 點擊觸發函式
// StuCourse.vue Script 部分
const handleOpenProfile = async () => {
  showProfileModal.value = true;

  const uid = auth.currentUser?.uid;
  if (!uid) return;

  try {
    // 🌟 建議路徑：將全域動作歸類在 logs/global 下
    const logPath = `logs/global/${uid}`;
    await push(dbRef(rtdb, logPath), {
      action: "學生開啟帳號設定",
      timestamp: serverTimestamp(),
      details: { page: "StuCourse_Home" },
    });
  } catch (e) {
    console.error("紀錄失敗:", e);
  }
};
</script>
