import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyC81VFllqRuz0UMlHsp7UUiexJjoffoHyI",
  authDomain: "quiz-center-905af.firebaseapp.com",
  projectId: "quiz-center-905af",
  storageBucket: "quiz-center-905af.firebasestorage.app",
  messagingSenderId: "902068667543",
  appId: "1:902068667543:web:4300140b241e1f136cd5d2"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
