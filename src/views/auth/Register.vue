<template>
  <div class="AuthPage">
    <div
      class="d-flex align-items-center justify-content-center min-vh-100 px-3"
    >
      <div class="container">
        <div class="row justify-content-center">
          <div class="col-12 col-sm-10 col-md-8 col-lg-6 col-xl-5">
            <div class="login-card shadow-sm p-4 p-md-5">
              <div class="text-center mb-5">
                <h2 class="AuthTitle">建立帳號</h2>
                <div class="title-underline mx-auto"></div>
                <p class="text-muted mt-3 small">
                  加入 AI 學習平台，開始您的學習之旅
                </p>
              </div>

              <div class="BigContainer">
                <div class="mb-3 TypeContainer">
                  <label class="form-label">電子郵件</label>
                  <input
                    v-model="email"
                    type="email"
                    class="form-control"
                    placeholder="example@mail.com"
                  />
                </div>

                <div class="mb-3 TypeContainer">
                  <label class="form-label">設定密碼</label>
                  <input
                    v-model="password"
                    type="password"
                    class="form-control"
                    placeholder="至少 6 位字元"
                  />
                </div>

                <div class="TeacherContainer mb-4 p-3 rounded-3 border">
                  <div class="form-check d-flex align-items-center mb-0">
                    <input
                      class="form-check-input"
                      type="checkbox"
                      v-model="isTeacher"
                      id="teacherCheck"
                    />
                    <label
                      class="form-check-label ms-2 IsTeacher fw-bold"
                      for="teacherCheck"
                    >
                      我想申請成為「教師」帳號
                    </label>
                  </div>
                  <small class="text-muted d-block mt-2 ms-4"
                    >教師帳號可建立課程、發布教材與追蹤數據。</small
                  >
                </div>

                <div class="ButtonContainer mt-4">
                  <div class="row g-3">
                    <div class="col-6">
                      <button
                        class="btn btn-primary btn-login w-100 py-3"
                        @click="register"
                      >
                        確認註冊
                      </button>
                    </div>
                    <div class="col-6">
                      <router-link to="/login" class="text-decoration-none">
                        <button
                          class="btn btn-outline-primary btn-register w-100 py-3"
                        >
                          返回登入
                        </button>
                      </router-link>
                    </div>
                  </div>
                </div>
              </div>

              <p v-if="errorMessage" class="error-msg mt-4 mb-0 text-center">
                {{ errorMessage }}
              </p>
            </div>

            <div class="text-center mt-4 text-muted extra-small">
              © 2026 AI Learning Platform
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { auth, rtdb } from "../../firebase/config";
import { ref as dbRef, set } from "firebase/database";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { useRouter } from "vue-router";
import Swal from "sweetalert2";
import "./Auth.css";

const email = ref("");
const password = ref("");
const errorMessage = ref("");
const isTeacher = ref(false);
const router = useRouter();

const register = async () => {
  errorMessage.value = "";

  // 基礎驗證
  if (!email.value || password.value.length < 6) {
    Swal.fire({
      icon: "warning",
      title: "格式錯誤",
      text: "請輸入正確的 Email 且密碼需至少 6 位字元",
      confirmButtonColor: "#4a70a9",
    });
    return;
  }

  try {
    // A. 建立 Firebase Auth 帳號
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email.value,
      password.value,
    );
    const user = userCredential.user;

    // B. ✨ 修正重點：使用 rtdb 將使用者資料寫入 Realtime Database
    // 這樣登入時 Login.vue 才能正確讀取到 role
    await set(dbRef(rtdb, "users/" + user.uid), {
      email: email.value,
      role: isTeacher.value ? "teacher" : "student",
      courseId: null, // 為之後的課程加入做預留
      submitted: false, // SRL 任務提交狀態
      groupId: null, // 實驗組/控制組分組預留
      timestamp: Date.now(),
    });

    // C. 成功回饋
    await Swal.fire({
      icon: "success",
      title: "註冊成功",
      text: `歡迎加入！您已註冊為：${isTeacher.value ? "教師" : "學生"}`,
      confirmButtonColor: "#4a70a9",
      confirmButtonText: "前往登入",
    });

    // D. 導向登入頁面
    router.push("/login");
  } catch (error) {
    console.error("註冊錯誤:", error.code);

    // 針對重複註冊等常見錯誤進行優化提示
    let msg = error.message;
    if (error.code === "auth/email-already-in-use") {
      msg = "此電子郵件已被註冊過囉！";
    }

    errorMessage.value = "註冊失敗：" + msg;
    Swal.fire({
      icon: "error",
      title: "註冊失敗",
      text: msg,
      confirmButtonColor: "#4a70a9",
    });
  }
};
</script>
