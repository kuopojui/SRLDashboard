<template>
  <div class="TrExam score-minimal-container animate__animated animate__fadeIn">
    <div class="d-flex justify-content-between align-items-center mb-5">
      <h3 class="fw-800 text-navy m-0">測驗成績列表</h3>
    </div>

    <div v-for="e in exams" :key="e.id" class="hw-item-row">
      <div class="hw-info">
        <div class="hw-type"># Exam Center</div>
        <h5 class="hw-title">{{ e.title }}</h5>
        <div class="hw-meta">
          題目：{{ e.questions?.length || 0 }} 題 | 總分：{{ e.totalScore }}
        </div>
      </div>

      <button class="btn-minimal-blue" @click="openModal(e)">
        查看名單 <i class="bi bi-chevron-right ms-1"></i>
      </button>
    </div>

    <div v-if="showModal" class="minimal-overlay" @click.self="closeModal">
      <div class="minimal-modal animate__animated animate__fadeInUp">
        <div class="modal-head mb-4">
          <div class="title-group">
            <h4 class="m-0 fw-800 text-navy">{{ currentItem?.title }}</h4>
            <span class="text-muted small">學生考試表現清單</span>
          </div>
          <button class="btn-close-red" @click="closeModal">✕</button>
        </div>

        <div class="modal-body custom-scrollbar">
          <div
            v-for="stu in studentList"
            :key="stu.uid"
            class="student-score-row"
          >
            <div class="stu-name-box">
              <span class="stu-name">{{ stu.displayName }}</span>
            </div>

            <div class="stu-status-box">
              <span v-if="!stu.submitted" class="status-dot text-muted"
                >○ 未交</span
              >
              <div v-else class="d-flex flex-column align-items-center">
                <span class="status-dot text-success">● 已交</span>
                <span v-if="stu.isLate" class="badge-late">遲交</span>
              </div>
            </div>

            <div class="stu-score-input">
              <input
                v-model="stu.score"
                type="number"
                placeholder="--"
                @change="saveTestScore(stu.uid, stu.score)"
              />
              <span class="unit-label">/ {{ currentItem?.totalScore }}</span>
            </div>

            <button
              class="btn-view-eye-minimal"
              :disabled="!stu.submitted"
              @click="viewDetails(stu)"
            >
              <i class="bi bi-file-earmark-text"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import { rtdb as db } from "../../../firebase/config";
import { ref as dbRef, onValue, set, get } from "firebase/database";
import Swal from "sweetalert2";
import "./TrExamScore.css";

const props = defineProps({ courseId: String });
const exams = ref([]);
const showModal = ref(false); // 🌟 確保定義了控制彈窗的變數
const currentItem = ref(null);
const studentList = ref([]);

// 🌟 捲動鎖定邏輯
const lockScroll = () => {
  document.body.style.overflow = "hidden";
  if (window.innerWidth < 768) {
    document.body.style.position = "fixed";
    document.body.style.width = "100%";
  }
};

const unlockScroll = () => {
  document.body.style.overflow = "";
  document.body.style.position = "";
  document.body.style.width = "";
};

// 1. 讀取測驗清單
onMounted(() => {
  onValue(dbRef(db, `courses/${props.courseId}/exams`), (snap) => {
    const data = snap.val();
    exams.value = data
      ? Object.entries(data).map(([id, d]) => ({ id, ...d }))
      : [];
  });
});

// 2. 打開成績名單彈窗 (將原本的 toggleExam 改回 openModal)
const openModal = async (exam) => {
  currentItem.value = exam;
  studentList.value = [];
  lockScroll(); // 鎖定背景

  try {
    const [profileSnap, answerSnap] = await Promise.all([
      get(dbRef(db, `courses/${props.courseId}/profiles`)),
      get(dbRef(db, `courses/${props.courseId}/exams/${exam.id}/answers`)),
    ]);

    const profiles = profileSnap.val() || {};
    const studentAnswers = answerSnap.val() || {};
    const deadlineTS = exam.deadline ? new Date(exam.deadline).getTime() : null;

    studentList.value = Object.entries(profiles).map(([uid, p]) => {
      const ansData = studentAnswers[uid] || null;
      const submittedAt = ansData?.submittedAt || null;
      const isLate =
        deadlineTS && submittedAt ? submittedAt > deadlineTS : false;

      return {
        uid,
        displayName: p.displayName || "匿名學生",
        submitted: !!ansData,
        isLate,
        score: ansData?.score || 0,
        answers: ansData?.answers || [],
        submittedAt: submittedAt,
      };
    });

    showModal.value = true; // 🌟 顯示彈窗
  } catch (err) {
    console.error("讀取測驗數據失敗:", err);
    unlockScroll();
  }
};

const closeModal = () => {
  showModal.value = false;
  unlockScroll();
};

// 3. 詳細答題詳情 (Swal)
const viewDetails = (stu) => {
  if (!stu.submitted || !currentItem.value.questions) return;

  let html = `<div class="text-start custom-scrollbar" style="max-height: 450px; overflow-y: auto; padding: 10px;">`;

  currentItem.value.questions.forEach((q, idx) => {
    const sAns = stu.answers[idx];
    const isCorrect = Array.isArray(q.finalAnswer)
      ? JSON.stringify(sAns?.sort()) === JSON.stringify(q.finalAnswer?.sort())
      : sAns === q.finalAnswer;

    html += `
      <div class="mb-4 pb-2 border-bottom" style="border-color: rgba(74, 112, 169, 0.1) !important;">
        <div class="fw-bold d-flex justify-content-between" style="color: #3a5a8a;">
          <span>Q${idx + 1}. ${q.question}</span>
          <span class="${isCorrect ? "text-success" : "text-danger"} small">${isCorrect ? "✓" : "✗"}</span>
        </div>
        <div class="mt-2 small">
          <div class="mb-1">
            <span class="text-muted">學生答案：</span>
            <span class="fw-bold ${isCorrect ? "text-success" : "text-danger"}">${formatVal(q, sAns)}</span>
          </div>
          <div class="text-muted">
            <span>正確答案：</span>
            <span class="text-navy">${formatVal(q, q.finalAnswer || q.refAnswer)}</span>
          </div>
        </div>
      </div>`;
  });
  html += "</div>";

  Swal.fire({
    title: `<span style="color: #3a5a8a; font-weight: 800;">${stu.displayName} 的試卷詳情</span>`,
    html: html,
    width: "600px",
    background: "#efece3",
    confirmButtonText: "關閉閱覽",
    confirmButtonColor: "#3a5a8a",
    customClass: { popup: "rounded-4 shadow-lg border-0" },
  });
};

const formatVal = (q, val) => {
  if (val === undefined || val === null || val === "") return "未答";
  if (q.type === "multipleChoice" && q.options)
    return `(${String.fromCharCode(65 + val)}) ${q.options[val] || val}`;
  if (q.type === "multiSelect" && Array.isArray(val))
    return val
      .map((i) => `(${String.fromCharCode(65 + i)}) ${q.options[i]}`)
      .join(", ");
  return val;
};

// 4. 存檔分數
const saveTestScore = async (uid, score) => {
  const path = `courses/${props.courseId}/exams/${currentItem.value.id}/answers/${uid}/score`;
  try {
    await set(dbRef(db, path), Number(score));
    Swal.fire({
      icon: "success",
      title: "成績已同步",
      toast: true,
      position: "top-end",
      timer: 1500,
      showConfirmButton: false,
      backdrop: false,
    });
  } catch (error) {
    Swal.fire("錯誤", "無法更新分數", "error");
  }
};

onUnmounted(() => unlockScroll());
</script>
