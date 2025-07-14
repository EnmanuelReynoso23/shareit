import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import authService from '../../services/authService';

// Async thunks for auth operations
export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const result = await authService.login(email, password);
      return result;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const registerUser = createAsyncThunk(
  'auth/registerUser',
  async ({ email, password, userData }, { rejectWithValue }) => {
    try {
      const result = await authService.register(email, password, userData);
      return result;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const logoutUser = createAsyncThunk(
  'auth/logoutUser',
  async (_, { rejectWithValue }) => {
    try {
      const result = await authService.logout();
      return result;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const resetPassword = createAsyncThunk(
  'auth/resetPassword',
  async (email, { rejectWithValue }) => {
    try {
      const result = await authService.resetPassword(email);
      return result;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const changePassword = createAsyncThunk(
  'auth/changePassword',
  async ({ currentPassword, newPassword }, { rejectWithValue }) => {
    try {
      const result = await authService.changePassword(currentPassword, newPassword);
      return result;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateUserProfile = createAsyncThunk(
  'auth/updateUserProfile',
  async (updates, { rejectWithValue }) => {
    try {
      const result = await authService.updateProfile(updates);
      return result;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const resendEmailVerification = createAsyncThunk(
  'auth/resendEmailVerification',
  async (_, { rejectWithValue }) => {
    try {
      const result = await authService.resendEmailVerification();
      return result;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  user: null,
  profile: null,
  isAuthenticated: false,
  loading: false,
  error: null,
  message: null,
  emailVerificationSent: false,
  passwordResetSent: false,
  authStateChecked: false
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setAuthState: (state, action) => {
      const { user, profile, isAuthenticated } = action.payload;
      state.user = user;
      state.profile = profile;
      state.isAuthenticated = isAuthenticated;
      state.authStateChecked = true;
      state.loading = false;
      state.error = null;
    },
    clearAuthState: (state) => {
      state.user = null;
      state.profile = null;
      state.isAuthenticated = false;
      state.loading = false;
      state.error = null;
      state.message = null;
      state.emailVerificationSent = false;
      state.passwordResetSent = false;
      state.authStateChecked = true;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
      state.loading = false;
    },
    clearError: (state) => {
      state.error = null;
    },
    setMessage: (state, action) => {
      state.message = action.payload;
    },
    clearMessage: (state) => {
      state.message = null;
    },
    updateProfile: (state, action) => {
      // With immer, we can mutate the state directly
      if (state.profile) {
        Object.assign(state.profile, action.payload);
      }
      if (state.user) {
        Object.assign(state.user, action.payload);
      }
    }
  },
  extraReducers: (builder) => {
    // Login user
    builder
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.message = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.profile = action.payload.profile;
        state.isAuthenticated = true;
        state.message = action.payload.message;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.isAuthenticated = false;
        state.user = null;
        state.profile = null;
      });

    // Register user
    builder
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.message = null;
        state.emailVerificationSent = false;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.profile = action.payload.profile;
        state.isAuthenticated = true;
        state.message = action.payload.message;
        state.emailVerificationSent = true;
        state.error = null;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.emailVerificationSent = false;
      });

    // Logout user
    builder
      .addCase(logoutUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.loading = false;
        state.user = null;
        state.profile = null;
        state.isAuthenticated = false;
        state.message = 'Logged out successfully';
        state.error = null;
        state.emailVerificationSent = false;
        state.passwordResetSent = false;
      })
      .addCase(logoutUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Reset password
    builder
      .addCase(resetPassword.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.passwordResetSent = false;
      })
      .addCase(resetPassword.fulfilled, (state, action) => {
        state.loading = false;
        state.message = action.payload.message;
        state.passwordResetSent = true;
        state.error = null;
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.passwordResetSent = false;
      });

    // Change password
    builder
      .addCase(changePassword.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(changePassword.fulfilled, (state, action) => {
        state.loading = false;
        state.message = action.payload.message;
        state.error = null;
      })
      .addCase(changePassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Update user profile
    builder
      .addCase(updateUserProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.profile = action.payload.profile;
        state.message = action.payload.message;
        state.error = null;
      })
      .addCase(updateUserProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Resend email verification
    builder
      .addCase(resendEmailVerification.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(resendEmailVerification.fulfilled, (state, action) => {
        state.loading = false;
        state.message = action.payload.message;
        state.emailVerificationSent = true;
        state.error = null;
      })
      .addCase(resendEmailVerification.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const {
  setAuthState,
  clearAuthState,
  setLoading,
  setError,
  clearError,
  setMessage,
  clearMessage,
  updateProfile
} = authSlice.actions;

// Selectors
export const selectAuth = (state) => state.auth;
export const selectUser = (state) => state.auth.user;
export const selectProfile = (state) => state.auth.profile;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectAuthLoading = (state) => state.auth.loading;
export const selectAuthError = (state) => state.auth.error;
export const selectAuthMessage = (state) => state.auth.message;
export const selectEmailVerificationSent = (state) => state.auth.emailVerificationSent;
export const selectPasswordResetSent = (state) => state.auth.passwordResetSent;
export const selectAuthStateChecked = (state) => state.auth.authStateChecked;

export default authSlice.reducer;
