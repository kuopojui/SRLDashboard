<template>
  <div class="StuSrlStrategy card border-0 shadow-sm p-4 rounded-4">
    <div class="strategy-header mb-4">
      <div class="ai-avatar">
        <i class="bi bi-robot"></i>
      </div>
      <div>
        <h5 class="fw-bold mb-0">AI 學習策略助手</h5>
        <span class="badge bg-soft-purple text-purple">SRL 智能指引</span>
      </div>
    </div>

    <div class="advice-content mb-4">
      <div v-if="loading" class="text-center py-4">
        <div class="spinner-border text-purple" role="status"></div>
        <p class="mt-2 text-muted small">正在分析您的學習歷程...</p>
      </div>
      <div v-else class="advice-box p-3 bg-light rounded-3">
        <p class="mb-0 text-navy">
          {{
            aiAdvice ||
            "點擊下方按鈕，AI 將根據你目前的進度提供專屬學習策略建議。"
          }}
        </p>
      </div>
    </div>

    <button @click="getAiStrategy" :disabled="loading" class="btn-ai-action">
      <i class="bi bi-lightbulb-fill me-2"></i>獲取學習建議
    </button>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { rtdb, auth } from "../../firebase/config";
import { ref as dbRef, push, get } from "firebase/database";

const props = defineProps(["courseId"]);
const aiAdvice = ref("");
const loading = ref(false);

const getAiStrategy = async () => {
  loading.value = true;
  const user = auth.currentUser;

  try {
    // 1. 抓取學生當前的學習數據 (這部分可依需求擴充)
    const profileSnap = await get(
      dbRef(rtdb, `courses/${props.courseId}/profiles/${user.uid}`),
    );
    const profileData = profileSnap.val();

    // 2. 模擬 AI 請求邏輯 (此處之後可更換為您的 API)
    setTimeout(async () => {
      const advice =
        "根據你的進度，建議先針對『過去完成式』的練習題進行複習，並嘗試在朗讀時注意動詞變化。";
      aiAdvice.value = advice;

      // 3. 紀錄 AI 回傳至資料庫 (供教師端下載)
      await push(
        dbRef(rtdb, `courses/${props.courseId}/ai_history/${user.uid}`),
        {
          role: "assistant",
          content: advice,
          timestamp: Date.now(),
          context: { progress: profileData.progress || 0 },
        },
      );

      loading.value = false;
    }, 1500);
  } catch (error) {
    console.error("AI 獲取失敗", error);
    loading.value = false;
  }
};
</script>

<style src="./StuSrlStrategy.css" scoped></style>
