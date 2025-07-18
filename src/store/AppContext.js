import React, { createContext, useContext, useReducer } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
        error: null,
      };
    case 'CLEAR_USER':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        error: null,
      };
    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload,
      };
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        loading: false,
      };
    case 'RESTORE_AUTH_STATE':
      return {
        ...state,
        ...action.payload,
        loading: false,
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
  loading: true,
  error: null,
  initialized: false,
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

  // Persist auth state
  const persistAuthState = async (state) => {
    try {
      await AsyncStorage.setItem('authState', JSON.stringify({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        timestamp: Date.now(),
      }));
    } catch (error) {
      console.warn('Failed to persist auth state:', error);
    }
  };

  // Restore auth state
  const restoreAuthState = async () => {
    try {
      const stored = await AsyncStorage.getItem('authState');
      if (stored) {
        const parsed = JSON.parse(stored);
        
        // Check if stored state is not too old (24 hours)
        const maxAge = 24 * 60 * 60 * 1000;
        if (Date.now() - parsed.timestamp < maxAge) {
          authDispatch({
            type: 'RESTORE_AUTH_STATE',
            payload: {
              user: parsed.user,
              isAuthenticated: parsed.isAuthenticated,
              initialized: true,
            },
          });
          return;
        }
      }
    } catch (error) {
      console.warn('Failed to restore auth state:', error);
    }
    
    // If no valid stored state, mark as initialized
    authDispatch({
      type: 'RESTORE_AUTH_STATE',
      payload: { initialized: true },
    });
  };

  // Initialize auth state on mount
  React.useEffect(() => {
    restoreAuthState();
  }, []);
  // Auth actions
  const setUser = (user) => {
    const newState = { user, isAuthenticated: true };
    authDispatch({ type: 'SET_USER', payload: user });
    persistAuthState(newState);
  };

  const clearUser = () => {
    const newState = { user: null, isAuthenticated: false };
    authDispatch({ type: 'CLEAR_USER' });
    persistAuthState(newState);
    // Clear stored auth state
    AsyncStorage.removeItem('authState').catch(console.warn);
  };

  const setAuthLoading = (loading) => {
    authDispatch({ type: 'SET_LOADING', payload: loading });
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
        setAuthLoading,
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
