import { Platform } from 'react-native';
import { PlatformInfo } from '../types';

/**
 * Detects the current platform and returns information about the environment
 */
export function getPlatformInfo(): PlatformInfo {
  const isWeb = Platform.OS === 'web';
  const isMobile = Platform.OS === 'ios' || Platform.OS === 'android';
  
  // Check if running in Electron
  const isElectron = typeof globalThis !== 'undefined' && 
                    typeof globalThis.window !== 'undefined' &&
                    typeof (globalThis.window as any).electronAPI !== 'undefined';

  let platform: PlatformInfo['platform'];
  
  if (isElectron) {
    platform = 'desktop';
  } else if (isWeb) {
    platform = 'web';
  } else {
    platform = Platform.OS as 'ios' | 'android';
  }

  return {
    isWeb,
    isMobile,
    isElectron,
    platform,
  };
}

/**
 * Returns true if the app is running on mobile (iOS or Android)
 */
export const isMobile = (): boolean => {
  return Platform.OS === 'ios' || Platform.OS === 'android';
};

/**
 * Returns true if the app is running on web
 */
export const isWeb = (): boolean => {
  return Platform.OS === 'web';
};

/**
 * Returns true if the app is running in Electron desktop app
 */
export const isElectron = (): boolean => {
  return typeof globalThis !== 'undefined' && 
         typeof globalThis.window !== 'undefined' &&
         typeof (globalThis.window as any).electronAPI !== 'undefined';
};

/**
 * Returns true if the app is running on iOS
 */
export const isIOS = (): boolean => {
  return Platform.OS === 'ios';
};

/**
 * Returns true if the app is running on Android
 */
export const isAndroid = (): boolean => {
  return Platform.OS === 'android';
};

/**
 * Returns the current platform as a string
 */
export const getCurrentPlatform = (): string => {
  if (isElectron()) {
    return 'desktop';
  }
  return Platform.OS;
};

/**
 * Get Electron API if available
 */
export const getElectronAPI = () => {
  if (typeof globalThis !== 'undefined' && 
      typeof globalThis.window !== 'undefined' && 
      (globalThis.window as any).electronAPI) {
    return (globalThis.window as any).electronAPI;
  }
  return null;
};

/**
 * Platform-specific styles helper
 */
export const platformSelect = <T>(options: {
  ios?: T;
  android?: T;
  web?: T;
  desktop?: T;
  default?: T;
}): T | undefined => {
  const platformInfo = getPlatformInfo();
  
  if (platformInfo.isElectron && options.desktop) {
    return options.desktop;
  }
  
  if (platformInfo.isWeb && options.web) {
    return options.web;
  }
  
  if (Platform.OS === 'ios' && options.ios) {
    return options.ios;
  }
  
  if (Platform.OS === 'android' && options.android) {
    return options.android;
  }
  
  return options.default;
};