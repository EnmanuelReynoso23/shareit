import { configureStore } from '@reduxjs/toolkit';
import authSlice from './slices/authSlice';
import photosSlice from './slices/photosSlice';
import widgetsSlice from './slices/widgetsSlice';
import userSlice from './slices/userSlice';

export const store = configureStore({
  reducer: {
    auth: authSlice,
    photos: photosSlice,
    widgets: widgetsSlice,
    user: userSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }),
});

// Export types for TypeScript (if using TypeScript)
// export type RootState = ReturnType<typeof store.getState>;
// export type AppDispatch = typeof store.dispatch;
