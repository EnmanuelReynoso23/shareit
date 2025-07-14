// Central export for all services
import photosService from './photosService';
import userService from './userService';
import widgetsService from './widgetsService';
import friendsService from './friendsService';
import authService from './authService';
import widgetPermissions from './widgetPermissions';
import widgetCollaboration from './widgetCollaboration';

// Export all services
export {
  photosService,
  userService,
  widgetsService,
  friendsService,
  authService,
  widgetPermissions,
  widgetCollaboration
};

// Default export for convenience
export default {
  photos: photosService,
  user: userService,
  widgets: widgetsService,
  friends: friendsService,
  auth: authService,
  permissions: widgetPermissions,
  collaboration: widgetCollaboration
};

// Service utility functions
export const serviceUtils = {
  // Handle service errors consistently
  handleServiceError: (error, defaultMessage = 'An error occurred') => {
    console.error('Service error:', error);
    return {
      success: false,
      error: error.message || defaultMessage,
      code: error.code || 'UNKNOWN_ERROR'
    };
  },

  // Handle service success responses
  handleServiceSuccess: (data, message = 'Operation successful') => {
    return {
      success: true,
      data,
      message
    };
  },

  // Validate required fields
  validateRequiredFields: (data, requiredFields) => {
    const missingFields = [];
    
    requiredFields.forEach(field => {
      if (!data[field] || data[field] === '') {
        missingFields.push(field);
      }
    });

    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }

    return true;
  },

  // Sanitize data before saving
  sanitizeData: (data) => {
    const sanitized = { ...data };
    
    // Remove undefined values
    Object.keys(sanitized).forEach(key => {
      if (sanitized[key] === undefined) {
        delete sanitized[key];
      }
    });

    return sanitized;
  },

  // Format timestamps for display
  formatTimestamp: (timestamp) => {
    if (!timestamp) return null;
    
    // Handle Firestore timestamp
    if (timestamp.toDate) {
      return timestamp.toDate();
    }
    
    // Handle regular timestamp
    if (typeof timestamp === 'number') {
      return new Date(timestamp);
    }
    
    return new Date(timestamp);
  },

  // Retry function for failed operations
  retry: async (fn, maxRetries = 3, delay = 1000) => {
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn();
      } catch (error) {
        if (i === maxRetries - 1) throw error;
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
      }
    }
  },

  // Widget collaboration utilities
  checkWidgetAccess: async (widgetId, userId, requiredPermission = 'read') => {
    try {
      const hasPermission = await widgetPermissions.hasPermission(widgetId, userId, requiredPermission);
      if (!hasPermission) {
        throw new Error(`Insufficient permissions: ${requiredPermission} access required`);
      }
      return true;
    } catch (error) {
      throw new Error(`Access check failed: ${error.message}`);
    }
  },

  // Start widget collaboration session
  startWidgetCollaboration: async (widgetId, userId) => {
    try {
      await serviceUtils.checkWidgetAccess(widgetId, userId, 'edit');
      const session = await widgetCollaboration.startCollaborationSession(widgetId, userId);
      return session;
    } catch (error) {
      throw new Error(`Failed to start collaboration: ${error.message}`);
    }
  },

  // Share widget with multiple users and permission levels
  shareWidgetAdvanced: async (widgetId, userId, recipients) => {
    try {
      await serviceUtils.checkWidgetAccess(widgetId, userId, 'share');
      
      // Validate recipients format: [{ userId, permissionLevel }]
      serviceUtils.validateRequiredFields({ recipients }, ['recipients']);
      
      if (!Array.isArray(recipients) || recipients.length === 0) {
        throw new Error('Recipients must be a non-empty array');
      }

      // Validate each recipient
      recipients.forEach((recipient, index) => {
        serviceUtils.validateRequiredFields(recipient, ['userId', 'permissionLevel']);
        
        const validLevels = Object.keys(widgetPermissions.constructor.PERMISSION_LEVELS);
        if (!validLevels.includes(recipient.permissionLevel)) {
          throw new Error(`Invalid permission level for recipient ${index}: ${recipient.permissionLevel}`);
        }
      });

      const result = await widgetsService.shareWidgetWithPermissions(widgetId, userId, recipients);
      return result;
    } catch (error) {
      throw new Error(`Failed to share widget: ${error.message}`);
    }
  },

  // Get widget with full collaboration context
  getWidgetWithContext: async (widgetId, userId) => {
    try {
      await serviceUtils.checkWidgetAccess(widgetId, userId, 'read');
      
      const widget = await widgetsService.getWidgetWithPermissions(widgetId, userId);
      const collaborationStats = await widgetsService.getWidgetCollaborationStats(widgetId);
      
      return {
        ...widget,
        collaborationStats,
        canEdit: widget.userPermissions.includes('edit'),
        canShare: widget.userPermissions.includes('share'),
        canDelete: widget.userPermissions.includes('delete'),
        isCollaborative: widget.hasActiveCollaboration
      };
    } catch (error) {
      throw new Error(`Failed to get widget context: ${error.message}`);
    }
  },

  // Batch operations for widgets
  batchWidgetOperations: async (operations, userId) => {
    const results = [];
    const errors = [];

    for (const operation of operations) {
      try {
        let result;
        
        switch (operation.type) {
          case 'CREATE':
            result = await widgetsService.createWidget({ ...operation.data, userId });
            break;
          case 'UPDATE':
            await serviceUtils.checkWidgetAccess(operation.widgetId, userId, 'edit');
            result = await widgetsService.updateWidgetWithCollaboration(
              operation.widgetId, 
              operation.data, 
              userId,
              operation.sessionId
            );
            break;
          case 'DELETE':
            result = await widgetsService.deleteWidgetWithPermissions(operation.widgetId, userId);
            break;
          case 'SHARE':
            result = await serviceUtils.shareWidgetAdvanced(
              operation.widgetId, 
              userId, 
              operation.recipients
            );
            break;
          default:
            throw new Error(`Unknown operation type: ${operation.type}`);
        }
        
        results.push({ success: true, operation: operation.type, result });
      } catch (error) {
        errors.push({ 
          success: false, 
          operation: operation.type, 
          error: error.message,
          widgetId: operation.widgetId 
        });
      }
    }

    return {
      success: errors.length === 0,
      results,
      errors,
      totalOperations: operations.length,
      successCount: results.length,
      errorCount: errors.length
    };
  }
};

// Service initialization with collaboration support
export const initializeServices = async () => {
  try {
    console.log('🔧 Initializing ShareIt services with collaboration support...');
    
    // Initialize services if needed
    // Add any initialization logic here
    
    console.log('✅ All services initialized successfully with collaboration features');
    return { success: true };
  } catch (error) {
    console.error('❌ Error initializing services:', error);
    return { success: false, error: error.message };
  }
};

// Widget collaboration event emitter for real-time updates
export class WidgetCollaborationEvents {
  constructor() {
    this.listeners = new Map();
  }

  // Subscribe to widget collaboration events
  subscribe(widgetId, userId, callback) {
    const key = `${widgetId}_${userId}`;
    
    if (this.listeners.has(key)) {
      this.unsubscribe(widgetId, userId);
    }

    const unsubscribe = widgetsService.subscribeToCollaborativeWidget(widgetId, userId, callback);
    this.listeners.set(key, unsubscribe);
    
    console.log(`📡 Subscribed to widget collaboration: ${widgetId}`);
    return unsubscribe;
  }

  // Unsubscribe from widget collaboration events
  unsubscribe(widgetId, userId) {
    const key = `${widgetId}_${userId}`;
    const unsubscribe = this.listeners.get(key);
    
    if (unsubscribe) {
      unsubscribe();
      this.listeners.delete(key);
      console.log(`📡 Unsubscribed from widget collaboration: ${widgetId}`);
    }
  }

  // Clean up all subscriptions
  cleanup() {
    this.listeners.forEach((unsubscribe, key) => {
      unsubscribe();
    });
    this.listeners.clear();
    console.log('🧹 Cleaned up all collaboration subscriptions');
  }

  // Get active subscriptions count
  getActiveSubscriptions() {
    return this.listeners.size;
  }
}

// Export singleton instance for collaboration events
export const collaborationEvents = new WidgetCollaborationEvents();