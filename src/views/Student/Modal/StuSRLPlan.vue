<template>
  <div
    class="StuSrlPlan-Combined modal-card-custom shadow-lg animate__animated animate__zoomIn"
  >
    <div
      class="modal-header-custom border-bottom d-flex justify-content-between align-items-center p-3"
    >
      <h4 class="fw-800 mb-0 text-navy">
        <i class="bi bi-journal-check me-2"></i>單元學習準備
      </h4>
      <button class="close-btn border-0 bg-transparent" @click="$emit('close')">
        <span class="fs-4">✕</span>
      </button>
    </div>

    <div class="modal-body-custom p-0">
      <div class="row g-0">
        <div class="col-md-5 border-end bg-light-subtle p-4">
          <div class="unit-info-section">
            <div class="unit-tag mb-2 text-uppercase">{{ badgeText }}</div>

            <h3 class="fw-800 text-dark mb-3">
              {{ unitData?.title || "載入中..." }}
            </h3>

            <p class="text-muted small mb-4 lh-base">
              {{
                unitData?.description ||
                "本單元暫無詳細描述，請參考下方任務清單進行規劃。"
              }}
            </p>

            <div
              class="notice-box p-3 rounded bg-white border-start border-4 border-navy shadow-xs mb-3"
            >
              <h6 class="fw-bold text-navy mb-1 small">
                <i class="bi bi-person-badge-fill me-1"></i>教師建議標竿
              </h6>
              <div class="d-flex align-items-baseline">
                <span class="fs-4 fw-800 text-navy">{{
                  displayBenchmarkTime
                }}</span>
                <span class="ms-1 text-muted xx-small">官方建議</span>
              </div>
            </div>

            <div
              class="notice-box p-3 rounded bg-white border-start border-4 border-warning shadow-xs mb-3"
            >
              <h6 class="fw-bold text-warning mb-1 small">
                <i class="bi bi-star-fill me-1"></i>優秀同儕參考 (前 25%)
              </h6>
              <div class="d-flex align-items-baseline">
                <span class="fs-4 fw-800 text-warning">{{
                  displayTop25Time
                }}</span>
                <span class="ms-1 text-muted xx-small">高效率參考</span>
              </div>
            </div>

            <div
              class="notice-box p-3 rounded bg-white border-start border-4 border-success shadow-xs mb-3"
            >
              <h6 class="fw-bold text-success mb-1 small">
                <i class="bi bi-people-fill me-1"></i>全體平均時間 (50%)
              </h6>
              <div class="d-flex align-items-baseline">
                <span class="fs-4 fw-800 text-success">{{
                  displayAverageTime
                }}</span>
                <span class="ms-1 text-muted xx-small">大眾平均</span>
              </div>
            </div>

            <div class="row g-2 mb-4">
              <div v-for="stat in unitStats" :key="stat.label" class="col-6">
                <div
                  class="stat-card p-2 rounded border bg-white text-center shadow-xs"
                >
                  <div class="small text-muted">{{ stat.label }}</div>
                  <div class="fw-bold" :class="stat.colorClass">
                    {{ stat.count }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="col-md-7 p-4 bg-white">
          <div class="srl-form-section">
            <h5 class="fw-bold text-navy mb-4 border-bottom pb-2">
              <i class="bi bi-pencil-square me-2"></i>設定我的學習目標
            </h5>

            <div class="mb-4">
              <label class="form-label fw-bold small text-secondary"
                >1. 我打算投入多少時間來完成這個單元？</label
              >
              <div class="d-flex align-items-center gap-3">
                <div class="input-group shadow-sm" style="max-width: 140px">
                  <input
                    type="number"
                    v-model.number="planData.hours"
                    class="form-control border-end-0"
                    min="0"
                    placeholder="0"
                  />
                  <span class="input-group-text bg-white text-muted">時</span>
                </div>
                <div class="input-group shadow-sm" style="max-width: 140px">
                  <input
                    type="number"
                    v-model.number="planData.mins"
                    class="form-control border-end-0"
                    min="0"
                    max="59"
                    placeholder="0"
                  />
                  <span class="input-group-text bg-white text-muted">分</span>
                </div>
              </div>
              <div class="xx-small text-muted mt-2">
                <i class="bi bi-info-circle me-1"></i> 合計預計：{{
                  totalMinutesDisplay
                }}
              </div>
            </div>

            <div class="mb-4">
              <label class="form-label fw-bold small text-secondary"
                >2. 這次學習，我具體想學會什麼？</label
              >
              <textarea
                v-model="planData.targetGoal"
                class="form-control shadow-sm"
                rows="2"
                placeholder="例如：掌握光合作用的關鍵步驟"
              ></textarea>
            </div>

            <div class="mb-4">
              <label class="form-label fw-bold small text-secondary d-block"
                >3. 我打算使用哪種策略來幫助學習？</label
              >
              <div class="d-flex flex-wrap gap-2 mt-2">
                <button
                  v-for="opt in strategyOptions"
                  :key="opt"
                  type="button"
                  class="btn btn-sm btn-outline-secondary rounded-pill px-3 transition-all"
                  :class="{
                    'active-strategy': planData.strategies.includes(opt),
                  }"
                  @click="toggleStrategy(opt)"
                >
                  {{ opt }}
                </button>

                <div
                  v-if="!showCustomInput"
                  class="btn btn-sm btn-light rounded-pill px-3 border border-dashed"
                  @click="showCustomInput = true"
                >
                  <i class="bi bi-plus-lg me-1"></i>其他策略
                </div>

                <div
                  v-else
                  class="input-group input-group-sm"
                  style="max-width: 180px"
                >
                  <input
                    type="text"
                    v-model="customInput"
                    class="form-control rounded-start-pill"
                    placeholder="輸入後按確認"
                    @keyup.enter="addCustomStrategy"
                  />
                  <button
                    class="btn btn-navy rounded-end-pill px-2"
                    type="button"
                    @click="addCustomStrategy"
                  >
                    確認
                  </button>
                </div>
              </div>
            </div>

            <div class="mb-4">
              <label class="form-label fw-bold small text-secondary d-block"
                >4. 我有信心按照進度掌握本單元嗎？</label
              >
              <div class="d-flex align-items-center gap-2 py-1">
                <i
                  v-for="n in 5"
                  :key="n"
                  class="bi fs-3 cursor-pointer transition-all"
                  :class="
                    n <= planData.confidence
                      ? 'bi-star-fill text-warning'
                      : 'bi-star text-light-gray'
                  "
                  @click="planData.confidence = n"
                ></i>
                <span class="ms-2 badge bg-light text-navy border fw-bold">{{
                  confidenceText
                }}</span>
              </div>
            </div>

            <div class="row g-2 mt-4">
              <div class="col-6">
                <button
                  @click="handleSaveOnly"
                  class="btn btn-outline-navy w-100 py-3 fw-bold"
                  :disabled="isSaving"
                >
                  <i class="bi bi-cloud-check me-1"></i> 儲存設定
                </button>
              </div>
              <div class="col-6">
                <button
                  @click="handleStartUnit"
                  class="btn btn-navy w-100 py-3 fw-bold shadow"
                  :disabled="isSaving"
                >
                  開始本單元 <i class="bi bi-play-circle-fill ms-1"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import { rtdb, auth } from "../../../firebase/config";
import { ref as dbRef, update, push } from "firebase/database";
import "./StuSRLPlan.css";
import Swal from "sweetalert2";
import "../StuUnit.vue";
import StuUnit from "../StuUnit.vue";

const props = defineProps({
  courseId: String,
  taskId: String,
  unitData: Object, // 從父組件傳入的完整單元資料
  badgeText: { type: String, default: "UNIT" },
});

const emit = defineEmits([
  "submit-success",
  "close",
  "start-unit", // 新增這個事件，對應你 handleStartUnit 裡的呼叫
]);

const isSaving = ref(false);
const router = useRouter();

const confidenceText = computed(() => {
  const texts = ["非常焦慮", "有點擔心", "普通", "有信心", "完全沒問題"];
  return texts[planData.confidence - 1];
});

const handleSavePlan = async () => {
  const user = auth.currentUser;

  // 🌟 核心更新：確保 unitId 是純淨的 Firebase Key，移除可能的 "unit_" 前綴
  const cleanUnitId = props.taskId?.replace("unit_", "");

  // 驗證欄位
  if (!planData.value.targetTime || !planData.value.targetGoal) {
    alert("請填寫預計時間與學習目標唷！");
    return;
  }

  if (!user || !cleanUnitId) {
    console.error("缺少使用者資訊或單元 ID");
    return;
  }

  isSaving.value = true;

  // 🌟 路徑對齊：確保存檔在 srl/planning/[純淨ID] 下
  const path = `courses/${props.courseId}/profiles/${user.uid}/srl/planning/${cleanUnitId}`;

  try {
    // 1. 更新規劃資料
    await update(dbRef(rtdb, path), {
      targetTime: Number(planData.value.targetTime),
      targetGoal: planData.value.targetGoal,
      strategies: planData.value.strategies || [],
      confidence: planData.value.confidence,
      unitTitle: props.unitData?.title || "未命名單元", // 確保標題有寫入
      timestamp: Date.now(),
    });

    // 2. 推送行為日誌 (Log)
    await push(dbRef(rtdb, `courses/${props.courseId}/logs/${user.uid}`), {
      type: "unit_srl_planning",
      unitId: cleanUnitId, // 使用洗乾淨後的 ID
      content: `[單元規劃] ${props.unitData?.title || "未知單元"} - 預計:${planData.value.targetTime}分, 信心:${planData.value.confidence}`,
      timestamp: Date.now(),
    });

    emit("submit-success");
  } catch (error) {
    console.error("Save Error:", error);
    alert("儲存失敗，請檢查網路連線");
  } finally {
    isSaving.value = false;
  }
};

// --- 1. 計算資源統計 (unitStats) ---
// 使用更嚴謹的防錯處理，確保在資料載入中或結構缺失時不會崩潰
const unitStats = computed(() => {
  // 先提取 unitData，若為空則預設空物件
  const data = props.unitData || {};

  return [
    {
      label: "教材",
      // 使用 ?. 確保 materials 存在才讀取 length，否則回傳 0
      count: data.materials?.length || 0,
      colorClass: "text-primary",
    },
    {
      label: "任務",
      count: data.assignments?.length || 0,
      colorClass: "text-warning",
    },
    {
      label: "測驗",
      count: data.exams?.length || 0,
      colorClass: "text-success",
    },
    {
      label: "討論",
      // 對應資料庫中的 forums 節點
      count: data.forums?.length || 0,
      colorClass: "text-info",
    },
  ];
});

// --- 格式化時間工具函式 (共用) ---
const formatTimeLabel = (totalMinutes) => {
  if (!totalMinutes || totalMinutes === 0) return "未設定";

  const d = Math.floor(totalMinutes / 1440);
  const h = Math.floor((totalMinutes % 1440) / 60);
  const m = totalMinutes % 60;

  let result = "";
  if (d > 0) result += `${d}天 `;
  if (h > 0) result += `${h}時 `;
  if (m > 0 || result === "") result += `${m}分`;

  return result.trim();
};

// 1. 教師建議標竿
const displayBenchmarkTime = computed(() =>
  formatTimeLabel(props.unitData?.targetTime),
);

// 2. 優秀同儕參考 (前 25%)
// 假設資料庫欄位名為 topPerformanceTime
const displayTop25Time = computed(() => {
  const mins = props.unitData?.topPerformanceTime;
  return mins ? formatTimeLabel(mins) : "收集數據中";
});

// 3. 全體平均時間 (50%)
// 假設資料庫欄位名為 averageTime
const displayAverageTime = computed(() => {
  const mins = props.unitData?.averageTime;
  return mins ? formatTimeLabel(mins) : "計算中...";
});

//右側
// 🌟 1. 策略與動態輸入管理
const strategyOptions = ref(["死記硬背", "紀錄重點", "反覆複習"]);
const showCustomInput = ref(false);
const customInput = ref("");

const planData = ref({
  hours: 0,
  mins: 0,
  targetGoal: "",
  strategies: [],
  confidence: 3,
});

// 🌟 2. 時間加總與顯示邏輯
const calculatedTotalMins = computed(() => {
  return (
    (Number(planData.value.hours) || 0) * 60 +
    (Number(planData.value.mins) || 0)
  );
});

const totalMinutesDisplay = computed(() => {
  const total = calculatedTotalMins.value;
  if (total === 0) return "尚未設定";
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${h > 0 ? h + "小時 " : ""}${m}分鐘`;
});

// 🌟 3. 動態新增策略邏輯
const addCustomStrategy = () => {
  const val = customInput.value.trim();
  if (val) {
    if (!strategyOptions.value.includes(val)) {
      strategyOptions.value.push(val);
    }
    toggleStrategy(val);
    customInput.value = "";
    showCustomInput.value = false;
  }
};

const toggleStrategy = (label) => {
  const index = planData.value.strategies.indexOf(label);
  if (index > -1) planData.value.strategies.splice(index, 1);
  else planData.value.strategies.push(label);
};

// 🌟 4. 寫入 Firebase 邏輯
const saveToFirebase = async (isStarting) => {
  // 1. 進階驗證：檢查時間與目標
  if (calculatedTotalMins.value <= 0 || !planData.value.targetGoal.trim()) {
    Swal.fire({
      icon: "warning",
      title: "規劃不完整",
      text: "請填寫預計投入的時間與具體的學習目標唷！",
      confirmButtonColor: "#002c53",
    });
    return false;
  }

  isSaving.value = true;
  const user = auth.currentUser;

  // 2. 路徑清洗與對齊
  const cleanId = props.taskId?.replace("unit_", "");
  const path = `courses/${props.courseId}/profiles/${user.uid}/srl/planning/${cleanId}`;
  const logPath = `courses/${props.courseId}/logs/${user.uid}`;

  // 3. 構建資料酬載 (Payload)
  const payload = {
    targetTime: calculatedTotalMins.value,
    targetGoal: planData.value.targetGoal,
    strategies: planData.value.strategies || [],
    confidence: planData.value.confidence,
    lastUpdated: Date.now(), // 記錄最後修改時間
  };

  // 🌟 若為「開始本單元」，額外注入啟動標籤
  if (isStarting) {
    payload.startTime = Date.now();
    payload.status = "learning";
  }

  try {
    // 4. 同步更新資料庫
    await update(dbRef(rtdb, path), payload);

    // 5. 自動記錄行為日誌 (這對 SRL 分析非常重要)
    await push(dbRef(rtdb, logPath), {
      type: isStarting ? "srl_start_learning" : "srl_save_plan",
      unitId: cleanId,
      content: isStarting
        ? `[開始學習] 目標:${planData.value.targetGoal} (預計 ${calculatedTotalMins.value} 分鐘)`
        : `[儲存規劃] 信心度: ${planData.value.confidence}`,
      timestamp: Date.now(),
    });

    return true;
  } catch (error) {
    console.error("Firebase Update Error:", error);

    // 錯誤反饋
    Swal.fire({
      icon: "error",
      title: "連線發生錯誤",
      text: "資料暫時無法存檔，請檢查網路連線後再試一次。",
      confirmButtonColor: "#d33",
    });
    return false;
  } finally {
    isSaving.value = false;
  }
};

const handleSaveOnly = async () => {
  const success = await saveToFirebase(false);

  if (success) {
    const Toast = Swal.mixin({
      toast: true,
      position: "top-end",
      showConfirmButton: false,
      timer: 2000,
      timerProgressBar: true,
    });

    Toast.fire({
      icon: "success",
      title: "規劃已成功儲存！",
      text: "您可以繼續修改，或準備好後點擊開始。",
    });
  }
};

// 🌟 2. 開始本單元：使用彈窗確認，強化行動承諾 (Action Commitment)
// StuSRLPlan.vue
const handleStartUnit = async () => {
  // 1. 驗證邏輯：確保規劃完整
  if (calculatedTotalMins.value === 0 || !planData.value.targetGoal) {
    Swal.fire({
      icon: "warning",
      title: "規劃尚未完成",
      text: "設定預計時間與目標，能幫助您更有效地監控學習進度唷！",
      confirmButtonColor: "#002c53",
    });
    return;
  }

  // 2. 彈出確認視窗
  const result = await Swal.fire({
    title: "準備好開始學習了嗎？",
    html: `您預計投入 <b>${totalMinutesDisplay.value}</b><br>目標：${planData.value.targetGoal}`,
    icon: "question",
    showCancelButton: true,
    confirmButtonColor: "#002c53",
    confirmButtonText: "是的，開始計時！",
    reverseButtons: true,
  });

  if (result.isConfirmed) {
    // 3. 儲存至 Firebase
    const success = await saveToFirebase(true);

    if (success) {
      // 4. 將「標準」存入本地，供 StuUnit 頁面讀取
      const srlSession = {
        unitId: props.unitData.id,
        courseId: props.courseId,
        standards: {
          targetGoal: planData.value.targetGoal,
          plannedMins: calculatedTotalMins.value,
          strategies: planData.value.strategies,
        },
        startTime: Date.now(),
      };
      localStorage.setItem(`active_srl_session`, JSON.stringify(srlSession));

      await Swal.fire({
        icon: "success",
        title: "目標已鎖定！",
        text: "正在進入單元，祝您學習順利！",
        timer: 1500,
        showConfirmButton: false,
      });

      // 5. 🌟 執行跳轉 (修正 Params 以符合 router/index.js)
      console.log("正在跳轉至單元頁面：", props.unitData.id);

      router
        .push({
          name: "StuUnit",
          params: {
            courseId: props.courseId, // 🌟 必須傳入，因為路由有 :courseId
            id: props.unitData.id, // 🌟 必須傳入，因為路由有 :id
          },
        })
        .catch((err) => {
          console.error("路由跳轉失敗：", err);
        });

      // 6. 關閉彈窗
      emit("close");
    }
  }
};
</script>
