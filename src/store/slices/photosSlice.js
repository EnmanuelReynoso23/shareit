import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  photos: [],
  loading: false,
  error: null,
  selectedPhoto: null,
};

const photosSlice = createSlice({
  name: 'photos',
  initialState,
  reducers: {
    setPhotos: (state, action) => {
      state.photos = action.payload;
      state.loading = false;
      state.error = null;
    },
    addPhoto: (state, action) => {
      state.photos.unshift(action.payload);
    },
    removePhoto: (state, action) => {
      state.photos = state.photos.filter(photo => photo.id !== action.payload);
    },
    setSelectedPhoto: (state, action) => {
      state.selectedPhoto = action.payload;
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
  setPhotos, 
  addPhoto, 
  removePhoto, 
  setSelectedPhoto, 
  setLoading, 
  setError 
} = photosSlice.actions;

export default photosSlice.reducer;
