<template>
  <div class="MaterialCreate ex-modal-overlay" @click.self="$emit('close')">
    <div
      class="ex-modal-content material-theme animate__animated animate__fadeInUp"
    >
      <div class="ex-modal-header">
        <h3 class="modal-title-navy">
          <i class="bi bi-cloud-arrow-up me-2"></i>上傳新教材
        </h3>
        <button
          type="button"
          class="btn-close-red"
          @click="$emit('close')"
          title="關閉"
        >
          ✕
        </button>
      </div>

      <form
        @submit.prevent="onUpload"
        class="ex-form-container custom-scrollbar"
      >
        <div class="form-body">
          <div class="mb-4">
            <label class="ex-label-small text-secondary fw-bold mb-2"
              >教材標題</label
            >
            <input
              v-model="formData.title"
              type="text"
              class="ex-input-field"
              placeholder="請輸入教材標題"
              required
              :disabled="isUploading"
            />
          </div>

          <div class="mb-4">
            <label class="ex-label-small text-secondary fw-bold mb-2"
              >選擇檔案</label
            >
            <div class="file-upload-wrapper">
              <input
                type="file"
                @change="onFileChange"
                class="file-input-hidden"
                required
                id="file-upload-input"
                :disabled="isUploading"
              />
              <label for="file-upload-input" class="file-upload-label">
                <i class="bi bi-folder-plus fs-4 mb-2"></i>
                <span>{{ fileName || "點擊選取檔案" }}</span>
              </label>
            </div>
          </div>

          <div class="mb-4">
            <label class="ex-label-small text-secondary fw-bold mb-2"
              >教材描述</label
            >
            <textarea
              v-model="formData.description"
              class="ex-textarea-field"
              rows="4"
              placeholder="說明此教材的用途..."
              :disabled="isUploading"
            ></textarea>
          </div>
        </div>

        <div class="ex-modal-footer">
          <button
            type="button"
            class="btn-cancel-link"
            @click="$emit('close')"
            :disabled="isUploading"
          >
            取消
          </button>
          <button
            type="submit"
            class="ex-btn-navy-action"
            :disabled="isUploading"
          >
            <span
              v-if="isUploading"
              class="spinner-border spinner-border-sm me-2"
            ></span>
            {{ isUploading ? "正在上傳..." : "確認上傳" }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted } from "vue";
import Swal from "sweetalert2";
import { rtdb as db } from "../../../firebase/config";
import { ref as dbRef, push, set } from "firebase/database";
import {
  getStorage,
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";
import "./MaterialCreate.css";

const props = defineProps({ courseId: String });
const emit = defineEmits(["close"]);

const storage = getStorage();
const isUploading = ref(false);
const selectedFile = ref(null);
const fileName = ref(""); // 🌟 修正 Render 警告：定義檔名變數
const formData = reactive({ title: "", description: "" });

// 🌟 鎖定背景捲動：確保手機版彈窗開啟時背景不動
onMounted(() => {
  document.body.style.overflow = "hidden";
  if (window.innerWidth < 768) {
    document.body.style.position = "fixed";
    document.body.style.width = "100%";
  }
});

onUnmounted(() => {
  document.body.style.overflow = "";
  document.body.style.position = "";
  document.body.style.width = "";
});

// 處理檔案選取
const onFileChange = (e) => {
  const file = e.target.files[0];
  if (file) {
    // 簡單檢查檔案大小 (例如限制 50MB)
    if (file.size > 50 * 1024 * 1024) {
      Swal.fire("檔案過大", "請上傳小於 50MB 的檔案", "warning");
      e.target.value = ""; // 清空 input
      return;
    }
    selectedFile.value = file;
    fileName.value = file.name; // 🌟 更新顯示的檔名
  }
};

// 執行上傳
const onUpload = async () => {
  if (!selectedFile.value || !formData.title.trim()) {
    Swal.fire("提示", "請輸入標題並選擇檔案", "info");
    return;
  }

  isUploading.value = true;
  try {
    // 1. 上傳至 Firebase Storage
    const filePath = `materials/${props.courseId}/${Date.now()}_${selectedFile.value.name}`;
    const fileRef = storageRef(storage, filePath);
    await uploadBytes(fileRef, selectedFile.value);
    const fileUrl = await getDownloadURL(fileRef);

    // 2. 寫入 RTDB 資源庫
    const newMaterialRef = push(
      dbRef(db, `courses/${props.courseId}/materials`),
    );
    await set(newMaterialRef, {
      title: formData.title.trim(),
      description: formData.description.trim(),
      fileUrl,
      filePath,
      id: newMaterialRef.key, // 儲存自身的 ID 方便後續刪除操作
      createdAt: Date.now(),
    });

    Swal.fire({
      icon: "success",
      title: "上傳成功",
      text: "教材已加入資源分配庫",
      timer: 1500,
      showConfirmButton: false,
    });

    emit("close");
  } catch (error) {
    console.error("Upload Error:", error);
    Swal.fire("錯誤", "上傳失敗，請檢查網路連線", "error");
  } finally {
    isUploading.value = false;
  }
};
</script>
