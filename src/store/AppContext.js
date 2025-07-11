import React, { createContext, useContext, useReducer, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Action Types
export const ACTION_TYPES = {
  // Auth
  SET_USER: 'SET_USER',
  CLEAR_USER: 'CLEAR_USER',
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  
  // Photos
  SET_PHOTOS: 'SET_PHOTOS',
  ADD_PHOTO: 'ADD_PHOTO',
  UPDATE_PHOTO: 'UPDATE_PHOTO',
  DELETE_PHOTO: 'DELETE_PHOTO',
  SET_PHOTOS_LOADING: 'SET_PHOTOS_LOADING',
  
  // Friends
  SET_FRIENDS: 'SET_FRIENDS',
  ADD_FRIEND: 'ADD_FRIEND',
  REMOVE_FRIEND: 'REMOVE_FRIEND',
  UPDATE_FRIEND_STATUS: 'UPDATE_FRIEND_STATUS',
  SET_FRIEND_REQUESTS: 'SET_FRIEND_REQUESTS',
  
  // Widgets
  SET_WIDGETS: 'SET_WIDGETS',
  ADD_WIDGET: 'ADD_WIDGET',
  UPDATE_WIDGET: 'UPDATE_WIDGET',
  DELETE_WIDGET: 'DELETE_WIDGET',
  SET_WIDGET_SETTINGS: 'SET_WIDGET_SETTINGS',
  
  // UI State
  SET_ACTIVE_TAB: 'SET_ACTIVE_TAB',
  SET_THEME: 'SET_THEME',
  SET_NETWORK_STATUS: 'SET_NETWORK_STATUS',
  SHOW_NOTIFICATION: 'SHOW_NOTIFICATION',
  HIDE_NOTIFICATION: 'HIDE_NOTIFICATION',
};

// Initial State
const initialState = {
  // Auth State
  user: null,
  isAuthenticated: false,
  authLoading: false,
  authError: null,
  
  // Photos State
  photos: [],
  photosLoading: false,
  photosError: null,
  uploadProgress: {},
  
  // Friends State
  friends: [],
  friendRequests: [],
  friendsLoading: false,
  friendsError: null,
  
  // Widgets State
  widgets: [],
  widgetSettings: {},
  widgetsLoading: false,
  widgetsError: null,
  
  // UI State
  activeTab: 'Home',
  theme: 'light',
  networkStatus: 'online',
  notifications: [],
  
  // App State
  isFirstLaunch: true,
  lastSync: null,
  appVersion: '1.0.0',
};

// Reducer
const appReducer = (state, action) => {
  switch (action.type) {
    // Auth Actions
    case ACTION_TYPES.SET_USER:
      return {
        ...state,
        user: action.payload,
        isAuthenticated: !!action.payload,
        authError: null,
      };
      
    case ACTION_TYPES.CLEAR_USER:
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        authError: null,
        photos: [],
        friends: [],
        widgets: [],
      };
      
    case ACTION_TYPES.SET_LOADING:
      return {
        ...state,
        authLoading: action.payload,
      };
      
    case ACTION_TYPES.SET_ERROR:
      return {
        ...state,
        authError: action.payload,
        authLoading: false,
      };
      
    // Photos Actions
    case ACTION_TYPES.SET_PHOTOS:
      return {
        ...state,
        photos: action.payload,
        photosLoading: false,
        photosError: null,
      };
      
    case ACTION_TYPES.ADD_PHOTO:
      return {
        ...state,
        photos: [action.payload, ...state.photos],
      };
      
    case ACTION_TYPES.UPDATE_PHOTO:
      return {
        ...state,
        photos: state.photos.map(photo =>
          photo.id === action.payload.id ? { ...photo, ...action.payload } : photo
        ),
      };
      
    case ACTION_TYPES.DELETE_PHOTO:
      return {
        ...state,
        photos: state.photos.filter(photo => photo.id !== action.payload),
      };
      
    case ACTION_TYPES.SET_PHOTOS_LOADING:
      return {
        ...state,
        photosLoading: action.payload,
      };
      
    // Friends Actions
    case ACTION_TYPES.SET_FRIENDS:
      return {
        ...state,
        friends: action.payload,
        friendsLoading: false,
        friendsError: null,
      };
      
    case ACTION_TYPES.ADD_FRIEND:
      return {
        ...state,
        friends: [...state.friends, action.payload],
      };
      
    case ACTION_TYPES.REMOVE_FRIEND:
      return {
        ...state,
        friends: state.friends.filter(friend => friend.id !== action.payload),
      };
      
    case ACTION_TYPES.UPDATE_FRIEND_STATUS:
      return {
        ...state,
        friends: state.friends.map(friend =>
          friend.id === action.payload.id 
            ? { ...friend, status: action.payload.status }
            : friend
        ),
      };
      
    case ACTION_TYPES.SET_FRIEND_REQUESTS:
      return {
        ...state,
        friendRequests: action.payload,
      };
      
    // Widgets Actions
    case ACTION_TYPES.SET_WIDGETS:
      return {
        ...state,
        widgets: action.payload,
        widgetsLoading: false,
        widgetsError: null,
      };
      
    case ACTION_TYPES.ADD_WIDGET:
      return {
        ...state,
        widgets: [...state.widgets, action.payload],
      };
      
    case ACTION_TYPES.UPDATE_WIDGET:
      return {
        ...state,
        widgets: state.widgets.map(widget =>
          widget.id === action.payload.id ? { ...widget, ...action.payload } : widget
        ),
      };
      
    case ACTION_TYPES.DELETE_WIDGET:
      return {
        ...state,
        widgets: state.widgets.filter(widget => widget.id !== action.payload),
      };
      
    case ACTION_TYPES.SET_WIDGET_SETTINGS:
      return {
        ...state,
        widgetSettings: {
          ...state.widgetSettings,
          [action.payload.widgetId]: action.payload.settings,
        },
      };
      
    // UI Actions
    case ACTION_TYPES.SET_ACTIVE_TAB:
      return {
        ...state,
        activeTab: action.payload,
      };
      
    case ACTION_TYPES.SET_THEME:
      return {
        ...state,
        theme: action.payload,
      };
      
    case ACTION_TYPES.SET_NETWORK_STATUS:
      return {
        ...state,
        networkStatus: action.payload,
      };
      
    case ACTION_TYPES.SHOW_NOTIFICATION:
      return {
        ...state,
        notifications: [...state.notifications, action.payload],
      };
      
    case ACTION_TYPES.HIDE_NOTIFICATION:
      return {
        ...state,
        notifications: state.notifications.filter(
          notification => notification.id !== action.payload
        ),
      };
      
    default:
      return state;
  }
};

// Context
const AppContext = createContext();

// Custom Hook
export const useAppState = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppState must be used within an AppProvider');
  }
  return context;
};

// Action Creators
export const createActions = (dispatch) => ({
  // Auth Actions
  setUser: (user) => {
    dispatch({ type: ACTION_TYPES.SET_USER, payload: user });
  },
  
  clearUser: () => {
    dispatch({ type: ACTION_TYPES.CLEAR_USER });
  },
  
  setLoading: (loading) => {
    dispatch({ type: ACTION_TYPES.SET_LOADING, payload: loading });
  },
  
  setError: (error) => {
    dispatch({ type: ACTION_TYPES.SET_ERROR, payload: error });
  },
  
  // Photos Actions
  setPhotos: (photos) => {
    dispatch({ type: ACTION_TYPES.SET_PHOTOS, payload: photos });
  },
  
  addPhoto: (photo) => {
    dispatch({ type: ACTION_TYPES.ADD_PHOTO, payload: photo });
  },
  
  updatePhoto: (photo) => {
    dispatch({ type: ACTION_TYPES.UPDATE_PHOTO, payload: photo });
  },
  
  deletePhoto: (photoId) => {
    dispatch({ type: ACTION_TYPES.DELETE_PHOTO, payload: photoId });
  },
  
  setPhotosLoading: (loading) => {
    dispatch({ type: ACTION_TYPES.SET_PHOTOS_LOADING, payload: loading });
  },
  
  // Friends Actions
  setFriends: (friends) => {
    dispatch({ type: ACTION_TYPES.SET_FRIENDS, payload: friends });
  },
  
  addFriend: (friend) => {
    dispatch({ type: ACTION_TYPES.ADD_FRIEND, payload: friend });
  },
  
  removeFriend: (friendId) => {
    dispatch({ type: ACTION_TYPES.REMOVE_FRIEND, payload: friendId });
  },
  
  updateFriendStatus: (friendId, status) => {
    dispatch({ 
      type: ACTION_TYPES.UPDATE_FRIEND_STATUS, 
      payload: { id: friendId, status } 
    });
  },
  
  setFriendRequests: (requests) => {
    dispatch({ type: ACTION_TYPES.SET_FRIEND_REQUESTS, payload: requests });
  },
  
  // Widgets Actions
  setWidgets: (widgets) => {
    dispatch({ type: ACTION_TYPES.SET_WIDGETS, payload: widgets });
  },
  
  addWidget: (widget) => {
    dispatch({ type: ACTION_TYPES.ADD_WIDGET, payload: widget });
  },
  
  updateWidget: (widget) => {
    dispatch({ type: ACTION_TYPES.UPDATE_WIDGET, payload: widget });
  },
  
  deleteWidget: (widgetId) => {
    dispatch({ type: ACTION_TYPES.DELETE_WIDGET, payload: widgetId });
  },
  
  setWidgetSettings: (widgetId, settings) => {
    dispatch({ 
      type: ACTION_TYPES.SET_WIDGET_SETTINGS, 
      payload: { widgetId, settings } 
    });
  },
  
  // UI Actions
  setActiveTab: (tab) => {
    dispatch({ type: ACTION_TYPES.SET_ACTIVE_TAB, payload: tab });
  },
  
  setTheme: (theme) => {
    dispatch({ type: ACTION_TYPES.SET_THEME, payload: theme });
  },
  
  setNetworkStatus: (status) => {
    dispatch({ type: ACTION_TYPES.SET_NETWORK_STATUS, payload: status });
  },
  
  showNotification: (notification) => {
    const id = Date.now().toString();
    const notificationWithId = { ...notification, id };
    dispatch({ type: ACTION_TYPES.SHOW_NOTIFICATION, payload: notificationWithId });
    
    // Auto-hide after specified duration
    if (notification.duration !== 0) {
      setTimeout(() => {
        dispatch({ type: ACTION_TYPES.HIDE_NOTIFICATION, payload: id });
      }, notification.duration || 3000);
    }
    
    return id;
  },
  
  hideNotification: (notificationId) => {
    dispatch({ type: ACTION_TYPES.HIDE_NOTIFICATION, payload: notificationId });
  },
});

// Provider Component
export const AppProvider = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const actions = createActions(dispatch);

  // Persistence
  useEffect(() => {
    const loadPersistedState = async () => {
      try {
        const persistedUser = await AsyncStorage.getItem('user');
        const persistedTheme = await AsyncStorage.getItem('theme');
        const isFirstLaunch = await AsyncStorage.getItem('isFirstLaunch');
        
        if (persistedUser) {
          actions.setUser(JSON.parse(persistedUser));
        }
        
        if (persistedTheme) {
          actions.setTheme(persistedTheme);
        }
        
        if (isFirstLaunch === null) {
          await AsyncStorage.setItem('isFirstLaunch', 'false');
        }
      } catch (error) {
        console.error('Error loading persisted state:', error);
      }
    };

    loadPersistedState();
  }, []);

  // Persist user changes
  useEffect(() => {
    if (state.user) {
      AsyncStorage.setItem('user', JSON.stringify(state.user));
    } else {
      AsyncStorage.removeItem('user');
    }
  }, [state.user]);

  // Persist theme changes
  useEffect(() => {
    AsyncStorage.setItem('theme', state.theme);
  }, [state.theme]);

  const value = {
    state,
    actions,
    dispatch, // For advanced usage
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

// Selectors
export const selectors = {
  // Auth Selectors
  getUser: (state) => state.user,
  isAuthenticated: (state) => state.isAuthenticated,
  isAuthLoading: (state) => state.authLoading,
  getAuthError: (state) => state.authError,
  
  // Photos Selectors
  getPhotos: (state) => state.photos,
  getUserPhotos: (state, userId) => 
    state.photos.filter(photo => photo.userId === userId),
  getSharedPhotos: (state, userId) => 
    state.photos.filter(photo => photo.userId !== userId),
  isPhotosLoading: (state) => state.photosLoading,
  getPhotosError: (state) => state.photosError,
  
  // Friends Selectors
  getFriends: (state) => state.friends,
  getOnlineFriends: (state) => 
    state.friends.filter(friend => friend.status === 'online'),
  getFriendRequests: (state) => state.friendRequests,
  getPendingRequests: (state) => 
    state.friendRequests.filter(request => request.status === 'pending'),
  isFriendsLoading: (state) => state.friendsLoading,
  
  // Widgets Selectors
  getWidgets: (state) => state.widgets,
  getWidgetsByType: (state, type) => 
    state.widgets.filter(widget => widget.type === type),
  getWidgetSettings: (state, widgetId) => 
    state.widgetSettings[widgetId] || {},
  isWidgetsLoading: (state) => state.widgetsLoading,
  
  // UI Selectors
  getActiveTab: (state) => state.activeTab,
  getTheme: (state) => state.theme,
  getNetworkStatus: (state) => state.networkStatus,
  getNotifications: (state) => state.notifications,
  isOnline: (state) => state.networkStatus === 'online',
};

// Utility Hooks
export const useAuth = () => {
  const { state, actions } = useAppState();
  return {
    user: selectors.getUser(state),
    isAuthenticated: selectors.isAuthenticated(state),
    isLoading: selectors.isAuthLoading(state),
    error: selectors.getAuthError(state),
    setUser: actions.setUser,
    clearUser: actions.clearUser,
    setLoading: actions.setLoading,
    setError: actions.setError,
  };
};

export const usePhotos = () => {
  const { state, actions } = useAppState();
  const user = selectors.getUser(state);
  
  return {
    photos: selectors.getPhotos(state),
    userPhotos: selectors.getUserPhotos(state, user?.uid),
    sharedPhotos: selectors.getSharedPhotos(state, user?.uid),
    isLoading: selectors.isPhotosLoading(state),
    error: selectors.getPhotosError(state),
    setPhotos: actions.setPhotos,
    addPhoto: actions.addPhoto,
    updatePhoto: actions.updatePhoto,
    deletePhoto: actions.deletePhoto,
    setLoading: actions.setPhotosLoading,
  };
};

export const useFriends = () => {
  const { state, actions } = useAppState();
  
  return {
    friends: selectors.getFriends(state),
    onlineFriends: selectors.getOnlineFriends(state),
    friendRequests: selectors.getFriendRequests(state),
    pendingRequests: selectors.getPendingRequests(state),
    isLoading: selectors.isFriendsLoading(state),
    setFriends: actions.setFriends,
    addFriend: actions.addFriend,
    removeFriend: actions.removeFriend,
    updateFriendStatus: actions.updateFriendStatus,
    setFriendRequests: actions.setFriendRequests,
  };
};

export const useWidgets = () => {
  const { state, actions } = useAppState();
  
  return {
    widgets: selectors.getWidgets(state),
    isLoading: selectors.isWidgetsLoading(state),
    getWidgetsByType: (type) => selectors.getWidgetsByType(state, type),
    getWidgetSettings: (widgetId) => selectors.getWidgetSettings(state, widgetId),
    setWidgets: actions.setWidgets,
    addWidget: actions.addWidget,
    updateWidget: actions.updateWidget,
    deleteWidget: actions.deleteWidget,
    setWidgetSettings: actions.setWidgetSettings,
  };
};

export const useUI = () => {
  const { state, actions } = useAppState();
  
  return {
    activeTab: selectors.getActiveTab(state),
    theme: selectors.getTheme(state),
    networkStatus: selectors.getNetworkStatus(state),
    notifications: selectors.getNotifications(state),
    isOnline: selectors.isOnline(state),
    setActiveTab: actions.setActiveTab,
    setTheme: actions.setTheme,
    setNetworkStatus: actions.setNetworkStatus,
    showNotification: actions.showNotification,
    hideNotification: actions.hideNotification,
  };
};

export default {
  AppProvider,
  useAppState,
  useAuth,
  usePhotos,
  useFriends,
  useWidgets,
  useUI,
  selectors,
  ACTION_TYPES,
};
