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
                <h2 class="AuthTitle">登入系統</h2>
                <div class="title-underline mx-auto"></div>
                <p class="text-muted mt-3 small">
                  請輸入您的帳號密碼以開始使用
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
                  <label class="form-label">密碼</label>
                  <input
                    v-model="password"
                    type="password"
                    class="form-control"
                    placeholder="••••••••"
                  />
                </div>

                <div
                  class="TeacherContainer mb-4"
                  :class="{ hidden: isLoginPage }"
                >
                  <div class="form-check d-flex align-items-center">
                    <input
                      class="form-check-input"
                      type="checkbox"
                      v-model="isTeacher"
                      id="teacherCheck"
                    />
                    <label
                      class="form-check-label ms-2 IsTeacher"
                      for="teacherCheck"
                    >
                      申請成為教師帳號
                    </label>
                  </div>
                </div>

                <div class="ButtonContainer mt-4">
                  <div class="row g-3">
                    <div class="col-6">
                      <button
                        class="btn btn-primary btn-login w-100 py-3"
                        @click="login"
                      >
                        登入
                      </button>
                    </div>
                    <div class="col-6">
                      <router-link to="/register" class="text-decoration-none">
                        <button
                          class="btn btn-outline-primary btn-register w-100 py-3"
                        >
                          註冊
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
import {
  signInWithEmailAndPassword,
  setPersistence,
  browserSessionPersistence,
} from "firebase/auth";
import { get, ref as dbRef } from "firebase/database";
import { useRouter } from "vue-router";
import Swal from "sweetalert2";
import "./Auth.css";

const email = ref("");
const password = ref("");
const errorMessage = ref("");
const isLoginPage = ref(true);
const isTeacher = ref(false);

const router = useRouter();

const login = async () => {
  errorMessage.value = "";

  if (!email.value || !password.value) {
    Swal.fire({
      icon: "warning",
      title: "提醒",
      text: "請完整填寫電子郵件與密碼",
      confirmButtonColor: "#4a70a9",
    });
    return;
  }

  try {
    // 強制指定為 SESSION 持久化，適合學校共用電腦環境
    await setPersistence(auth, browserSessionPersistence);

    const userCredential = await signInWithEmailAndPassword(
      auth,
      email.value,
      password.value,
    );
    const user = userCredential.user;

    // 3. ✨ 修正重點：將 db 改為 rtdb，確保指向 Realtime Database
    const snapshot = await get(dbRef(rtdb, "users/" + user.uid));

    if (!snapshot.exists()) {
      errorMessage.value = "找不到使用者資料，請確認註冊流程";
      // 如果登入成功但資料庫沒資料，建議引導至註冊或手動檢查後台
      return;
    }

    const role = snapshot.val().role;

    await Swal.fire({
      icon: "success",
      title: "登入成功",
      text: `歡迎回來！身份：${role === "teacher" ? "教師" : "學生"}`,
      confirmButtonColor: "#4a70a9",
      confirmButtonText: "進入系統",
      timer: 1500,
      timerProgressBar: true,
    });

    // 根據角色導向對應頁面
    if (role === "teacher") {
      router.push("/trcourse");
    } else {
      router.push("/stucourse");
    }
  } catch (error) {
    console.error("登入錯誤細節:", error);

    // 針對 Firebase 常見錯誤碼進行友善提示
    if (
      error.code === "auth/user-not-found" ||
      error.code === "auth/wrong-password"
    ) {
      errorMessage.value = "帳號或密碼錯誤";
    } else if (error.code === "auth/network-request-failed") {
      errorMessage.value = "網路連線失敗，請檢查網路狀態";
    } else {
      errorMessage.value = "系統錯誤，請稍後再試";
    }

    Swal.fire({
      icon: "error",
      title: "登入失敗",
      text: errorMessage.value,
      confirmButtonColor: "#4a70a9",
    });
  }
};
</script>
