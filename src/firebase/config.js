import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database"; // 導入 Realtime Database

const firebaseConfig = {
  apiKey: "AIzaSyDBCpMlaHkweTb3bf__cB56Vabvq5bHTYI",
  authDomain: "srldashboard-1085a.firebaseapp.com",
  databaseURL: "https://srldashboard-1085a-default-rtdb.firebaseio.com",
  databaseURL:
    "https://srldashboard-1085a-default-rtdb.asia-southeast1.firebasedatabase.app",
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
const db = getFirestore(app); // Firestore (原本的)
const rtdb = getDatabase(app); // Realtime Database (新加入的)
const auth = getAuth(app); // 驗證功能

// 導出 rtdb，之後在組件中就可以 import { rtdb }
export { db, rtdb, auth, analytics };
