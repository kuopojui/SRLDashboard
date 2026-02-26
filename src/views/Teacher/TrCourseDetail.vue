<template>
  <div
    class="TrLayout"
    :class="{ 'sidebar-collapsed': isCollapsed, 'mobile-open': isMobileOpen }"
  >
    <aside class="TrSidebar">
      <div class="sidebar-header">
        <div class="logo">
          <i class="bi bi-shield-lock-fill"></i>
          <span>課程管理中心</span>
        </div>
      </div>

      <nav class="sidebar-nav">
        <button
          class="nav-item"
          :class="{ active: currentView === 'dashboard' }"
          @click="currentView = 'dashboard'"
        >
          <i class="bi bi-graph-up-arrow"></i>
          <span class="nav-label">數據看板</span>
        </button>

        <button
          class="nav-item"
          :class="{ active: currentView === 'content' }"
          @click="currentView = 'content'"
        >
          <i class="bi bi-list-ul"></i>
          <span class="nav-label">單元大綱</span>
        </button>

        <button
          class="nav-item"
          :class="{ active: currentView === 'add' }"
          @click="currentView = 'add'"
        >
          <i class="bi bi-plus-square-dotted"></i>
          <span class="nav-label">資源管理</span>
        </button>

        <button
          class="nav-item"
          :class="{ active: currentView === 'score' }"
          @click="currentView = 'score'"
        >
          <i class="bi bi-patch-check"></i>
          <span class="nav-label">成績檢視</span>
        </button>

        <button
          class="nav-item"
          :class="{ active: currentView === 'settings' }"
          @click="currentView = 'settings'"
        >
          <i class="bi bi-gear"></i>
          <span class="nav-label">實驗設定</span>
        </button>
      </nav>

      <div class="sidebar-footer">
        <button class="nav-item return-btn" @click="$router.push('/trcourse')">
          <i class="bi bi-arrow-left-square"></i>
          <span class="nav-label">返回列表</span>
        </button>
      </div>
    </aside>

    <div class="TrMainContainer">
      <header class="TrHeader shadow-sm">
        <div class="header-left">
          <div class="header-breadcrumb-area ms-3">
            <div class="header-main-info">
              <h5 class="fw-bold mb-0">{{ courseInfo.title }}</h5>
            </div>
          </div>
        </div>

        <div class="header-right d-flex align-items-center">
          <div class="join-code-tag me-3 d-none d-md-flex">
            <span class="label">邀請碼</span>
            <span class="code">{{ courseInfo.joinCode }}</span>
          </div>

          <button
            class="mobile-hamburger d-lg-none ms-3"
            @click="isMobileOpen = !isMobileOpen"
          >
            <i :class="['bi', isMobileOpen ? 'bi-x-lg' : 'bi-list']"></i>
          </button>
        </div>
      </header>

      <main class="TrContent p-4 CourseDetail">
        <div
          v-if="currentView === 'dashboard'"
          class="animate__animated animate__fadeIn"
        >
          <TrDashboard :courseId="courseId" />
        </div>
        <div
          v-if="currentView === 'content'"
          class="animate__animated animate__fadeIn"
        >
          <TrUnit :courseId="courseId" />
        </div>
        <div
          v-if="currentView === 'settings'"
          class="animate__animated animate__fadeIn"
        >
          <TrExperiment :courseId="courseId" />
        </div>
        <div
          v-if="currentView === 'add'"
          class="animate__animated animate__fadeIn"
        >
          <TrAdd :courseId="courseId" />
        </div>
        <div
          v-if="currentView === 'score'"
          class="animate__animated animate__fadeIn"
        >
          <TrScore :courseId="courseId" />
        </div>
      </main>
    </div>

    <div
      v-if="showAddUnitModal"
      class="modal fade show d-block"
      style="background: rgba(0, 0, 0, 0.5)"
    >
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content border-0 shadow">
          <div class="modal-header border-0">
            <h5 class="fw-bold">新增學習單元</h5>
            <button
              class="btn-close"
              @click="showAddUnitModal = false"
            ></button>
          </div>
          <div class="modal-body">
            <input
              v-model="newUnit.title"
              class="form-control mb-3"
              placeholder="例如：Unit 1 核心單字"
            />
            <textarea
              v-model="newUnit.description"
              class="form-control"
              rows="3"
              placeholder="單元學習目標說明..."
            ></textarea>
          </div>
          <div class="modal-footer border-0">
            <button class="btn btn-light" @click="showAddUnitModal = false">
              取消
            </button>
            <button class="btn btn-primary px-4" @click="addUnit">
              確認新增
            </button>
          </div>
        </div>
      </div>
    </div>

    <div
      class="mobile-overlay"
      v-if="isMobileOpen"
      @click="isMobileOpen = false"
    ></div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { rtdb } from "../../firebase/config";
import { ref as dbRef, onValue, push, set, remove } from "firebase/database";
import Swal from "sweetalert2";
import "./TrCourseDetail.css";

// 插件引入
import TrDashboard from "./TrDashboard.vue";
import TrExperiment from "./TrExperiment.vue";
import TrAdd from "./TrAdd.vue";
import TrScore from "./TrScore.vue";
import TrUnit from "./TrUnit.vue";

const route = useRoute();
const router = useRouter();

/** * ✨ 關鍵修正 1：變數宣告
 * 確保模板中使用的 isCollapsed 和 isMobileOpen 都有被定義
 */
const isCollapsed = ref(false); // 控制側邊欄收合 (電腦版)
const isMobileOpen = ref(false); // 控制側邊欄開啟 (手機版)
const currentView = ref("dashboard");

/**
 * ✨ 關鍵修正 2：路由參數
 * 請確認你的 router 設定中是用 :id 還是 :courseId
 * 根據你之前的報錯，這裡統整為抓取 params.id
 */
const courseId = route.params.id || route.params.courseId;

const courseInfo = ref({});
const units = ref([]);
const students = ref([]);
const showAddUnitModal = ref(false);
const newUnit = ref({ title: "", description: "" });

// ✨ 輔助：定義選單項目
const menuItems = [
  { id: "content", label: "單元大綱", icon: "bi-list-ul" },
  { id: "add", label: "資源管理", icon: "bi-plus-square-dotted" },
  { id: "dashboard", label: "數據看板", icon: "bi-graph-up-arrow" },
  { id: "score", label: "成績檢視", icon: "bi-patch-check" },
  { id: "settings", label: "實驗設定", icon: "bi-gear" },
];

onMounted(() => {
  if (!courseId) {
    Swal.fire("錯誤", "找不到課程 ID", "error");
    return;
  }

  // 1. 抓取課程基礎資訊
  onValue(dbRef(rtdb, `courses/${courseId}`), (snap) => {
    courseInfo.value = snap.val() || {};
  });

  // 2. 監聽單元列表
  onValue(dbRef(rtdb, `courses/${courseId}/units`), (snap) => {
    const data = snap.val();
    units.value = data
      ? Object.entries(data).map(([id, val]) => ({ id, ...val }))
      : [];
  });

  // 3. 監聽學生名單
  onValue(dbRef(rtdb, `courses/${courseId}/profiles`), (snap) => {
    const data = snap.val();
    students.value = data ? Object.values(data) : [];
  });
});

// ✨ 輔助方法：切換視圖並關閉手機版側欄
const switchView = (viewId) => {
  currentView.value = viewId;
  isMobileOpen.value = false;
};

const addUnit = async () => {
  if (!newUnit.value.title.trim()) return;
  const unitRef = push(dbRef(rtdb, `courses/${courseId}/units`));
  try {
    await set(unitRef, {
      ...newUnit.value,
      createdAt: Date.now(),
    });
    showAddUnitModal.value = false;
    newUnit.value = { title: "", description: "" };
    Swal.fire({
      title: "成功",
      text: "單元已建立",
      icon: "success",
      timer: 1500,
    });
  } catch (e) {
    Swal.fire("錯誤", "無法建立單元", "error");
  }
};

const deleteUnit = (unitId) => {
  Swal.fire({
    title: "確定要刪除此單元？",
    text: "刪除後將無法還原該單元內容",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#d33",
    confirmButtonText: "確定刪除",
    cancelButtonText: "取消",
  }).then((res) => {
    if (res.isConfirmed) {
      remove(dbRef(rtdb, `courses/${courseId}/units/${unitId}`));
    }
  });
};

const manageUnitContent = (unit) => {
  // 切換到資源管理頁面，並可以考慮自動帶入單元篩選 (進階功能)
  currentView.value = "add";
  Swal.fire("跳轉", `已切換至資源管理，請編輯單元：${unit.title}`, "info");
};

const formatDate = (ts) => (ts ? new Date(ts).toLocaleDateString() : "N/A");
</script>
