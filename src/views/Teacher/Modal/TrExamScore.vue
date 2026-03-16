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
              <div v-if="stu.submitted && stu.isLate" class="status-pill late">
                <i class="bi bi-clock-fill me-1"></i>遲交
              </div>
              <div v-else-if="stu.submitted" class="status-pill submitted">
                <i class="bi bi-check-circle-fill me-1"></i>已交
              </div>
              <div v-else class="status-pill pending">
                <i class="bi bi-dash-circle me-1"></i>未交
              </div>
            </div>

            <div class="stu-score-input">
              <input
                v-model="stu.score"
                type="number"
                placeholder="0"
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
import {
  ref as dbRef,
  onValue,
  set,
  get,
  off,
  update,
} from "firebase/database";
import Swal from "sweetalert2";
import "./TrExamScore.css";

const props = defineProps({ courseId: String });

// --- 狀態控制 ---
const exams = ref([]);
const showModal = ref(false);
const currentItem = ref(null);
const studentList = ref([]);
const isLoading = ref(false);

// 監聽器管理
let activeListeners = {
  exams: null,
  profiles: null,
  traces: null,
};

// --- 1. 初始化：讀取測驗清單 (保持同步) ---
onMounted(() => {
  const examsPath = dbRef(db, `courses/${props.courseId}/exams`);
  activeListeners.exams = onValue(examsPath, (snap) => {
    const data = snap.val();
    exams.value = data
      ? Object.entries(data).map(([id, d]) => ({ id, ...d }))
      : [];
  });
});

// --- 2. 打開名單並即時監聽 ---
const openModal = async (exam) => {
  currentItem.value = exam;
  isLoading.value = true;
  showModal.value = true;

  const profilesRef = dbRef(db, `courses/${props.courseId}/profiles`);
  const unitId = exam.unitId || "-OnlpYzB9HKzzvAtYhma";
  const tracesRef = dbRef(
    db,
    `courses/${props.courseId}/units/${unitId}/student_traces`,
  );

  activeListeners.profiles = onValue(profilesRef, (pSnap) => {
    const profiles = pSnap.val() || {};

    activeListeners.traces = onValue(tracesRef, (tSnap) => {
      const allTraces = tSnap.val() || {};
      const deadlineTS = exam.deadline
        ? new Date(exam.deadline).getTime()
        : null;

      const list = Object.entries(profiles).map(([uid, p]) => {
        const trace = allTraces[uid] || null;
        const isThisExam = trace && trace.examId === exam.id;

        // 🌟 核心防閃爍邏輯：
        // 1. 找到目前畫面上該學生的現有資料
        const existingStu = studentList.value.find((s) => s.uid === uid);

        // 2. 取得資料庫最新的分數
        const dbScore = isThisExam ? (trace.currentScore ?? 0) : 0;

        // 3. 判定分數：
        // 如果這個學生已經在畫面上，我們保留目前的 score (避免輸入時被 DB 的舊資料跳回 0)
        // 除非 dbScore 跟本地不一樣且本地沒有在「被修改中」的狀態（通常由 @change 處理完畢）
        const finalScore = existingStu ? existingStu.score : dbScore;

        return {
          uid,
          displayName: p.displayName || "學生",
          submitted:
            isThisExam &&
            (trace.status === "submitted" || trace.currentScore !== undefined),
          isLate:
            deadlineTS && trace?.lastActive
              ? trace.lastActive > deadlineTS
              : false,
          score: finalScore, // 🌟 使用保留的分數，不再強制變回 0
          answers: isThisExam ? trace.answers || [] : [],
          lastActive: trace?.lastActive,
        };
      });

      // 🌟 排序邏輯優化：
      // 如果 studentList 已經有資料，代表老師正在操作，這時我們只更新數值，不重新排序。
      // 避免老師輸入到一半，學生的位置因為「未交變已交」突然噴走。
      if (studentList.value.length === 0) {
        studentList.value = list.sort((a, b) => b.submitted - a.submitted);
      } else {
        // 更新數據但保持原本的順序
        studentList.value = list;
      }

      isLoading.value = false;
    });
  });
};
// --- 3. 顯示作答詳情 (Swal) ---
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
    title: `<span style="color: #3a5a8a; font-weight: 800;">${stu.displayName} 的作答內容</span>`,
    html: html,
    width: "600px",
    background: "#efece3",
    confirmButtonText: "關閉視窗",
    confirmButtonColor: "#3a5a8a",
    customClass: { popup: "rounded-4 shadow-lg border-0" },
  });
};

const formatVal = (q, val) => {
  if (val === undefined || val === null || val === "") return "未填寫";
  if (q.type === "multipleChoice" && q.options)
    return `(${String.fromCharCode(65 + val)}) ${q.options[val] || val}`;
  if (q.type === "multiSelect" && Array.isArray(val))
    return val
      .map((i) => `(${String.fromCharCode(65 + i)}) ${q.options[i]}`)
      .join(", ");
  return val;
};

// --- 4. 分數手動存檔：綁定 Exam ID ---
const saveTestScore = async (uid, score) => {
  if (!currentItem.value) return;

  const examId = currentItem.value.id;
  const unitId = currentItem.value.unitId;

  // 🌟 建立專屬路徑：優先存入 exams/{examId}/scores/{uid}
  // 這樣不同考試的成績就會完全分開
  let targetPath = `courses/${props.courseId}/exams/${examId}/scores/${uid}`;

  // 如果您希望同時同步回單元軌跡（選做）
  let tracePath = unitId
    ? `courses/${props.courseId}/units/${unitId}/student_traces/${uid}`
    : null;

  try {
    const updateData = {
      score: Number(score),
      updatedAt: Date.now(),
    };

    // 1. 存入考試專屬節點
    await update(dbRef(db, targetPath), updateData);

    // 2. 如果有綁定單元，同步更新單元內的 currentScore
    if (tracePath) {
      await update(dbRef(db, tracePath), { currentScore: Number(score) });
    }

    // 3. 更新該場考試的統計數據 (P75)
    const allScoresSnap = await get(
      dbRef(db, `courses/${props.courseId}/exams/${examId}/scores`),
    );
    if (allScoresSnap.exists()) {
      const scores = Object.values(allScoresSnap.val())
        .map((d) => d.score || 0)
        .sort((a, b) => b - a);

      const topCount = Math.max(1, Math.ceil(scores.length * 0.25));
      const topAvg = Math.round(
        scores.slice(0, topCount).reduce((a, b) => a + b, 0) / topCount,
      );

      // 存入該考試專屬的統計
      await update(
        dbRef(db, `courses/${props.courseId}/exams/${examId}/stats`),
        {
          topAverage: topAvg,
          lastUpdated: Date.now(),
        },
      );
    }

    Swal.fire({
      icon: "success",
      title: "成績已分別儲存",
      toast: true,
      position: "top-end",
      timer: 1500,
      showConfirmButton: false,
    });
  } catch (error) {
    console.error(error);
    Swal.fire("錯誤", "無法存檔", "error");
  }
};

const closeModal = () => {
  showModal.value = false;
  if (activeListeners.profiles)
    off(dbRef(db, `courses/${props.courseId}/profiles`));
  const unitId = currentItem.value?.unitId || "-OnlpYzB9HKzzvAtYhma";
  if (activeListeners.traces)
    off(dbRef(db, `courses/${props.courseId}/units/${unitId}/student_traces`));
};

onUnmounted(() => {
  if (activeListeners.exams) off(dbRef(db, `courses/${props.courseId}/exams`));
  closeModal();
});
</script>
