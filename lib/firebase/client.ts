import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDEkRmJ2-FGwwfAQkGbXdv0Z9ekoxbHV5k",
  authDomain: "velox-ea85b.firebaseapp.com",
  projectId: "velox-ea85b",
  storageBucket: "velox-ea85b.firebasestorage.app",
  messagingSenderId: "390676396806",
  appId: "1:390676396806:web:c755bf1745e9d0683ffc87",
  measurementId: "G-2B4QNJ5VJN"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db, GoogleAuthProvider, signInWithPopup, signOut };
