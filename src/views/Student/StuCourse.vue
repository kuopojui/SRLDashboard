<template>
  <div class="StuCourse d-flex flex-column min-vh-100">
    <nav
      class="navbar navbar-expand-md navbar-light bg-white shadow-sm sticky-top"
    >
      <div class="container">
        <a class="navbar-brand fw-bold text-primary" href="#"
          >學生課程管理系統</a
        >
        <div class="ms-auto">
          <button
            class="btn btn-danger btn-sm px-3 rounded-pill"
            @click="handleLogout"
          >
            登出
          </button>
        </div>
      </div>
    </nav>

    <main class="container my-5 flex-grow-1">
      <div class="row justify-content-center">
        <div class="col-12 col-lg-10">
          <div class="d-flex justify-content-between align-items-center mb-5">
            <div>
              <h2 class="h3 mb-1 fw-bold text-dark">課程清單</h2>
            </div>
            <button
              class="btn btn-primary btn-lg shadow-sm px-4 rounded-pill"
              @click="promptJoinCode"
            >
              <i class="bi bi-plus-circle-fill me-2"></i>加入新課程
            </button>
          </div>

          <div class="row g-4">
            <div
              class="col-12 col-md-6 col-lg-4"
              v-for="course in joinedCourses"
              :key="course.id"
            >
              <div
                class="card h-100 border-0 shadow-sm course-card-hover p-2"
                @click="goToDashboard(course.id)"
              >
                <div class="card-body d-flex flex-column">
                  <h5 class="card-title fw-bold text-dark mb-3">
                    {{ course.title }}
                  </h5>
                  <p class="card-text text-muted small mb-4 text-truncate-2">
                    {{ course.description || "老師很懶，還沒寫描述..." }}
                  </p>

                  <div
                    class="mt-auto pt-3 border-top d-flex justify-content-between align-items-center"
                  >
                    <span class="text-muted xx-small">
                      <i class="bi bi-clock-history me-1"></i> 加入於
                      {{ formatDate(course.joinedAt) }}
                    </span>
                    <i class="bi bi-chevron-right text-primary"></i>
                  </div>
                </div>
              </div>
            </div>

            <div
              v-if="joinedCourses.length === 0"
              class="col-12 text-center py-5"
            >
              <div class="empty-box py-5">
                <i
                  class="bi bi-journal-bookmark display-1 text-light-emphasis"
                ></i>
                <h4 class="mt-3 text-secondary">這裡空空如也</h4>
                <p class="text-muted">
                  點擊「加入新課程」並輸入老師提供的 6 位代碼
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>

    <footer
      class="py-4 mt-auto bg-white border-top text-center text-muted small"
    >
      © 2026 AI SRL Learning System
    </footer>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { rtdb, auth } from "../../firebase/config";
import { ref as dbRef, onValue, get, set } from "firebase/database";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { useRouter } from "vue-router";
import Swal from "sweetalert2";

const router = useRouter();
const joinedCourses = ref([]);

/* --- 核心邏輯：讀取學生已加入的課程 --- */
const fetchMyCourses = (uid) => {
  // 監聽所有課程，過濾出 profiles 裡有自己 UID 的課程
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

/* --- 處理加入課程 --- */
const promptJoinCode = async () => {
  const { value: code } = await Swal.fire({
    title: "輸入課程代碼",
    input: "text",
    inputPlaceholder: "請輸入 6 位大寫邀請碼",
    showCancelButton: true,
    confirmButtonColor: "#4a70a9",
    inputValidator: (value) => {
      if (!value || value.length < 6) return "請輸入完整的邀請碼";
    },
  });

  if (code) {
    processJoin(code.toUpperCase());
  }
};

const processJoin = async (inputCode) => {
  const user = auth.currentUser;
  try {
    const snap = await get(dbRef(rtdb, "courses"));
    const courses = snap.val();
    const targetKey = Object.keys(courses || {}).find(
      (k) => courses[k].joinCode === inputCode,
    );

    if (targetKey) {
      // 寫入學生資料到該課程
      await set(dbRef(rtdb, `courses/${targetKey}/profiles/${user.uid}`), {
        uid: user.uid,
        displayName: user.displayName || user.email.split("@")[0],
        joinedAt: Date.now(),
      });
      Swal.fire("成功", "已加入該學習單元", "success");
    } else {
      Swal.fire("錯誤", "找不到該代碼對應的課程", "error");
    }
  } catch (e) {
    Swal.fire("錯誤", "連線失敗", "error");
  }
};

/* --- 進入課程前的實驗攔截檢查 --- */
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

      // 🌟 找出所有「尚未提交」的問卷
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
        const currentTest = pendingTests[0]; // 取得目前要填的第一份

        await Swal.fire({
          title: "實驗前測任務",
          // 🌟 顯示進度提示 (例如：還剩 2 份問卷)
          html: `進入課程前，請先完成前測問卷。<br><b class="text-primary">${currentTest.title}</b><br><small class="text-muted">(剩餘 ${pendingTests.length} 份待完成)</small>`,
          icon: "info",
          confirmButtonText: "開始填寫",
          confirmButtonColor: "#3a5a8a",
          allowOutsideClick: false,
        });

        // 🌟 跳轉時帶上特定的 testId
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
</script>
