import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';

// Validación de configuración Firebase
const validateFirebaseConfig = (config) => {
  const requiredFields = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'];
  
  for (const field of requiredFields) {
    if (!config[field] || config[field].includes('XXXX') || config[field].includes('placeholder')) {
      throw new Error(`Firebase config error: ${field} contains placeholder data or is missing`);
    }
  }
  
  // Validar formato de measurementId si está presente
  if (config.measurementId && (config.measurementId.includes('XXXX') || !config.measurementId.startsWith('G-'))) {
    console.warn('Firebase Analytics: measurementId contains placeholder data or invalid format. Analytics will be disabled.');
    // Remover measurementId inválido para evitar errores
    delete config.measurementId;
  }
  
  return config;
};

// Configuración Firebase para ShareIt
const firebaseConfig = {
  apiKey: "AIzaSyBvK8F_OhLprMfaZIJXGNJpFg5wJ9nSMHY",
  authDomain: "shareit-fcb52.firebaseapp.com",
  projectId: "shareit-fcb52",
  storageBucket: "shareit-fcb52.firebasestorage.app",
  messagingSenderId: "583495948453",
  appId: "1:583495948453:web:f8b9c5e0e8d2c3e4a1b5f6",
  // measurementId removido temporalmente hasta obtener ID válido de Analytics
  // measurementId: "G-XXXXXXXXXX" // Placeholder - debe ser reemplazado con ID real
};

// Validar configuración antes de inicializar
const validatedConfig = validateFirebaseConfig(firebaseConfig);

// Inicializar Firebase con configuración validada
const app = initializeApp(validatedConfig);

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
