// src/utils/logger.js
import { rtdb } from "../firebase/config"; // 確保此路徑正確指向您的 Firebase 設定
import { ref as dbRef, push, serverTimestamp } from "firebase/database";
import { getAuth } from "firebase/auth";

/**
 * 🌟 紀錄詳細操作行為
 * 路徑: courses/{courseId}/logs/{uid}
 */
export const recordStudentAction = async (
  courseId,
  actionName,
  details = {},
) => {
  const uid = getAuth().currentUser?.uid;
  if (!uid || !courseId) return;

  try {
    const logPath = `courses/${courseId}/logs/${uid}`;
    await push(dbRef(rtdb, logPath), {
      action: actionName,
      details: { ...details, platform: "web" },
      timestamp: serverTimestamp(),
    });
    console.log(`✅ [Log] 紀錄成功: ${actionName}`);
  } catch (e) {
    console.error("❌ [Log] 失敗:", e);
  }
};

/**
 * 🌟 紀錄 AI 提示詞與回覆歷史
 * 路徑: courses/{courseId}/ai_history/{uid}
 */
export const recordAiChat = async (courseId, prompt, response) => {
  const uid = getAuth().currentUser?.uid;
  if (!uid || !courseId) return;

  try {
    const aiRef = dbRef(rtdb, `courses/${courseId}/ai_history/${uid}`);
    await push(aiRef, {
      prompt,
      response,
      timestamp: serverTimestamp(),
      type: "srl_support",
    });
    console.log("✅ [AI Log] 對話已紀錄");
  } catch (e) {
    console.error("❌ [AI Log] 失敗:", e);
  }
};
