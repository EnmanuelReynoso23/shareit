import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  widgets: [],
  loading: false,
  error: null,
  selectedWidget: null,
};

const widgetsSlice = createSlice({
  name: 'widgets',
  initialState,
  reducers: {
    setWidgets: (state, action) => {
      state.widgets = action.payload;
      state.loading = false;
      state.error = null;
    },
    addWidget: (state, action) => {
      state.widgets.push(action.payload);
    },
    updateWidget: (state, action) => {
      const index = state.widgets.findIndex(widget => widget.id === action.payload.id);
      if (index !== -1) {
        state.widgets[index] = action.payload;
      }
    },
    removeWidget: (state, action) => {
      state.widgets = state.widgets.filter(widget => widget.id !== action.payload);
    },
    setSelectedWidget: (state, action) => {
      state.selectedWidget = action.payload;
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
  setWidgets, 
  addWidget, 
  updateWidget, 
  removeWidget, 
  setSelectedWidget, 
  setLoading, 
  setError 
} = widgetsSlice.actions;

export default widgetsSlice.reducer;
