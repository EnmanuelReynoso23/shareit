import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';

// Configuración Firebase para ShareIt
const firebaseConfig = {
  apiKey: "AIzaSyBvK8F_OhLprMfaZIJXGNJpFg5wJ9nSMHY",
  authDomain: "shareit-fcb52.firebaseapp.com",
  projectId: "shareit-fcb52",
  storageBucket: "shareit-fcb52.firebasestorage.app",
  messagingSenderId: "583495948453",
  appId: "1:583495948453:web:f8b9c5e0e8d2c3e4a1b5f6",
  measurementId: "G-XXXXXXXXXX"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Inicializar servicios
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Para desarrollo local (emuladores)
if (process.env.NODE_ENV === 'development') {
  try {
    connectFirestoreEmulator(db, 'localhost', 8080);
    connectStorageEmulator(storage, 'localhost', 9199);
  } catch (error) {
    console.log('Emulators already connected or not available');
  }
}

export default app;
