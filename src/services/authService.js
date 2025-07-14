import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  updatePassword,
  updateEmail,
  updateProfile,
  deleteUser,
  reauthenticateWithCredential,
  EmailAuthProvider,
  onAuthStateChanged
} from 'firebase/auth';
import { auth } from '../../config/firebase';
import userService from './userService';

class AuthService {
  constructor() {
    this.currentUser = null;
    this.authStateSubscription = null;
    this.tokenRefreshInterval = null;
    this.isRefreshingToken = false;
    this.tokenRefreshListeners = [];
    this.TOKEN_REFRESH_INTERVAL = 50 * 60 * 1000; // 50 minutes
    this.TOKEN_EXPIRY_BUFFER = 5 * 60 * 1000; // 5 minutes buffer
  }

  // Initialize token refresh monitoring
  initializeTokenRefresh() {
    const user = auth.currentUser;
    if (!user) return;

    // Clear existing interval
    this.stopTokenRefresh();

    // Set up periodic token refresh
    this.tokenRefreshInterval = setInterval(() => {
      this.checkAndRefreshToken();
    }, this.TOKEN_REFRESH_INTERVAL);

    console.log('🔄 Token refresh monitoring initialized');
  }

  // Stop token refresh monitoring
  stopTokenRefresh() {
    if (this.tokenRefreshInterval) {
      clearInterval(this.tokenRefreshInterval);
      this.tokenRefreshInterval = null;
      console.log('⏹️ Token refresh monitoring stopped');
    }
  }

  // Check if token needs refresh and refresh if necessary
  async checkAndRefreshToken() {
    try {
      const user = auth.currentUser;
      if (!user) return false;

      // Get the current token result
      const tokenResult = await user.getIdTokenResult();
      const now = new Date();
      const expirationTime = new Date(tokenResult.expirationTime);
      const timeUntilExpiry = expirationTime.getTime() - now.getTime();

      // Refresh token if it expires within the buffer time
      if (timeUntilExpiry <= this.TOKEN_EXPIRY_BUFFER) {
        console.log('🔄 Token expiring soon, refreshing...');
        return await this.refreshTokenSilently();
      }

      return true;
    } catch (error) {
      console.error('Error checking token expiry:', error);
      return false;
    }
  }

  // Refresh token silently
  async refreshTokenSilently(forceRefresh = true) {
    if (this.isRefreshingToken) {
      // If already refreshing, wait for completion
      return new Promise((resolve, reject) => {
        this.tokenRefreshListeners.push({ resolve, reject });
      });
    }

    try {
      this.isRefreshingToken = true;
      const user = auth.currentUser;
      
      if (!user) {
        throw new Error('No authenticated user');
      }

      console.log('🔄 Refreshing authentication token...');
      
      // Force refresh the token
      const newToken = await user.getIdToken(forceRefresh);
      
      // Notify all waiting listeners
      this.tokenRefreshListeners.forEach(listener => {
        listener.resolve(newToken);
      });
      this.tokenRefreshListeners = [];

      console.log('✅ Token refreshed successfully');
      return newToken;
    } catch (error) {
      console.error('❌ Failed to refresh token:', error);
      
      // Notify all waiting listeners of the error
      this.tokenRefreshListeners.forEach(listener => {
        listener.reject(error);
      });
      this.tokenRefreshListeners = [];

      // Handle token refresh failure
      await this.handleTokenRefreshFailure(error);
      throw error;
    } finally {
      this.isRefreshingToken = false;
    }
  }

  // Handle token refresh failure
  async handleTokenRefreshFailure(error) {
    console.warn('Token refresh failed:', error.message);
    
    // Check if the error indicates the user needs to re-authenticate
    if (this.isReauthenticationRequired(error)) {
      console.log('🚪 Re-authentication required, logging out user');
      try {
        await this.logout();
      } catch (logoutError) {
        console.error('Error during forced logout:', logoutError);
      }
    }
  }

  // Check if error requires re-authentication
  isReauthenticationRequired(error) {
    const reauthCodes = [
      'auth/user-token-expired',
      'auth/invalid-user-token',
      'auth/user-disabled',
      'auth/user-not-found',
      'auth/token-expired'
    ];
    
    return reauthCodes.includes(error.code);
  }

  // Get valid token (with automatic refresh if needed)
  async getValidToken() {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('No authenticated user');
      }

      // Check if token needs refresh
      const needsRefresh = await this.checkAndRefreshToken();
      
      // Get the token (force refresh if needed)
      return await user.getIdToken(!needsRefresh);
    } catch (error) {
      console.error('Error getting valid token:', error);
      throw error;
    }
  }

  // Enhanced method to make authenticated requests with automatic token refresh
  async makeAuthenticatedRequest(requestFunction) {
    try {
      const token = await this.getValidToken();
      return await requestFunction(token);
    } catch (error) {
      // If token error, try refreshing once more
      if (this.isTokenError(error)) {
        console.log('🔄 Token error detected, attempting refresh...');
        try {
          const newToken = await this.refreshTokenSilently(true);
          return await requestFunction(newToken);
        } catch (refreshError) {
          console.error('Failed to recover from token error:', refreshError);
          throw refreshError;
        }
      }
      throw error;
    }
  }

  // Check if error is token-related
  isTokenError(error) {
    const tokenErrorCodes = [
      'auth/id-token-expired',
      'auth/id-token-revoked',
      'auth/invalid-id-token',
      'auth/user-token-expired'
    ];
    
    return tokenErrorCodes.includes(error.code) ||
           error.message?.toLowerCase().includes('token') ||
           error.status === 401;
  }

  // Register new user
  async register(email, password, userData = {}) {
    try {
      // Validate input
      this.validateEmail(email);
      this.validatePassword(password);

      // Create user with Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Update profile with display name if provided
      if (userData.displayName) {
        await updateProfile(user, {
          displayName: userData.displayName
        });
      }

      // Send email verification
      await sendEmailVerification(user);

      // Create user profile in Firestore
      const userProfile = await userService.createUserProfile(user.uid, {
        email: user.email,
        displayName: userData.displayName || '',
        photoURL: user.photoURL,
        ...userData
      });

      return {
        success: true,
        user: {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          emailVerified: user.emailVerified
        },
        profile: userProfile,
        message: 'Account created successfully. Please verify your email.'
      };
    } catch (error) {
      console.error('Error registering user:', error);
      throw new Error(this.getAuthErrorMessage(error.code));
    }
  }

  // Login user
  async login(email, password) {
    try {
      this.validateEmail(email);
      
      if (!password) {
        throw new Error('Password is required');
      }

      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Initialize token refresh monitoring
      this.initializeTokenRefresh();

      // Update last active
      await userService.updateLastActive(user.uid);

      // Get user profile from Firestore
      let userProfile = null;
      try {
        userProfile = await userService.getUserProfile(user.uid);
      } catch (error) {
        // Create profile if it doesn't exist
        userProfile = await userService.createUserProfile(user.uid, {
          email: user.email,
          displayName: user.displayName || '',
          photoURL: user.photoURL
        });
      }

      return {
        success: true,
        user: {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          emailVerified: user.emailVerified
        },
        profile: userProfile,
        message: 'Login successful'
      };
    } catch (error) {
      console.error('Error logging in:', error);
      throw new Error(this.getAuthErrorMessage(error.code));
    }
  }

  // Logout user
  async logout() {
    try {
      // Stop token refresh monitoring
      this.stopTokenRefresh();
      
      await signOut(auth);
      this.currentUser = null;
      
      return {
        success: true,
        message: 'Logged out successfully'
      };
    } catch (error) {
      console.error('Error logging out:', error);
      throw new Error('Failed to logout. Please try again.');
    }
  }

  // Send password reset email
  async resetPassword(email) {
    try {
      this.validateEmail(email);
      
      await sendPasswordResetEmail(auth, email);
      
      return {
        success: true,
        message: 'Password reset email sent. Please check your inbox.'
      };
    } catch (error) {
      console.error('Error sending password reset email:', error);
      throw new Error(this.getAuthErrorMessage(error.code));
    }
  }

  // Change password
  async changePassword(currentPassword, newPassword) {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('No authenticated user');
      }

      this.validatePassword(newPassword);

      // Reauthenticate user
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);

      // Update password
      await updatePassword(user, newPassword);

      return {
        success: true,
        message: 'Password updated successfully'
      };
    } catch (error) {
      console.error('Error changing password:', error);
      throw new Error(this.getAuthErrorMessage(error.code));
    }
  }

  // Change email
  async changeEmail(newEmail, currentPassword) {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('No authenticated user');
      }

      this.validateEmail(newEmail);

      // Reauthenticate user
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);

      // Update email
      await updateEmail(user, newEmail);

      // Send verification email
      await sendEmailVerification(user);

      // Update email in Firestore
      await userService.updateUserProfile(user.uid, { email: newEmail });

      return {
        success: true,
        message: 'Email updated successfully. Please verify your new email.'
      };
    } catch (error) {
      console.error('Error changing email:', error);
      throw new Error(this.getAuthErrorMessage(error.code));
    }
  }

  // Update user profile
  async updateProfile(updates) {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('No authenticated user');
      }

      // Update Firebase Auth profile
      const authUpdates = {};
      if (updates.displayName !== undefined) {
        authUpdates.displayName = updates.displayName;
      }
      if (updates.photoURL !== undefined) {
        authUpdates.photoURL = updates.photoURL;
      }

      if (Object.keys(authUpdates).length > 0) {
        await updateProfile(user, authUpdates);
      }

      // Update Firestore profile
      const updatedProfile = await userService.updateUserProfile(user.uid, updates);

      return {
        success: true,
        profile: updatedProfile,
        message: 'Profile updated successfully'
      };
    } catch (error) {
      console.error('Error updating profile:', error);
      throw new Error(`Failed to update profile: ${error.message}`);
    }
  }

  // Resend email verification
  async resendEmailVerification() {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('No authenticated user');
      }

      if (user.emailVerified) {
        throw new Error('Email is already verified');
      }

      await sendEmailVerification(user);

      return {
        success: true,
        message: 'Verification email sent. Please check your inbox.'
      };
    } catch (error) {
      console.error('Error resending email verification:', error);
      throw new Error(this.getAuthErrorMessage(error.code));
    }
  }

  // Delete user account
  async deleteAccount(password) {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('No authenticated user');
      }

      // Reauthenticate user
      const credential = EmailAuthProvider.credential(user.email, password);
      await reauthenticateWithCredential(user, credential);

      // Delete user data from Firestore
      await userService.deleteUserAccount(user.uid);

      // Delete user from Firebase Auth
      await deleteUser(user);

      this.currentUser = null;

      return {
        success: true,
        message: 'Account deleted successfully'
      };
    } catch (error) {
      console.error('Error deleting account:', error);
      throw new Error(this.getAuthErrorMessage(error.code));
    }
  }

  // Get current user
  getCurrentUser() {
    return auth.currentUser;
  }

  // Check if user is authenticated
  isAuthenticated() {
    return !!auth.currentUser;
  }

  // Setup auth state listener
  onAuthStateChanged(callback) {
    return onAuthStateChanged(auth, async (user) => {
      if (user) {
        this.currentUser = user;
        
        // Get user profile from Firestore
        try {
          const userProfile = await userService.getUserProfile(user.uid);
          callback({
            user: {
              uid: user.uid,
              email: user.email,
              displayName: user.displayName,
              photoURL: user.photoURL,
              emailVerified: user.emailVerified
            },
            profile: userProfile,
            isAuthenticated: true
          });
        } catch (error) {
          console.warn('Could not fetch user profile:', error);
          callback({
            user: {
              uid: user.uid,
              email: user.email,
              displayName: user.displayName,
              photoURL: user.photoURL,
              emailVerified: user.emailVerified
            },
            profile: null,
            isAuthenticated: true
          });
        }
      } else {
        this.currentUser = null;
        callback({
          user: null,
          profile: null,
          isAuthenticated: false
        });
      }
    });
  }

  // Validate email format
  validateEmail(email) {
    if (!email) {
      throw new Error('Email is required');
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Please enter a valid email address');
    }
    
    return true;
  }

  // Validate password strength
  validatePassword(password) {
    if (!password) {
      throw new Error('Password is required');
    }
    
    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters long');
    }
    
    // Check for at least one letter and one number
    const hasLetter = /[a-zA-Z]/.test(password);
    const hasNumber = /\d/.test(password);
    
    if (!hasLetter || !hasNumber) {
      throw new Error('Password must contain at least one letter and one number');
    }
    
    return true;
  }

  // Get user-friendly auth error messages
  getAuthErrorMessage(errorCode) {
    const errorMessages = {
      'auth/user-not-found': 'No account found with this email address',
      'auth/wrong-password': 'Incorrect password',
      'auth/email-already-in-use': 'An account with this email already exists',
      'auth/weak-password': 'Password is too weak. Please choose a stronger password',
      'auth/invalid-email': 'Please enter a valid email address',
      'auth/user-disabled': 'This account has been disabled',
      'auth/too-many-requests': 'Too many failed attempts. Please try again later',
      'auth/network-request-failed': 'Network error. Please check your connection',
      'auth/requires-recent-login': 'Please log out and log back in to perform this action',
      'auth/invalid-credential': 'Invalid credentials provided',
      'auth/credential-already-in-use': 'This credential is already associated with another account'
    };

    return errorMessages[errorCode] || 'An unexpected error occurred. Please try again.';
  }

  // Check password strength
  checkPasswordStrength(password) {
    let strength = 0;
    let feedback = [];

    if (password.length >= 8) strength += 1;
    else feedback.push('Use at least 8 characters');

    if (/[a-z]/.test(password)) strength += 1;
    else feedback.push('Include lowercase letters');

    if (/[A-Z]/.test(password)) strength += 1;
    else feedback.push('Include uppercase letters');

    if (/\d/.test(password)) strength += 1;
    else feedback.push('Include numbers');

    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength += 1;
    else feedback.push('Include special characters');

    const levels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
    
    return {
      score: strength,
      level: levels[strength] || 'Very Weak',
      feedback: feedback
    };
  }
}

export default new AuthService();