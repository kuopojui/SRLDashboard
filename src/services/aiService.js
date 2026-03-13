import axios from "axios";

// 讀取環境變數 (保持原有的配置)
const API_KEY = import.meta.env.VITE_AI_API_KEY;
const API_URL = import.meta.env.VITE_AI_URL;
const MODEL = import.meta.env.VITE_AI_MODEL;

/**
 * 🌟 底層：OpenAI 請求函式 (保持你的原版邏輯，增加一點安全性)
 */
export const askOpenAI = async (systemPrompt, userContent) => {
  if (!API_KEY) return "系統配置錯誤：缺少 API 金鑰。";

  try {
    const response = await axios.post(
      API_URL,
      {
        model: MODEL || "gpt-3.5-turbo",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContent },
        ],
        temperature: 0.7,
        max_tokens: 400,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${API_KEY}`,
        },
      },
    );
    return response.data.choices[0].message.content;
  } catch (error) {
    console.error("❌ AI API 報錯:", error.response?.status || error.message);
    return "AI 導師目前連線繁忙，請繼續您的學習。";
  }
};

/**
 * 🌟 高層：AiService 診斷邏輯
 * 將 raw data 轉化為具備「對比感」的 Prompt
 */
export const AiService = {
  async getLearningAdvice(context) {
    const {
      videoMins,
      readingMins,
      errorCount,
      topAverage, // 全班領先群平均得分
      elapsedTime,
      plannedTime,
      unitTitle,
    } = context;

    // 1. 建立 System Role：定義 AI 的「藥石導師」人格
    const systemPrompt = `
      你是一位專精於 SRL (自我調節學習) 的專業導師。
      你的任務是診斷學生的學習軌跡，並對標「班級領先群」(平均得分：${topAverage}) 給予改善建議。
      
      請遵循「診斷 -> 對標 -> 藥石」三步驟：
      - 診斷：分析時間分配與錯誤率。
      - 對標：具體指出學生與班級領先群的差距或優勢。
      - 藥石：給出一個具體的調節策略（例如：調整閱讀速度、重新看影片、寫筆記）。
      
      要求：字數 60 字以內，語氣要溫和且有導師的權威感，嚴禁廢話。
    `;

    // 2. 建立 User Content：將數據脈絡化
    const userContent = `
      單元名稱：${unitTitle}
      [學生數據]
      - 投入時間：${elapsedTime} 分鐘 (當初規劃：${plannedTime} 分鐘)
      - 教材操作：影片 ${videoMins.toFixed(1)} 分 / 文件 ${readingMins.toFixed(1)} 分
      - 測驗表現：累積錯誤 ${errorCount} 次
      
      [班級基準]
      - 領先群平均得分：${topAverage} 分
      
      請根據上述「個人數據」與「班級基準」的差異，給我一條具備調節作用的改善建議。
    `;

    // 3. 執行請求
    return await askOpenAI(systemPrompt, userContent);
  },
};
