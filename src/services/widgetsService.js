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
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  runTransaction
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import widgetPermissions from './widgetPermissions';
import widgetCollaboration from './widgetCollaboration';

class WidgetsService {
  constructor() {
    this.collection = 'widgets';
    // Registro de listeners activos para prevenir memory leaks
    this.activeListeners = new Map();
    this.listenerCounter = 0;
  }

  // Registrar listener para tracking y limpieza
  registerListener(listenerId, unsubscribeFunction) {
    this.activeListeners.set(listenerId, {
      unsubscribe: unsubscribeFunction,
      timestamp: Date.now()
    });
  }

  // Desregistrar y limpiar listener
  unregisterListener(listenerId) {
    const listener = this.activeListeners.get(listenerId);
    if (listener) {
      try {
        if (typeof listener.unsubscribe === 'function') {
          listener.unsubscribe();
        }
      } catch (error) {
        console.warn(`Error unsubscribing listener ${listenerId}:`, error);
      }
      this.activeListeners.delete(listenerId);
    }
  }

  // Limpiar todos los listeners
  cleanupAllListeners() {
    for (const [listenerId, listener] of this.activeListeners.entries()) {
      try {
        if (typeof listener.unsubscribe === 'function') {
          listener.unsubscribe();
        }
      } catch (error) {
        console.warn(`Error cleaning up listener ${listenerId}:`, error);
      }
    }
    this.activeListeners.clear();
  }

  // Limpiar listeners antiguos (más de 30 minutos)
  cleanupStaleListeners() {
    const now = Date.now();
    const staleThreshold = 30 * 60 * 1000; // 30 minutos
    
    for (const [listenerId, listener] of this.activeListeners.entries()) {
      if (now - listener.timestamp > staleThreshold) {
        this.unregisterListener(listenerId);
      }
    }
  }

  // Generar ID único para listener
  generateListenerId() {
    return `listener_${++this.listenerCounter}_${Date.now()}`;
  }

  // Widget types available
  static WIDGET_TYPES = {
    CLOCK: 'clock',
    PHOTOS: 'photos',
    NOTES: 'notes',
    WEATHER: 'weather',
    CALENDAR: 'calendar',
    MUSIC: 'music'
  };

  // Create new widget with permissions
  async createWidget(widgetData) {
    try {
      const widget = {
        ...widgetData,
        id: null, // Will be set by Firestore
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        isActive: true,
        shared: false,
        sharedWith: [],
        collaborators: [],
        settings: {
          ...this.getDefaultSettings(widgetData.type),
          ...widgetData.settings
        },
        version: 1,
        lastSyncTimestamp: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, this.collection), widget);
      const widgetId = docRef.id;

      // Create permissions for the widget
      await widgetPermissions.createWidgetPermissions(widgetId, widgetData.userId);

      return {
        id: widgetId,
        ...widget
      };
    } catch (error) {
      console.error('Error creating widget:', error);
      throw new Error(`Failed to create widget: ${error.message}`);
    }
  }

  // Share widget with permissions
  async shareWidgetWithPermissions(widgetId, userId, sharing) {
    try {
      // Check if user has share permissions
      const hasSharePermission = await widgetPermissions.hasPermission(widgetId, userId, 'share');
      if (!hasSharePermission) {
        throw new Error('Insufficient permissions to share this widget');
      }

      // Grant permissions to users
      const permissionPromises = sharing.map(async ({ userId: targetUserId, permissionLevel }) => {
        return await widgetPermissions.grantPermissions(widgetId, targetUserId, permissionLevel, userId);
      });

      await Promise.all(permissionPromises);

      // Update widget sharing status
      const userIds = sharing.map(s => s.userId);
      await updateDoc(doc(db, this.collection, widgetId), {
        shared: true,
        sharedWith: userIds,
        collaborators: arrayUnion(...userIds),
        updatedAt: serverTimestamp(),
        version: serverTimestamp() // Use timestamp as version
      });

      return { success: true, widgetId, sharedWith: userIds };
    } catch (error) {
      console.error('Error sharing widget with permissions:', error);
      throw new Error(`Failed to share widget with permissions: ${error.message}`);
    }
  }

  // Update widget with collaboration tracking
  async updateWidgetWithCollaboration(widgetId, updates, userId, sessionId = null) {
    try {
      // Check edit permissions
      const hasEditPermission = await widgetPermissions.hasPermission(widgetId, userId, 'edit');
      if (!hasEditPermission) {
        throw new Error('Insufficient permissions to edit this widget');
      }

      return await runTransaction(db, async (transaction) => {
        const widgetRef = doc(db, this.collection, widgetId);
        const widgetDoc = await transaction.get(widgetRef);
        
        if (!widgetDoc.exists()) {
          throw new Error('Widget not found');
        }

        const currentData = widgetDoc.data();
        const updateData = {
          ...updates,
          updatedAt: serverTimestamp(),
          lastEditedBy: userId,
          version: serverTimestamp() // Use timestamp as version
        };

        // Update the widget
        transaction.update(widgetRef, updateData);

        // Record the change if in a collaboration session
        if (sessionId) {
          await widgetCollaboration.recordWidgetChange(
            sessionId,
            widgetId,
            userId,
            widgetCollaboration.constructor.CHANGE_TYPES.UPDATE,
            updates,
            currentData
          );
        }

        return {
          id: widgetId,
          ...currentData,
          ...updateData
        };
      });
    } catch (error) {
      console.error('Error updating widget with collaboration:', error);
      throw new Error(`Failed to update widget with collaboration: ${error.message}`);
    }
  }

  // Get widgets accessible to user (owned + shared)
  async getAccessibleWidgets(userId, limitCount = 50) {
    try {
      // Get widgets with permissions
      const accessibleWidgets = await widgetPermissions.getUserAccessibleWidgets(userId);
      const widgetIds = accessibleWidgets.map(w => w.widgetId);

      if (widgetIds.length === 0) {
        return [];
      }

      // Get widget details in batches (Firestore limit is 10 for 'in' queries)
      const widgets = [];
      const batchSize = 10;
      
      for (let i = 0; i < widgetIds.length; i += batchSize) {
        const batch = widgetIds.slice(i, i + batchSize);
        const q = query(
          collection(db, this.collection),
          where('__name__', 'in', batch.map(id => doc(db, this.collection, id))),
          where('isActive', '==', true)
        );

        const querySnapshot = await getDocs(q);
        
        querySnapshot.forEach((doc) => {
          const widgetData = doc.data();
          const permissions = accessibleWidgets.find(w => w.widgetId === doc.id);
          
          widgets.push({
            id: doc.id,
            ...widgetData,
            userPermissions: permissions.permissions,
            permissionLevel: permissions.permissionLevel,
            isOwner: permissions.isOwner
          });
        });
      }

      // Sort by most recently updated
      widgets.sort((a, b) => {
        const aTime = a.updatedAt?.toMillis?.() || 0;
        const bTime = b.updatedAt?.toMillis?.() || 0;
        return bTime - aTime;
      });

      return widgets.slice(0, limitCount);
    } catch (error) {
      console.error('Error getting accessible widgets:', error);
      throw new Error(`Failed to get accessible widgets: ${error.message}`);
    }
  }

  // Get collaborative widgets (widgets being actively collaborated on)
  async getCollaborativeWidgets(userId) {
    try {
      const userWidgets = await this.getAccessibleWidgets(userId);
      const collaborativeWidgets = [];

      for (const widget of userWidgets) {
        const activeSessions = await widgetCollaboration.getActiveSessionsForWidget(widget.id);
        if (activeSessions.length > 0) {
          const stats = await widgetCollaboration.getCollaborationStats(widget.id);
          collaborativeWidgets.push({
            ...widget,
            activeSessions,
            collaborationStats: stats
          });
        }
      }

      return collaborativeWidgets;
    } catch (error) {
      console.error('Error getting collaborative widgets:', error);
      throw new Error(`Failed to get collaborative widgets: ${error.message}`);
    }
  }

  // Start collaborative editing session
  async startCollaborativeEditing(widgetId, userId) {
    try {
      // Check edit permissions
      const hasEditPermission = await widgetPermissions.hasPermission(widgetId, userId, 'edit');
      if (!hasEditPermission) {
        throw new Error('Insufficient permissions to start collaborative editing');
      }

      // Start collaboration session
      const session = await widgetCollaboration.startCollaborationSession(widgetId, userId);
      
      return session;
    } catch (error) {
      console.error('Error starting collaborative editing:', error);
      throw new Error(`Failed to start collaborative editing: ${error.message}`);
    }
  }

  // Join collaborative editing session
  async joinCollaborativeEditing(sessionId, userId) {
    try {
      const result = await widgetCollaboration.joinCollaborationSession(sessionId, userId);
      return result;
    } catch (error) {
      console.error('Error joining collaborative editing:', error);
      throw new Error(`Failed to join collaborative editing: ${error.message}`);
    }
  }

  // Update widget settings with collaboration
  async updateWidgetSettingsWithCollaboration(widgetId, settings, userId, sessionId = null) {
    try {
      // Check edit permissions
      const hasEditPermission = await widgetPermissions.hasPermission(widgetId, userId, 'edit');
      if (!hasEditPermission) {
        throw new Error('Insufficient permissions to edit widget settings');
      }

      const widget = await this.getWidget(widgetId);
      const updatedSettings = {
        ...widget.settings,
        ...settings
      };

      const updateData = {
        settings: updatedSettings,
        updatedAt: serverTimestamp(),
        lastEditedBy: userId,
        version: serverTimestamp()
      };

      await updateDoc(doc(db, this.collection, widgetId), updateData);

      // Record the change if in a collaboration session
      if (sessionId) {
        await widgetCollaboration.recordWidgetChange(
          sessionId,
          widgetId,
          userId,
          widgetCollaboration.constructor.CHANGE_TYPES.SETTINGS,
          settings,
          widget.settings
        );
      }

      return updatedSettings;
    } catch (error) {
      console.error('Error updating widget settings with collaboration:', error);
      throw new Error(`Failed to update widget settings with collaboration: ${error.message}`);
    }
  }

  // Delete widget with permission check
  async deleteWidgetWithPermissions(widgetId, userId) {
    try {
      // Check delete permissions (only admin/owner can delete)
      const hasDeletePermission = await widgetPermissions.hasPermission(widgetId, userId, 'delete');
      if (!hasDeletePermission) {
        throw new Error('Insufficient permissions to delete this widget');
      }

      // End any active collaboration sessions
      const activeSessions = await widgetCollaboration.getActiveSessionsForWidget(widgetId);
      for (const session of activeSessions) {
        await widgetCollaboration.endCollaborationSession(session.id, userId);
      }

      // Delete widget permissions
      await widgetPermissions.deleteWidgetPermissions(widgetId, userId);

      // Delete the widget
      await deleteDoc(doc(db, this.collection, widgetId));

      return { success: true, widgetId };
    } catch (error) {
      console.error('Error deleting widget with permissions:', error);
      throw new Error(`Failed to delete widget with permissions: ${error.message}`);
    }
  }

  // Get widget with permissions info
  async getWidgetWithPermissions(widgetId, userId) {
    try {
      const widget = await this.getWidget(widgetId);
      const userPermissions = await widgetPermissions.getUserPermissionLevel(widgetId, userId);
      const collaborators = await widgetPermissions.getWidgetCollaborators(widgetId);
      const activeSessions = await widgetCollaboration.getActiveSessionsForWidget(widgetId);

      if (!userPermissions) {
        throw new Error('No access to this widget');
      }

      return {
        ...widget,
        userPermissions: userPermissions.permissions,
        permissionLevel: userPermissions.level,
        isOwner: userPermissions.isOwner,
        collaborators,
        activeSessions,
        hasActiveCollaboration: activeSessions.length > 0
      };
    } catch (error) {
      console.error('Error getting widget with permissions:', error);
      throw new Error(`Failed to get widget with permissions: ${error.message}`);
    }
  }

  // Synchronize widget state with collaboration
  async synchronizeWidget(widgetId, localState, userId) {
    try {
      // Check read permissions
      const hasReadPermission = await widgetPermissions.hasPermission(widgetId, userId, 'read');
      if (!hasReadPermission) {
        throw new Error('Insufficient permissions to access this widget');
      }

      const result = await widgetCollaboration.synchronizeWidgetState(widgetId, localState, userId);
      return result;
    } catch (error) {
      console.error('Error synchronizing widget:', error);
      throw new Error(`Failed to synchronize widget: ${error.message}`);
    }
  }

  // Real-time listener for collaborative widgets
  subscribeToCollaborativeWidget(widgetId, userId, callback) {
    const listenerId = this.generateListenerId();
    const unsubscribers = [];

    try {
      // Subscribe to widget changes
      const widgetUnsubscribe = onSnapshot(
        doc(db, this.collection, widgetId),
        (doc) => {
          if (doc.exists()) {
            callback({
              type: 'widget_update',
              data: {
                id: doc.id,
                ...doc.data()
              }
            });
          }
        },
        (error) => {
          console.error('Widget listener error:', error);
          callback({
            type: 'error',
            data: { error: error.message }
          });
        }
      );
      unsubscribers.push(widgetUnsubscribe);

      // Subscribe to collaboration changes
      const changesUnsubscribe = widgetCollaboration.subscribeToWidgetChanges(widgetId, (changes) => {
        callback({
          type: 'collaboration_changes',
          data: changes
        });
      });
      unsubscribers.push(changesUnsubscribe);

      // Combined unsubscribe function
      const combinedUnsubscribe = () => {
        unsubscribers.forEach(unsubscribe => {
          try {
            if (typeof unsubscribe === 'function') {
              unsubscribe();
            }
          } catch (error) {
            console.warn('Error unsubscribing:', error);
          }
        });
        this.unregisterListener(listenerId);
      };

      // Register the listener
      this.registerListener(listenerId, combinedUnsubscribe);

      // Return unsubscribe function
      return combinedUnsubscribe;
    } catch (error) {
      console.error('Error setting up collaborative widget listener:', error);
      throw new Error(`Failed to subscribe to collaborative widget: ${error.message}`);
    }
  }

  // Real-time listener for user's widgets
  subscribeToUserWidgets(userId, callback) {
    const listenerId = this.generateListenerId();
    
    try {
      const q = query(
        collection(db, this.collection),
        where('userId', '==', userId),
        where('isActive', '==', true),
        orderBy('updatedAt', 'desc')
      );

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const widgets = [];
          snapshot.forEach((doc) => {
            widgets.push({
              id: doc.id,
              ...doc.data()
            });
          });
          callback(widgets);
        },
        (error) => {
          console.error('User widgets listener error:', error);
          callback([]);
        }
      );

      this.registerListener(listenerId, unsubscribe);
      return () => this.unregisterListener(listenerId);
    } catch (error) {
      console.error('Error setting up user widgets listener:', error);
      throw new Error(`Failed to subscribe to user widgets: ${error.message}`);
    }
  }

  // Real-time listener for widget permissions
  subscribeToWidgetPermissions(widgetId, userId, callback) {
    const listenerId = this.generateListenerId();
    
    try {
      const unsubscribe = widgetPermissions.subscribeToWidgetPermissions(widgetId, userId, callback);
      this.registerListener(listenerId, unsubscribe);
      return () => this.unregisterListener(listenerId);
    } catch (error) {
      console.error('Error setting up widget permissions listener:', error);
      throw new Error(`Failed to subscribe to widget permissions: ${error.message}`);
    }
  }

  // Cleanup listeners for specific widget
  cleanupWidgetListeners(widgetId) {
    const listenersToRemove = [];
    
    for (const [listenerId, listener] of this.activeListeners.entries()) {
      if (listenerId.includes(widgetId)) {
        listenersToRemove.push(listenerId);
      }
    }
    
    listenersToRemove.forEach(listenerId => {
      this.unregisterListener(listenerId);
    });
  }

  // Cleanup listeners for specific user
  cleanupUserListeners(userId) {
    const listenersToRemove = [];
    
    for (const [listenerId, listener] of this.activeListeners.entries()) {
      if (listenerId.includes(userId)) {
        listenersToRemove.push(listenerId);
      }
    }
    
    listenersToRemove.forEach(listenerId => {
      this.unregisterListener(listenerId);
    });
  }

  // Get widget collaboration statistics
  async getWidgetCollaborationStats(widgetId) {
    try {
      const stats = await widgetCollaboration.getCollaborationStats(widgetId);
      return stats;
    } catch (error) {
      console.error('Error getting widget collaboration stats:', error);
      throw new Error(`Failed to get widget collaboration stats: ${error.message}`);
    }
  }

  // --- Existing methods (updated for compatibility) ---

  // Get default settings for widget type
  getDefaultSettings(type) {
    const defaultSettings = {
      [WidgetsService.WIDGET_TYPES.CLOCK]: {
        format24h: false,
        showSeconds: true,
        showDate: true,
        theme: 'blue',
        size: 'medium',
        backgroundColor: '#667eea',
        textColor: '#ffffff',
        borderRadius: 12,
        showTimezone: false
      },
      [WidgetsService.WIDGET_TYPES.PHOTOS]: {
        maxPhotos: 6,
        autoRefresh: true,
        refreshInterval: 300000, // 5 minutes
        showCaptions: true,
        layout: 'grid',
        borderRadius: 8,
        spacing: 4
      },
      [WidgetsService.WIDGET_TYPES.NOTES]: {
        maxNotes: 5,
        allowMarkdown: true,
        autoSave: true,
        theme: 'yellow',
        fontSize: 14,
        fontFamily: 'System',
        allowColors: true
      },
      [WidgetsService.WIDGET_TYPES.WEATHER]: {
        unit: 'celsius',
        showForecast: true,
        forecastDays: 3,
        showHumidity: true,
        showWindSpeed: true,
        autoLocation: true
      },
      [WidgetsService.WIDGET_TYPES.CALENDAR]: {
        showUpcoming: true,
        daysAhead: 7,
        show24h: false,
        showAllDay: true,
        theme: 'blue'
      },
      [WidgetsService.WIDGET_TYPES.MUSIC]: {
        showArtwork: true,
        showProgress: true,
        showControls: true,
        theme: 'dark'
      }
    };

    return defaultSettings[type] || {};
  }

  // Get widgets by user (legacy method - now uses getAccessibleWidgets)
  async getWidgetsByUser(userId, limitCount = 50) {
    return await this.getAccessibleWidgets(userId, limitCount);
  }

  // Get single widget
  async getWidget(widgetId) {
    try {
      const docRef = doc(db, this.collection, widgetId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data()
        };
      } else {
        throw new Error('Widget not found');
      }
    } catch (error) {
      console.error('Error getting widget:', error);
      throw new Error(`Failed to get widget: ${error.message}`);
    }
  }

  // Update widget (legacy method - now uses updateWidgetWithCollaboration)
  async updateWidget(widgetId, updates) {
    try {
      const docRef = doc(db, this.collection, widgetId);
      const updateData = {
        ...updates,
        updatedAt: serverTimestamp(),
        version: serverTimestamp()
      };

      await updateDoc(docRef, updateData);
      
      return {
        id: widgetId,
        ...updateData
      };
    } catch (error) {
      console.error('Error updating widget:', error);
      throw new Error(`Failed to update widget: ${error.message}`);
    }
  }

  // Legacy methods maintained for backward compatibility
  async shareWidget(widgetId, userIds) {
    // Convert to new permission-based sharing
    const sharing = userIds.map(userId => ({
      userId,
      permissionLevel: 'COLLABORATOR'
    }));
    
    // Get current user (assuming from context or auth)
    const currentUser = null; // This should be passed or retrieved from auth
    return await this.shareWidgetWithPermissions(widgetId, currentUser, sharing);
  }

  async updateWidgetSettings(widgetId, settings) {
    return await this.updateWidget(widgetId, { settings });
  }

  async deleteWidget(widgetId, userId) {
    return await this.deleteWidgetWithPermissions(widgetId, userId);
  }

  // Other existing methods remain the same...
  async getSharedWidgets(userId, limitCount = 30) {
    // This is now handled by getAccessibleWidgets
    const widgets = await this.getAccessibleWidgets(userId, limitCount);
    return widgets.filter(widget => !widget.isOwner);
  }

  async toggleWidgetActive(widgetId, isActive) {
    return await this.updateWidget(widgetId, { isActive });
  }

  async updateWidgetPosition(widgetId, position) {
    return await this.updateWidget(widgetId, { position });
  }

  async updateWidgetData(widgetId, data) {
    return await this.updateWidget(widgetId, { 
      data, 
      lastDataUpdate: serverTimestamp() 
    });
  }

  async getUserWidgetStats(userId) {
    try {
      const widgets = await this.getAccessibleWidgets(userId, 1000);
      
      const totalWidgets = widgets.length;
      const ownedWidgets = widgets.filter(w => w.isOwner).length;
      const sharedWidgets = widgets.filter(w => !w.isOwner).length;
      const activeWidgets = widgets.filter(w => w.isActive).length;
      
      const typeStats = {};
      widgets.forEach(widget => {
        typeStats[widget.type] = (typeStats[widget.type] || 0) + 1;
      });

      return {
        totalWidgets,
        ownedWidgets,
        sharedWidgets,
        activeWidgets,
        typeStats,
        mostUsedType: Object.keys(typeStats).reduce((a, b) => 
          typeStats[a] > typeStats[b] ? a : b, 'none')
      };
    } catch (error) {
      console.error('Error getting widget stats:', error);
      throw new Error(`Failed to get widget stats: ${error.message}`);
    }
  }
}

export default new WidgetsService();