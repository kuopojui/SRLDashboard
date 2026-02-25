import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore"; // 必須手動加入
import { getAuth } from "firebase/auth"; // 必須手動加入

const firebaseConfig = {
  apiKey: "AIzaSyDBCpMlaHkweTb3bf__cB56Vabvq5bHTYI",
  authDomain: "srldashboard-1085a.firebaseapp.com",
  projectId: "srldashboard-1085a",
  storageBucket: "srldashboard-1085a.firebasestorage.app",
  messagingSenderId: "979362328568",
  appId: "1:979362328568:web:b167b02af9e9b2ee3c300d",
  measurementId: "G-MCRFWHH1BJ",
};

// 初始化 Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// 建立實例
const db = getFirestore(app);
const auth = getAuth(app);

// 導出，這樣 UnitDefinition.vue 才能 import db
export { db, auth, analytics };
