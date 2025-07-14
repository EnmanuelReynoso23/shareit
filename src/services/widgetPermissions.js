import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  getDocs,
  serverTimestamp,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';
import { db } from '../../config/firebase';

class WidgetPermissionsService {
  constructor() {
    this.collection = 'widgetPermissions';
  }

  // Permission types
  static PERMISSIONS = {
    READ: 'read',
    EDIT: 'edit',
    SHARE: 'share',
    ADMIN: 'admin',
    DELETE: 'delete'
  };

  // Permission levels (hierarchical)
  static PERMISSION_LEVELS = {
    VIEWER: ['read'],
    EDITOR: ['read', 'edit'],
    COLLABORATOR: ['read', 'edit', 'share'],
    ADMIN: ['read', 'edit', 'share', 'admin', 'delete']
  };

  // Create permission document for a widget
  async createWidgetPermissions(widgetId, ownerId) {
    try {
      const permissionDoc = {
        widgetId,
        ownerId,
        permissions: {
          [ownerId]: {
            level: 'ADMIN',
            permissions: WidgetPermissionsService.PERMISSION_LEVELS.ADMIN,
            grantedBy: ownerId,
            grantedAt: serverTimestamp(),
            isOwner: true
          }
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await setDoc(doc(db, this.collection, widgetId), permissionDoc);
      return permissionDoc;
    } catch (error) {
      console.error('Error creating widget permissions:', error);
      throw new Error(`Failed to create widget permissions: ${error.message}`);
    }
  }

  // Grant permissions to a user
  async grantPermissions(widgetId, targetUserId, permissionLevel, grantedByUserId) {
    try {
      // Validate that granter has admin permissions
      const hasAdminPermission = await this.hasPermission(widgetId, grantedByUserId, 'admin');
      if (!hasAdminPermission) {
        throw new Error('Insufficient permissions to grant access');
      }

      // Validate permission level
      if (!WidgetPermissionsService.PERMISSION_LEVELS[permissionLevel]) {
        throw new Error(`Invalid permission level: ${permissionLevel}`);
      }

      const permissionRef = doc(db, this.collection, widgetId);
      const permissions = WidgetPermissionsService.PERMISSION_LEVELS[permissionLevel];

      const updateData = {
        [`permissions.${targetUserId}`]: {
          level: permissionLevel,
          permissions: permissions,
          grantedBy: grantedByUserId,
          grantedAt: serverTimestamp(),
          isOwner: false
        },
        updatedAt: serverTimestamp()
      };

      await updateDoc(permissionRef, updateData);

      return {
        success: true,
        widgetId,
        targetUserId,
        permissionLevel,
        permissions
      };
    } catch (error) {
      console.error('Error granting permissions:', error);
      throw new Error(`Failed to grant permissions: ${error.message}`);
    }
  }

  // Revoke permissions from a user
  async revokePermissions(widgetId, targetUserId, revokedByUserId) {
    try {
      // Validate that revoker has admin permissions
      const hasAdminPermission = await this.hasPermission(widgetId, revokedByUserId, 'admin');
      if (!hasAdminPermission) {
        throw new Error('Insufficient permissions to revoke access');
      }

      // Check if target user is the owner
      const permissionDoc = await this.getWidgetPermissions(widgetId);
      if (permissionDoc.permissions[targetUserId]?.isOwner) {
        throw new Error('Cannot revoke permissions from widget owner');
      }

      const permissionRef = doc(db, this.collection, widgetId);
      
      const updateData = {
        [`permissions.${targetUserId}`]: null,
        updatedAt: serverTimestamp()
      };

      await updateDoc(permissionRef, updateData);

      return { success: true, widgetId, targetUserId };
    } catch (error) {
      console.error('Error revoking permissions:', error);
      throw new Error(`Failed to revoke permissions: ${error.message}`);
    }
  }

  // Check if user has specific permission
  async hasPermission(widgetId, userId, permission) {
    try {
      const permissionDoc = await this.getWidgetPermissions(widgetId);
      
      if (!permissionDoc || !permissionDoc.permissions[userId]) {
        return false;
      }

      const userPermissions = permissionDoc.permissions[userId].permissions;
      return userPermissions.includes(permission);
    } catch (error) {
      console.error('Error checking permission:', error);
      return false;
    }
  }

  // Check multiple permissions at once
  async hasPermissions(widgetId, userId, requiredPermissions) {
    try {
      const permissionDoc = await this.getWidgetPermissions(widgetId);
      
      if (!permissionDoc || !permissionDoc.permissions[userId]) {
        return false;
      }

      const userPermissions = permissionDoc.permissions[userId].permissions;
      return requiredPermissions.every(permission => userPermissions.includes(permission));
    } catch (error) {
      console.error('Error checking permissions:', error);
      return false;
    }
  }

  // Get all permissions for a widget
  async getWidgetPermissions(widgetId) {
    try {
      const permissionRef = doc(db, this.collection, widgetId);
      const permissionSnap = await getDoc(permissionRef);
      
      if (permissionSnap.exists()) {
        return {
          id: permissionSnap.id,
          ...permissionSnap.data()
        };
      } else {
        return null;
      }
    } catch (error) {
      console.error('Error getting widget permissions:', error);
      throw new Error(`Failed to get widget permissions: ${error.message}`);
    }
  }

  // Get user's permission level for a widget
  async getUserPermissionLevel(widgetId, userId) {
    try {
      const permissionDoc = await this.getWidgetPermissions(widgetId);
      
      if (!permissionDoc || !permissionDoc.permissions[userId]) {
        return null;
      }

      return permissionDoc.permissions[userId];
    } catch (error) {
      console.error('Error getting user permission level:', error);
      throw new Error(`Failed to get user permission level: ${error.message}`);
    }
  }

  // Get all widgets user has permissions for
  async getUserAccessibleWidgets(userId) {
    try {
      const q = query(collection(db, this.collection));
      const querySnapshot = await getDocs(q);
      
      const accessibleWidgets = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.permissions[userId]) {
          accessibleWidgets.push({
            widgetId: doc.id,
            permissionLevel: data.permissions[userId].level,
            permissions: data.permissions[userId].permissions,
            isOwner: data.permissions[userId].isOwner || false,
            grantedBy: data.permissions[userId].grantedBy,
            grantedAt: data.permissions[userId].grantedAt
          });
        }
      });

      return accessibleWidgets;
    } catch (error) {
      console.error('Error getting user accessible widgets:', error);
      throw new Error(`Failed to get user accessible widgets: ${error.message}`);
    }
  }

  // Get all collaborators for a widget
  async getWidgetCollaborators(widgetId) {
    try {
      const permissionDoc = await this.getWidgetPermissions(widgetId);
      
      if (!permissionDoc) {
        return [];
      }

      const collaborators = [];
      Object.keys(permissionDoc.permissions).forEach(userId => {
        const permission = permissionDoc.permissions[userId];
        collaborators.push({
          userId,
          level: permission.level,
          permissions: permission.permissions,
          isOwner: permission.isOwner || false,
          grantedBy: permission.grantedBy,
          grantedAt: permission.grantedAt
        });
      });

      return collaborators;
    } catch (error) {
      console.error('Error getting widget collaborators:', error);
      throw new Error(`Failed to get widget collaborators: ${error.message}`);
    }
  }

  // Update permission level for a user
  async updatePermissionLevel(widgetId, targetUserId, newPermissionLevel, updatedByUserId) {
    try {
      // Validate that updater has admin permissions
      const hasAdminPermission = await this.hasPermission(widgetId, updatedByUserId, 'admin');
      if (!hasAdminPermission) {
        throw new Error('Insufficient permissions to update access');
      }

      // Validate permission level
      if (!WidgetPermissionsService.PERMISSION_LEVELS[newPermissionLevel]) {
        throw new Error(`Invalid permission level: ${newPermissionLevel}`);
      }

      // Check if target user is the owner
      const permissionDoc = await this.getWidgetPermissions(widgetId);
      if (permissionDoc.permissions[targetUserId]?.isOwner) {
        throw new Error('Cannot modify owner permissions');
      }

      const permissionRef = doc(db, this.collection, widgetId);
      const permissions = WidgetPermissionsService.PERMISSION_LEVELS[newPermissionLevel];

      const updateData = {
        [`permissions.${targetUserId}.level`]: newPermissionLevel,
        [`permissions.${targetUserId}.permissions`]: permissions,
        [`permissions.${targetUserId}.updatedBy`]: updatedByUserId,
        [`permissions.${targetUserId}.updatedAt`]: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await updateDoc(permissionRef, updateData);

      return {
        success: true,
        widgetId,
        targetUserId,
        newPermissionLevel,
        permissions
      };
    } catch (error) {
      console.error('Error updating permission level:', error);
      throw new Error(`Failed to update permission level: ${error.message}`);
    }
  }

  // Transfer ownership of a widget
  async transferOwnership(widgetId, newOwnerId, currentOwnerId) {
    try {
      // Validate that current user is the owner
      const permissionDoc = await this.getWidgetPermissions(widgetId);
      if (!permissionDoc.permissions[currentOwnerId]?.isOwner) {
        throw new Error('Only widget owner can transfer ownership');
      }

      const permissionRef = doc(db, this.collection, widgetId);

      const updateData = {
        // Remove owner status from current owner, make them admin
        [`permissions.${currentOwnerId}.isOwner`]: false,
        [`permissions.${currentOwnerId}.level`]: 'ADMIN',
        [`permissions.${currentOwnerId}.updatedAt`]: serverTimestamp(),
        
        // Grant ownership to new owner
        [`permissions.${newOwnerId}`]: {
          level: 'ADMIN',
          permissions: WidgetPermissionsService.PERMISSION_LEVELS.ADMIN,
          isOwner: true,
          grantedBy: currentOwnerId,
          grantedAt: serverTimestamp()
        },
        
        ownerId: newOwnerId,
        updatedAt: serverTimestamp()
      };

      await updateDoc(permissionRef, updateData);

      return { success: true, widgetId, newOwnerId, previousOwnerId: currentOwnerId };
    } catch (error) {
      console.error('Error transferring ownership:', error);
      throw new Error(`Failed to transfer ownership: ${error.message}`);
    }
  }

  // Delete widget permissions (when widget is deleted)
  async deleteWidgetPermissions(widgetId, userId) {
    try {
      // Validate that user is the owner
      const permissionDoc = await this.getWidgetPermissions(widgetId);
      if (!permissionDoc.permissions[userId]?.isOwner) {
        throw new Error('Only widget owner can delete permissions');
      }

      await deleteDoc(doc(db, this.collection, widgetId));
      return { success: true, widgetId };
    } catch (error) {
      console.error('Error deleting widget permissions:', error);
      throw new Error(`Failed to delete widget permissions: ${error.message}`);
    }
  }

  // Bulk permission operations
  async bulkGrantPermissions(widgetId, userPermissions, grantedByUserId) {
    try {
      // Validate that granter has admin permissions
      const hasAdminPermission = await this.hasPermission(widgetId, grantedByUserId, 'admin');
      if (!hasAdminPermission) {
        throw new Error('Insufficient permissions to grant access');
      }

      const permissionRef = doc(db, this.collection, widgetId);
      const updateData = { updatedAt: serverTimestamp() };

      userPermissions.forEach(({ userId, permissionLevel }) => {
        if (!WidgetPermissionsService.PERMISSION_LEVELS[permissionLevel]) {
          throw new Error(`Invalid permission level: ${permissionLevel}`);
        }

        updateData[`permissions.${userId}`] = {
          level: permissionLevel,
          permissions: WidgetPermissionsService.PERMISSION_LEVELS[permissionLevel],
          grantedBy: grantedByUserId,
          grantedAt: serverTimestamp(),
          isOwner: false
        };
      });

      await updateDoc(permissionRef, updateData);
      return { success: true, widgetId, grantedCount: userPermissions.length };
    } catch (error) {
      console.error('Error bulk granting permissions:', error);
      throw new Error(`Failed to bulk grant permissions: ${error.message}`);
    }
  }

  // Get permission audit log
  async getPermissionAuditLog(widgetId) {
    try {
      const permissionDoc = await this.getWidgetPermissions(widgetId);
      
      if (!permissionDoc) {
        return [];
      }

      const auditLog = [];
      Object.keys(permissionDoc.permissions).forEach(userId => {
        const permission = permissionDoc.permissions[userId];
        auditLog.push({
          userId,
          action: 'GRANTED',
          level: permission.level,
          grantedBy: permission.grantedBy,
          grantedAt: permission.grantedAt,
          updatedBy: permission.updatedBy,
          updatedAt: permission.updatedAt
        });
      });

      // Sort by most recent first
      auditLog.sort((a, b) => {
        const aTime = a.updatedAt || a.grantedAt;
        const bTime = b.updatedAt || b.grantedAt;
        return bTime - aTime;
      });

      return auditLog;
    } catch (error) {
      console.error('Error getting permission audit log:', error);
      throw new Error(`Failed to get permission audit log: ${error.message}`);
    }
  }
}

export default new WidgetPermissionsService();