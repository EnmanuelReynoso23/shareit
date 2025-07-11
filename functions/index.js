/**
 * ShareIt Cloud Functions
 * Firebase backend functions for ShareIt app
 */

const {setGlobalOptions} = require("firebase-functions");
const {initializeApp} = require("firebase-admin/app");

// Initialize Firebase Admin
initializeApp();

// Set global options for cost control
setGlobalOptions({maxInstances: 10});

// Import function modules
const userTriggers = require("./userTriggers");
const photoProcessing = require("./photoProcessing");
const notifications = require("./notifications");
const friendsManager = require("./friendsManager");
const widgetsManager = require("./widgetsManager");

// Export all functions
module.exports = { // User triggers
  ...userTriggers,

  // Photo processing
  ...photoProcessing,

  // Notifications
  ...notifications,

  // Friends management
  ...friendsManager,

  // Widgets management
  ...widgetsManager,
};
