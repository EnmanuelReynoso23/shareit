import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  writeBatch
} from 'firebase/firestore';
import { 
  updateProfile, 
  updatePassword, 
  updateEmail, 
  deleteUser as deleteAuthUser 
} from 'firebase/auth';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject 
} from 'firebase/storage';
import { db, storage, auth } from '../../config/firebase';

class UserService {
  constructor() {
    this.collection = 'users';
    this.storageRef = 'users';
    
    // Queue y locks para evitar race conditions
    this.operationQueue = new Map();
    this.activeLocks = new Set();
  }

  // Crear un lock para operaciones críticas
  async acquireLock(lockId) {
    const timeout = 5000; // 5 segundos timeout
    const startTime = Date.now();
    
    while (this.activeLocks.has(lockId)) {
      if (Date.now() - startTime > timeout) {
        throw new Error(`Operation timeout: Could not acquire lock for ${lockId}`);
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    this.activeLocks.add(lockId);
  }

  // Liberar lock
  releaseLock(lockId) {
    this.activeLocks.delete(lockId);
  }

  // Ejecutar operación con lock
  async executeWithLock(lockId, operation) {
    await this.acquireLock(lockId);
    try {
      return await operation();
    } finally {
      this.releaseLock(lockId);
    }
  }

  // Queue para operaciones secuenciales
  async queueOperation(userId, operation) {
    if (!this.operationQueue.has(userId)) {
      this.operationQueue.set(userId, Promise.resolve());
    }

    const previousOperation = this.operationQueue.get(userId);
    
    const newOperation = previousOperation.then(async () => {
      try {
        return await operation();
      } catch (error) {
        console.error(`Queued operation failed for user ${userId}:`, error);
        throw error;
      }
    });

    this.operationQueue.set(userId, newOperation);
    return newOperation;
  }

  // Create user profile in Firestore
  async createUserProfile(userId, userData) {
    try {
      const userProfile = {
        uid: userId,
        email: userData.email,
        displayName: userData.displayName || '',
        photoURL: userData.photoURL || null,
        bio: userData.bio || '',
        location: userData.location || '',
        website: userData.website || '',
        isPublic: userData.isPublic !== undefined ? userData.isPublic : true,
        preferences: {
          theme: 'light',
          notifications: {
            photos: true,
            widgets: true,
            friends: true,
            push: true
          },
          privacy: {
            showEmail: false,
            showLocation: false,
            allowTagging: true
          }
        },
        stats: {
          photosCount: 0,
          widgetsCount: 0,
          friendsCount: 0,
          likesReceived: 0
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastActive: serverTimestamp()
      };

      await setDoc(doc(db, this.collection, userId), userProfile);
      
      return userProfile;
    } catch (error) {
      console.error('Error creating user profile:', error);
      throw new Error(`Failed to create user profile: ${error.message}`);
    }
  }

  // Get user profile
  async getUserProfile(userId) {
    try {
      const docRef = doc(db, this.collection, userId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data()
        };
      } else {
        throw new Error('User profile not found');
      }
    } catch (error) {
      console.error('Error getting user profile:', error);
      throw new Error(`Failed to get user profile: ${error.message}`);
    }
  }

  // Update user profile
  async updateUserProfile(userId, updates) {
    try {
      const docRef = doc(db, this.collection, userId);
      const updateData = {
        ...updates,
        updatedAt: serverTimestamp()
      };

      await updateDoc(docRef, updateData);
      
      // Update Firebase Auth profile if needed
      if (updates.displayName || updates.photoURL) {
        const user = auth.currentUser;
        if (user) {
          await updateProfile(user, {
            displayName: updates.displayName || user.displayName,
            photoURL: updates.photoURL || user.photoURL
          });
        }
      }
      
      return {
        id: userId,
        ...updateData
      };
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw new Error(`Failed to update user profile: ${error.message}`);
    }
  }

  // Upload profile picture
  async uploadProfilePicture(userId, file) {
    try {
      const fileName = `${userId}_profile_${Date.now()}`;
      const storageRef = ref(storage, `${this.storageRef}/${fileName}`);
      
      // Upload file
      const snapshot = await uploadBytes(storageRef, file);
      
      // Get download URL
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      // Update user profile with new photo URL
      await this.updateUserProfile(userId, {
        photoURL: downloadURL
      });
      
      return downloadURL;
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      throw new Error(`Failed to upload profile picture: ${error.message}`);
    }
  }

  // Search users
  async searchUsers(searchTerm, limitCount = 20) {
    try {
      const q = query(
        collection(db, this.collection),
        where('displayName', '>=', searchTerm),
        where('displayName', '<=', searchTerm + '\uf8ff'),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);
      const users = [];
      
      querySnapshot.forEach((doc) => {
        const userData = doc.data();
        if (userData.isPublic) {
          users.push({
            id: doc.id,
            uid: userData.uid,
            displayName: userData.displayName,
            photoURL: userData.photoURL,
            bio: userData.bio,
            location: userData.location
          });
        }
      });

      return users;
    } catch (error) {
      console.error('Error searching users:', error);
      throw new Error(`Failed to search users: ${error.message}`);
    }
  }

  // Get user's friends
  async getUserFriends(userId) {
    try {
      const userProfile = await this.getUserProfile(userId);
      const friendIds = userProfile.friends || [];
      
      if (friendIds.length === 0) {
        return [];
      }

      const friends = [];
      for (const friendId of friendIds) {
        try {
          const friend = await this.getUserProfile(friendId);
          friends.push({
            id: friend.id,
            uid: friend.uid,
            displayName: friend.displayName,
            photoURL: friend.photoURL,
            bio: friend.bio,
            lastActive: friend.lastActive
          });
        } catch (error) {
          console.warn(`Could not fetch friend ${friendId}:`, error);
        }
      }

      return friends;
    } catch (error) {
      console.error('Error getting user friends:', error);
      throw new Error(`Failed to get user friends: ${error.message}`);
    }
  }

  // Add friend - optimized with batch operations
  async addFriend(userId, friendId) {
    return await this.queueOperation(userId, async () => {
      return await this.executeWithLock(`friend_${userId}_${friendId}`, async () => {
        try {
          // Verificar que no sean ya amigos
          const userProfile = await this.getUserProfile(userId);
          const friendProfile = await this.getUserProfile(friendId);
          
          if (userProfile.friends?.includes(friendId)) {
            throw new Error('Users are already friends');
          }
          
          // Create batch operation
          const batch = writeBatch(db);
          
          const userDocRef = doc(db, this.collection, userId);
          const friendDocRef = doc(db, this.collection, friendId);
          
          // Add friend to user's friends array
          batch.update(userDocRef, {
            friends: arrayUnion(friendId),
            updatedAt: serverTimestamp(),
            stats: {
              ...userProfile.stats,
              friendsCount: (userProfile.stats?.friendsCount || 0) + 1
            }
          });
          
          // Add user to friend's friends array
          batch.update(friendDocRef, {
            friends: arrayUnion(userId),
            updatedAt: serverTimestamp(),
            stats: {
              ...friendProfile.stats,
              friendsCount: (friendProfile.stats?.friendsCount || 0) + 1
            }
          });
          
          // Commit batch operation
          await batch.commit();
          
          return { success: true };
        } catch (error) {
          console.error('Error adding friend:', error);
          throw new Error(`Failed to add friend: ${error.message}`);
        }
      });
    });
  }

  // Remove friend
  async removeFriend(userId, friendId) {
    return await this.queueOperation(userId, async () => {
      return await this.executeWithLock(`friend_${userId}_${friendId}`, async () => {
        try {
          // Verificar que sean amigos
          const userProfile = await this.getUserProfile(userId);
          
          if (!userProfile.friends?.includes(friendId)) {
            throw new Error('Users are not friends');
          }
          
          const userDocRef = doc(db, this.collection, userId);
          const friendDocRef = doc(db, this.collection, friendId);
          
          // Remove friend from user's friends array
          await updateDoc(userDocRef, {
            friends: arrayRemove(friendId),
            updatedAt: serverTimestamp()
          });
          
          // Remove user from friend's friends array
          await updateDoc(friendDocRef, {
            friends: arrayRemove(userId),
            updatedAt: serverTimestamp()
          });
          
          // Update stats sequentially
          await this.updateUserStats(userId, { friendsCount: -1 });
          await this.updateUserStats(friendId, { friendsCount: -1 });
          
          return { success: true };
        } catch (error) {
          console.error('Error removing friend:', error);
          throw new Error(`Failed to remove friend: ${error.message}`);
        }
      });
    });
  }

  // Update user statistics
  async updateUserStats(userId, statUpdates) {
    return await this.queueOperation(userId, async () => {
      return await this.executeWithLock(`stats_${userId}`, async () => {
        try {
          const userProfile = await this.getUserProfile(userId);
          const currentStats = userProfile.stats || {};
          
          const updatedStats = { ...currentStats };
          
          Object.keys(statUpdates).forEach(key => {
            if (typeof statUpdates[key] === 'number') {
              updatedStats[key] = Math.max(0, (currentStats[key] || 0) + statUpdates[key]);
            } else {
              updatedStats[key] = statUpdates[key];
            }
          });
          
          await updateDoc(doc(db, this.collection, userId), {
            stats: updatedStats,
            updatedAt: serverTimestamp()
          });
          
          return updatedStats;
        } catch (error) {
          console.error('Error updating user stats:', error);
          throw new Error(`Failed to update user stats: ${error.message}`);
        }
      });
    });
  }

  // Update user preferences
  async updateUserPreferences(userId, preferences) {
    try {
      const userProfile = await this.getUserProfile(userId);
      const currentPreferences = userProfile.preferences || {};
      
      const updatedPreferences = {
        ...currentPreferences,
        ...preferences
      };
      
      await updateDoc(doc(db, this.collection, userId), {
        preferences: updatedPreferences,
        updatedAt: serverTimestamp()
      });
      
      return updatedPreferences;
    } catch (error) {
      console.error('Error updating user preferences:', error);
      throw new Error(`Failed to update user preferences: ${error.message}`);
    }
  }

  // Update last active timestamp
  async updateLastActive(userId) {
    try {
      await updateDoc(doc(db, this.collection, userId), {
        lastActive: serverTimestamp()
      });
      
      return { success: true };
    } catch (error) {
      console.error('Error updating last active:', error);
      // Don't throw error for last active updates
      return { success: false };
    }
  }

  // Change user password
  async changePassword(newPassword) {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('No authenticated user');
      }
      
      await updatePassword(user, newPassword);
      return { success: true };
    } catch (error) {
      console.error('Error changing password:', error);
      throw new Error(`Failed to change password: ${error.message}`);
    }
  }

  // Change user email
  async changeEmail(newEmail) {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('No authenticated user');
      }
      
      await updateEmail(user, newEmail);
      
      // Update email in Firestore
      await updateDoc(doc(db, this.collection, user.uid), {
        email: newEmail,
        updatedAt: serverTimestamp()
      });
      
      return { success: true };
    } catch (error) {
      console.error('Error changing email:', error);
      throw new Error(`Failed to change email: ${error.message}`);
    }
  }

  // Delete user account
  async deleteUserAccount(userId) {
    try {
      const user = auth.currentUser;
      if (!user || user.uid !== userId) {
        throw new Error('Unauthorized');
      }
      
      // Delete user profile picture from storage
      const userProfile = await this.getUserProfile(userId);
      if (userProfile.photoURL) {
        try {
          const photoRef = ref(storage, userProfile.photoURL);
          await deleteObject(photoRef);
        } catch (error) {
          console.warn('Could not delete profile picture:', error);
        }
      }
      
      // Delete user document from Firestore
      await deleteDoc(doc(db, this.collection, userId));
      
      // Delete user from Firebase Auth
      await deleteAuthUser(user);
      
      return { success: true };
    } catch (error) {
      console.error('Error deleting user account:', error);
      throw new Error(`Failed to delete user account: ${error.message}`);
    }
  }

  // Real-time listener for user profile
  subscribeToUserProfile(userId, callback) {
    const docRef = doc(db, this.collection, userId);
    
    return onSnapshot(docRef, (doc) => {
      if (doc.exists()) {
        callback({
          id: doc.id,
          ...doc.data()
        });
      } else {
        callback(null);
      }
    });
  }

  // Get popular users
  async getPopularUsers(limitCount = 10) {
    try {
      const q = query(
        collection(db, this.collection),
        where('isPublic', '==', true),
        orderBy('stats.likesReceived', 'desc'),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);
      const users = [];
      
      querySnapshot.forEach((doc) => {
        const userData = doc.data();
        users.push({
          id: doc.id,
          uid: userData.uid,
          displayName: userData.displayName,
          photoURL: userData.photoURL,
          bio: userData.bio,
          stats: userData.stats
        });
      });

      return users;
    } catch (error) {
      console.error('Error getting popular users:', error);
      throw new Error(`Failed to get popular users: ${error.message}`);
    }
  }
}

export default new UserService();