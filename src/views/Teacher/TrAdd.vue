<template>
  <div class="TrAdd container-fluid py-4 animate__animated animate__fadeIn">
    <div class="NavTabs d-flex gap-2 mb-4 overflow-auto pb-2">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        class="btn btn-sm SwitchButton"
        :class="{ active: extraTab === tab.id }"
        @click="extraTab = tab.id"
      >
        <i :class="['bi', tab.icon, 'me-1']"></i>{{ tab.name }}
      </button>
    </div>

    <div class="ContentArea">
      <div v-for="tab in tabs" :key="tab.id">
        <div v-if="extraTab === tab.id" class="fade-in">
          <div
            class="section-header d-flex justify-content-between align-items-center mb-4"
          >
            <h3 class="section-title h5 mb-0 fw-bold title-blue">
              {{ tab.name }}列表
            </h3>
            <button
              class="btn-create-action fw-bold"
              @click="openModal(tab.id)"
            >
              ＋ 建立{{ tab.name }}
            </button>
          </div>

          <div v-if="dataList[tab.id].length" class="card-list">
            <div
              v-for="item in dataList[tab.id]"
              :key="item.id"
              class="material-list-card shadow-sm mb-3"
              :class="'border-' + tab.id"
            >
              <div class="card-body-main">
                <div class="card-left">
                  <h4 class="item-title fw-bold text-truncate">
                    {{ item.title }}
                  </h4>
                  <p class="item-description mb-2 text-truncate-2">
                    {{ item.description }}
                  </p>

                  <div class="item-meta d-flex flex-wrap gap-2">
                    <span v-if="item.deadline" class="deadline-tag">
                      <i class="bi bi-calendar-event me-1"></i>截止：{{
                        formatDate(item.deadline)
                      }}
                    </span>
                    <span
                      v-if="item.type"
                      class="type-tag badge bg-light text-dark border"
                    >
                      {{ item.type }}
                    </span>
                  </div>
                </div>

                <div
                  class="card-right d-flex flex-column align-items-end justify-content-between"
                >
                  <div class="time-text text-secondary xx-small text-end">
                    <i class="bi bi-clock me-1"></i
                    >{{ new Date(item.createdAt).toLocaleDateString() }}
                  </div>
                  <button
                    class="btn-delete-brick mt-2"
                    @click="handleDelete(tab.id, item.id, item.title)"
                  >
                    <span class="label-text fw-bold">X</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div
            v-else
            class="empty-state border-dashed py-5 text-center text-muted"
          >
            <i class="bi bi-inbox display-6 mb-2 d-block"></i>
            目前沒有{{ tab.name }}內容
          </div>
        </div>
      </div>
    </div>

    <MaterialCreate
      v-if="showModal.materials"
      :units="units"
      :courseId="courseId"
      @close="showModal.materials = false"
    />
    <HomeworkCreate
      v-if="showModal.assignments"
      :units="units"
      :courseId="courseId"
      @close="showModal.assignments = false"
    />
    <ExamCreate
      v-if="showModal.exams"
      :units="units"
      :courseId="courseId"
      @close="showModal.exams = false"
    />
    <DiscussionCreate
      v-if="showModal.discussions"
      :units="units"
      :courseId="courseId"
      @close="showModal.discussions = false"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, reactive } from "vue";
import { ref as dbRef, onValue, remove } from "firebase/database";
import { rtdb as db } from "../../firebase/config";
import { useRoute } from "vue-router";
import Swal from "sweetalert2";
import "./TrAdd.css";

// 引入建立組件
import MaterialCreate from "./Modal/MaterialCreate.vue"; // ✨ 新增教材建立
import HomeworkCreate from "./Modal/HomeworkCreate.vue";
import ExamCreate from "./Modal/ExamCreate.vue";
import DiscussionCreate from "./Modal/DiscussionCreate.vue";

const route = useRoute();
const courseId = route.params.courseId;
const extraTab = ref("materials"); // 預設改為教材

const tabs = [
  { id: "materials", name: "教材", icon: "bi-book" },
  { id: "assignments", name: "功課", icon: "bi-journal-text" },
  { id: "exams", name: "考試", icon: "bi-pencil-square" },
  { id: "discussions", name: "討論區", icon: "bi-chat-dots" },
];

const dataList = reactive({
  materials: [],
  assignments: [],
  exams: [],
  discussions: [],
});

const units = ref([]);
const showModal = reactive({
  materials: false,
  assignments: false,
  exams: false,
  discussions: false,
});

const openModal = (tabId) => {
  showModal[tabId] = true;
};

const handleDelete = async (type, id, title) => {
  const labelMap = {
    materials: "教材",
    assignments: "作業",
    exams: "考試",
    discussions: "討論",
  };
  const result = await Swal.fire({
    title: `刪除${labelMap[type]}`,
    text: `確定要刪除「${title}」嗎？此動作不可還原。`,
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "執行刪除",
    cancelButtonText: "取消",
    confirmButtonColor: "#d33",
  });

  if (result.isConfirmed) {
    await remove(dbRef(db, `courses/${courseId}/${type}/${id}`));
    Swal.fire({
      title: "已成功刪除",
      icon: "success",
      timer: 1000,
      showConfirmButton: false,
    });
  }
};

onMounted(() => {
  const sync = (path, key) => {
    onValue(dbRef(db, `courses/${courseId}/${path}`), (snap) => {
      const val = snap.val();
      dataList[key] = val
        ? Object.entries(val).map(([id, data]) => ({ id, ...data }))
        : [];
    });
  };

  sync("materials", "materials");
  sync("assignments", "assignments");
  sync("exams", "exams");
  sync("discussions", "discussions");
  onValue(dbRef(db, `courses/${courseId}/units`), (snap) => {
    const val = snap.val();
    units.value = val
      ? Object.entries(val).map(([id, data]) => ({ id, ...data }))
      : [];
  });
});

const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString("zh-TW") : "未設定";
</script>
