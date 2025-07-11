// Firebase configuration
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyAIZkohmvrIdVPvMF_uU2qK_kxX0FjP480",
  authDomain: "shareit-fcb52.firebaseapp.com",
  projectId: "shareit-fcb52",
  storageBucket: "shareit-fcb52.firebasestorage.app",
  messagingSenderId: "983703024909",
  appId: "1:983703024909:web:82f12319de5fc18970ac44",
  measurementId: "G-YKLSQVY202"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
