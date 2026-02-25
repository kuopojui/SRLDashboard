<template>
  <div class="ex-modal-overlay" @click.self="$emit('close')">
    <div class="ex-modal-content material-theme">
      <div class="ex-modal-header">
        <h3><i class="bi bi-cloud-arrow-up"></i>上傳新教材</h3>
        <button class="btn-close" @click="$emit('close')"></button>
      </div>
      <form @submit.prevent="onUpload" class="ex-form-container">
        <div class="mb-4">
          <label class="ex-label">教材標題</label>
          <input
            v-model="formData.title"
            type="text"
            class="ex-input"
            placeholder="請輸入教材標題"
            required
          />
        </div>
        <div class="mb-4">
          <label class="ex-label">選擇檔案</label>
          <input
            type="file"
            @change="onFileChange"
            class="ex-input"
            required
            id="file-upload-input"
          />
        </div>
        <div class="mb-2">
          <label class="ex-label">教材描述</label>
          <textarea
            v-model="formData.description"
            class="ex-textarea"
            rows="3"
            placeholder="說明此教材的用途..."
          ></textarea>
        </div>
        <div class="ex-modal-footer">
          <button
            type="button"
            class="ex-btn-secondary"
            @click="$emit('close')"
          >
            取消
          </button>
          <button type="submit" class="ex-btn-primary" :disabled="isUploading">
            <span
              v-if="isUploading"
              class="spinner-border spinner-border-sm me-2"
            ></span
            >確認上傳
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from "vue";
import Swal from "sweetalert2";
import { rtdb as db } from "../../../firebase/config";
import { ref as dbRef, push, set } from "firebase/database";
import {
  getStorage,
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";
import "./create.css";

const props = defineProps({ courseId: String });
const emit = defineEmits(["close"]);
const storage = getStorage();
const isUploading = ref(false);
const selectedFile = ref(null);
const formData = reactive({ title: "", description: "" });

const onFileChange = (e) => {
  selectedFile.value = e.target.files[0];
};

const onUpload = async () => {
  if (!selectedFile.value) return;
  isUploading.value = true;
  try {
    const filePath = `materials/${props.courseId}/${Date.now()}_${selectedFile.value.name}`;
    const fileRef = storageRef(storage, filePath);
    await uploadBytes(fileRef, selectedFile.value);
    const fileUrl = await getDownloadURL(fileRef);

    await set(push(dbRef(db, `courses/${props.courseId}/materials`)), {
      ...formData,
      fileUrl,
      filePath,
      createdAt: Date.now(),
    });
    Swal.fire({
      icon: "success",
      title: "上傳成功",
      timer: 1500,
      showConfirmButton: false,
    });
    emit("close");
  } catch (error) {
    Swal.fire("錯誤", "上傳失敗", "error");
  } finally {
    isUploading.value = false;
  }
};
</script>

<style scoped>
.material-theme {
  --theme-color: #16a34a;
  --theme-soft: rgba(22, 163, 74, 0.1);
}
</style>
