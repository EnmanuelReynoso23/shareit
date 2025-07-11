import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useUI } from '../store/AppContext';

const { width } = Dimensions.get('window');

const NotificationItem = ({ notification, onDismiss }) => {
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    // Animación de entrada
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const dismiss = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -100,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 0.8,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => onDismiss(notification.id));
  };

  const getNotificationStyle = () => {
    switch (notification.type) {
      case 'success':
        return {
          gradient: ['#4CAF50', '#45a049'],
          icon: '✅',
          borderColor: '#4CAF50',
        };
      case 'error':
        return {
          gradient: ['#f44336', '#da190b'],
          icon: '❌',
          borderColor: '#f44336',
        };
      case 'warning':
        return {
          gradient: ['#ff9800', '#f57c00'],
          icon: '⚠️',
          borderColor: '#ff9800',
        };
      case 'info':
        return {
          gradient: ['#2196F3', '#1976D2'],
          icon: 'ℹ️',
          borderColor: '#2196F3',
        };
      default:
        return {
          gradient: ['#667eea', '#764ba2'],
          icon: '🔔',
          borderColor: '#667eea',
        };
    }
  };

  const style = getNotificationStyle();

  return (
    <Animated.View
      style={[
        styles.notificationContainer,
        {
          transform: [
            { translateY },
            { scale },
          ],
          opacity,
        },
      ]}
    >
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={notification.onPress || dismiss}
        style={styles.notificationTouchable}
      >
        <LinearGradient
          colors={style.gradient}
          style={[styles.notification, { borderColor: style.borderColor }]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.notificationContent}>
            <View style={styles.notificationHeader}>
              <Text style={styles.notificationIcon}>{style.icon}</Text>
              <View style={styles.notificationText}>
                <Text style={styles.notificationTitle}>
                  {notification.title || 'Notificación'}
                </Text>
                {notification.message && (
                  <Text style={styles.notificationMessage}>
                    {notification.message}
                  </Text>
                )}
              </View>
              <TouchableOpacity
                style={styles.dismissButton}
                onPress={dismiss}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={styles.dismissIcon}>×</Text>
              </TouchableOpacity>
            </View>
            
            {notification.actions && notification.actions.length > 0 && (
              <View style={styles.notificationActions}>
                {notification.actions.map((action, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.actionButton,
                      action.primary && styles.primaryActionButton,
                    ]}
                    onPress={() => {
                      action.onPress && action.onPress();
                      dismiss();
                    }}
                  >
                    <Text style={[
                      styles.actionButtonText,
                      action.primary && styles.primaryActionButtonText,
                    ]}>
                      {action.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
          
          {notification.progress !== undefined && (
            <View style={styles.progressContainer}>
              <Animated.View
                style={[
                  styles.progressBar,
                  { 
                    width: `${Math.max(0, Math.min(100, notification.progress))}%` 
                  },
                ]}
              />
            </View>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};

const NotificationSystem = () => {
  const { notifications, hideNotification } = useUI();

  if (!notifications || notifications.length === 0) {
    return null;
  }

  return (
    <View style={styles.notificationSystem} pointerEvents="box-none">
      <SafeAreaView style={styles.safeArea} pointerEvents="box-none">
        <StatusBar backgroundColor="transparent" translucent />
        {notifications.map((notification) => (
          <NotificationItem
            key={notification.id}
            notification={notification}
            onDismiss={hideNotification}
          />
        ))}
      </SafeAreaView>
    </View>
  );
};

// Notification Helper Functions
export const showSuccessNotification = (showNotification, title, message, options = {}) => {
  return showNotification({
    type: 'success',
    title,
    message,
    duration: 3000,
    ...options,
  });
};

export const showErrorNotification = (showNotification, title, message, options = {}) => {
  return showNotification({
    type: 'error',
    title,
    message,
    duration: 5000,
    ...options,
  });
};

export const showWarningNotification = (showNotification, title, message, options = {}) => {
  return showNotification({
    type: 'warning',
    title,
    message,
    duration: 4000,
    ...options,
  });
};

export const showInfoNotification = (showNotification, title, message, options = {}) => {
  return showNotification({
    type: 'info',
    title,
    message,
    duration: 3000,
    ...options,
  });
};

export const showProgressNotification = (showNotification, title, progress, options = {}) => {
  return showNotification({
    type: 'info',
    title,
    progress,
    duration: 0, // No auto-dismiss for progress notifications
    ...options,
  });
};

export const showActionNotification = (showNotification, title, message, actions, options = {}) => {
  return showNotification({
    type: 'info',
    title,
    message,
    actions,
    duration: 0, // No auto-dismiss for action notifications
    ...options,
  });
};

// Custom Hook for easy notifications
export const useNotifications = () => {
  const { showNotification } = useUI();

  return {
    showSuccess: (title, message, options) => 
      showSuccessNotification(showNotification, title, message, options),
    
    showError: (title, message, options) => 
      showErrorNotification(showNotification, title, message, options),
    
    showWarning: (title, message, options) => 
      showWarningNotification(showNotification, title, message, options),
    
    showInfo: (title, message, options) => 
      showInfoNotification(showNotification, title, message, options),
    
    showProgress: (title, progress, options) => 
      showProgressNotification(showNotification, title, progress, options),
    
    showAction: (title, message, actions, options) => 
      showActionNotification(showNotification, title, message, actions, options),
    
    show: showNotification,
  };
};

const styles = StyleSheet.create({
  notificationSystem: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    pointerEvents: 'box-none',
  },
  safeArea: {
    paddingTop: 10,
    paddingHorizontal: 16,
  },
  notificationContainer: {
    marginBottom: 8,
  },
  notificationTouchable: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  notification: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    backgroundColor: '#ffffff',
  },
  notificationContent: {
    padding: 16,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  notificationIcon: {
    fontSize: 20,
    marginRight: 12,
    marginTop: 2,
  },
  notificationText: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 2,
  },
  notificationMessage: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 18,
  },
  dismissButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  dismissIcon: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '600',
    lineHeight: 16,
  },
  notificationActions: {
    flexDirection: 'row',
    marginTop: 12,
    justifyContent: 'flex-end',
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginLeft: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  primaryActionButton: {
    backgroundColor: '#ffffff',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  primaryActionButtonText: {
    color: '#667eea',
  },
  progressContainer: {
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#ffffff',
  },
});

export default NotificationSystem;
