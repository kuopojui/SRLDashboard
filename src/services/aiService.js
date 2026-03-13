import axios from "axios";

// 讀取環境變數配置
const API_KEY = import.meta.env.VITE_AI_API_KEY;
const API_URL = import.meta.env.VITE_AI_URL;
const MODEL = import.meta.env.VITE_AI_MODEL;

/**
 * 🌟 底層：OpenAI 請求函式
 * 封裝通用的 API 調用邏輯
 */
export const askOpenAI = async (systemPrompt, userContent, maxTokens = 400) => {
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
        max_tokens: maxTokens,
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
 * 🌟 高層：AiService 服務物件
 * 包含「即時診斷」與「反思調節」兩個核心分支
 */
export const AiService = {
  /**
   * 🚀 分支 1：即時學習診斷 (用於 StuUnit.vue)
   * 功能：Stage 3 監控，對標全班領先群給予建議
   */
  async getLearningAdvice(context) {
    const {
      videoMins,
      readingMins,
      errorCount,
      topAverage,
      elapsedTime,
      plannedTime,
      unitTitle,
    } = context;

    const systemPrompt = `
      你是一位專精於 SRL (自我調節學習) 的專業導師。
      你的任務是診斷學生的學習軌跡，並對標「班級領先群」(平均得分：${topAverage}) 給予改善建議。
      請遵循「診斷 -> 對標 -> 藥石」三步驟，給出具體的調節策略。
      字數 60 字以內，語氣溫和且具權威感，嚴禁廢話。
    `;

    const userContent = `
      單元：${unitTitle}
      [學生數據] 投入時間：${elapsedTime}分 (計畫：${plannedTime}分)、影片：${videoMins.toFixed(1)}分、文件：${readingMins.toFixed(1)}分、錯誤：${errorCount}次。
      [班級基準] 領先群平均：${topAverage}分。
      請給我一條具備調節作用的改善建議。
    `;

    return await askOpenAI(systemPrompt, userContent, 300);
  },

  /**
   * 🚀 分支 2：單元結案反思建議 (用於 StuSRLEval.vue)
   * 功能：Stage 4 自我調節，針對學生歸因與心得給予前饋建議
   */
  async getEvalAdvice(context) {
    const { unit, gap, attribution, score, userComment } = context;

    const systemPrompt = `
      你是一位自我調節學習(SRL)的反思教練。
      學生的任務已結束，你的目標是引導學生進行「前饋 (Feed-forward)」。
      請根據學生的執行數據、歸因、策略評分與心得，給出下個單元的調整建議。
      字數 80 字內，口吻鼓勵且具啟發性。
    `;

    const userContent = `
      單元：${unit}
      數據：時間落差 ${gap > 0 ? "超時" : "提前"} ${Math.abs(gap)} 分鐘、學生歸因：${attribution}、策略有效性評分：${score}星。
      學生心得：${userComment || "未填寫"}。
      請提供針對性的調節建議。
    `;

    return await askOpenAI(systemPrompt, userContent, 400);
  },
};
