import { store } from '../store';
import { setAuthState, clearAuthState } from '../store/slices/authSlice';
import { setPhotos, addPhoto, updatePhotoInList, setSharedPhotos } from '../store/slices/photosSlice';
import { setWidgets, addWidget, updateWidgetInList, setSharedWidgets } from '../store/slices/widgetsSlice';
import authService from '../services/authService';
import photosService from '../services/photosService';
import widgetsService from '../services/widgetsService';
import friendsService from '../services/friendsService';

class RealtimeManager {
  constructor() {
    this.listeners = new Map();
    this.isInitialized = false;
    this.isOnline = navigator.onLine;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000; // Start with 1 second
    this.maxReconnectDelay = 30000; // Max 30 seconds
    this.reconnectTimer = null;
    this.currentUserId = null;
    this.connectionListeners = new Set();
    this.cleanupTimer = null;
    this.isDestroyed = false;
    
    // Listen to online/offline events
    this.setupNetworkListeners();
    
    // Setup periodic cleanup
    this.setupPeriodicCleanup();
  }

  // Setup periodic cleanup to prevent memory leaks
  setupPeriodicCleanup() {
    this.cleanupTimer = setInterval(() => {
      if (!this.isDestroyed) {
        this.cleanupStaleListeners();
        this.performMemoryCleanup();
      }
    }, 5 * 60 * 1000); // Every 5 minutes
  }

  // Perform memory cleanup
  performMemoryCleanup() {
    // Clear old connection listeners
    if (this.connectionListeners.size > 10) {
      console.warn('⚠️ Too many connection listeners, clearing old ones');
      const listenersArray = Array.from(this.connectionListeners);
      this.connectionListeners.clear();
      // Keep only the last 5 listeners
      listenersArray.slice(-5).forEach(listener => {
        this.connectionListeners.add(listener);
      });
    }

    // Clear old timers
    if (this.reconnectTimer && this.reconnectAttempts === 0) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  // Setup network connectivity listeners
  setupNetworkListeners() {
    window.addEventListener('online', () => {
      console.log('🌐 Network connection restored');
      this.isOnline = true;
      this.reconnectAttempts = 0;
      this.onConnectionRestored();
    });

    window.addEventListener('offline', () => {
      console.log('🚫 Network connection lost');
      this.isOnline = false;
      this.onConnectionLost();
    });
  }

  // Handle connection loss
  onConnectionLost() {
    this.notifyConnectionListeners('offline');
    // Don't cleanup listeners immediately, just mark as offline
    console.log('📡 Connection lost, listeners will attempt to reconnect...');
  }

  // Handle connection restoration
  onConnectionRestored() {
    this.notifyConnectionListeners('online');
    if (this.currentUserId) {
      console.log('🔄 Reconnecting realtime listeners...');
      this.attemptReconnection();
    }
  }

  // Attempt to reconnect listeners
  async attemptReconnection() {
    if (!this.isOnline || this.reconnectAttempts >= this.maxReconnectAttempts) {
      return;
    }

    this.reconnectAttempts++;
    console.log(`🔄 Reconnection attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);

    try {
      // Clean up existing listeners
      this.cleanupUserListeners();
      
      // Re-setup user listeners
      if (this.currentUserId) {
        await this.setupUserListeners(this.currentUserId);
        console.log('✅ Listeners reconnected successfully');
        this.reconnectAttempts = 0;
        this.reconnectDelay = 1000; // Reset delay
        this.notifyConnectionListeners('reconnected');
      }
    } catch (error) {
      console.error(`❌ Reconnection attempt ${this.reconnectAttempts} failed:`, error);
      
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        // Schedule next reconnection attempt with exponential backoff
        this.reconnectDelay = Math.min(this.reconnectDelay * 2, this.maxReconnectDelay);
        this.scheduleReconnection();
      } else {
        console.error('❌ Max reconnection attempts reached');
        this.notifyConnectionListeners('failed');
      }
    }
  }

  // Schedule reconnection with delay
  scheduleReconnection() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    this.reconnectTimer = setTimeout(() => {
      if (this.isOnline) {
        this.attemptReconnection();
      }
    }, this.reconnectDelay);

    console.log(`⏰ Next reconnection attempt in ${this.reconnectDelay}ms`);
  }

  // Add connection status listener
  addConnectionListener(callback) {
    this.connectionListeners.add(callback);
    return () => this.connectionListeners.delete(callback);
  }

  // Notify connection listeners
  notifyConnectionListeners(status) {
    this.connectionListeners.forEach(callback => {
      try {
        callback(status);
      } catch (error) {
        console.warn('Error notifying connection listener:', error);
      }
    });
  }

  // Enhanced listener setup with error handling
  setupListenerWithRetry(key, setupFunction, maxRetries = 3) {
    if (this.isDestroyed) {
      console.warn('⚠️ Cannot setup listener, RealtimeManager is destroyed');
      return false;
    }

    let retries = 0;
    
    const attemptSetup = () => {
      if (this.isDestroyed) {
        return false;
      }

      try {
        const unsubscribe = setupFunction();
        
        // Wrap unsubscribe to handle cleanup properly
        const wrappedUnsubscribe = () => {
          try {
            if (typeof unsubscribe === 'function') {
              unsubscribe();
            }
          } catch (error) {
            console.warn(`Error unsubscribing ${key}:`, error);
          }
        };
        
        this.listeners.set(key, unsubscribe);
        console.log(`📡 Successfully setup listener: ${key}`);
        return true;
      } catch (error) {
        console.error(`❌ Error setting up listener ${key}:`, error);
        retries++;
        
        if (retries < maxRetries && !this.isDestroyed) {
          console.log(`🔄 Retrying listener setup ${key} (${retries}/${maxRetries})`);
          setTimeout(attemptSetup, 1000 * retries); // Exponential backoff
        } else {
          console.error(`❌ Failed to setup listener ${key} after ${maxRetries} attempts`);
        }
        return false;
      }
    };

    return attemptSetup();
  }

  // Initialize all realtime listeners
  async initialize() {
    if (this.isInitialized) {
      console.warn('RealtimeManager already initialized');
      return;
    }

    try {
      console.log('🔄 Initializing Realtime Manager...');
      
      // Setup auth state listener
      this.setupAuthStateListener();
      
      this.isInitialized = true;
      console.log('✅ Realtime Manager initialized successfully');
    } catch (error) {
      console.error('❌ Error initializing Realtime Manager:', error);
      throw error;
    }
  }

  // Setup Firebase Auth state listener
  setupAuthStateListener() {
    const unsubscribe = authService.onAuthStateChanged((authData) => {
      const { user, profile, isAuthenticated } = authData;
      
      if (isAuthenticated && user) {
        // User is authenticated
        store.dispatch(setAuthState({ user, profile, isAuthenticated }));
        
        // Setup user-specific listeners
        this.setupUserListeners(user.uid);
        
        console.log('🔐 User authenticated, setting up listeners for:', user.email);
      } else {
        // User is not authenticated
        store.dispatch(clearAuthState());
        
        // Clean up all listeners
        this.cleanupUserListeners();
        
        console.log('🚪 User logged out, cleaned up all listeners');
      }
    });

    this.listeners.set('auth', unsubscribe);
  }

  // Setup listeners for authenticated user
  async setupUserListeners(userId) {
    try {
      this.currentUserId = userId;
      
      // Setup photos listeners
      await this.setupPhotosListeners(userId);
      
      // Setup widgets listeners
      await this.setupWidgetsListeners(userId);
      
      // Setup friends listeners
      await this.setupFriendsListeners(userId);
      
      console.log('📡 All user listeners setup for user:', userId);
    } catch (error) {
      console.error('Error setting up user listeners:', error);
      throw error;
    }
  }

  // Setup photos realtime listeners
  async setupPhotosListeners(userId) {
    // Setup user photos listener with retry
    this.setupListenerWithRetry('userPhotos', () => {
      return photosService.subscribeToUserPhotos(
        userId,
        (photos) => {
          if (this.isOnline) {
            store.dispatch(setPhotos(photos));
            console.log('📸 User photos updated:', photos.length);
          }
        },
        (error) => {
          console.error('User photos listener error:', error);
          if (this.isOnline) {
            this.scheduleReconnection();
          }
        }
      );
    });

    // Setup shared photos listener with retry
    this.setupListenerWithRetry('sharedPhotos', () => {
      return photosService.subscribeToSharedPhotos(
        userId,
        (sharedPhotos) => {
          if (this.isOnline) {
            store.dispatch(setSharedPhotos(sharedPhotos));
            console.log('🔗 Shared photos updated:', sharedPhotos.length);
          }
        },
        (error) => {
          console.error('Shared photos listener error:', error);
          if (this.isOnline) {
            this.scheduleReconnection();
          }
        }
      );
    });
  }

  // Setup widgets realtime listeners
  async setupWidgetsListeners(userId) {
    // Setup user widgets listener with retry
    this.setupListenerWithRetry('userWidgets', () => {
      return widgetsService.subscribeToUserWidgets(
        userId,
        (widgets) => {
          if (this.isOnline) {
            store.dispatch(setWidgets(widgets));
            console.log('🧩 User widgets updated:', widgets.length);
          }
        },
        (error) => {
          console.error('User widgets listener error:', error);
          if (this.isOnline) {
            this.scheduleReconnection();
          }
        }
      );
    });

    // Setup shared widgets listener with retry (if the method exists)
    if (typeof widgetsService.subscribeToSharedWidgets === 'function') {
      this.setupListenerWithRetry('sharedWidgets', () => {
        return widgetsService.subscribeToSharedWidgets(
          userId,
          (sharedWidgets) => {
            if (this.isOnline) {
              store.dispatch(setSharedWidgets(sharedWidgets));
              console.log('🔗 Shared widgets updated:', sharedWidgets.length);
            }
          },
          (error) => {
            console.error('Shared widgets listener error:', error);
            if (this.isOnline) {
              this.scheduleReconnection();
            }
          }
        );
      });
    }
  }

  // Setup friends realtime listeners
  async setupFriendsListeners(userId) {
    // Setup friend requests listener with retry (if the method exists)
    if (typeof friendsService.subscribeToReceivedRequests === 'function') {
      this.setupListenerWithRetry('friendRequests', () => {
        return friendsService.subscribeToReceivedRequests(
          userId,
          (requests) => {
            if (this.isOnline) {
              console.log('👥 Friend requests updated:', requests.length);
              // You can dispatch to a friends slice if you create one
            }
          },
          (error) => {
            console.error('Friend requests listener error:', error);
            if (this.isOnline) {
              this.scheduleReconnection();
            }
          }
        );
      });
    }

    // Setup friendships listener with retry (if the method exists)
    if (typeof friendsService.subscribeToFriendships === 'function') {
      this.setupListenerWithRetry('friendships', () => {
        return friendsService.subscribeToFriendships(
          userId,
          (friends) => {
            if (this.isOnline) {
              console.log('👫 Friends updated:', friends.length);
              // You can dispatch to a friends slice if you create one
            }
          },
          (error) => {
            console.error('Friendships listener error:', error);
            if (this.isOnline) {
              this.scheduleReconnection();
            }
          }
        );
      });
    }
  }

  // Clean up user-specific listeners
  cleanupUserListeners() {
    const userListeners = ['userPhotos', 'sharedPhotos', 'userWidgets', 'sharedWidgets', 'friendRequests', 'friendships'];
    
    userListeners.forEach(listenerKey => {
      const unsubscribe = this.listeners.get(listenerKey);
      if (unsubscribe && typeof unsubscribe === 'function') {
        unsubscribe();
        this.listeners.delete(listenerKey);
      }
    });
    
    console.log('🧹 User listeners cleaned up');
  }

  // Clean up all listeners
  cleanup() {
    if (this.isDestroyed) {
      console.warn('⚠️ RealtimeManager already destroyed');
      return;
    }

    console.log('🧹 Cleaning up all realtime listeners...');
    this.isDestroyed = true;
    
    // Clear periodic cleanup timer
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    
    // Clear reconnection timer
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    this.listeners.forEach((unsubscribe, key) => {
      if (typeof unsubscribe === 'function') {
        try {
          unsubscribe();
          console.log(`✅ Cleaned up listener: ${key}`);
        } catch (error) {
          console.warn(`⚠️ Error cleaning up listener ${key}:`, error);
        }
      }
    });
    
    this.listeners.clear();
    this.connectionListeners.clear();
    this.isInitialized = false;
    this.currentUserId = null;
    
    console.log('✅ All realtime listeners cleaned up');
  }

  // Get active listeners count
  getActiveListenersCount() {
    return this.listeners.size;
  }

  // Get active listener keys
  getActiveListenerKeys() {
    return Array.from(this.listeners.keys());
  }

  // Check if a specific listener is active
  isListenerActive(key) {
    return this.listeners.has(key);
  }

  // Manually add a listener
  addListener(key, unsubscribeFunction) {
    if (this.listeners.has(key)) {
      console.warn(`Listener ${key} already exists, replacing...`);
      const existingUnsubscribe = this.listeners.get(key);
      if (typeof existingUnsubscribe === 'function') {
        existingUnsubscribe();
      }
    }
    
    this.listeners.set(key, unsubscribeFunction);
    console.log(`📡 Added listener: ${key}`);
  }

  // Manually remove a listener
  removeListener(key) {
    const unsubscribe = this.listeners.get(key);
    if (unsubscribe && typeof unsubscribe === 'function') {
      unsubscribe();
      this.listeners.delete(key);
      console.log(`🗑️ Removed listener: ${key}`);
      return true;
    }
    return false;
  }

  // Pause all listeners (useful for background state)
  pauseListeners() {
    console.log('⏸️ Pausing all realtime listeners...');
    // Store current listeners but don't unsubscribe
    // This could be implemented if needed for performance
  }

  // Resume all listeners
  resumeListeners() {
    console.log('▶️ Resuming all realtime listeners...');
    // Restore listeners if they were paused
    // This could be implemented if needed for performance
  }

  // Get listener status
  getStatus() {
    return {
      isInitialized: this.isInitialized,
      activeListeners: this.getActiveListenersCount(),
      listenerKeys: this.getActiveListenerKeys()
    };
  }

  // Health check for listeners
  healthCheck() {
    const status = this.getStatus();
    const currentUser = store.getState().auth.user;
    
    console.log('🏥 Realtime Manager Health Check:', {
      ...status,
      hasUser: !!currentUser,
      userEmail: currentUser?.email
    });
    
    return status;
  }
}

// Create singleton instance
const realtimeManager = new RealtimeManager();

// Export both the class and instance
export default realtimeManager;
export { RealtimeManager };

// Helper functions for React components
export const useRealtimeStatus = () => {
  return realtimeManager.getStatus();
};

export const initializeRealtime = async () => {
  return await realtimeManager.initialize();
};

export const cleanupRealtime = () => {
  realtimeManager.cleanup();
};