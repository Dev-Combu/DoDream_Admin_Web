// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyARD3Q7mgqs2rMkX-uYiossFRCnrHtnVRM",
  authDomain: "do-dream-youth.firebaseapp.com",
  projectId: "do-dream-youth",
  storageBucket: "do-dream-youth.firebasestorage.app",
  messagingSenderId: "297450037271",
  appId: "1:297450037271:web:4d93bf3e05679e067d7c52",
  measurementId: "G-134LCLMKNV"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// 2. 다른 파일에서 쓸 서비스들만 export (내보내기)
export const db = getFirestore(app);   // 데이터베이스
export const auth = getAuth(app);       // 인증(로그인)
// analytics는 웹 앱 분석용이라 관리자 페이지에선 일단 빼도 무관합니다.