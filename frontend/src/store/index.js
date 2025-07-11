import { configureStore } from '@reduxjs/toolkit';
import authSlice from './slices/authSlice';
import userSlice from './slices/userSlice';
import photosSlice from './slices/photosSlice';
import widgetsSlice from './slices/widgetsSlice';
import friendsSlice from './slices/friendsSlice';

export const store = configureStore({
  reducer: {
    auth: authSlice,
    user: userSlice,
    photos: photosSlice,
    widgets: widgetsSlice,
    friends: friendsSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }),
});

// Type definitions for TypeScript projects:
// export type RootState = ReturnType<typeof store.getState>;
// export type AppDispatch = typeof store.dispatch;
