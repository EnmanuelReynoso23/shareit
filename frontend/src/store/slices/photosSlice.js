import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  updateDoc, 
  doc,
  deleteDoc 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../../../config/firebase';

// Async thunks for photos
export const uploadPhoto = createAsyncThunk(
  'photos/uploadPhoto',
  async ({ imageUri, userId, caption, friendIds }, { rejectWithValue }) => {
    try {
      // Upload image to Firebase Storage
      const response = await fetch(imageUri);
      const blob = await response.blob();
      const filename = `photos/${userId}/${Date.now()}.jpg`;
      const storageRef = ref(storage, filename);
      
      await uploadBytes(storageRef, blob);
      const downloadURL = await getDownloadURL(storageRef);
      
      // Save photo metadata to Firestore
      const photoData = {
        userId,
        imageUrl: downloadURL,
        caption: caption || '',
        sharedWith: friendIds || [],
        createdAt: new Date(),
        likes: [],
        comments: [],
      };
      
      const docRef = await addDoc(collection(db, 'photos'), photoData);
      
      return {
        id: docRef.id,
        ...photoData,
      };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchPhotos = createAsyncThunk(
  'photos/fetchPhotos',
  async ({ userId }, { rejectWithValue }) => {
    try {
      const q = query(
        collection(db, 'photos'),
        where('sharedWith', 'array-contains', userId),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const photos = [];
      
      querySnapshot.forEach((doc) => {
        photos.push({
          id: doc.id,
          ...doc.data(),
        });
      });
      
      return photos;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const likePhoto = createAsyncThunk(
  'photos/likePhoto',
  async ({ photoId, userId }, { rejectWithValue }) => {
    try {
      const photoRef = doc(db, 'photos', photoId);
      await updateDoc(photoRef, {
        likes: [...likes, userId]
      });
      
      return { photoId, userId };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const addComment = createAsyncThunk(
  'photos/addComment',
  async ({ photoId, userId, comment }, { rejectWithValue }) => {
    try {
      const photoRef = doc(db, 'photos', photoId);
      const newComment = {
        id: Date.now().toString(),
        userId,
        comment,
        createdAt: new Date(),
      };
      
      await updateDoc(photoRef, {
        comments: [...comments, newComment]
      });
      
      return { photoId, comment: newComment };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const deletePhoto = createAsyncThunk(
  'photos/deletePhoto',
  async ({ photoId, imageUrl }, { rejectWithValue }) => {
    try {
      // Delete from Firestore
      await deleteDoc(doc(db, 'photos', photoId));
      
      // Delete from Storage
      const storageRef = ref(storage, imageUrl);
      await deleteObject(storageRef);
      
      return photoId;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const photosSlice = createSlice({
  name: 'photos',
  initialState: {
    photos: [],
    sharedGallery: [],
    loading: false,
    uploading: false,
    error: null,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setPhotos: (state, action) => {
      state.photos = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Upload photo
      .addCase(uploadPhoto.pending, (state) => {
        state.uploading = true;
        state.error = null;
      })
      .addCase(uploadPhoto.fulfilled, (state, action) => {
        state.uploading = false;
        state.photos.unshift(action.payload);
      })
      .addCase(uploadPhoto.rejected, (state, action) => {
        state.uploading = false;
        state.error = action.payload;
      })
      // Fetch photos
      .addCase(fetchPhotos.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPhotos.fulfilled, (state, action) => {
        state.loading = false;
        state.photos = action.payload;
        state.sharedGallery = action.payload;
      })
      .addCase(fetchPhotos.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Like photo
      .addCase(likePhoto.fulfilled, (state, action) => {
        const { photoId, userId } = action.payload;
        const photo = state.photos.find(p => p.id === photoId);
        if (photo && !photo.likes.includes(userId)) {
          photo.likes.push(userId);
        }
      })
      // Add comment
      .addCase(addComment.fulfilled, (state, action) => {
        const { photoId, comment } = action.payload;
        const photo = state.photos.find(p => p.id === photoId);
        if (photo) {
          photo.comments.push(comment);
        }
      })
      // Delete photo
      .addCase(deletePhoto.fulfilled, (state, action) => {
        state.photos = state.photos.filter(p => p.id !== action.payload);
        state.sharedGallery = state.sharedGallery.filter(p => p.id !== action.payload);
      });
  },
});

export const { clearError, setPhotos } = photosSlice.actions;
export default photosSlice.reducer;
