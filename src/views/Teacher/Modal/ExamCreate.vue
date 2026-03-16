<template>
  <div class="ExamCreate ex-modal-overlay" @click.self="$emit('close')">
    <div
      class="ex-modal-content homework-theme animate__animated animate__fadeInUp"
    >
      <div class="ex-modal-header">
        <h3 class="modal-title-navy">
          <i class="bi bi-pencil-square me-2"></i
          >{{ form.isOffline ? "建立線下測驗" : "建立單元測驗" }}
        </h3>
        <button
          type="button"
          class="btn-close-red"
          @click="$emit('close')"
          title="關閉"
        >
          ✕
        </button>
      </div>

      <form
        @submit.prevent="createExam"
        class="ex-form-container custom-scrollbar"
      >
        <div class="form-body">
          <div class="mb-4">
            <label class="ex-label-small text-secondary fw-bold mb-2"
              >標題</label
            >
            <input
              v-model="form.title"
              type="text"
              class="ex-input-field"
              placeholder="例如：第一單元 課後練習或線下實作"
              required
            />
          </div>

          <div class="exam-settings-grid mb-4">
            <div :class="form.isOffline ? 'col-12' : 'setting-item'">
              <label class="ex-label-small text-secondary fw-bold mb-2">
                {{ form.isOffline ? "回報期限" : "截止日期" }}
              </label>
              <input
                v-model="form.deadline"
                type="datetime-local"
                class="ex-input-field"
                required
              />
            </div>

            <template v-if="!form.isOffline">
              <div class="setting-item">
                <label class="ex-label-small text-secondary fw-bold mb-2"
                  >時長 (分鐘)</label
                >
                <input
                  v-model="form.duration"
                  type="number"
                  class="ex-input-field"
                  placeholder="60"
                  min="1"
                />
              </div>

              <div class="setting-item">
                <label class="ex-label-small text-secondary fw-bold mb-2"
                  >可測驗次數</label
                >
                <input
                  v-model="form.maxAttempts"
                  type="number"
                  class="ex-input-field"
                  placeholder="1"
                  min="1"
                />
              </div>
            </template>
          </div>

          <div class="row g-3 mb-4">
            <div class="col-md-4 col-12">
              <div
                class="setting-card p-3 border rounded-4 bg-light d-flex justify-content-between align-items-center"
                :class="{ 'border-primary shadow-sm': form.isOffline }"
              >
                <div>
                  <span class="small fw-bold text-navy d-block"
                    >線下測驗模式</span
                  >
                  <span class="xx-small text-muted"
                    >學生僅回報完成，不需線上答題</span
                  >
                </div>
                <div class="form-check form-switch m-0">
                  <input
                    class="form-check-input"
                    type="checkbox"
                    v-model="form.isOffline"
                  />
                </div>
              </div>
            </div>

            <div class="col-md-4 col-12">
              <div
                class="setting-card p-3 border rounded-4 bg-white d-flex justify-content-between align-items-center"
              >
                <span class="small fw-bold text-navy">允許遲交</span>
                <div class="form-check form-switch m-0">
                  <input
                    class="form-check-input"
                    type="checkbox"
                    v-model="form.allowLate"
                  />
                </div>
              </div>
            </div>

            <div class="col-md-4 col-12" v-if="!form.isOffline">
              <div
                class="setting-card p-3 border rounded-4 bg-white d-flex justify-content-between align-items-center"
              >
                <span class="small fw-bold text-navy">立即顯示成績</span>
                <div class="form-check form-switch m-0">
                  <input
                    class="form-check-input"
                    type="checkbox"
                    v-model="form.showResult"
                  />
                </div>
              </div>
            </div>
          </div>

          <hr class="ex-divider my-4" />

          <div
            v-if="form.isOffline"
            class="offline-setup-box p-4 border rounded-4 bg-light text-center mb-4"
          >
            <i
              class="bi bi-person-workspace fs-1 text-secondary mb-2 d-block"
            ></i>
            <h6 class="fw-bold text-navy">線下測驗設定</h6>
          </div>

          <div v-else class="ex-question-list">
            <div
              class="ex-question-card shadow-sm border mb-4"
              v-for="(q, idx) in questions"
              :key="idx"
            >
              <div
                class="q-card-header d-flex justify-content-between align-items-center"
              >
                <div class="d-flex align-items-center gap-2">
                  <span
                    class="badge-index bg-danger text-white px-2 py-1 rounded"
                    >Q {{ idx + 1 }}</span
                  >
                  <div class="input-group input-group-sm" style="width: 120px">
                    <input
                      v-model="q.point"
                      type="number"
                      class="form-control"
                      placeholder="分值"
                      min="0"
                    />
                    <span class="input-group-text bg-white">分</span>
                  </div>
                </div>
                <button
                  type="button"
                  class="btn-remove-q"
                  @click="questions.splice(idx, 1)"
                >
                  <i class="bi bi-trash3"></i>
                </button>
              </div>

              <div class="q-card-body p-3">
                <input
                  v-model="q.question"
                  type="text"
                  class="ex-input-field mb-3"
                  placeholder="請輸入問題內容..."
                  required
                />
                <select
                  v-model="q.type"
                  class="ex-select-field mb-3"
                  @change="handleTypeChange(q)"
                >
                  <option value="shortAnswer">簡答題</option>
                  <option value="multipleChoice">單選題 (4選1)</option>
                  <option value="multiSelect">多選題 (5選項)</option>
                </select>

                <div class="ex-answer-setup p-3 rounded-4 bg-light">
                  <label class="xx-small fw-bold text-navy mb-2 d-block"
                    >參考答案設定</label
                  >
                  <div v-if="q.type === 'shortAnswer'">
                    <textarea
                      v-model="q.refAnswer"
                      class="ex-input-field"
                      rows="2"
                      placeholder="請輸入評分關鍵字..."
                    ></textarea>
                  </div>
                  <div v-else class="options-container">
                    <div
                      v-for="i in q.type === 'multipleChoice' ? 4 : 5"
                      :key="i"
                      class="option-row d-flex gap-2 mb-2 align-items-center"
                    >
                      <span
                        class="opt-label fw-bold text-muted"
                        style="min-width: 25px"
                        >{{ String.fromCharCode(64 + i) }}</span
                      >
                      <input
                        v-model="q.options[i - 1]"
                        type="text"
                        class="ex-input-field sm flex-grow-1"
                        placeholder="選項內容"
                        required
                      />
                      <input
                        v-if="q.type === 'multipleChoice'"
                        type="radio"
                        :name="'exans-' + idx"
                        :value="i - 1"
                        v-model="q.answer"
                        class="form-check-input"
                      />
                      <input
                        v-else
                        type="checkbox"
                        :value="i - 1"
                        v-model="q.multiAnswers"
                        class="form-check-input"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <button
              type="button"
              class="btn-add-dashed-full mb-4"
              @click="addQuestion"
            >
              <i class="bi bi-plus-lg me-2"></i> 新增下一道題目
            </button>
          </div>
        </div>

        <div
          class="ex-modal-footer d-flex justify-content-between align-items-center"
        >
          <div class="score-display fw-bold text-navy">
            總計評分：<span class="fs-4 text-danger">{{
              displayTotalScore
            }}</span>
            分
          </div>
          <button type="submit" class="ex-btn-navy-action">
            發佈{{ form.isOffline ? "作業" : "測驗" }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from "vue";
import { rtdb as db } from "../../../firebase/config";
import { ref as dbRef, push, set } from "firebase/database";
import Swal from "sweetalert2";
import "./ExamCreate.css";

const props = defineProps({ courseId: String });
const emit = defineEmits(["close"]);

// 測驗基本設定
const form = reactive({
  title: "",
  duration: 60,
  deadline: "",
  maxAttempts: 1,
  allowLate: false,
  showResult: true,
  isOffline: false, // 🌟 新增：是否為線下模式
  offlineTotalScore: 100, // 🌟 新增：線下模式的滿分
});

const questions = ref([]);

// 🌟 計算顯示的總分
const displayTotalScore = computed(() => {
  if (form.isOffline) return Number(form.offlineTotalScore) || 0;
  return questions.value.reduce((s, q) => s + (Number(q.point) || 0), 0);
});

onMounted(() => {
  document.body.style.overflow = "hidden";
});

onUnmounted(() => {
  document.body.style.overflow = "";
});

const addQuestion = () => {
  questions.value.push({
    type: "multipleChoice",
    question: "",
    point: 10,
    options: ["", "", "", "", ""],
    answer: 0,
    multiAnswers: [],
    refAnswer: "",
  });
};

const handleTypeChange = (q) => {
  q.answer = 0;
  q.multiAnswers = [];
  q.refAnswer = "";
};

const createExam = async () => {
  // 1. 驗證：線上模式必須有題目；線下模式則直接通過
  if (!form.isOffline && questions.value.length === 0) {
    return Swal.fire("提醒", "請至少新增一個題目", "warning");
  }

  const finalScore = displayTotalScore.value;

  // 2. 總分檢查：不到 100 分時提醒
  if (finalScore < 100) {
    const result = await Swal.fire({
      title: "總分不足 100 分",
      text: `目前總分為 ${finalScore} 分，確定要直接發佈嗎？`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3a5a8a", // Navy 主題色
      confirmButtonText: "仍要發佈",
      cancelButtonText: "回去修改",
    });

    if (!result.isConfirmed) return;
  }

  try {
    // 3. 根據模式構建乾淨的資料結構
    const examData = {
      title: form.title,
      deadline: form.deadline,
      allowLate: form.allowLate,
      isOffline: form.isOffline,
      totalScore: finalScore,
      createdAt: Date.now(),
    };

    if (form.isOffline) {
      // 🌟 線下模式：移除線上專用邏輯
      examData.duration = 0;
      examData.maxAttempts = 1;
      examData.showResult = false; // 老師在後台手動給分前，學生端不顯示結果
      examData.questions = []; // 線下不需要題目數據
    } else {
      // 🌟 線上模式：保留原本邏輯
      examData.duration = form.duration;
      examData.maxAttempts = form.maxAttempts;
      examData.showResult = form.showResult;
      examData.questions = questions.value.map((q) => {
        const base = { type: q.type, question: q.question, point: q.point };
        if (q.type === "shortAnswer") {
          return { ...base, refAnswer: q.refAnswer };
        }
        return {
          ...base,
          options:
            q.type === "multipleChoice"
              ? q.options.slice(0, 4)
              : q.options.slice(0, 5),
          finalAnswer: q.type === "multipleChoice" ? q.answer : q.multiAnswers,
        };
      });
    }

    // 4. 寫入 Firebase
    const newExamRef = push(dbRef(db, `courses/${props.courseId}/exams`));
    await set(newExamRef, examData);

    Swal.fire({
      icon: "success",
      title: form.isOffline ? "線下作業已發佈" : "測驗已發佈",
      showConfirmButton: false,
      timer: 1500,
    });

    emit("close");
  } catch (error) {
    console.error("發佈失敗原因：", error);
    Swal.fire("錯誤", "發佈失敗，請稍後再試", "error");
  }
};
</script>
