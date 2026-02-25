import { createRouter, createWebHistory } from "vue-router";
// 引入您的頁面組件
import Login from "../views/auth/Login.vue";
import Register from "../views/auth/Register.vue";
import TrCourse from "../views/Teacher/TrCourse.vue";
import TrCourseDetail from "../views/Teacher/TrCourseDetail.vue";
import StuCourse from "../views/Student/StuCourse.vue";
import StuCourseDetail from "../views/Student/StuCourseDetail.vue";

const routes = [
  {
    path: "/",
    redirect: "/login",
  },
  {
    path: "/login",
    name: "Login",
    component: Login,
  },
  {
    path: "/register",
    name: "Register",
    component: Register,
  },
  {
    path: "/trcourse",
    name: "TrCourse",
    component: TrCourse,
  },
  {
    path: "/trdashboard/:courseId",
    name: "TrCourseDetail",
    component: TrCourseDetail,
  },
  {
    path: "/stucourse",
    name: "StuCourse",
    component: StuCourse,
  },
  {
    path: "/studashboard/:courseId",
    name: "StuCourseDetail",
    component: StuCourseDetail,
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
