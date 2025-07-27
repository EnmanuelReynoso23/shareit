import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import authService from '../../services/authService';
import { User, AuthState } from '../../types';

// Types for async thunk arguments
interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterData {
  email: string;
  password: string;
  userData: {
    displayName?: string;
    firstName?: string;
    lastName?: string;
  };
}

interface PasswordChangeData {
  currentPassword: string;
  newPassword: string;
}

interface ProfileUpdateData {
  displayName?: string;
  photoURL?: string;
  firstName?: string;
  lastName?: string;
}

// Async thunks for auth operations
export const loginUser = createAsyncThunk<
  User,
  LoginCredentials,
  { rejectValue: string }
>(
  'auth/loginUser',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const result = await authService.login(email, password);
      return result.user || result;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Login failed');
    }
  }
);

export const registerUser = createAsyncThunk<
  User,
  RegisterData,
  { rejectValue: string }
>(
  'auth/registerUser',
  async ({ email, password, userData }, { rejectWithValue }) => {
    try {
      const result = await authService.register(email, password, userData);
      return result.user || result;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Registration failed');
    }
  }
);

export const logoutUser = createAsyncThunk<
  void,
  void,
  { rejectValue: string }
>(
  'auth/logoutUser',
  async (_, { rejectWithValue }) => {
    try {
      await authService.logout();
      return;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Logout failed');
    }
  }
);

export const resetPassword = createAsyncThunk<
  void,
  string,
  { rejectValue: string }
>(
  'auth/resetPassword',
  async (email, { rejectWithValue }) => {
    try {
      await authService.resetPassword(email);
      return;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Password reset failed');
    }
  }
);

export const changePassword = createAsyncThunk<
  void,
  PasswordChangeData,
  { rejectValue: string }
>(
  'auth/changePassword',
  async ({ currentPassword, newPassword }, { rejectWithValue }) => {
    try {
      await authService.changePassword(currentPassword, newPassword);
      return;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Password change failed');
    }
  }
);

export const updateUserProfile = createAsyncThunk<
  User,
  ProfileUpdateData,
  { rejectValue: string }
>(
  'auth/updateUserProfile',
  async (updates, { rejectWithValue }) => {
    try {
      const result = await authService.updateProfile(updates);
      return result.profile || result;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Profile update failed');
    }
  }
);

export const resendEmailVerification = createAsyncThunk<
  void,
  void,
  { rejectValue: string }
>(
  'auth/resendEmailVerification',
  async (_, { rejectWithValue }) => {
    try {
      await authService.resendEmailVerification();
      return;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Email verification failed');
    }
  }
);

const initialState: AuthState & {
  profile: User | null;
  message: string | null;
  emailVerificationSent: boolean;
  passwordResetSent: boolean;
  authStateChecked: boolean;
} = {
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
    setAuthState: (state, action: PayloadAction<{
      user: User | null;
      profile: User | null;
      isAuthenticated: boolean;
    }>) => {
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
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    clearMessage: (state) => {
      state.message = null;
    },
    setUser: (state, action: PayloadAction<User | null>) => {
      state.user = action.payload;
      state.profile = action.payload;
      state.isAuthenticated = !!action.payload;
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
        state.user = action.payload;
        state.profile = action.payload;
        state.isAuthenticated = true;
        state.error = null;
        state.message = 'Login successful';
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || 'Login failed';
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
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.profile = action.payload;
        state.isAuthenticated = true;
        state.error = null;
        state.message = 'Registration successful';
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || 'Registration failed';
        state.isAuthenticated = false;
        state.user = null;
        state.profile = null;
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
        state.error = null;
        state.message = 'Logout successful';
        state.emailVerificationSent = false;
        state.passwordResetSent = false;
      })
      .addCase(logoutUser.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || 'Logout failed';
      });

    // Reset password
    builder
      .addCase(resetPassword.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.passwordResetSent = false;
      })
      .addCase(resetPassword.fulfilled, (state) => {
        state.loading = false;
        state.passwordResetSent = true;
        state.error = null;
        state.message = 'Password reset email sent';
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || 'Password reset failed';
        state.passwordResetSent = false;
      });

    // Change password
    builder
      .addCase(changePassword.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(changePassword.fulfilled, (state) => {
        state.loading = false;
        state.error = null;
        state.message = 'Password changed successfully';
      })
      .addCase(changePassword.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || 'Password change failed';
      });

    // Update profile
    builder
      .addCase(updateUserProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.profile = action.payload;
        state.error = null;
        state.message = 'Profile updated successfully';
      })
      .addCase(updateUserProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || 'Profile update failed';
      });

    // Resend email verification
    builder
      .addCase(resendEmailVerification.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.emailVerificationSent = false;
      })
      .addCase(resendEmailVerification.fulfilled, (state) => {
        state.loading = false;
        state.emailVerificationSent = true;
        state.error = null;
        state.message = 'Verification email sent';
      })
      .addCase(resendEmailVerification.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || 'Email verification failed';
        state.emailVerificationSent = false;
      });
  }
});

export const {
  setAuthState,
  clearAuthState,
  setLoading,
  clearError,
  clearMessage,
  setUser
} = authSlice.actions;

export default authSlice.reducer;