<template>
  <div class="TrHW score-minimal-container animate__animated animate__fadeIn">
    <div class="d-flex justify-content-between align-items-center mb-5">
      <h3 class="fw-800 text-navy m-0">功課評分列表</h3>
    </div>

    <div v-for="a in assignments" :key="a.id" class="hw-item-row">
      <div class="hw-info">
        <div class="hw-type"># {{ a.unit || "General" }}</div>
        <h5 class="hw-title">{{ a.title }}</h5>
        <div class="hw-meta">截止：{{ a.deadline || "無期限" }}</div>
      </div>

      <button class="btn-minimal-blue" @click="openModal(a)">
        查看名單 <i class="bi bi-chevron-right ms-1"></i>
      </button>
    </div>

    <div v-if="showModal" class="minimal-overlay" @click.self="closeModal">
      <div class="minimal-modal animate__animated animate__fadeInUp">
        <div class="modal-head mb-4">
          <div class="title-group">
            <h4 class="m-0 fw-800 text-navy">{{ currentItem?.title }}</h4>
            <span class="text-muted small">學生評分清單</span>
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
                >○ 未繳</span
              >
              <div v-else class="d-flex flex-column align-items-center">
                <span class="status-dot text-success">● 已繳</span>
                <span v-if="stu.isLate" class="badge-late">遲交</span>
              </div>
            </div>

            <div class="stu-score-input">
              <input
                v-model="stu.score"
                type="number"
                placeholder="--"
                @change="handleScoreChange(stu.uid, stu.score)"
              />
              <span class="unit-label">分</span>
            </div>

            <button
              class="btn-view-eye-minimal"
              :disabled="!stu.submitted"
              @click="viewSubmission(stu)"
            >
              <i class="bi bi-eye"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted } from "vue";
import { rtdb as db } from "../../../firebase/config";
import { ref as dbRef, onValue, set, get, update } from "firebase/database";
import Swal from "sweetalert2";
import "./TrHWScore.css";

const props = defineProps({ courseId: String });
const assignments = ref([]);
const showModal = ref(false);
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

// 1. 讀取功課清單
onMounted(() => {
  onValue(dbRef(db, `courses/${props.courseId}/assignments`), (snap) => {
    const data = snap.val();
    if (data) {
      assignments.value = Object.entries(data)
        .filter(([id]) => id !== "undefined")
        .map(([id, d]) => ({ id, ...d }));
    } else {
      assignments.value = [];
    }
  });
});

// 2. 開啟名單彈窗
const openModal = async (assignment) => {
  currentItem.value = assignment;
  studentList.value = [];
  lockScroll();

  try {
    const [profileSnap, submissionsSnap, scoresSnap] = await Promise.all([
      get(dbRef(db, `courses/${props.courseId}/profiles`)),
      get(
        dbRef(
          db,
          `courses/${props.courseId}/assignments/${assignment.id}/submissions`,
        ),
      ),
      get(
        dbRef(
          db,
          `courses/${props.courseId}/assignments/${assignment.id}/scores`,
        ),
      ),
    ]);

    const profiles = profileSnap.val() || {};
    const submissions = submissionsSnap.val() || {};
    const scores = scoresSnap.val() || {};

    const deadlineTS = assignment.deadline
      ? new Date(assignment.deadline).getTime()
      : null;

    studentList.value = Object.entries(profiles).map(([uid, p]) => {
      const sub = submissions[uid] || null;
      const scoreRecord = scores[uid] || null;

      // 🌟 核心修正：判定是否繳交
      // 線上模式：看是否在 submissions 節點有資料
      // 線下模式：看是否在 scores 節點有 status === 'submitted' 或已有分數
      let isSubmitted = false;
      let submittedAt = null;

      if (assignment.isOffline) {
        isSubmitted =
          scoreRecord?.status === "submitted" ||
          scoreRecord?.score !== undefined;
        submittedAt = scoreRecord?.updatedAt || null;
      } else {
        isSubmitted = !!sub;
        submittedAt = sub?.submittedAt || null;
      }

      // 遲交判定
      const isLate =
        deadlineTS && submittedAt ? submittedAt > deadlineTS : false;

      return {
        uid,
        displayName: p.displayName || "匿名學生",
        submitted: isSubmitted,
        isLate,
        answers: sub?.answers || [],
        score: scoreRecord?.score || 0,
      };
    });

    showModal.value = true;
  } catch (error) {
    console.error("讀取數據失敗:", error);
    unlockScroll();
  }
};

const closeModal = () => {
  showModal.value = false;
  unlockScroll();
};

// 3. 查看答題內容 (Swal 風格同步)
const viewSubmission = (stu) => {
  if (!stu.submitted || !currentItem.value.questions) return;

  let htmlContent = `<div class="text-start custom-scrollbar" style="max-height: 400px; overflow-y: auto; padding: 10px;">`;

  currentItem.value.questions.forEach((q, idx) => {
    const studentAns = stu.answers[idx];
    htmlContent += `
      <div class="mb-4 pb-2 border-bottom" style="border-color: rgba(74, 112, 169, 0.1) !important;">
        <div class="fw-bold" style="color: #3a5a8a;">Q${idx + 1}. ${q.question}</div>
        <div class="mt-2 d-flex align-items-baseline">
          <span class="badge bg-light text-navy border xx-small me-2">學生回答</span>
          <span style="color: #1a2a40; font-weight: 500;">${formatAnswer(q, studentAns)}</span>
        </div>
      </div>`;
  });
  htmlContent += "</div>";

  Swal.fire({
    title: `<span style="color: #3a5a8a; font-weight: 800;">${stu.displayName} 的作業</span>`,
    html: htmlContent,
    width: "550px",
    background: "#efece3", // 🌟 與背景米色一致
    confirmButtonText: "關閉閱覽",
    confirmButtonColor: "#3a5a8a",
    customClass: { popup: "rounded-4 shadow-lg border-0" },
  });
};

const formatAnswer = (question, ans) => {
  if (ans === null || ans === undefined || ans === "")
    return '<span class="text-danger">未作答</span>';
  if (question.type === "multipleChoice") {
    return `(${String.fromCharCode(65 + ans)}) ${question.options[ans] || ans}`;
  }
  if (question.type === "multiSelect") {
    return Array.isArray(ans)
      ? ans
          .map((i) => `(${String.fromCharCode(65 + i)}) ${question.options[i]}`)
          .join(", ")
      : ans;
  }
  return ans;
};

// 4. 存檔分數
const handleScoreChange = async (uid, score) => {
  if (!currentItem.value) return;

  const assignmentId = currentItem.value.id;
  const path = `courses/${props.courseId}/assignments/${assignmentId}/scores/${uid}`;

  try {
    // 🌟 使用 update 而非 set，避免覆蓋掉學生可能已存在的其他欄位
    // 同時強制寫入 status: "submitted"，確保看板能正確統計
    await update(dbRef(db, path), {
      score: Number(score),
      status: "submitted", // 🌟 確保線下作業給分後，狀態轉為已繳交
      updatedAt: Date.now(),
    });

    // 🌟 額外優化：同步更新該單元的 P75 (前25%) 統計數據
    // 這樣學生的儀表板折線圖指標才會跟著連動
    updateAssignmentStats(assignmentId);

    // 輕量級 Toast 通知
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
    console.error("儲存失敗:", error);
    Swal.fire({
      icon: "error",
      title: "儲存失敗",
      text: error.message,
      toast: true,
      position: "top-end",
      timer: 3000,
    });
  }
};

// 🌟 輔助函數：更新該功課項目的領先群指標
const updateAssignmentStats = async (hwId) => {
  try {
    const scoresSnap = await get(
      dbRef(db, `courses/${props.courseId}/assignments/${hwId}/scores`),
    );
    if (scoresSnap.exists()) {
      const data = Object.values(scoresSnap.val());
      const scores = data
        .map((d) => d.score)
        .filter((s) => typeof s === "number")
        .sort((a, b) => b - a);

      if (scores.length > 0) {
        const topCount = Math.max(1, Math.ceil(scores.length * 0.25));
        const topAvg = Math.round(
          scores.slice(0, topCount).reduce((a, b) => a + b, 0) / topCount,
        );

        // 將計算好的前25%平均值存入 stats 節點
        await update(
          dbRef(db, `courses/${props.courseId}/assignments/${hwId}/stats`),
          {
            topAverage: topAvg,
            lastUpdated: Date.now(),
          },
        );
      }
    }
  } catch (err) {
    console.warn("統計數據更新失敗", err);
  }
};

// 元件卸載時恢復捲動，避免 Modal 未關閉就導航走導致背景鎖死
onUnmounted(() => unlockScroll());
</script>
