const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

// Import function modules
const userTriggers = require('./src/userTriggers');
const photoProcessing = require('./src/photoProcessing');
const notifications = require('./src/notifications');
const friendsManager = require('./src/friendsManager');
const widgetsManager = require('./src/widgetsManager');

// Export all functions
module.exports = {
  // User triggers
  createUserProfile: userTriggers.createUserProfile,
  deleteUserData: userTriggers.deleteUserData,
  
  // Photo processing
  generateThumbnail: photoProcessing.generateThumbnail,
  processPhotoUpload: photoProcessing.processPhotoUpload,
  
  // Notifications
  sendWidgetShareNotification: notifications.sendWidgetShareNotification,
  sendFriendRequestNotification: notifications.sendFriendRequestNotification,
  sendChatNotification: notifications.sendChatNotification,
  
  // Friends management
  sendFriendRequest: friendsManager.sendFriendRequest,
  acceptFriendRequest: friendsManager.acceptFriendRequest,
  searchUsers: friendsManager.searchUsers,
  
  // Widgets management
  shareWidget: widgetsManager.shareWidget,
  updateWidgetSharing: widgetsManager.updateWidgetSharing,
  cleanupInactiveWidgets: widgetsManager.cleanupInactiveWidgets
};
