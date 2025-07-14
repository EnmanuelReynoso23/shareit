import { 
  collection, 
  doc, 
  getDoc, 
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
  runTransaction
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import widgetPermissions from './widgetPermissions';

class WidgetCollaborationService {
  constructor() {
    this.sessionsCollection = 'collaborationSessions';
    this.changesCollection = 'widgetChanges';
    this.conflictsCollection = 'editConflicts';
  }

  // Collaboration session states
  static SESSION_STATES = {
    ACTIVE: 'active',
    INACTIVE: 'inactive',
    ENDED: 'ended'
  };

  // Change types
  static CHANGE_TYPES = {
    CREATE: 'create',
    UPDATE: 'update',
    DELETE: 'delete',
    SETTINGS: 'settings',
    DATA: 'data'
  };

  // Conflict resolution strategies
  static CONFLICT_RESOLUTION = {
    LAST_WRITE_WINS: 'last_write_wins',
    MANUAL_RESOLVE: 'manual_resolve',
    MERGE: 'merge'
  };

  // Start collaboration session
  async startCollaborationSession(widgetId, userId) {
    try {
      // Check if user has edit permissions
      const hasEditPermission = await widgetPermissions.hasPermission(widgetId, userId, 'edit');
      if (!hasEditPermission) {
        throw new Error('Insufficient permissions to collaborate on this widget');
      }

      const sessionId = `${widgetId}_${Date.now()}`;
      const sessionData = {
        id: sessionId,
        widgetId,
        initiatedBy: userId,
        participants: [userId],
        activeParticipants: [userId],
        state: WidgetCollaborationService.SESSION_STATES.ACTIVE,
        startedAt: serverTimestamp(),
        lastActivity: serverTimestamp(),
        settings: {
          conflictResolution: WidgetCollaborationService.CONFLICT_RESOLUTION.LAST_WRITE_WINS,
          autoSave: true,
          saveInterval: 5000, // 5 seconds
          maxParticipants: 10
        }
      };

      await setDoc(doc(db, this.sessionsCollection, sessionId), sessionData);
      
      return {
        success: true,
        sessionId,
        session: sessionData
      };
    } catch (error) {
      console.error('Error starting collaboration session:', error);
      throw new Error(`Failed to start collaboration session: ${error.message}`);
    }
  }

  // Join collaboration session
  async joinCollaborationSession(sessionId, userId) {
    try {
      const sessionRef = doc(db, this.sessionsCollection, sessionId);
      const sessionSnap = await getDoc(sessionRef);
      
      if (!sessionSnap.exists()) {
        throw new Error('Collaboration session not found');
      }

      const sessionData = sessionSnap.data();
      
      // Check widget permissions
      const hasEditPermission = await widgetPermissions.hasPermission(
        sessionData.widgetId, 
        userId, 
        'edit'
      );
      if (!hasEditPermission) {
        throw new Error('Insufficient permissions to join this collaboration session');
      }

      // Check if session is active
      if (sessionData.state !== WidgetCollaborationService.SESSION_STATES.ACTIVE) {
        throw new Error('Collaboration session is not active');
      }

      // Check participant limit
      if (sessionData.activeParticipants.length >= sessionData.settings.maxParticipants) {
        throw new Error('Collaboration session is full');
      }

      // Add user to session
      await updateDoc(sessionRef, {
        participants: arrayUnion(userId),
        activeParticipants: arrayUnion(userId),
        lastActivity: serverTimestamp()
      });

      return {
        success: true,
        sessionId,
        session: {
          ...sessionData,
          participants: [...sessionData.participants, userId],
          activeParticipants: [...sessionData.activeParticipants, userId]
        }
      };
    } catch (error) {
      console.error('Error joining collaboration session:', error);
      throw new Error(`Failed to join collaboration session: ${error.message}`);
    }
  }

  // Leave collaboration session
  async leaveCollaborationSession(sessionId, userId) {
    try {
      const sessionRef = doc(db, this.sessionsCollection, sessionId);
      
      await updateDoc(sessionRef, {
        activeParticipants: arrayRemove(userId),
        lastActivity: serverTimestamp()
      });

      // Check if session should be ended (no active participants)
      const sessionSnap = await getDoc(sessionRef);
      const sessionData = sessionSnap.data();
      
      if (sessionData.activeParticipants.length <= 1) {
        await updateDoc(sessionRef, {
          state: WidgetCollaborationService.SESSION_STATES.INACTIVE,
          endedAt: serverTimestamp()
        });
      }

      return { success: true, sessionId };
    } catch (error) {
      console.error('Error leaving collaboration session:', error);
      throw new Error(`Failed to leave collaboration session: ${error.message}`);
    }
  }

  // Record widget change
  async recordWidgetChange(sessionId, widgetId, userId, changeType, changeData, previousData = null) {
    try {
      const changeId = `${sessionId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const changeRecord = {
        id: changeId,
        sessionId,
        widgetId,
        userId,
        changeType,
        changeData,
        previousData,
        timestamp: serverTimestamp(),
        applied: false,
        conflicted: false
      };

      // Check for conflicts
      const conflicts = await this.detectConflicts(widgetId, changeData, userId);
      
      if (conflicts.length > 0) {
        changeRecord.conflicted = true;
        changeRecord.conflicts = conflicts;
        
        // Handle conflict based on resolution strategy
        const session = await this.getCollaborationSession(sessionId);
        const resolution = session.settings.conflictResolution;
        
        if (resolution === WidgetCollaborationService.CONFLICT_RESOLUTION.LAST_WRITE_WINS) {
          changeRecord.applied = true;
          // Resolve conflicts automatically
          await this.resolveConflicts(conflicts, changeRecord);
        }
      } else {
        changeRecord.applied = true;
      }

      await setDoc(doc(db, this.changesCollection, changeId), changeRecord);
      
      // Update session activity
      await updateDoc(doc(db, this.sessionsCollection, sessionId), {
        lastActivity: serverTimestamp()
      });

      return {
        success: true,
        changeId,
        change: changeRecord,
        hasConflicts: conflicts.length > 0
      };
    } catch (error) {
      console.error('Error recording widget change:', error);
      throw new Error(`Failed to record widget change: ${error.message}`);
    }
  }

  // Detect edit conflicts
  async detectConflicts(widgetId, changeData, userId, timeWindow = 5000) {
    try {
      const cutoffTime = new Date(Date.now() - timeWindow);
      
      const q = query(
        collection(db, this.changesCollection),
        where('widgetId', '==', widgetId),
        where('userId', '!=', userId),
        where('timestamp', '>', cutoffTime),
        orderBy('timestamp', 'desc'),
        limit(10)
      );

      const querySnapshot = await getDocs(q);
      const conflicts = [];
      
      querySnapshot.forEach((doc) => {
        const recentChange = doc.data();
        
        // Check if changes affect the same data fields
        const conflictingFields = this.findConflictingFields(changeData, recentChange.changeData);
        
        if (conflictingFields.length > 0) {
          conflicts.push({
            conflictId: doc.id,
            conflictingUserId: recentChange.userId,
            conflictingFields,
            conflictingChange: recentChange,
            detectedAt: new Date()
          });
        }
      });

      return conflicts;
    } catch (error) {
      console.error('Error detecting conflicts:', error);
      return [];
    }
  }

  // Find conflicting fields between two changes
  findConflictingFields(change1, change2) {
    const conflicts = [];
    
    if (!change1 || !change2) return conflicts;
    
    // Compare field by field
    Object.keys(change1).forEach(field => {
      if (change2.hasOwnProperty(field) && change1[field] !== change2[field]) {
        conflicts.push({
          field,
          value1: change1[field],
          value2: change2[field]
        });
      }
    });
    
    return conflicts;
  }

  // Resolve conflicts
  async resolveConflicts(conflicts, winningChange) {
    try {
      const resolutionPromises = conflicts.map(async (conflict) => {
        const resolutionRecord = {
          conflictId: conflict.conflictId,
          widgetId: winningChange.widgetId,
          winningChangeId: winningChange.id,
          losingChangeId: conflict.conflictId,
          resolutionStrategy: WidgetCollaborationService.CONFLICT_RESOLUTION.LAST_WRITE_WINS,
          resolvedAt: serverTimestamp(),
          resolvedBy: 'system'
        };

        await setDoc(
          doc(db, this.conflictsCollection, `resolution_${conflict.conflictId}`),
          resolutionRecord
        );

        // Mark conflicting change as superseded
        await updateDoc(doc(db, this.changesCollection, conflict.conflictId), {
          superseded: true,
          supersededBy: winningChange.id,
          supersededAt: serverTimestamp()
        });
      });

      await Promise.all(resolutionPromises);
      return { success: true, resolvedConflicts: conflicts.length };
    } catch (error) {
      console.error('Error resolving conflicts:', error);
      throw new Error(`Failed to resolve conflicts: ${error.message}`);
    }
  }

  // Get collaboration session
  async getCollaborationSession(sessionId) {
    try {
      const sessionRef = doc(db, this.sessionsCollection, sessionId);
      const sessionSnap = await getDoc(sessionRef);
      
      if (sessionSnap.exists()) {
        return {
          id: sessionSnap.id,
          ...sessionSnap.data()
        };
      } else {
        throw new Error('Collaboration session not found');
      }
    } catch (error) {
      console.error('Error getting collaboration session:', error);
      throw new Error(`Failed to get collaboration session: ${error.message}`);
    }
  }

  // Get active sessions for a widget
  async getActiveSessionsForWidget(widgetId) {
    try {
      const q = query(
        collection(db, this.sessionsCollection),
        where('widgetId', '==', widgetId),
        where('state', '==', WidgetCollaborationService.SESSION_STATES.ACTIVE)
      );

      const querySnapshot = await getDocs(q);
      const sessions = [];
      
      querySnapshot.forEach((doc) => {
        sessions.push({
          id: doc.id,
          ...doc.data()
        });
      });

      return sessions;
    } catch (error) {
      console.error('Error getting active sessions:', error);
      throw new Error(`Failed to get active sessions: ${error.message}`);
    }
  }

  // Get change history for a widget
  async getWidgetChangeHistory(widgetId, limit = 50) {
    try {
      const q = query(
        collection(db, this.changesCollection),
        where('widgetId', '==', widgetId),
        orderBy('timestamp', 'desc'),
        limit(limit)
      );

      const querySnapshot = await getDocs(q);
      const changes = [];
      
      querySnapshot.forEach((doc) => {
        changes.push({
          id: doc.id,
          ...doc.data()
        });
      });

      return changes;
    } catch (error) {
      console.error('Error getting change history:', error);
      throw new Error(`Failed to get change history: ${error.message}`);
    }
  }

  // Real-time listener for collaboration session
  subscribeToCollaborationSession(sessionId, callback) {
    const sessionRef = doc(db, this.sessionsCollection, sessionId);
    
    return onSnapshot(sessionRef, (doc) => {
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

  // Real-time listener for widget changes
  subscribeToWidgetChanges(widgetId, callback, sinceTimestamp = null) {
    let q = query(
      collection(db, this.changesCollection),
      where('widgetId', '==', widgetId),
      where('applied', '==', true),
      orderBy('timestamp', 'desc')
    );

    if (sinceTimestamp) {
      q = query(q, where('timestamp', '>', sinceTimestamp));
    }

    return onSnapshot(q, (snapshot) => {
      const changes = [];
      snapshot.forEach((doc) => {
        changes.push({
          id: doc.id,
          ...doc.data()
        });
      });
      callback(changes);
    });
  }

  // Synchronize widget state
  async synchronizeWidgetState(widgetId, localState, userId) {
    try {
      return await runTransaction(db, async (transaction) => {
        // Get latest changes
        const latestChanges = await this.getWidgetChangeHistory(widgetId, 10);
        
        // Apply changes that are newer than local state
        let syncedState = { ...localState };
        let appliedChanges = [];
        
        for (const change of latestChanges) {
          if (change.applied && change.timestamp > localState.lastSyncTimestamp) {
            syncedState = this.applyChange(syncedState, change);
            appliedChanges.push(change);
          }
        }
        
        // Update sync timestamp
        syncedState.lastSyncTimestamp = new Date();
        
        return {
          success: true,
          syncedState,
          appliedChanges,
          changeCount: appliedChanges.length
        };
      });
    } catch (error) {
      console.error('Error synchronizing widget state:', error);
      throw new Error(`Failed to synchronize widget state: ${error.message}`);
    }
  }

  // Apply change to widget state
  applyChange(currentState, change) {
    const newState = { ...currentState };
    
    switch (change.changeType) {
      case WidgetCollaborationService.CHANGE_TYPES.UPDATE:
        Object.assign(newState, change.changeData);
        break;
      case WidgetCollaborationService.CHANGE_TYPES.SETTINGS:
        newState.settings = { ...newState.settings, ...change.changeData };
        break;
      case WidgetCollaborationService.CHANGE_TYPES.DATA:
        newState.data = { ...newState.data, ...change.changeData };
        break;
      default:
        console.warn(`Unknown change type: ${change.changeType}`);
    }
    
    return newState;
  }

  // Get collaboration statistics
  async getCollaborationStats(widgetId) {
    try {
      const sessions = await this.getActiveSessionsForWidget(widgetId);
      const changes = await this.getWidgetChangeHistory(widgetId, 100);
      
      const stats = {
        activeCollaborators: sessions.reduce((acc, session) => {
          return acc + session.activeParticipants.length;
        }, 0),
        totalSessions: sessions.length,
        totalChanges: changes.length,
        changesLast24h: changes.filter(change => {
          const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
          return change.timestamp > oneDayAgo;
        }).length,
        uniqueCollaborators: [...new Set(changes.map(change => change.userId))].length,
        lastActivity: changes.length > 0 ? changes[0].timestamp : null
      };
      
      return stats;
    } catch (error) {
      console.error('Error getting collaboration stats:', error);
      throw new Error(`Failed to get collaboration stats: ${error.message}`);
    }
  }

  // End collaboration session
  async endCollaborationSession(sessionId, userId) {
    try {
      const session = await this.getCollaborationSession(sessionId);
      
      // Check if user has permission to end session
      if (session.initiatedBy !== userId) {
        const hasAdminPermission = await widgetPermissions.hasPermission(
          session.widgetId, 
          userId, 
          'admin'
        );
        if (!hasAdminPermission) {
          throw new Error('Insufficient permissions to end collaboration session');
        }
      }

      await updateDoc(doc(db, this.sessionsCollection, sessionId), {
        state: WidgetCollaborationService.SESSION_STATES.ENDED,
        endedAt: serverTimestamp(),
        endedBy: userId
      });

      return { success: true, sessionId };
    } catch (error) {
      console.error('Error ending collaboration session:', error);
      throw new Error(`Failed to end collaboration session: ${error.message}`);
    }
  }
}

export default new WidgetCollaborationService();