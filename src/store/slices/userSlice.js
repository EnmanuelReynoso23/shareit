import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  profile: null,
  preferences: {
    theme: 'light',
    notifications: true,
    language: 'es',
  },
  loading: false,
  error: null,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setProfile: (state, action) => {
      state.profile = action.payload;
      state.loading = false;
      state.error = null;
    },
    updateProfile: (state, action) => {
      state.profile = { ...state.profile, ...action.payload };
    },
    setPreferences: (state, action) => {
      state.preferences = { ...state.preferences, ...action.payload };
    },
    clearProfile: (state) => {
      state.profile = null;
      state.preferences = initialState.preferences;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
      state.loading = false;
    },
  },
});

export const { 
  setProfile, 
  updateProfile, 
  setPreferences, 
  clearProfile, 
  setLoading, 
  setError 
} = userSlice.actions;

export default userSlice.reducer;
