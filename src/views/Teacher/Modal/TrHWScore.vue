<template>
  <div class="TrHW score-view-container animate__animated animate__fadeIn">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h4 class="fw-bold text-navy mb-0">
        <i class="bi bi-journal-check me-2"></i>功課評分
      </h4>
    </div>

    <div v-for="a in assignments" :key="a.id" class="score-list-card">
      <div>
        <span class="status-pill badge-pre mb-2">{{
          a.unit || "一般作業"
        }}</span>
        <h5 class="fw-bold text-navy mb-1">{{ a.title }}</h5>
        <small class="text-muted">截止：{{ a.deadline || "不限時" }}</small>
      </div>
      <button class="btn btn-navy-pill btn-sm px-4" @click="openModal(a)">
        查看繳交
      </button>
    </div>

    <div
      v-if="showModal"
      class="ex-modal-overlay"
      @click.self="showModal = false"
    >
      <div class="ex-modal-content">
        <div class="ex-modal-header">
          <h3>批改：{{ currentItem?.title }}</h3>
          <button
            class="btn-close btn-close-white"
            @click="showModal = false"
          ></button>
        </div>

        <div class="ex-table-wrapper">
          <table class="ex-score-table">
            <thead>
              <tr>
                <th class="ps-4">學生</th>
                <th class="text-center">狀態</th>
                <th class="text-center">分數</th>
                <th class="text-center">操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="stu in studentList" :key="stu.uid">
                <td class="ps-4 stu-info">
                  <span class="name">{{ stu.displayName }}</span>
                </td>

                <td class="text-center">
                  <span
                    :class="[
                      'status-pill',
                      stu.submitted ? 'badge-done' : 'badge-pending',
                    ]"
                  >
                    {{ stu.submitted ? "已繳" : "未繳" }}
                  </span>
                </td>

                <td class="text-center">
                  <div class="quick-score-box">
                    <input
                      v-model="stu.score"
                      type="number"
                      placeholder="0"
                      @change="saveScore(stu.uid, stu.score)"
                    />
                    <span class="smaller text-muted">分</span>
                  </div>
                </td>

                <td class="text-center">
                  <button
                    class="btn btn-sm btn-view-content rounded-pill"
                    :disabled="!stu.submitted"
                    @click="viewSubmission(stu)"
                  >
                    <i class="bi bi-eye me-1"></i>查看內容
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { rtdb as db } from "../../../firebase/config";
import { ref as dbRef, onValue, set, get } from "firebase/database";
import Swal from "sweetalert2";
import "./TrHWScore.css";

const props = defineProps({ courseId: String });
const assignments = ref([]);
const showModal = ref(false);
const currentItem = ref(null);
const studentList = ref([]);

// 1. 讀取所有功課清單，過濾掉 JSON 中的 "undefined" 鍵值
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

// 2. 打開批改彈窗：結合 Profile 與 Submissions
const openModal = async (assignment) => {
  currentItem.value = assignment;
  studentList.value = [];

  try {
    // 同步獲取學生資訊、提交內容與現有分數
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

    // 依照 profiles 建立學生列表，確保未繳交的學生也會出現
    studentList.value = Object.entries(profiles).map(([uid, p]) => {
      const sub = submissions[uid] || null;
      return {
        uid,
        displayName: p.displayName || "匿名學生", // JSON 中使用的是 displayName
        submitted: !!sub,
        status: sub?.status || "pending",
        answers: sub?.answers || [], // 取得學生答題陣列
        submittedAt: sub?.submittedAt || null,
        score: scores[uid]?.score || 0,
      };
    });

    showModal.value = true;
  } catch (error) {
    console.error("讀取數據失敗:", error);
  }
};

// 3. 查看答題詳情：將 answers 與題目對照
const viewSubmission = (stu) => {
  if (!stu.submitted || !currentItem.value.questions) return;

  let htmlContent =
    '<div class="text-start" style="max-height: 400px; overflow-y: auto;">';

  currentItem.value.questions.forEach((q, idx) => {
    const studentAns = stu.answers[idx];
    htmlContent += `
      <div class="mb-3 p-2 border-bottom">
        <div class="fw-bold text-navy">Q${idx + 1}. ${q.question} <small class="text-muted">(${q.type})</small></div>
        <div class="mt-1">
          <span class="badge bg-light text-dark border">學生回答：</span>
          <span class="ms-2">${formatAnswer(q, studentAns)}</span>
        </div>
      </div>`;
  });

  htmlContent += "</div>";

  Swal.fire({
    title: `${stu.displayName} 的繳交內容`,
    html: htmlContent,
    width: "600px",
    confirmButtonText: "關閉",
    confirmButtonColor: "#1a2a40",
  });
};

// 輔助函式：根據題型格式化輸出答案
const formatAnswer = (question, ans) => {
  if (ans === null || ans === undefined)
    return '<span class="text-danger">未作答</span>';
  if (question.type === "multipleChoice") {
    return question.options[ans] || ans;
  }
  if (question.type === "multiSelect") {
    return Array.isArray(ans)
      ? ans.map((i) => question.options[i]).join(", ")
      : ans;
  }
  return ans;
};

const saveScore = async (uid, score) => {
  const path = `courses/${props.courseId}/assignments/${currentItem.value.id}/scores/${uid}`;
  try {
    await set(dbRef(db, path), {
      score: Number(score),
      updatedAt: Date.now(),
    });
  } catch (error) {
    Swal.fire("儲存失敗", error.message, "error");
  }
};
</script>
