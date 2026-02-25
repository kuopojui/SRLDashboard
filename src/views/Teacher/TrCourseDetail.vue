<template>
  <div class="CourseDetail container-fluid py-4 bg-light min-vh-100">
    <div class="container">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <nav aria-label="breadcrumb">
            <ol class="breadcrumb mb-1">
              <li class="breadcrumb-item">
                <a href="#" @click.prevent="$router.push('/trcourse')"
                  >課程列表</a
                >
              </li>
              <li class="breadcrumb-item active">{{ courseInfo.title }}</li>
            </ol>
          </nav>
          <h2 class="h3 fw-bold mb-0">課程管理中心</h2>
        </div>
        <button
          v-if="currentView === 'content'"
          class="btn btn-primary px-4 rounded-pill shadow-sm"
          @click="showAddUnitModal = true"
        >
          <i class="bi bi-plus-circle me-1"></i> 新增學習單元
        </button>
      </div>

      <ul
        class="nav nav-tabs border-0 mb-4 gap-2 overflow-auto flex-nowrap pb-2"
      >
        <li class="nav-item">
          <button
            class="nav-link rounded-pill px-4 shadow-sm"
            :class="{
              'active bg-primary text-white': currentView === 'content',
            }"
            @click="currentView = 'content'"
          >
            <i class="bi bi-list-ul me-2"></i>單元大綱
          </button>
        </li>

        <li class="nav-item">
          <button
            class="nav-link rounded-pill px-4 shadow-sm"
            :class="{ 'active bg-primary text-white': currentView === 'add' }"
            @click="currentView = 'add'"
          >
            <i class="bi bi-plus-square-dotted me-2"></i>資源管理
          </button>
        </li>

        <li class="nav-item">
          <button
            class="nav-link rounded-pill px-4 shadow-sm"
            :class="{
              'active bg-primary text-white': currentView === 'dashboard',
            }"
            @click="currentView = 'dashboard'"
          >
            <i class="bi bi-graph-up-arrow me-2"></i>數據看板
          </button>
        </li>

        <li class="nav-item">
          <button
            class="nav-link rounded-pill px-4 shadow-sm"
            :class="{
              'active bg-primary text-white': currentView === 'settings',
            }"
            @click="currentView = 'settings'"
          >
            <i class="bi bi-gear me-2"></i>實驗設定
          </button>
        </li>

        <li class="nav-item">
          <button
            class="nav-link rounded-pill px-4 shadow-sm"
            :class="{
              'active bg-primary text-white': currentView === 'score',
            }"
            @click="currentView = 'score'"
          >
            <i class="bi bi-graph-up-arrow me-2"></i>成績檢視
          </button>
        </li>
      </ul>

      <div
        v-if="currentView === 'content'"
        class="row g-4 animate__animated animate__fadeIn"
      >
        <div class="col-lg-8">
          <div
            v-if="units.length === 0"
            class="card border-0 shadow-sm p-5 text-center"
          >
            <i class="bi bi-stack display-4 text-muted mb-3"></i>
            <p class="text-muted">
              目前尚未建立任何單元，請點擊右上方按鈕開始。
            </p>
          </div>

          <div v-else class="accordion shadow-sm" id="unitAccordion">
            <div
              v-for="(unit, index) in units"
              :key="unit.id"
              class="accordion-item border-0 mb-3 rounded-3 overflow-hidden"
            >
              <h2 class="accordion-header">
                <button
                  class="accordion-button collapsed fw-bold"
                  type="button"
                  data-bs-toggle="collapse"
                  :data-bs-target="'#collapse' + index"
                >
                  {{ unit.title }}
                </button>
              </h2>
              <div
                :id="'collapse' + index"
                class="accordion-collapse collapse"
                data-bs-parent="#unitAccordion"
              >
                <div class="accordion-body bg-white">
                  <p class="text-muted small">
                    {{ unit.description || "暫無說明" }}
                  </p>
                  <div class="d-flex gap-2 mt-3">
                    <button
                      class="btn btn-sm btn-outline-primary"
                      @click="manageUnitContent(unit)"
                    >
                      管理教材內容
                    </button>
                    <button
                      class="btn btn-sm btn-outline-danger"
                      @click="deleteUnit(unit.id)"
                    >
                      刪除
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="col-lg-4">
          <div class="card border-0 shadow-sm mb-4">
            <div class="card-body">
              <h5 class="fw-bold mb-3">課程資訊</h5>
              <div class="mb-2">
                邀請碼：<span class="badge bg-primary fs-6">{{
                  courseInfo.joinCode
                }}</span>
              </div>
              <div class="text-muted small">
                建立日期：{{ formatDate(courseInfo.createdAt) }}
              </div>
            </div>
          </div>
          <div class="card border-0 shadow-sm">
            <div class="card-body">
              <h5 class="fw-bold mb-3">已加入學生 ({{ students.length }})</h5>
              <div
                v-if="students.length === 0"
                class="text-muted small py-3 text-center"
              >
                尚無學生加入
              </div>
              <ul class="list-group list-group-flush">
                <li
                  v-for="stu in students"
                  :key="stu.uid"
                  class="list-group-item px-0 d-flex justify-content-between align-items-center"
                >
                  <span>{{ stu.displayName || "匿名學生" }}</span>
                  <span class="badge rounded-pill bg-light text-dark border"
                    >未開始</span
                  >
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div
        v-if="currentView === 'dashboard'"
        class="animate__animated animate__fadeIn"
      >
        <TrDashboard :courseId="courseId" />
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
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { rtdb } from "../../firebase/config";
import { ref as dbRef, onValue, push, set, remove } from "firebase/database";
import Swal from "sweetalert2";

//插件引入
import TrDashboard from "./TrDashboard.vue";
import TrExperiment from "./TrExperiment.vue";
import TrAdd from "./TrAdd.vue";
import TrScore from "./TrScore.vue";

const route = useRoute();
const router = useRouter();
const courseId = route.params.courseId;

const courseInfo = ref({});
const units = ref([]);
const students = ref([]);
const showAddUnitModal = ref(false);
const newUnit = ref({ title: "", description: "" });
const currentView = ref("content");

onMounted(() => {
  // 1. 抓取課程基礎資訊
  onValue(dbRef(rtdb, `courses/${courseId}`), (snap) => {
    courseInfo.value = snap.val() || {};
  });

  // 2. 監聽單元列表 (儲存在 courses/:id/units)
  onValue(dbRef(rtdb, `courses/${courseId}/units`), (snap) => {
    const data = snap.val();
    units.value = data
      ? Object.entries(data).map(([id, val]) => ({ id, ...id, ...val }))
      : [];
  });

  // 3. 監聽學生名單
  onValue(dbRef(rtdb, `courses/${courseId}/profiles`), (snap) => {
    const data = snap.val();
    students.value = data ? Object.values(data) : [];
  });
});

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
    Swal.fire("成功", "單元已建立", "success");
  } catch (e) {
    Swal.fire("錯誤", "無法建立單元", "error");
  }
};

const deleteUnit = (unitId) => {
  Swal.fire({
    title: "確定刪除？",
    text: "這將會移除該單元內的所有內容",
    icon: "warning",
    showCancelButton: true,
  }).then((res) => {
    if (res.isConfirmed) {
      remove(dbRef(rtdb, `courses/${courseId}/units/${unitId}`));
    }
  });
};

const manageUnitContent = (unit) => {
  // 未來導向具體的教材編輯頁
  Swal.fire("提示", `準備進入單元：${unit.title} 的詳細編輯頁面`, "info");
};

const formatDate = (ts) => (ts ? new Date(ts).toLocaleDateString() : "N/A");
</script>
