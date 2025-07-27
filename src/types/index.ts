// User types
export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified?: boolean;
  phoneNumber?: string | null;
  createdAt?: string;
  lastLoginAt?: string;
}

// Photo types
export interface Photo {
  id: string;
  url: string;
  thumbnail?: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: string;
  uploadedBy: string;
  description?: string;
  tags?: string[];
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  metadata?: {
    width: number;
    height: number;
    camera?: string;
    iso?: number;
    focalLength?: number;
    aperture?: number;
    shutterSpeed?: string;
  };
}

// Widget types
export interface Widget {
  id: string;
  type: 'photo' | 'text' | 'location' | 'weather' | 'calendar';
  title: string;
  content: any;
  position: {
    x: number;
    y: number;
  };
  size: {
    width: number;
    height: number;
  };
  createdAt: string;
  createdBy: string;
  updatedAt?: string;
  updatedBy?: string;
  isPublic: boolean;
  collaborators?: string[];
}

// Notification types
export interface Notification {
  id?: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
  action?: {
    label: string;
    onPress: () => void;
  };
}

// Navigation types
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};

export type AuthStackParamList = {
  Welcome: undefined;
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};

export type MainStackParamList = {
  Home: undefined;
  Camera: undefined;
  Gallery: undefined;
  Profile: undefined;
  Settings: undefined;
  PhotoDetail: { photoId: string };
  WidgetEditor: { widgetId?: string };
};

export type TabParamList = {
  Home: undefined;
  Gallery: undefined;
  Camera: undefined;
  Widgets: undefined;
  Profile: undefined;
};

// Redux state types
export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

export interface PhotosState {
  photos: Photo[];
  loading: boolean;
  error: string | null;
  uploadProgress: { [key: string]: number };
}

export interface WidgetsState {
  widgets: Widget[];
  loading: boolean;
  error: string | null;
  selectedWidget: Widget | null;
}

export interface UserState {
  profile: User | null;
  settings: UserSettings;
  loading: boolean;
  error: string | null;
}

export interface UserSettings {
  theme: 'light' | 'dark' | 'auto';
  language: 'es' | 'en';
  notifications: {
    push: boolean;
    email: boolean;
    inApp: boolean;
  };
  privacy: {
    profilePublic: boolean;
    photosPublic: boolean;
    locationSharing: boolean;
  };
  camera: {
    quality: 'low' | 'medium' | 'high';
    saveToGallery: boolean;
    geotagging: boolean;
  };
}

// API response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Platform detection
export interface PlatformInfo {
  isWeb: boolean;
  isMobile: boolean;
  isElectron: boolean;
  platform: 'ios' | 'android' | 'web' | 'desktop';
}

// Storage types
export interface StorageKeys {
  USER_TOKEN: string;
  USER_SETTINGS: string;
  CACHED_PHOTOS: string;
  CACHED_WIDGETS: string;
  OFFLINE_QUEUE: string;
}

// Error types
export interface AppError {
  code: string;
  message: string;
  details?: any;
  timestamp: string;
}

// Upload types
export interface UploadTask {
  id: string;
  file: File | any;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'failed';
  error?: string;
}

// Camera types
export interface CameraOptions {
  quality: number;
  allowsEditing: boolean;
  aspect: [number, number];
  exif: boolean;
  base64: boolean;
}

export interface CapturedPhoto {
  uri: string;
  width: number;
  height: number;
  base64?: string;
  exif?: any;
}