import { ref, onMounted, computed, nextTick, onUnmounted } from "vue";
import { rtdb as db } from "../firebase/config";
import {
  ref as dbRef,
  onValue,
  push,
  serverTimestamp,
} from "firebase/database";
import { getAuth } from "firebase/auth";
import { Chart, registerables } from "chart.js";

Chart.register(...registerables);

const props = defineProps({ courseId: String });
const courseId = props.courseId;

// --- 1. 狀態控制 ---
const aiAnalysis = ref("");
const showRankModal = ref(false);
const discussionCount = ref(0);
const performanceSummary = ref({ hw: [], exam: [] });

// 🌟 時間追蹤變數
const pageEnterTime = ref(null);
const materialStartTime = ref(null);

let hwChartInstance = null;
let examChartInstance = null;

// --- 2. 鉅細靡遺的行為紀錄 (Action Logs) ---
/**
 * 紀錄詳細操作 (如進入頁面、點擊、閱讀時間)
 * 路徑: courses/{courseId}/logs/{uid}
 */
const recordAction = async (action, details = {}) => {
  const uid = getAuth().currentUser?.uid;
  if (!uid) return;
  try {
    const logPath = `courses/${courseId}/logs/${uid}`;
    await push(dbRef(db, logPath), {
      action,
      details: { ...details, platform: "web" },
      timestamp: serverTimestamp(),
    });
  } catch (e) {
    console.error("Action Log 失敗:", e);
  }
};

// --- 3. AI 提示詞與回覆對照 (AI History) ---
/**
 * 紀錄學生提問內容與 AI 回覆，方便教師對照提問策略
 * 路徑: courses/{courseId}/ai_history/{uid}
 */
const recordAiChat = async (prompt, response) => {
  const uid = getAuth().currentUser?.uid;
  if (!uid) return;
  try {
    const aiRef = dbRef(db, `courses/${courseId}/ai_history/${uid}`);
    await push(aiRef, {
      prompt, // 學生提示詞
      response, // AI 回覆內容
      timestamp: serverTimestamp(),
      type: "srl_support",
    });
  } catch (e) {
    console.error("AI Log 失敗:", e);
  }
};

// --- 4. 數據監聽與埋點 ---
onMounted(() => {
  const auth = getAuth();
  const uid = auth.currentUser?.uid;
  if (!uid) return;

  // 🌟 紀錄進入頁面時間與行為
  pageEnterTime.value = Date.now();
  recordAction("進入學習診斷儀表板");

  // A. 監聽功課成績 (對齊 JSON: assignments/{id}/scores/{uid})
  onValue(dbRef(db, `courses/${courseId}/assignments`), (snap) => {
    if (!snap.exists()) return;
    const data = snap.val();
    const processedHw = Object.entries(data)
      .map(([id, val]) => ({
        title: val.title || "未命名任務",
        score:
          val.scores?.[uid]?.score !== undefined ? val.scores[uid].score : null,
        avg: val.stats?.avgScore || 0,
      }))
      .filter((i) => i.score !== null);

    performanceSummary.value.hw = processedHw;
    updateChart(
      "hwCompareChart",
      processedHw.map((i) => i.title),
      processedHw.map((i) => i.score),
      "#4a70a9",
    );
  });

  // B. 監聽討論次數 (對齊 JSON: discussions/{id}/messages)
  onValue(dbRef(db, `courses/${courseId}/discussions`), (snap) => {
    if (!snap.exists()) return;
    let count = 0;
    Object.values(snap.val()).forEach((disc) => {
      if (disc.messages) {
        count += Object.values(disc.messages).filter(
          (m) => m.userId === uid,
        ).length;
      }
    });
    discussionCount.value = count;
  });
});

// --- 5. 閱讀時間計算與卸載處理 ---
onUnmounted(() => {
  const stayDuration = Math.round((Date.now() - pageEnterTime.value) / 1000);
  // 🌟 離開時紀錄總停留時間
  recordAction("離開學習診斷儀表板", { total_stay_seconds: stayDuration });

  if (hwChartInstance) hwChartInstance.destroy();
  if (examChartInstance) examChartInstance.destroy();
});

// 🌟 點擊排行按鈕的詳細紀錄
const handleOpenRank = () => {
  showRankModal.value = true;
  recordAction("查看排行榜", { from: "top_stats_card" });
};

// 🌟 AI 呼叫範例：紀錄提問與回覆
const handleAiConsult = async (studentPrompt) => {
  // 假設這裡是您的 AI API 呼叫過程
  const aiResponseText = "建議您可以多參與討論區以提升學習成效...";
  aiAnalysis.value = aiResponseText;

  // 🌟 同步紀錄到 ai_history 節點
  await recordAiChat(studentPrompt, aiResponseText);
};
