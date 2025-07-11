/**
 * ShareIt Client-Side Functions
 * Reemplaza Cloud Functions para plan gratuito Firebase Spark
 */

import { 
  doc, 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  getDoc,
  query, 
  where, 
  orderBy, 
  onSnapshot,
  serverTimestamp,
  writeBatch 
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject 
} from 'firebase/storage';
import { db, storage } from './firebase-config.js';

// ============ USER MANAGEMENT ============
export class UserManager {
  static async createUserProfile(userId, userData) {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        ...userData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      // Crear widgets por defecto
      await this.createDefaultWidgets(userId);
      
      return { success: true };
    } catch (error) {
      console.error('Error creating user profile:', error);
      return { success: false, error: error.message };
    }
  }
  
  static async createDefaultWidgets(userId) {
    const defaultWidgets = [
      {
        type: 'clock',
        title: 'Reloj',
        settings: { timezone: 'America/Santo_Domingo' },
        position: { x: 0, y: 0 },
        size: { width: 2, height: 1 }
      },
      {
        type: 'notes',
        title: 'Notas Rápidas',
        settings: { content: '¡Bienvenido a ShareIt!' },
        position: { x: 2, y: 0 },
        size: { width: 2, height: 2 }
      }
    ];
    
    for (const widget of defaultWidgets) {
      await addDoc(collection(db, 'widgets'), {
        ...widget,
        userId,
        shared: false,
        sharedWith: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    }
  }
}

// ============ FRIENDS MANAGEMENT ============
export class FriendsManager {
  static async sendFriendRequest(fromUserId, toEmail) {
    try {
      // Buscar usuario por email
      const usersQuery = query(
        collection(db, 'users'), 
        where('email', '==', toEmail)
      );
      const userSnapshot = await getDocs(usersQuery);
      
      if (userSnapshot.empty) {
        return { success: false, error: 'Usuario no encontrado' };
      }
      
      const toUserId = userSnapshot.docs[0].id;
      
      // Verificar si ya son amigos o hay solicitud pendiente
      const existingRequest = await this.checkExistingRelation(fromUserId, toUserId);
      if (existingRequest.exists) {
        return { success: false, error: 'Ya existe una relación con este usuario' };
      }
      
      // Crear solicitud de amistad
      await addDoc(collection(db, 'friends'), {
        requesterId: fromUserId,
        addresseeId: toUserId,
        status: 'pending',
        createdAt: serverTimestamp()
      });
      
      return { success: true, message: 'Solicitud enviada' };
    } catch (error) {
      console.error('Error sending friend request:', error);
      return { success: false, error: error.message };
    }
  }
  
  static async acceptFriendRequest(requestId) {
    try {
      const requestRef = doc(db, 'friends', requestId);
      await updateDoc(requestRef, {
        status: 'accepted',
        acceptedAt: serverTimestamp()
      });
      
      return { success: true };
    } catch (error) {
      console.error('Error accepting friend request:', error);
      return { success: false, error: error.message };
    }
  }
  
  static async rejectFriendRequest(requestId) {
    try {
      const requestRef = doc(db, 'friends', requestId);
      await deleteDoc(requestRef);
      
      return { success: true };
    } catch (error) {
      console.error('Error rejecting friend request:', error);
      return { success: false, error: error.message };
    }
  }
  
  static async checkExistingRelation(userId1, userId2) {
    const q1 = query(
      collection(db, 'friends'),
      where('requesterId', '==', userId1),
      where('addresseeId', '==', userId2)
    );
    
    const q2 = query(
      collection(db, 'friends'),
      where('requesterId', '==', userId2),
      where('addresseeId', '==', userId1)
    );
    
    const [snapshot1, snapshot2] = await Promise.all([
      getDocs(q1),
      getDocs(q2)
    ]);
    
    return { exists: !snapshot1.empty || !snapshot2.empty };
  }
}

// ============ PHOTO MANAGEMENT ============
export class PhotoManager {
  static async uploadPhoto(userId, file, caption = '') {
    try {
      // Generar ID único para la foto
      const photoId = `photo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Subir archivo a Storage
      const fileRef = ref(storage, `shared-photos/${userId}/${photoId}`);
      const uploadResult = await uploadBytes(fileRef, file);
      const downloadURL = await getDownloadURL(uploadResult.ref);
      
      // Crear documento en Firestore
      const photoData = {
        userId,
        fileName: file.name,
        url: downloadURL,
        caption,
        tags: [],
        sharedWith: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      const docRef = await addDoc(collection(db, 'photos'), photoData);
      
      return { success: true, photoId: docRef.id, url: downloadURL };
    } catch (error) {
      console.error('Error uploading photo:', error);
      return { success: false, error: error.message };
    }
  }
  
  static async deletePhoto(photoId) {
    try {
      // Obtener datos de la foto
      const photoRef = doc(db, 'photos', photoId);
      const photoSnap = await getDoc(photoRef);
      
      if (!photoSnap.exists()) {
        return { success: false, error: 'Foto no encontrada' };
      }
      
      const photoData = photoSnap.data();
      
      // Eliminar archivo de Storage
      if (photoData.url) {
        const fileRef = ref(storage, `shared-photos/${photoData.userId}/${photoData.fileName}`);
        await deleteObject(fileRef);
      }
      
      // Eliminar documento de Firestore
      await deleteDoc(photoRef);
      
      return { success: true };
    } catch (error) {
      console.error('Error deleting photo:', error);
      return { success: false, error: error.message };
    }
  }
}

// ============ WIDGETS MANAGEMENT ============
export class WidgetsManager {
  static async createWidget(userId, widgetData) {
    try {
      const widget = {
        ...widgetData,
        userId,
        shared: false,
        sharedWith: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      const docRef = await addDoc(collection(db, 'widgets'), widget);
      
      return { success: true, widgetId: docRef.id };
    } catch (error) {
      console.error('Error creating widget:', error);
      return { success: false, error: error.message };
    }
  }
  
  static async updateWidget(widgetId, updateData) {
    try {
      const widgetRef = doc(db, 'widgets', widgetId);
      await updateDoc(widgetRef, {
        ...updateData,
        updatedAt: serverTimestamp()
      });
      
      return { success: true };
    } catch (error) {
      console.error('Error updating widget:', error);
      return { success: false, error: error.message };
    }
  }
  
  static async shareWidget(widgetId, targetUserId) {
    try {
      const widgetRef = doc(db, 'widgets', widgetId);
      const widgetSnap = await getDoc(widgetRef);
      
      if (!widgetSnap.exists()) {
        return { success: false, error: 'Widget no encontrado' };
      }
      
      const widgetData = widgetSnap.data();
      const currentSharedWith = widgetData.sharedWith || [];
      
      if (!currentSharedWith.includes(targetUserId)) {
        await updateDoc(widgetRef, {
          shared: true,
          sharedWith: [...currentSharedWith, targetUserId],
          updatedAt: serverTimestamp()
        });
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error sharing widget:', error);
      return { success: false, error: error.message };
    }
  }
}

// ============ NOTIFICATIONS (Client-side) ============
export class NotificationsManager {
  static async sendLocalNotification(title, body, data = {}) {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: '/icon-192x192.png',
        data
      });
    }
  }
  
  static async requestPermission() {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  }
}

// ============ REAL-TIME LISTENERS ============
export class RealtimeManager {
  static listenToFriendRequests(userId, callback) {
    const q = query(
      collection(db, 'friends'),
      where('addresseeId', '==', userId),
      where('status', '==', 'pending')
    );
    
    return onSnapshot(q, callback);
  }
  
  static listenToUserWidgets(userId, callback) {
    const q = query(
      collection(db, 'widgets'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    
    return onSnapshot(q, callback);
  }
  
  static listenToSharedWidgets(userId, callback) {
    const q = query(
      collection(db, 'widgets'),
      where('sharedWith', 'array-contains', userId)
    );
    
    return onSnapshot(q, callback);
  }
  
  static listenToUserPhotos(userId, callback) {
    const q = query(
      collection(db, 'photos'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    
    return onSnapshot(q, callback);
  }
}
