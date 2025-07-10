import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { updateProfile } from 'firebase/auth';
import { db, storage, auth } from '../../../config/firebase';

// Async thunks for user profile
export const createUserProfile = createAsyncThunk(
  'user/createUserProfile',
  async ({ uid, email, displayName, photoURL }, { rejectWithValue }) => {
    try {
      const userProfile = {
        uid,
        email,
        displayName: displayName || '',
        photoURL: photoURL || '',
        bio: '',
        location: '',
        joinedAt: new Date(),
        lastActive: new Date(),
        preferences: {
          notifications: {
            newFriendRequest: true,
            photoShared: true,
            widgetUpdate: true,
            friendActivity: true,
          },
          privacy: {
            profileVisible: true,
            allowFriendRequests: true,
            showLastActive: true,
          },
          theme: 'light',
        },
      };
      
      await setDoc(doc(db, 'users', uid), userProfile);
      
      return userProfile;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchUserProfile = createAsyncThunk(
  'user/fetchUserProfile',
  async ({ uid }, { rejectWithValue }) => {
    try {
      const docRef = doc(db, 'users', uid);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return docSnap.data();
      } else {
        throw new Error('User profile not found');
      }
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateUserProfile = createAsyncThunk(
  'user/updateUserProfile',
  async ({ uid, profileData }, { rejectWithValue }) => {
    try {
      const userRef = doc(db, 'users', uid);
      await updateDoc(userRef, {
        ...profileData,
        updatedAt: new Date(),
      });
      
      // Update Firebase Auth profile if displayName or photoURL changed
      if (profileData.displayName || profileData.photoURL) {
        await updateProfile(auth.currentUser, {
          displayName: profileData.displayName,
          photoURL: profileData.photoURL,
        });
      }
      
      return profileData;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const uploadProfilePhoto = createAsyncThunk(
  'user/uploadProfilePhoto',
  async ({ uid, imageUri }, { rejectWithValue }) => {
    try {
      const response = await fetch(imageUri);
      const blob = await response.blob();
      const filename = `profiles/${uid}/profile.jpg`;
      const storageRef = ref(storage, filename);
      
      await uploadBytes(storageRef, blob);
      const downloadURL = await getDownloadURL(storageRef);
      
      // Update user profile with new photo URL
      const userRef = doc(db, 'users', uid);
      await updateDoc(userRef, {
        photoURL: downloadURL,
        updatedAt: new Date(),
      });
      
      // Update Firebase Auth profile
      await updateProfile(auth.currentUser, {
        photoURL: downloadURL,
      });
      
      return downloadURL;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateUserPreferences = createAsyncThunk(
  'user/updateUserPreferences',
  async ({ uid, preferences }, { rejectWithValue }) => {
    try {
      const userRef = doc(db, 'users', uid);
      await updateDoc(userRef, {
        preferences,
        updatedAt: new Date(),
      });
      
      return preferences;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateLastActive = createAsyncThunk(
  'user/updateLastActive',
  async ({ uid }, { rejectWithValue }) => {
    try {
      const userRef = doc(db, 'users', uid);
      await updateDoc(userRef, {
        lastActive: new Date(),
      });
      
      return new Date();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const userSlice = createSlice({
  name: 'user',
  initialState: {
    profile: null,
    loading: false,
    uploading: false,
    error: null,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setProfile: (state, action) => {
      state.profile = action.payload;
    },
    updateProfileField: (state, action) => {
      const { field, value } = action.payload;
      if (state.profile) {
        state.profile[field] = value;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Create user profile
      .addCase(createUserProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createUserProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.profile = action.payload;
      })
      .addCase(createUserProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch user profile
      .addCase(fetchUserProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.profile = action.payload;
      })
      .addCase(fetchUserProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Update user profile
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        if (state.profile) {
          state.profile = { ...state.profile, ...action.payload };
        }
      })
      // Upload profile photo
      .addCase(uploadProfilePhoto.pending, (state) => {
        state.uploading = true;
        state.error = null;
      })
      .addCase(uploadProfilePhoto.fulfilled, (state, action) => {
        state.uploading = false;
        if (state.profile) {
          state.profile.photoURL = action.payload;
        }
      })
      .addCase(uploadProfilePhoto.rejected, (state, action) => {
        state.uploading = false;
        state.error = action.payload;
      })
      // Update user preferences
      .addCase(updateUserPreferences.fulfilled, (state, action) => {
        if (state.profile) {
          state.profile.preferences = action.payload;
        }
      })
      // Update last active
      .addCase(updateLastActive.fulfilled, (state, action) => {
        if (state.profile) {
          state.profile.lastActive = action.payload;
        }
      });
  },
});

export const { clearError, setProfile, updateProfileField } = userSlice.actions;
export default userSlice.reducer;
