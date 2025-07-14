import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  getDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  onSnapshot,
  serverTimestamp 
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject 
} from 'firebase/storage';
import { db, storage } from '../../config/firebase';

class PhotosService {
  constructor() {
    this.collection = 'photos';
    this.storageRef = 'photos';
  }

  // Upload photo to Firebase Storage
  async uploadPhoto(file, userId, metadata = {}) {
    try {
      // Validar tamaño del archivo (10MB máximo)
      const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
      if (file.size > MAX_FILE_SIZE) {
        throw new Error(`File too large. Maximum size allowed is ${MAX_FILE_SIZE / (1024 * 1024)}MB`);
      }

      // Validar tipo de archivo
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        throw new Error(`Invalid file type. Allowed types: ${allowedTypes.join(', ')}`);
      }

      const timestamp = Date.now();
      const fileName = `${userId}_${timestamp}_${file.name || 'photo.jpg'}`;
      const storageRef = ref(storage, `${this.storageRef}/${fileName}`);
      
      // Upload file con retry logic
      let uploadAttempts = 0;
      const maxAttempts = 3;
      
      while (uploadAttempts < maxAttempts) {
        try {
          const snapshot = await uploadBytes(storageRef, file, {
            customMetadata: {
              userId,
              uploadedAt: timestamp.toString(),
              originalSize: file.size.toString(),
              ...metadata
            }
          });
          
          // Get download URL
          const downloadURL = await getDownloadURL(snapshot.ref);
          
          return {
            url: downloadURL,
            path: snapshot.ref.fullPath,
            fileName,
            size: snapshot.metadata.size,
            contentType: snapshot.metadata.contentType,
            uploadAttempts: uploadAttempts + 1
          };
        } catch (uploadError) {
          uploadAttempts++;
          
          if (uploadAttempts >= maxAttempts) {
            throw uploadError;
          }
          
          // Esperar antes de reintentar
          await new Promise(resolve => setTimeout(resolve, 1000 * uploadAttempts));
          console.warn(`Upload attempt ${uploadAttempts} failed, retrying...`);
        }
      }
    } catch (error) {
      console.error('Error uploading photo:', error);
      
      // Mejorar mensajes de error específicos
      if (error.code === 'storage/unauthorized') {
        throw new Error('Unauthorized: Please check your permissions');
      } else if (error.code === 'storage/canceled') {
        throw new Error('Upload was canceled');
      } else if (error.code === 'storage/quota-exceeded') {
        throw new Error('Storage quota exceeded');
      } else if (error.code === 'storage/retry-limit-exceeded') {
        throw new Error('Upload failed after multiple attempts. Please try again later');
      } else if (error.message.includes('File too large')) {
        throw error; // Re-throw custom size error
      } else if (error.message.includes('Invalid file type')) {
        throw error; // Re-throw custom type error
      } else {
        throw new Error(`Failed to upload photo: ${error.message}`);
      }
    }
  }

  // Create photo document in Firestore
  async createPhoto(photoData) {
    try {
      const photoDoc = {
        ...photoData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        likes: 0,
        comments: [],
        shared: false,
        sharedWith: [],
        tags: photoData.tags || [],
        location: photoData.location || null,
        metadata: {
          width: photoData.width || null,
          height: photoData.height || null,
          size: photoData.size || null,
          type: photoData.type || 'image/jpeg'
        }
      };

      const docRef = await addDoc(collection(db, this.collection), photoDoc);
      
      return {
        id: docRef.id,
        ...photoDoc
      };
    } catch (error) {
      console.error('Error creating photo:', error);
      throw new Error(`Failed to create photo: ${error.message}`);
    }
  }

  // Get photos by user
  async getPhotosByUser(userId, limitCount = 20) {
    try {
      const q = query(
        collection(db, this.collection),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);
      const photos = [];
      
      querySnapshot.forEach((doc) => {
        photos.push({
          id: doc.id,
          ...doc.data()
        });
      });

      return photos;
    } catch (error) {
      console.error('Error getting photos by user:', error);
      throw new Error(`Failed to get photos: ${error.message}`);
    }
  }

  // Get shared photos for user's home feed
  async getSharedPhotos(userId, limitCount = 50) {
    try {
      const q = query(
        collection(db, this.collection),
        where('sharedWith', 'array-contains', userId),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);
      const photos = [];
      
      querySnapshot.forEach((doc) => {
        photos.push({
          id: doc.id,
          ...doc.data()
        });
      });

      return photos;
    } catch (error) {
      console.error('Error getting shared photos:', error);
      throw new Error(`Failed to get shared photos: ${error.message}`);
    }
  }

  // Get single photo
  async getPhoto(photoId) {
    try {
      const docRef = doc(db, this.collection, photoId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data()
        };
      } else {
        throw new Error('Photo not found');
      }
    } catch (error) {
      console.error('Error getting photo:', error);
      throw new Error(`Failed to get photo: ${error.message}`);
    }
  }

  // Update photo
  async updatePhoto(photoId, updates) {
    try {
      const docRef = doc(db, this.collection, photoId);
      const updateData = {
        ...updates,
        updatedAt: serverTimestamp()
      };

      await updateDoc(docRef, updateData);
      
      return {
        id: photoId,
        ...updateData
      };
    } catch (error) {
      console.error('Error updating photo:', error);
      throw new Error(`Failed to update photo: ${error.message}`);
    }
  }

  // Share photo with users
  async sharePhoto(photoId, userIds) {
    try {
      const docRef = doc(db, this.collection, photoId);
      const updateData = {
        shared: true,
        sharedWith: userIds,
        updatedAt: serverTimestamp()
      };

      await updateDoc(docRef, updateData);
      return { success: true };
    } catch (error) {
      console.error('Error sharing photo:', error);
      throw new Error(`Failed to share photo: ${error.message}`);
    }
  }

  // Like/unlike photo
  async toggleLike(photoId, userId) {
    try {
      const photoDoc = await this.getPhoto(photoId);
      const currentLikes = photoDoc.likes || 0;
      const likedBy = photoDoc.likedBy || [];
      
      const hasLiked = likedBy.includes(userId);
      
      const updateData = {
        likes: hasLiked ? currentLikes - 1 : currentLikes + 1,
        likedBy: hasLiked 
          ? likedBy.filter(id => id !== userId)
          : [...likedBy, userId],
        updatedAt: serverTimestamp()
      };

      await updateDoc(doc(db, this.collection, photoId), updateData);
      return { 
        success: true, 
        liked: !hasLiked,
        totalLikes: updateData.likes
      };
    } catch (error) {
      console.error('Error toggling like:', error);
      throw new Error(`Failed to toggle like: ${error.message}`);
    }
  }

  // Delete photo
  async deletePhoto(photoId, userId) {
    try {
      const photoDoc = await this.getPhoto(photoId);
      
      // Verify ownership
      if (photoDoc.userId !== userId) {
        throw new Error('Unauthorized: You can only delete your own photos');
      }

      // Delete from storage
      if (photoDoc.storagePath) {
        const storageRef = ref(storage, photoDoc.storagePath);
        await deleteObject(storageRef);
      }

      // Delete from Firestore
      await deleteDoc(doc(db, this.collection, photoId));
      
      return { success: true };
    } catch (error) {
      console.error('Error deleting photo:', error);
      throw new Error(`Failed to delete photo: ${error.message}`);
    }
  }

  // Real-time listener for user's photos
  subscribeToUserPhotos(userId, callback) {
    const q = query(
      collection(db, this.collection),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
      const photos = [];
      snapshot.forEach((doc) => {
        photos.push({
          id: doc.id,
          ...doc.data()
        });
      });
      callback(photos);
    });
  }

  // Real-time listener for shared photos
  subscribeToSharedPhotos(userId, callback) {
    const q = query(
      collection(db, this.collection),
      where('sharedWith', 'array-contains', userId),
      orderBy('createdAt', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
      const photos = [];
      snapshot.forEach((doc) => {
        photos.push({
          id: doc.id,
          ...doc.data()
        });
      });
      callback(photos);
    });
  }

  // Search photos
  async searchPhotos(searchTerm, userId, limitCount = 20) {
    try {
      const q = query(
        collection(db, this.collection),
        where('userId', '==', userId),
        where('tags', 'array-contains-any', [searchTerm.toLowerCase()]),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);
      const photos = [];
      
      querySnapshot.forEach((doc) => {
        photos.push({
          id: doc.id,
          ...doc.data()
        });
      });

      return photos;
    } catch (error) {
      console.error('Error searching photos:', error);
      throw new Error(`Failed to search photos: ${error.message}`);
    }
  }

  // Get user's photo statistics
  async getUserPhotoStats(userId) {
    try {
      const photos = await this.getPhotosByUser(userId, 1000);
      
      const totalPhotos = photos.length;
      const totalLikes = photos.reduce((sum, photo) => sum + (photo.likes || 0), 0);
      const totalShared = photos.filter(photo => photo.shared).length;
      const totalSize = photos.reduce((sum, photo) => sum + (photo.metadata?.size || 0), 0);

      return {
        totalPhotos,
        totalLikes,
        totalShared,
        totalSize,
        averageLikes: totalPhotos > 0 ? Math.round(totalLikes / totalPhotos) : 0
      };
    } catch (error) {
      console.error('Error getting photo stats:', error);
      throw new Error(`Failed to get photo stats: ${error.message}`);
    }
  }
}

export default new PhotosService();