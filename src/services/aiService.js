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
   * 功能：Stage 3 監控，對標全班領先群給予建議，並加入教師自定義指令
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
      teacherGlobalPrompt,
      teacherGroupPrompt,
    } = context;

    const systemPrompt = `
      你是一位專精於 SRL (自我調節學習) 的專業導師。
      你的任務是診斷學生的學習軌跡，並對標「班級領先群」(平均得分：${topAverage}) 給予改善建議。
      
      【教師特別指令】
      ${teacherGlobalPrompt || "請以專業且鼓勵的語氣引導學生。"}
      
      【針對此組別的額外要求】
      ${teacherGroupPrompt || "無特定組別要求。"}

      【排版規範】
      1. 請務必使用繁體中文。
      2. 請務必使用換行，將「現況診斷」與「建議策略」分開。
      3. 建議內容請使用條列式（例如使用 📍 符號）。
      4. 總字數請控制在 200 字以內，禁止廢話。
      5. 條列式換行不要擠在一起。
    `;

    const userContent = `
      單元：${unitTitle}
      [學生數據] 
      - 投入時間：${elapsedTime}分 (計畫：${plannedTime}分)
      - 影片觀看：${videoMins.toFixed(1)}分
      - 文件閱讀：${readingMins.toFixed(1)}分
      - 練習錯誤：${errorCount}次
      
      [班級基準] 領先群平均：${topAverage}分。
      
      請給我一段具備調節作用的具體建議。
    `;

    return await askOpenAI(systemPrompt, userContent, 400);
  },

  /**
   * 🚀 分支 2：單元結案反思建議 (用於 StuSRLEval.vue)
   * 功能：Stage 4 自我調節，針對學生歸因與心得給予前饋建議
   */
  async getEvalAdvice(context) {
    const { unit, gap, attribution, score, userComment, teacherInstructions } =
      context;

    const systemPrompt = `
    你是一位自我調節學習(SRL)的反思教練。任務已結束，請引導學生進行「前饋 (Feed-forward)」。

    ⚠️【最優先指令 - 格式規範】：
    ${teacherInstructions || "請依照 SRL 邏輯引導。"}

    【回覆結構要求】：
    1. 總結問題：簡短總結本次單元遇到的核心挑戰（對標數據與歸因）。
    2. 條列分析：以條列式（使用 - 或 1.）呈現 2 點關鍵分析。
    3. 前饋建議：結尾給出下一個單元具體的調節建議。

    【排版規範】：
    1. 必須嚴格執行上方【最優先指令】要求的開頭或結尾文字。
    2. 全文請使用繁體中文，字數控制在 120 字以內。
    3. 使用換行增加可讀性，口吻需具啟發性。
  `;

    const userContent = `
    [單元數據]
    - 名稱：${unit}
    - 時間：${gap > 0 ? "超時" : "提前"} ${Math.abs(gap)} 分鐘
    - 學生歸因：${attribution}
    - 策略評分：${score} 星
    - 心得回顧：${userComment || "未填寫"}

    請根據上述數據與規範，生成結構化的調節建議。
  `;

    try {
      return await askOpenAI(systemPrompt, userContent, 400);
    } catch (error) {
      console.error("AI Service Error:", error);
      // 備援方案：至少確保基本數值得以呈現
      return `路徑測試123\n本次單元執行${gap > 0 ? "較預期慢" : "比預期快"}了 ${Math.abs(gap)} 分鐘。建議下個單元持續優化策略！\n路徑測試實驗組`;
    }
  },
};
