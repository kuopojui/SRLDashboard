import { createApp } from "vue";
import App from "./App.vue";
import router from "./router"; // 引入剛寫好的 router/index.js
import "bootstrap/dist/css/bootstrap.min.css";

const app = createApp(App);

app.use(router); // ✨ 關鍵：使用路由
app.mount("#app");
