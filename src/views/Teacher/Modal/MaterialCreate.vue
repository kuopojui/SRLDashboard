<template>
  <div class="MaterialCreate ex-modal-overlay" @click.self="$emit('close')">
    <div
      class="ex-modal-content material-theme animate__animated animate__fadeInUp"
    >
      <div class="ex-modal-header">
        <h3 class="modal-title-navy">
          <i class="bi bi-cloud-arrow-up me-2"></i>新增教材
        </h3>
        <button type="button" class="btn-close-red" @click="$emit('close')">
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
              >教材類型</label
            >
            <div class="d-flex gap-2">
              <button
                type="button"
                class="btn btn-sm flex-fill"
                :class="
                  formData.type === 'file' ? 'btn-navy' : 'btn-outline-navy'
                "
                @click="formData.type = 'file'"
              >
                <i class="bi bi-file-earmark-arrow-up me-1"></i>上傳檔案
              </button>
              <button
                type="button"
                class="btn btn-sm flex-fill"
                :class="
                  formData.type === 'reading' ? 'btn-navy' : 'btn-outline-navy'
                "
                @click="formData.type = 'reading'"
              >
                <i class="bi bi-book me-1"></i>自主讀書/複習
              </button>
            </div>
          </div>

          <div class="mb-4">
            <label class="ex-label-small text-secondary fw-bold mb-2"
              >教材標題</label
            >
            <input
              v-model="formData.title"
              type="text"
              class="ex-input-field"
              :placeholder="
                formData.type === 'reading'
                  ? '例如：複習課本第 12-20 頁'
                  : '請輸入教材標題'
              "
              required
              :disabled="isUploading"
            />
          </div>

          <div class="mb-4" v-if="formData.type === 'file'">
            <label class="ex-label-small text-secondary fw-bold mb-2"
              >選擇檔案</label
            >
            <div class="file-upload-wrapper">
              <input
                type="file"
                @change="onFileChange"
                class="file-input-hidden"
                :required="formData.type === 'file'"
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
            <label class="ex-label-small text-secondary fw-bold mb-2">
              {{
                formData.type === "reading" ? "複習說明 / 任務內容" : "教材描述"
              }}
            </label>
            <textarea
              v-model="formData.description"
              class="ex-textarea-field"
              rows="4"
              :placeholder="
                formData.type === 'reading'
                  ? '請詳細說明需要學生複習的範圍、重點或是指定頁數...'
                  : '說明此教材的用途...'
              "
              :disabled="isUploading"
              :required="formData.type === 'reading'"
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
            {{ isUploading ? "處理中..." : "確認新增" }}
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
const fileName = ref("");

// 🌟 核心修正：將 type 整合進 formData，確保與 Template 雙向綁定
const formData = reactive({
  title: "",
  description: "",
  type: "file", // 預設為檔案上傳模式
});

// 鎖定背景捲動
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
    if (file.size > 50 * 1024 * 1024) {
      Swal.fire("檔案過大", "請上傳小於 50MB 的檔案", "warning");
      e.target.value = "";
      return;
    }
    selectedFile.value = file;
    fileName.value = file.name;
    // 自動填充標題（若為空）
    if (!formData.title)
      formData.title = file.name.split(".").slice(0, -1).join(".");
  }
};

// 執行提交/上傳
const onUpload = async () => {
  // 1. 基礎驗證
  if (!formData.title.trim()) {
    Swal.fire("提示", "請輸入教材標題", "info");
    return;
  }

  // 2. 分流驗證：檢查對應模式的必填項
  if (formData.type === "file" && !selectedFile.value) {
    Swal.fire("提示", "您選擇了檔案上傳模式，請選取檔案", "info");
    return;
  }

  if (formData.type === "reading" && !formData.description.trim()) {
    Swal.fire("提示", "請在描述欄位填寫複習說明（例如頁數、重點）", "info");
    return;
  }

  isUploading.value = true;
  try {
    let finalFileUrl = "reading_mode"; // 預設標記，學生端偵測到此字串即啟動閱讀計時
    let finalFilePath = null;

    // 🌟 核心分流邏輯：只有檔案模式才需要連動 Firebase Storage
    if (formData.type === "file") {
      const path = `materials/${props.courseId}/${Date.now()}_${selectedFile.value.name}`;
      const fileRef = storageRef(storage, path);
      await uploadBytes(fileRef, selectedFile.value);
      finalFileUrl = await getDownloadURL(fileRef);
      finalFilePath = path;
    }

    // 3. 寫入 RTDB 資源庫
    const newMaterialRef = push(
      dbRef(db, `courses/${props.courseId}/materials`),
    );

    await set(newMaterialRef, {
      title: formData.title.trim(),
      description: formData.description.trim(),
      fileUrl: finalFileUrl,
      filePath: finalFilePath,
      materialType: formData.type, // 儲存類型以利學生端渲染介面
      id: newMaterialRef.key,
      createdAt: Date.now(),
    });

    Swal.fire({
      icon: "success",
      title: formData.type === "file" ? "檔案上傳成功" : "讀書任務已建立",
      text: "教材已成功加入資源庫",
      timer: 1500,
      showConfirmButton: false,
    });

    emit("close");
  } catch (error) {
    console.error("Upload Error:", error);
    Swal.fire("錯誤", "處理失敗，請檢查網路連線或 Storage 權限", "error");
  } finally {
    isUploading.value = false;
  }
};
</script>
