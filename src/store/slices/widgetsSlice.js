import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import widgetsService from '../../services/widgetsService';

// Async thunks for widgets operations
export const createWidget = createAsyncThunk(
  'widgets/createWidget',
  async (widgetData, { rejectWithValue }) => {
    try {
      const widget = await widgetsService.createWidget(widgetData);
      return widget;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchUserWidgets = createAsyncThunk(
  'widgets/fetchUserWidgets',
  async ({ userId, limit = 50 }, { rejectWithValue }) => {
    try {
      const widgets = await widgetsService.getWidgetsByUser(userId, limit);
      return widgets;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchSharedWidgets = createAsyncThunk(
  'widgets/fetchSharedWidgets',
  async ({ userId, limit = 30 }, { rejectWithValue }) => {
    try {
      const widgets = await widgetsService.getSharedWidgets(userId, limit);
      return widgets;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchWidget = createAsyncThunk(
  'widgets/fetchWidget',
  async (widgetId, { rejectWithValue }) => {
    try {
      const widget = await widgetsService.getWidget(widgetId);
      return widget;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateWidget = createAsyncThunk(
  'widgets/updateWidget',
  async ({ widgetId, updates }, { rejectWithValue }) => {
    try {
      const updatedWidget = await widgetsService.updateWidget(widgetId, updates);
      return updatedWidget;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateWidgetSettings = createAsyncThunk(
  'widgets/updateWidgetSettings',
  async ({ widgetId, settings }, { rejectWithValue }) => {
    try {
      const updatedSettings = await widgetsService.updateWidgetSettings(widgetId, settings);
      return { widgetId, settings: updatedSettings };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateWidgetPosition = createAsyncThunk(
  'widgets/updateWidgetPosition',
  async ({ widgetId, position }, { rejectWithValue }) => {
    try {
      await widgetsService.updateWidgetPosition(widgetId, position);
      return { widgetId, position };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const shareWidget = createAsyncThunk(
  'widgets/shareWidget',
  async ({ widgetId, userIds }, { rejectWithValue }) => {
    try {
      await widgetsService.shareWidget(widgetId, userIds);
      return { widgetId, userIds };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const toggleWidgetActive = createAsyncThunk(
  'widgets/toggleWidgetActive',
  async ({ widgetId, isActive }, { rejectWithValue }) => {
    try {
      await widgetsService.toggleWidgetActive(widgetId, isActive);
      return { widgetId, isActive };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const deleteWidget = createAsyncThunk(
  'widgets/deleteWidget',
  async ({ widgetId, userId }, { rejectWithValue }) => {
    try {
      await widgetsService.deleteWidget(widgetId, userId);
      return widgetId;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const cloneWidget = createAsyncThunk(
  'widgets/cloneWidget',
  async ({ widgetId, userId }, { rejectWithValue }) => {
    try {
      const clonedWidget = await widgetsService.cloneWidget(widgetId, userId);
      return clonedWidget;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchWidgetsByType = createAsyncThunk(
  'widgets/fetchWidgetsByType',
  async ({ userId, type, limit = 20 }, { rejectWithValue }) => {
    try {
      const widgets = await widgetsService.getWidgetsByType(userId, type, limit);
      return { type, widgets };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateWidgetData = createAsyncThunk(
  'widgets/updateWidgetData',
  async ({ widgetId, data }, { rejectWithValue }) => {
    try {
      await widgetsService.updateWidgetData(widgetId, data);
      return { widgetId, data };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchWidgetStats = createAsyncThunk(
  'widgets/fetchWidgetStats',
  async (userId, { rejectWithValue }) => {
    try {
      const stats = await widgetsService.getUserWidgetStats(userId);
      return stats;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const batchUpdateWidgets = createAsyncThunk(
  'widgets/batchUpdateWidgets',
  async (updates, { rejectWithValue }) => {
    try {
      const results = await widgetsService.batchUpdateWidgets(updates);
      return results;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  widgets: [],
  sharedWidgets: [],
  selectedWidget: null,
  widgetsByType: {},
  stats: {
    totalWidgets: 0,
    activeWidgets: 0,
    sharedWidgets: 0,
    typeStats: {},
    mostUsedType: 'none'
  },
  loading: false,
  error: null,
  message: null,
  lastFetch: null,
  realtimeListeners: {},
  defaultSettings: widgetsService.getDefaultSettings || {}
};

const widgetsSlice = createSlice({
  name: 'widgets',
  initialState,
  reducers: {
    setWidgets: (state, action) => {
      state.widgets = action.payload;
      state.loading = false;
      state.error = null;
      state.lastFetch = Date.now();
    },
    addWidget: (state, action) => {
      state.widgets.unshift(action.payload);
      state.stats.totalWidgets += 1;
      if (action.payload.isActive) {
        state.stats.activeWidgets += 1;
      }
    },
    removeWidget: (state, action) => {
      const widgetId = action.payload;
      const widget = state.widgets.find(w => w.id === widgetId);
      
      state.widgets = state.widgets.filter(w => w.id !== widgetId);
      state.stats.totalWidgets = Math.max(0, state.stats.totalWidgets - 1);
      
      if (widget && widget.isActive) {
        state.stats.activeWidgets = Math.max(0, state.stats.activeWidgets - 1);
      }
      
      // Clear selected widget if it was deleted
      if (state.selectedWidget && state.selectedWidget.id === widgetId) {
        state.selectedWidget = null;
      }
    },
    updateWidgetInList: (state, action) => {
      const { widgetId, updates } = action.payload;
      const widgetIndex = state.widgets.findIndex(widget => widget.id === widgetId);
      
      if (widgetIndex !== -1) {
        const oldWidget = state.widgets[widgetIndex];
        Object.assign(state.widgets[widgetIndex], updates);
        
        // Update stats if active status changed
        if (updates.hasOwnProperty('isActive')) {
          if (updates.isActive && !oldWidget.isActive) {
            state.stats.activeWidgets += 1;
          } else if (!updates.isActive && oldWidget.isActive) {
            state.stats.activeWidgets = Math.max(0, state.stats.activeWidgets - 1);
          }
        }
      }
      
      // Also update in shared widgets if exists
      const sharedWidgetIndex = state.sharedWidgets.findIndex(widget => widget.id === widgetId);
      if (sharedWidgetIndex !== -1) {
        Object.assign(state.sharedWidgets[sharedWidgetIndex], updates);
      }
      
      // Update selected widget if it's the same
      if (state.selectedWidget && state.selectedWidget.id === widgetId) {
        Object.assign(state.selectedWidget, updates);
      }
    },
    setSelectedWidget: (state, action) => {
      state.selectedWidget = action.payload;
    },
    clearSelectedWidget: (state) => {
      state.selectedWidget = null;
    },
    setSharedWidgets: (state, action) => {
      state.sharedWidgets = action.payload;
    },
    addSharedWidget: (state, action) => {
      state.sharedWidgets.unshift(action.payload);
    },
    setWidgetsByType: (state, action) => {
      const { type, widgets } = action.payload;
      state.widgetsByType[type] = widgets;
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
    setStats: (state, action) => {
      state.stats = action.payload;
    },
    updateStats: (state, action) => {
      Object.assign(state.stats, action.payload);
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
    },
    reorderWidgets: (state, action) => {
      const { fromIndex, toIndex } = action.payload;
      const [removed] = state.widgets.splice(fromIndex, 1);
      state.widgets.splice(toIndex, 0, removed);
    },
    setDefaultSettings: (state, action) => {
      const { type, settings } = action.payload;
      state.defaultSettings[type] = settings;
    }
  },
  extraReducers: (builder) => {
    // Create widget
    builder
      .addCase(createWidget.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.message = null;
      })
      .addCase(createWidget.fulfilled, (state, action) => {
        state.loading = false;
        state.widgets.unshift(action.payload);
        state.stats.totalWidgets += 1;
        if (action.payload.isActive) {
          state.stats.activeWidgets += 1;
        }
        state.message = 'Widget created successfully';
        state.error = null;
      })
      .addCase(createWidget.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Fetch user widgets
    builder
      .addCase(fetchUserWidgets.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserWidgets.fulfilled, (state, action) => {
        state.loading = false;
        state.widgets = action.payload;
        state.lastFetch = Date.now();
        state.error = null;
      })
      .addCase(fetchUserWidgets.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Fetch shared widgets
    builder
      .addCase(fetchSharedWidgets.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSharedWidgets.fulfilled, (state, action) => {
        state.loading = false;
        state.sharedWidgets = action.payload;
        state.error = null;
      })
      .addCase(fetchSharedWidgets.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Fetch single widget
    builder
      .addCase(fetchWidget.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchWidget.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedWidget = action.payload;
        state.error = null;
      })
      .addCase(fetchWidget.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Update widget
    builder
      .addCase(updateWidget.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateWidget.fulfilled, (state, action) => {
        state.loading = false;
        const { id, ...updates } = action.payload;
        
        // Update in widgets array
        const widgetIndex = state.widgets.findIndex(widget => widget.id === id);
        if (widgetIndex !== -1) {
          state.widgets[widgetIndex] = { ...state.widgets[widgetIndex], ...updates };
        }
        
        // Update selected widget if it's the same
        if (state.selectedWidget && state.selectedWidget.id === id) {
          state.selectedWidget = { ...state.selectedWidget, ...updates };
        }
        
        state.message = 'Widget updated successfully';
        state.error = null;
      })
      .addCase(updateWidget.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Update widget settings
    builder
      .addCase(updateWidgetSettings.fulfilled, (state, action) => {
        const { widgetId, settings } = action.payload;
        
        // Update in widgets array
        const widgetIndex = state.widgets.findIndex(widget => widget.id === widgetId);
        if (widgetIndex !== -1) {
          state.widgets[widgetIndex].settings = settings;
        }
        
        // Update selected widget if it's the same
        if (state.selectedWidget && state.selectedWidget.id === widgetId) {
          state.selectedWidget.settings = settings;
        }
        
        state.message = 'Widget settings updated';
      })
      .addCase(updateWidgetSettings.rejected, (state, action) => {
        state.error = action.payload;
      });

    // Update widget position
    builder
      .addCase(updateWidgetPosition.fulfilled, (state, action) => {
        const { widgetId, position } = action.payload;
        
        // Update in widgets array
        const widgetIndex = state.widgets.findIndex(widget => widget.id === widgetId);
        if (widgetIndex !== -1) {
          state.widgets[widgetIndex].position = position;
        }
      })
      .addCase(updateWidgetPosition.rejected, (state, action) => {
        state.error = action.payload;
      });

    // Share widget
    builder
      .addCase(shareWidget.fulfilled, (state, action) => {
        const { widgetId, userIds } = action.payload;
        
        // Update widget sharing status
        const widgetIndex = state.widgets.findIndex(widget => widget.id === widgetId);
        if (widgetIndex !== -1) {
          state.widgets[widgetIndex].shared = true;
          state.widgets[widgetIndex].sharedWith = userIds;
        }
        
        state.message = 'Widget shared successfully';
      })
      .addCase(shareWidget.rejected, (state, action) => {
        state.error = action.payload;
      });

    // Toggle widget active
    builder
      .addCase(toggleWidgetActive.fulfilled, (state, action) => {
        const { widgetId, isActive } = action.payload;
        
        // Update in widgets array
        const widgetIndex = state.widgets.findIndex(widget => widget.id === widgetId);
        if (widgetIndex !== -1) {
          const oldActive = state.widgets[widgetIndex].isActive;
          state.widgets[widgetIndex].isActive = isActive;
          
          // Update stats
          if (isActive && !oldActive) {
            state.stats.activeWidgets += 1;
          } else if (!isActive && oldActive) {
            state.stats.activeWidgets = Math.max(0, state.stats.activeWidgets - 1);
          }
        }
        
        state.message = `Widget ${isActive ? 'activated' : 'deactivated'}`;
      })
      .addCase(toggleWidgetActive.rejected, (state, action) => {
        state.error = action.payload;
      });

    // Delete widget
    builder
      .addCase(deleteWidget.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteWidget.fulfilled, (state, action) => {
        state.loading = false;
        const widgetId = action.payload;
        const widget = state.widgets.find(w => w.id === widgetId);
        
        state.widgets = state.widgets.filter(w => w.id !== widgetId);
        state.stats.totalWidgets = Math.max(0, state.stats.totalWidgets - 1);
        
        if (widget && widget.isActive) {
          state.stats.activeWidgets = Math.max(0, state.stats.activeWidgets - 1);
        }
        
        // Clear selected widget if it was deleted
        if (state.selectedWidget && state.selectedWidget.id === widgetId) {
          state.selectedWidget = null;
        }
        
        state.message = 'Widget deleted successfully';
        state.error = null;
      })
      .addCase(deleteWidget.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Clone widget
    builder
      .addCase(cloneWidget.fulfilled, (state, action) => {
        state.widgets.unshift(action.payload);
        state.stats.totalWidgets += 1;
        if (action.payload.isActive) {
          state.stats.activeWidgets += 1;
        }
        state.message = 'Widget cloned successfully';
      })
      .addCase(cloneWidget.rejected, (state, action) => {
        state.error = action.payload;
      });

    // Fetch widgets by type
    builder
      .addCase(fetchWidgetsByType.fulfilled, (state, action) => {
        const { type, widgets } = action.payload;
        state.widgetsByType[type] = widgets;
      })
      .addCase(fetchWidgetsByType.rejected, (state, action) => {
        state.error = action.payload;
      });

    // Update widget data
    builder
      .addCase(updateWidgetData.fulfilled, (state, action) => {
        const { widgetId, data } = action.payload;
        
        // Update in widgets array
        const widgetIndex = state.widgets.findIndex(widget => widget.id === widgetId);
        if (widgetIndex !== -1) {
          state.widgets[widgetIndex].data = data;
          state.widgets[widgetIndex].lastDataUpdate = Date.now();
        }
      })
      .addCase(updateWidgetData.rejected, (state, action) => {
        state.error = action.payload;
      });

    // Fetch widget stats
    builder
      .addCase(fetchWidgetStats.fulfilled, (state, action) => {
        state.stats = action.payload;
      })
      .addCase(fetchWidgetStats.rejected, (state, action) => {
        state.error = action.payload;
      });

    // Batch update widgets
    builder
      .addCase(batchUpdateWidgets.fulfilled, (state, action) => {
        state.message = 'Widgets updated successfully';
      })
      .addCase(batchUpdateWidgets.rejected, (state, action) => {
        state.error = action.payload;
      });
  }
});

export const {
  setWidgets,
  addWidget,
  removeWidget,
  updateWidgetInList,
  setSelectedWidget,
  clearSelectedWidget,
  setSharedWidgets,
  addSharedWidget,
  setWidgetsByType,
  setLoading,
  setError,
  clearError,
  setMessage,
  clearMessage,
  setStats,
  updateStats,
  setRealtimeListener,
  removeRealtimeListener,
  clearAllListeners,
  reorderWidgets,
  setDefaultSettings
} = widgetsSlice.actions;

// Selectors
export const selectWidgets = (state) => state.widgets.widgets;
export const selectActiveWidgets = (state) => state.widgets.widgets.filter(w => w.isActive);
export const selectSharedWidgets = (state) => state.widgets.sharedWidgets;
export const selectSelectedWidget = (state) => state.widgets.selectedWidget;
export const selectWidgetsByType = (state) => state.widgets.widgetsByType;
export const selectWidgetsLoading = (state) => state.widgets.loading;
export const selectWidgetsError = (state) => state.widgets.error;
export const selectWidgetsMessage = (state) => state.widgets.message;
export const selectWidgetsStats = (state) => state.widgets.stats;
export const selectDefaultSettings = (state) => state.widgets.defaultSettings;
export const selectLastFetch = (state) => state.widgets.lastFetch;

// Widget types
export const WIDGET_TYPES = widgetsService.WIDGET_TYPES || {
  CLOCK: 'clock',
  PHOTOS: 'photos',
  NOTES: 'notes',
  WEATHER: 'weather',
  CALENDAR: 'calendar',
  MUSIC: 'music'
};

export default widgetsSlice.reducer;
