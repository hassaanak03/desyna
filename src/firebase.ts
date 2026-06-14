import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyB74XhxZjWu2XDH0bWuoWtGRF1bm_TF96U",
  authDomain: "desyna-bb4fe.firebaseapp.com",
  projectId: "desyna-bb4fe",
  storageBucket: "desyna-bb4fe.firebasestorage.app",
  messagingSenderId: "467088169827",
  appId: "1:467088169827:web:81593357a49cd05eb11156",
  measurementId: "G-L1R0ECJY3Y"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app);
