import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import photosService from '../../services/photosService';

// Async thunks for photos operations
export const uploadPhoto = createAsyncThunk(
  'photos/uploadPhoto',
  async ({ file, userId, metadata }, { rejectWithValue }) => {
    try {
      // Upload photo to storage
      const uploadResult = await photosService.uploadPhoto(file, userId, metadata);
      
      // Create photo document in Firestore
      const photoData = {
        userId,
        url: uploadResult.url,
        storagePath: uploadResult.path,
        fileName: uploadResult.fileName,
        size: uploadResult.size,
        contentType: uploadResult.contentType,
        ...metadata
      };
      
      const photo = await photosService.createPhoto(photoData);
      return photo;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchUserPhotos = createAsyncThunk(
  'photos/fetchUserPhotos',
  async ({ userId, limit = 20 }, { rejectWithValue }) => {
    try {
      const photos = await photosService.getPhotosByUser(userId, limit);
      return photos;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchSharedPhotos = createAsyncThunk(
  'photos/fetchSharedPhotos',
  async ({ userId, limit = 50 }, { rejectWithValue }) => {
    try {
      const photos = await photosService.getSharedPhotos(userId, limit);
      return photos;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchPhoto = createAsyncThunk(
  'photos/fetchPhoto',
  async (photoId, { rejectWithValue }) => {
    try {
      const photo = await photosService.getPhoto(photoId);
      return photo;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const updatePhoto = createAsyncThunk(
  'photos/updatePhoto',
  async ({ photoId, updates }, { rejectWithValue }) => {
    try {
      const updatedPhoto = await photosService.updatePhoto(photoId, updates);
      return updatedPhoto;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const sharePhoto = createAsyncThunk(
  'photos/sharePhoto',
  async ({ photoId, userIds }, { rejectWithValue }) => {
    try {
      await photosService.sharePhoto(photoId, userIds);
      return { photoId, userIds };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const toggleLikePhoto = createAsyncThunk(
  'photos/toggleLikePhoto',
  async ({ photoId, userId }, { rejectWithValue }) => {
    try {
      const result = await photosService.toggleLike(photoId, userId);
      return { photoId, ...result };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const deletePhoto = createAsyncThunk(
  'photos/deletePhoto',
  async ({ photoId, userId }, { rejectWithValue }) => {
    try {
      await photosService.deletePhoto(photoId, userId);
      return photoId;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const searchPhotos = createAsyncThunk(
  'photos/searchPhotos',
  async ({ searchTerm, userId, limit = 20 }, { rejectWithValue }) => {
    try {
      const photos = await photosService.searchPhotos(searchTerm, userId, limit);
      return photos;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchPhotoStats = createAsyncThunk(
  'photos/fetchPhotoStats',
  async (userId, { rejectWithValue }) => {
    try {
      const stats = await photosService.getUserPhotoStats(userId);
      return stats;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  photos: [],
  sharedPhotos: [],
  selectedPhoto: null,
  searchResults: [],
  stats: {
    totalPhotos: 0,
    totalLikes: 0,
    totalShared: 0,
    totalSize: 0,
    averageLikes: 0
  },
  loading: false,
  uploading: false,
  error: null,
  message: null,
  lastFetch: null,
  hasMore: true,
  realtimeListeners: {}
};

const photosSlice = createSlice({
  name: 'photos',
  initialState,
  reducers: {
    setPhotos: (state, action) => {
      state.photos = action.payload;
      state.loading = false;
      state.error = null;
      state.lastFetch = Date.now();
    },
    addPhoto: (state, action) => {
      state.photos.unshift(action.payload);
      state.stats.totalPhotos += 1;
    },
    removePhoto: (state, action) => {
      state.photos = state.photos.filter(photo => photo.id !== action.payload);
      state.stats.totalPhotos = Math.max(0, state.stats.totalPhotos - 1);
    },
    updatePhotoInList: (state, action) => {
      const { photoId, updates } = action.payload;
      const photoIndex = state.photos.findIndex(photo => photo.id === photoId);
      if (photoIndex !== -1) {
        Object.assign(state.photos[photoIndex], updates);
      }
      
      // Also update in shared photos if exists
      const sharedPhotoIndex = state.sharedPhotos.findIndex(photo => photo.id === photoId);
      if (sharedPhotoIndex !== -1) {
        Object.assign(state.sharedPhotos[sharedPhotoIndex], updates);
      }
      
      // Update selected photo if it's the same
      if (state.selectedPhoto && state.selectedPhoto.id === photoId) {
        Object.assign(state.selectedPhoto, updates);
      }
    },
    setSelectedPhoto: (state, action) => {
      state.selectedPhoto = action.payload;
    },
    clearSelectedPhoto: (state) => {
      state.selectedPhoto = null;
    },
    setSharedPhotos: (state, action) => {
      state.sharedPhotos = action.payload;
    },
    addSharedPhoto: (state, action) => {
      state.sharedPhotos.unshift(action.payload);
    },
    setSearchResults: (state, action) => {
      state.searchResults = action.payload;
    },
    clearSearchResults: (state) => {
      state.searchResults = [];
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setUploading: (state, action) => {
      state.uploading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
      state.loading = false;
      state.uploading = false;
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
    setStats: (state, action) => {
      state.stats = action.payload;
    },
    updateStats: (state, action) => {
      Object.assign(state.stats, action.payload);
    },
    setHasMore: (state, action) => {
      state.hasMore = action.payload;
    },
    setRealtimeListener: (state, action) => {
      const { type, listener } = action.payload;
      state.realtimeListeners[type] = listener;
    },
    removeRealtimeListener: (state, action) => {
      const type = action.payload;
      delete state.realtimeListeners[type];
    },
    clearAllListeners: (state) => {
      // Unsubscribe from all listeners
      Object.values(state.realtimeListeners).forEach(unsubscribe => {
        if (typeof unsubscribe === 'function') {
          unsubscribe();
        }
      });
      state.realtimeListeners = {};
    }
  },
  extraReducers: (builder) => {
    // Upload photo
    builder
      .addCase(uploadPhoto.pending, (state) => {
        state.uploading = true;
        state.error = null;
        state.message = null;
      })
      .addCase(uploadPhoto.fulfilled, (state, action) => {
        state.uploading = false;
        state.photos.unshift(action.payload);
        state.stats.totalPhotos += 1;
        state.message = 'Photo uploaded successfully';
        state.error = null;
      })
      .addCase(uploadPhoto.rejected, (state, action) => {
        state.uploading = false;
        state.error = action.payload;
      });

    // Fetch user photos
    builder
      .addCase(fetchUserPhotos.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserPhotos.fulfilled, (state, action) => {
        state.loading = false;
        state.photos = action.payload;
        state.hasMore = action.payload.length >= 20;
        state.lastFetch = Date.now();
        state.error = null;
      })
      .addCase(fetchUserPhotos.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Fetch shared photos
    builder
      .addCase(fetchSharedPhotos.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSharedPhotos.fulfilled, (state, action) => {
        state.loading = false;
        state.sharedPhotos = action.payload;
        state.error = null;
      })
      .addCase(fetchSharedPhotos.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Fetch single photo
    builder
      .addCase(fetchPhoto.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPhoto.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedPhoto = action.payload;
        state.error = null;
      })
      .addCase(fetchPhoto.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Update photo
    builder
      .addCase(updatePhoto.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updatePhoto.fulfilled, (state, action) => {
        state.loading = false;
        const { id, ...updates } = action.payload;
        
        // Update in photos array
        const photoIndex = state.photos.findIndex(photo => photo.id === id);
        if (photoIndex !== -1) {
          state.photos[photoIndex] = { ...state.photos[photoIndex], ...updates };
        }
        
        // Update selected photo if it's the same
        if (state.selectedPhoto && state.selectedPhoto.id === id) {
          state.selectedPhoto = { ...state.selectedPhoto, ...updates };
        }
        
        state.message = 'Photo updated successfully';
        state.error = null;
      })
      .addCase(updatePhoto.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Share photo
    builder
      .addCase(sharePhoto.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(sharePhoto.fulfilled, (state, action) => {
        state.loading = false;
        const { photoId, userIds } = action.payload;
        
        // Update photo sharing status
        const photoIndex = state.photos.findIndex(photo => photo.id === photoId);
        if (photoIndex !== -1) {
          state.photos[photoIndex].shared = true;
          state.photos[photoIndex].sharedWith = userIds;
        }
        
        state.message = 'Photo shared successfully';
        state.error = null;
      })
      .addCase(sharePhoto.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Toggle like photo
    builder
      .addCase(toggleLikePhoto.pending, (state) => {
        state.error = null;
      })
      .addCase(toggleLikePhoto.fulfilled, (state, action) => {
        const { photoId, liked, totalLikes } = action.payload;
        
        // Update in photos array
        const photoIndex = state.photos.findIndex(photo => photo.id === photoId);
        if (photoIndex !== -1) {
          state.photos[photoIndex].likes = totalLikes;
        }
        
        // Update in shared photos array
        const sharedPhotoIndex = state.sharedPhotos.findIndex(photo => photo.id === photoId);
        if (sharedPhotoIndex !== -1) {
          state.sharedPhotos[sharedPhotoIndex].likes = totalLikes;
        }
        
        // Update selected photo
        if (state.selectedPhoto && state.selectedPhoto.id === photoId) {
          state.selectedPhoto.likes = totalLikes;
        }
        
        state.error = null;
      })
      .addCase(toggleLikePhoto.rejected, (state, action) => {
        state.error = action.payload;
      });

    // Delete photo
    builder
      .addCase(deletePhoto.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deletePhoto.fulfilled, (state, action) => {
        state.loading = false;
        const photoId = action.payload;
        state.photos = state.photos.filter(photo => photo.id !== photoId);
        state.stats.totalPhotos = Math.max(0, state.stats.totalPhotos - 1);
        
        // Clear selected photo if it was deleted
        if (state.selectedPhoto && state.selectedPhoto.id === photoId) {
          state.selectedPhoto = null;
        }
        
        state.message = 'Photo deleted successfully';
        state.error = null;
      })
      .addCase(deletePhoto.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Search photos
    builder
      .addCase(searchPhotos.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(searchPhotos.fulfilled, (state, action) => {
        state.loading = false;
        state.searchResults = action.payload;
        state.error = null;
      })
      .addCase(searchPhotos.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Fetch photo stats
    builder
      .addCase(fetchPhotoStats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPhotoStats.fulfilled, (state, action) => {
        state.loading = false;
        state.stats = action.payload;
        state.error = null;
      })
      .addCase(fetchPhotoStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const {
  setPhotos,
  addPhoto,
  removePhoto,
  updatePhotoInList,
  setSelectedPhoto,
  clearSelectedPhoto,
  setSharedPhotos,
  addSharedPhoto,
  setSearchResults,
  clearSearchResults,
  setLoading,
  setUploading,
  setError,
  clearError,
  setMessage,
  clearMessage,
  setStats,
  updateStats,
  setHasMore,
  setRealtimeListener,
  removeRealtimeListener,
  clearAllListeners
} = photosSlice.actions;

// Selectors
export const selectPhotos = (state) => state.photos.photos;
export const selectSharedPhotos = (state) => state.photos.sharedPhotos;
export const selectSelectedPhoto = (state) => state.photos.selectedPhoto;
export const selectSearchResults = (state) => state.photos.searchResults;
export const selectPhotosLoading = (state) => state.photos.loading;
export const selectPhotosUploading = (state) => state.photos.uploading;
export const selectPhotosError = (state) => state.photos.error;
export const selectPhotosMessage = (state) => state.photos.message;
export const selectPhotosStats = (state) => state.photos.stats;
export const selectHasMorePhotos = (state) => state.photos.hasMore;
export const selectLastFetch = (state) => state.photos.lastFetch;

export default photosSlice.reducer;
