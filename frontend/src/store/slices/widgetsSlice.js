import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  updateDoc, 
  doc,
  deleteDoc 
} from 'firebase/firestore';
import { db } from '../../../../config/firebase';

// Widget types
export const WIDGET_TYPES = {
  CLOCK: 'clock',
  WEATHER: 'weather',
  CALENDAR: 'calendar',
  BATTERY: 'battery',
  PHOTOS: 'photos',
  NOTES: 'notes',
  REMINDERS: 'reminders',
  STATUS: 'status',
};

// Async thunks for widgets
export const createWidget = createAsyncThunk(
  'widgets/createWidget',
  async ({ userId, type, config, sharedWith }, { rejectWithValue }) => {
    try {
      const widgetData = {
        userId,
        type,
        config: config || {},
        sharedWith: sharedWith || [],
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true,
      };
      
      const docRef = await addDoc(collection(db, 'widgets'), widgetData);
      
      return {
        id: docRef.id,
        ...widgetData,
      };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchUserWidgets = createAsyncThunk(
  'widgets/fetchUserWidgets',
  async ({ userId }, { rejectWithValue }) => {
    try {
      const q = query(
        collection(db, 'widgets'),
        where('userId', '==', userId)
      );
      
      const querySnapshot = await getDocs(q);
      const widgets = [];
      
      querySnapshot.forEach((doc) => {
        widgets.push({
          id: doc.id,
          ...doc.data(),
        });
      });
      
      return widgets;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchSharedWidgets = createAsyncThunk(
  'widgets/fetchSharedWidgets',
  async ({ userId }, { rejectWithValue }) => {
    try {
      const q = query(
        collection(db, 'widgets'),
        where('sharedWith', 'array-contains', userId)
      );
      
      const querySnapshot = await getDocs(q);
      const sharedWidgets = [];
      
      querySnapshot.forEach((doc) => {
        sharedWidgets.push({
          id: doc.id,
          ...doc.data(),
        });
      });
      
      return sharedWidgets;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateWidget = createAsyncThunk(
  'widgets/updateWidget',
  async ({ widgetId, config }, { rejectWithValue }) => {
    try {
      const widgetRef = doc(db, 'widgets', widgetId);
      await updateDoc(widgetRef, {
        config,
        updatedAt: new Date(),
      });
      
      return { widgetId, config };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const shareWidget = createAsyncThunk(
  'widgets/shareWidget',
  async ({ widgetId, friendIds }, { rejectWithValue }) => {
    try {
      const widgetRef = doc(db, 'widgets', widgetId);
      await updateDoc(widgetRef, {
        sharedWith: friendIds,
        updatedAt: new Date(),
      });
      
      return { widgetId, sharedWith: friendIds };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const deleteWidget = createAsyncThunk(
  'widgets/deleteWidget',
  async ({ widgetId }, { rejectWithValue }) => {
    try {
      await deleteDoc(doc(db, 'widgets', widgetId));
      return widgetId;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateWidgetData = createAsyncThunk(
  'widgets/updateWidgetData',
  async ({ widgetId, data }, { rejectWithValue }) => {
    try {
      const widgetRef = doc(db, 'widgets', widgetId);
      await updateDoc(widgetRef, {
        data,
        updatedAt: new Date(),
      });
      
      return { widgetId, data };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const widgetsSlice = createSlice({
  name: 'widgets',
  initialState: {
    userWidgets: [],
    sharedWidgets: [],
    activeWidgets: [],
    loading: false,
    error: null,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setActiveWidgets: (state, action) => {
      state.activeWidgets = action.payload;
    },
    reorderWidgets: (state, action) => {
      state.activeWidgets = action.payload;
    },
    toggleWidget: (state, action) => {
      const { widgetId, isActive } = action.payload;
      const widget = state.userWidgets.find(w => w.id === widgetId);
      if (widget) {
        widget.isActive = isActive;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Create widget
      .addCase(createWidget.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createWidget.fulfilled, (state, action) => {
        state.loading = false;
        state.userWidgets.push(action.payload);
        if (action.payload.isActive) {
          state.activeWidgets.push(action.payload);
        }
      })
      .addCase(createWidget.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch user widgets
      .addCase(fetchUserWidgets.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserWidgets.fulfilled, (state, action) => {
        state.loading = false;
        state.userWidgets = action.payload;
        state.activeWidgets = action.payload.filter(w => w.isActive);
      })
      .addCase(fetchUserWidgets.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch shared widgets
      .addCase(fetchSharedWidgets.fulfilled, (state, action) => {
        state.sharedWidgets = action.payload;
      })
      // Update widget
      .addCase(updateWidget.fulfilled, (state, action) => {
        const { widgetId, config } = action.payload;
        const widget = state.userWidgets.find(w => w.id === widgetId);
        if (widget) {
          widget.config = config;
          widget.updatedAt = new Date();
        }
        const activeWidget = state.activeWidgets.find(w => w.id === widgetId);
        if (activeWidget) {
          activeWidget.config = config;
          activeWidget.updatedAt = new Date();
        }
      })
      // Share widget
      .addCase(shareWidget.fulfilled, (state, action) => {
        const { widgetId, sharedWith } = action.payload;
        const widget = state.userWidgets.find(w => w.id === widgetId);
        if (widget) {
          widget.sharedWith = sharedWith;
        }
      })
      // Delete widget
      .addCase(deleteWidget.fulfilled, (state, action) => {
        const widgetId = action.payload;
        state.userWidgets = state.userWidgets.filter(w => w.id !== widgetId);
        state.activeWidgets = state.activeWidgets.filter(w => w.id !== widgetId);
      })
      // Update widget data
      .addCase(updateWidgetData.fulfilled, (state, action) => {
        const { widgetId, data } = action.payload;
        const widget = state.userWidgets.find(w => w.id === widgetId);
        if (widget) {
          widget.data = data;
        }
        const activeWidget = state.activeWidgets.find(w => w.id === widgetId);
        if (activeWidget) {
          activeWidget.data = data;
        }
      });
  },
});

export const { clearError, setActiveWidgets, reorderWidgets, toggleWidget } = widgetsSlice.actions;
export default widgetsSlice.reducer;
