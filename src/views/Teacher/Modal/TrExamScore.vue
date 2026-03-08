<template>
  <div class="TrTest score-view-container animate__animated animate__fadeIn">
    <div v-for="e in exams" :key="e.id" class="score-list-card">
      <div>
        <span class="status-pill badge-post mb-2">測驗</span>
        <h5 class="fw-bold text-navy mb-1">{{ e.title }}</h5>
        <small class="text-muted">{{ e.questions?.length || 0 }} 題</small>
      </div>
      <button class="btn btn-navy-pill btn-sm px-4" @click="openModal(e)">
        成績總覽
      </button>
    </div>

    <div
      v-if="showModal"
      class="ex-modal-overlay"
      @click.self="showModal = false"
    >
      <div class="ex-modal-content">
        <div class="ex-modal-header">
          <h3>成績表：{{ currentItem?.title }}</h3>
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
                <th class="text-center">交卷</th>
                <th class="text-center" style="width: 150px">最終分數</th>
                <th class="text-center">詳細</th>
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
                    {{ stu.submitted ? "已交" : "未交" }}
                  </span>
                </td>
                <td class="text-center">
                  <div class="quick-score-box">
                    <input
                      v-model="stu.score"
                      type="number"
                      @change="saveTestScore(stu.uid, stu.score)"
                    />
                    <span class="smaller text-muted">分</span>
                  </div>
                </td>
                <td class="text-center">
                  <button
                    class="btn btn-sm btn-view-content rounded-pill"
                    :disabled="!stu.submitted"
                    @click="viewDetails(stu)"
                  >
                    查看內容
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
import "./TrExamScore.css";

const props = defineProps({ courseId: String });
const exams = ref([]);
const showModal = ref(false);
const currentItem = ref(null);
const studentList = ref([]);

// 1. 讀取測驗清單
onMounted(() => {
  onValue(dbRef(db, `courses/${props.courseId}/exams`), (snap) => {
    const data = snap.val();
    exams.value = data
      ? Object.entries(data).map(([id, d]) => ({ id, ...d }))
      : [];
  });
});

// 2. 打開成績總覽彈窗
const openModal = async (exam) => {
  currentItem.value = exam;
  studentList.value = [];

  try {
    const [profileSnap, answerSnap] = await Promise.all([
      get(dbRef(db, `courses/${props.courseId}/profiles`)),
      get(dbRef(db, `courses/${props.courseId}/exams/${exam.id}/answers`)),
    ]);

    const profiles = profileSnap.val() || {};
    const studentAnswers = answerSnap.val() || {};

    studentList.value = Object.entries(profiles).map(([uid, p]) => {
      const ansData = studentAnswers[uid] || null;
      return {
        uid,
        displayName: p.displayName || "匿名學生", // 對照 JSON 結構
        submitted: !!ansData,
        score: ansData?.score || 0,
        answers: ansData?.answers || [], // 儲存學生每題的回答
        submittedAt: ansData?.submittedAt || null,
      };
    });

    showModal.value = true;
  } catch (err) {
    console.error("讀取測驗數據失敗:", err);
  }
};

// 3. 查看詳細答題頁面 (Swal 預覽)
const viewDetails = (stu) => {
  if (!stu.submitted || !currentItem.value.questions) return;

  let html =
    '<div class="text-start" style="max-height: 450px; overflow-y: auto;">';
  currentItem.value.questions.forEach((q, idx) => {
    const sAns = stu.answers[idx];
    const isCorrect =
      q.type === "multipleChoice" ? sAns === q.finalAnswer : true; // 簡化判斷

    html += `
      <div class="mb-3 p-3 border-radius-sm bg-light">
        <div class="fw-bold text-navy mb-2">Q${idx + 1}. ${q.question} (${q.point}分)</div>
        <div class="small">
          <div class="mb-1 text-primary">學生答案：${formatVal(q, sAns)}</div>
          <div class="text-success">正確答案：${formatVal(q, q.finalAnswer || q.refAnswer)}</div>
        </div>
      </div>`;
  });
  html += "</div>";

  Swal.fire({
    title: `${stu.displayName} 的測驗詳情`,
    html: html,
    width: "650px",
    confirmButtonColor: "#1a2a40",
  });
};

const formatVal = (q, val) => {
  if (val === undefined || val === null) return "未答";
  if (q.type === "multipleChoice" && q.options) return q.options[val] || val;
  if (q.type === "multiSelect" && Array.isArray(val))
    return val.map((i) => q.options[i]).join(", ");
  return val;
};

const saveTestScore = async (uid, score) => {
  const path = `courses/${props.courseId}/exams/${currentItem.value.id}/answers/${uid}/score`;
  await set(dbRef(db, path), Number(score));
};
</script>
