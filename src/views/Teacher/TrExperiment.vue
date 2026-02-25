<template>
  <div class="TrExpeiment animate__animated animate__fadeIn">
    <div class="row g-4">
      <div class="col-lg-8">
        <div class="card border-0 shadow-sm p-4 mb-4">
          <div class="d-flex align-items-center mb-4">
            <div class="icon-box me-3">
              <i class="bi bi-robot"></i>
            </div>
            <h5 class="fw-bold mb-0 text-navy">
              AI 學習引導方針 (System Prompt)
            </h5>
          </div>

          <div class="mb-4">
            <label class="form-label small fw-bold text-secondary"
              >AI 教學指令 (指令會影響 AI 的引導口吻與邏輯)</label
            >
            <textarea
              v-model="aiSettings.teacherPrompt"
              class="form-control bg-light border-0"
              rows="8"
              placeholder="範例：你是一位 SRL 學習教練。請在學生練習單字時，先引導他們進行「計畫階段」，詢問他們今天的學習目標..."
            ></textarea>
          </div>

          <div class="d-flex justify-content-end">
            <button
              class="btn btn-primary px-5 rounded-pill fw-bold"
              @click="saveAiSettings"
              :disabled="loading"
            >
              <span
                v-if="loading"
                class="spinner-border spinner-border-sm me-2"
              ></span>
              儲存 AI 方針
            </button>
          </div>
        </div>

        <div class="card border-0 shadow-sm p-4">
          <div class="d-flex align-items-center mb-4">
            <div class="icon-box me-3 bg-soft-success text-success">
              <i class="bi bi-people-fill"></i>
            </div>
            <h5 class="fw-bold mb-0 text-navy">實驗組別定義</h5>
          </div>

          <p class="text-muted small mb-4">
            在此定義的組別名稱將同步顯示於「數據看板」的分組管理中。
          </p>

          <div class="group-list">
            <div
              v-for="(group, idx) in experimentGroups"
              :key="group.id"
              class="input-group mb-3 shadow-sm rounded-3 overflow-hidden"
            >
              <span
                class="input-group-text border-0 bg-white fw-bold text-muted"
                >#{{ idx + 1 }}</span
              >
              <input
                v-model="group.name"
                type="text"
                class="form-control border-0 px-3"
                placeholder="輸入組別名稱"
              />
              <button
                class="btn btn-white border-0 text-danger"
                @click="removeGroup(idx)"
              >
                <i class="bi bi-trash3"></i>
              </button>
            </div>
          </div>

          <button
            class="btn btn-outline-primary btn-sm mt-2 rounded-pill border-2 fw-bold"
            @click="addGroup"
          >
            <i class="bi bi-plus-lg me-1"></i> 增加實驗組別
          </button>

          <div class="mt-4 d-flex justify-content-end">
            <button
              class="btn btn-navy px-5 rounded-pill fw-bold text-white"
              @click="saveGroups"
            >
              儲存組別設定
            </button>
          </div>
        </div>
      </div>

      <div class="col-lg-4">
        <div
          class="card border-0 shadow-sm p-4 sticky-top"
          style="top: 100px; z-index: 10"
        >
          <h5 class="fw-bold mb-4 text-navy border-bottom pb-2">
            實驗參數控制
          </h5>

          <div class="form-check form-switch mb-4 custom-switch">
            <input
              class="form-check-input"
              type="checkbox"
              v-model="aiSettings.allowVoice"
              @change="saveAiSettings"
            />
            <label class="form-check-label fw-bold">開啟語音輸入功能</label>
            <div class="form-text">允許學生使用語音辨識練習發音。</div>
          </div>

          <div class="form-check form-switch mb-4 custom-switch">
            <input
              class="form-check-input"
              type="checkbox"
              v-model="aiSettings.showFeedback"
              @change="saveAiSettings"
            />
            <label class="form-check-label fw-bold">即時回饋模式</label>
            <div class="form-text">練習完畢後立即顯示答題正確性。</div>
          </div>

          <div class="form-check form-switch mb-4 custom-switch">
            <input
              class="form-check-input"
              type="checkbox"
              v-model="aiSettings.enableSrlGuide"
              @change="saveAiSettings"
            />
            <label class="form-check-label fw-bold">強制 SRL 引導流程</label>
            <div class="form-text">學生必須完成計畫與反思才能結束單元。</div>
          </div>

          <div class="alert alert-info border-0 rounded-4 small mb-0">
            <i class="bi bi-info-circle-fill me-2"></i>
            在此變動的設定將即時寫入雲端數據庫，並影響所有線上學生的操作介面。
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { rtdb } from "../../firebase/config";
import { ref as dbRef, onValue, set } from "firebase/database";
import Swal from "sweetalert2";

const props = defineProps({
  courseId: { type: String, required: true },
});

const loading = ref(false);
const aiSettings = ref({
  teacherPrompt: "",
  allowVoice: false,
  showFeedback: true,
  enableSrlGuide: true,
});

const experimentGroups = ref([]);

onMounted(() => {
  // 監聽 AI 設定
  onValue(
    dbRef(rtdb, `courses/${props.courseId}/experiment/settings/aiSettings`),
    (snap) => {
      if (snap.exists())
        aiSettings.value = { ...aiSettings.value, ...snap.val() };
    },
  );

  // 監聽組別設定
  onValue(
    dbRef(rtdb, `courses/${props.courseId}/experiment/settings/groups`),
    (snap) => {
      const data = snap.val();
      experimentGroups.value = data
        ? Array.isArray(data)
          ? data
          : Object.values(data)
        : [
            { id: "group_1", name: "實驗組 (AI 引導)" },
            { id: "group_2", name: "控制組 (傳統模式)" },
          ];
    },
  );
});

const saveAiSettings = async () => {
  loading.value = true;
  try {
    await set(
      dbRef(rtdb, `courses/${props.courseId}/experiment/settings/aiSettings`),
      aiSettings.value,
    );
    loading.value = false;
  } catch (e) {
    Swal.fire("錯誤", "無法更新 AI 設定", "error");
  }
};

const saveGroups = async () => {
  try {
    await set(
      dbRef(rtdb, `courses/${props.courseId}/experiment/settings/groups`),
      experimentGroups.value,
    );
    Swal.fire("成功", "實驗組別已更新", "success");
  } catch (e) {
    Swal.fire("錯誤", "組別儲存失敗", "error");
  }
};

const addGroup = () => {
  experimentGroups.value.push({ id: "group_" + Date.now(), name: "新組別" });
};

const removeGroup = (idx) => {
  experimentGroups.value.splice(idx, 1);
};
</script>
