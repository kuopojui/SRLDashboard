import axios from "axios";

// 讀取環境變數
const API_KEY = import.meta.env.VITE_AI_API_KEY;
const API_URL = import.meta.env.VITE_AI_URL;
const MODEL = import.meta.env.VITE_AI_MODEL;

/**
 * 🌟 OpenAI 通用請求函式
 * @param {string} systemPrompt - 教師定義的 SRL 方針 (System Role)
 * @param {string} userContent - 學生的數據與反思內容 (User Message)
 */
export const askOpenAI = async (systemPrompt, userContent) => {
  // 1. 安全檢查：確保金鑰已讀取
  if (!API_KEY) {
    console.error(
      "❌ 錯誤：未偵測到 VITE_AI_API_KEY。請檢查根目錄的 .env 檔案並重啟 npm run dev。",
    );
    return "系統配置錯誤：缺少 API 金鑰。";
  }

  console.log("🚀 [AI Service] 準備發送請求...");
  console.log("📍 使用模型:", MODEL);

  try {
    const response = await axios.post(
      API_URL,
      {
        model: MODEL || "gpt-3.5-turbo", // 如果環境變數沒抓到，預設使用 3.5
        messages: [
          {
            role: "system",
            content:
              systemPrompt ||
              "你是一位專業的學習教練，請根據 SRL 自我調節學習理論給予學生回饋。",
          },
          {
            role: "user",
            content: userContent,
          },
        ],
        temperature: 0.7,
        max_tokens: 500, // 限制長度以節省額度並防止過長回覆
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${API_KEY}`,
        },
      },
    );

    // 2. 成功日誌：在 Console 直接看 AI 說了什麼
    const aiResult = response.data.choices[0].message.content;
    console.log("✅ [AI Service] 回覆成功:", aiResult);

    return aiResult;
  } catch (error) {
    // 3. 詳細錯誤診斷
    if (error.response) {
      // API 端回報的錯誤 (例如：401 金鑰無效, 429 沒錢了)
      console.error(
        "❌ OpenAI API 報錯:",
        error.response.status,
        error.response.data,
      );
      if (error.response.status === 401)
        return "AI 認證失敗：請檢查 API 金鑰是否正確。";
      if (error.response.status === 429) return "AI 額度不足或請求過於頻繁。";
    } else {
      // 網路問題或程式碼錯誤
      console.error("❌ 連線失敗:", error.message);
    }
    return "AI 暫時無法回應，請檢查網路連線或稍後再試。";
  }
};
