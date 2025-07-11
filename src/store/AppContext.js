import React, { createContext, useContext, useReducer } from 'react';

// Auth Context
const AuthContext = createContext();
const UIContext = createContext();

// Auth reducer
const authReducer = (state, action) => {
  switch (action.type) {
    case 'SET_USER':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
      };
    case 'CLEAR_USER':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
      };
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
      };
    default:
      return state;
  }
};

// UI reducer
const uiReducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload,
      };
    case 'SET_NETWORK_STATUS':
      return {
        ...state,
        networkStatus: action.payload,
      };
    case 'SHOW_NOTIFICATION':
      return {
        ...state,
        notifications: [...state.notifications, { ...action.payload, id: Date.now() }],
      };
    case 'HIDE_NOTIFICATION':
      return {
        ...state,
        notifications: state.notifications.filter(n => n.id !== action.payload),
      };
    default:
      return state;
  }
};

// Initial states
const initialAuthState = {
  user: null,
  isAuthenticated: false,
  error: null,
};

const initialUIState = {
  loading: false,
  networkStatus: 'online',
  notifications: [],
};

// App Provider
export const AppProvider = ({ children }) => {
  const [authState, authDispatch] = useReducer(authReducer, initialAuthState);
  const [uiState, uiDispatch] = useReducer(uiReducer, initialUIState);

  // Auth actions
  const setUser = (user) => {
    authDispatch({ type: 'SET_USER', payload: user });
  };

  const clearUser = () => {
    authDispatch({ type: 'CLEAR_USER' });
  };

  const setError = (error) => {
    authDispatch({ type: 'SET_ERROR', payload: error });
  };

  // UI actions
  const setLoading = (loading) => {
    uiDispatch({ type: 'SET_LOADING', payload: loading });
  };

  const setNetworkStatus = (status) => {
    uiDispatch({ type: 'SET_NETWORK_STATUS', payload: status });
  };

  const showNotification = (notification) => {
    uiDispatch({ type: 'SHOW_NOTIFICATION', payload: notification });
    
    // Auto-hide notification after duration
    if (notification.duration) {
      setTimeout(() => {
        hideNotification(notification.id || Date.now());
      }, notification.duration);
    }
  };

  const hideNotification = (id) => {
    uiDispatch({ type: 'HIDE_NOTIFICATION', payload: id });
  };

  return (
    <AuthContext.Provider
      value={{
        ...authState,
        setUser,
        clearUser,
        setError,
      }}
    >
      <UIContext.Provider
        value={{
          ...uiState,
          setLoading,
          setNetworkStatus,
          showNotification,
          hideNotification,
        }}
      >
        {children}
      </UIContext.Provider>
    </AuthContext.Provider>
  );
};

// Custom hooks
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AppProvider');
  }
  return context;
};

export const useUI = () => {
  const context = useContext(UIContext);
  if (!context) {
    throw new Error('useUI must be used within an AppProvider');
  }
  return context;
};
