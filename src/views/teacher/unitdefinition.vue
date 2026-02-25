<template>
  <div class="container py-5">
    <div class="card shadow">
      <div class="card-header bg-primary text-white">
        <h4 class="mb-0">教師端：定義第一課單字 (SRL 實驗設定)</h4>
      </div>
      <div class="card-body">
        <div class="row mb-4">
          <div class="col-md-6">
            <label class="form-label fw-bold">單元名稱</label>
            <input
              v-model="unit.title"
              type="text"
              class="form-control"
              placeholder="例如：Book 1 Lesson 1"
            />
          </div>
          <div class="col-md-3">
            <label class="form-label fw-bold">建議完成天數</label>
            <input
              v-model.number="unit.targetDays"
              type="number"
              class="form-control"
            />
          </div>
          <div class="col-md-3">
            <label class="form-label fw-bold">預警分數門檻</label>
            <input
              v-model.number="unit.passingScore"
              type="number"
              class="form-control"
            />
          </div>
        </div>

        <table class="table table-bordered">
          <thead class="table-light">
            <tr>
              <th>英文單字</th>
              <th>中文翻譯</th>
              <th width="100">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, index) in unit.vocabList" :key="index">
              <td>
                <input v-model="item.en" type="text" class="form-control" />
              </td>
              <td>
                <input v-model="item.ch" type="text" class="form-control" />
              </td>
              <td>
                <button
                  @click="removeVocab(index)"
                  class="btn btn-outline-danger btn-sm"
                >
                  刪除
                </button>
              </td>
            </tr>
          </tbody>
        </table>

        <div class="d-flex justify-content-between">
          <button @click="addVocab" class="btn btn-secondary">
            + 新增單字列
          </button>
          <button @click="publishUnit" class="btn btn-success px-5">
            發佈單元至 Firebase
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { db } from "../../firebase/config"; // 確保路徑正確
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

// 定義資料狀態
const unit = ref({
  title: "第一課單字",
  targetDays: 3,
  passingScore: 80,
  vocabList: [
    { en: "hello", ch: "你好" },
    { en: "student", ch: "學生" },
  ],
});

// 新增單字列
const addVocab = () => {
  unit.value.vocabList.push({ en: "", ch: "" });
};

// 移除單字列
const removeVocab = (index) => {
  if (unit.value.vocabList.length > 1) {
    unit.value.vocabList.splice(index, 1);
  }
};

// 核心：發佈到 Firebase
const publishUnit = async () => {
  // 簡單防呆
  if (!unit.value.title || unit.value.vocabList.some((v) => !v.en)) {
    alert("請填寫完整的單元名稱與單字！");
    return;
  }

  try {
    console.log("正在嘗試寫入 Firebase...");
    // 指向 curriculum 集合
    const docRef = await addDoc(collection(db, "curriculum"), {
      ...unit.value,
      createdAt: serverTimestamp(), // 加入時間戳記
    });

    console.log("寫入成功，文件 ID:", docRef.id);
    alert("發佈成功！已存入 Firebase。");
  } catch (error) {
    console.error("寫入錯誤：", error);
    alert("發佈失敗，請查看 F12 控制台錯誤訊息。");
  }
};
</script>
