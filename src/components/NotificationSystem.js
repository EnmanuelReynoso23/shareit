import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useUI } from '../store/AppContext';

const NotificationSystem = () => {
  const { notifications, hideNotification } = useUI();

  if (!notifications || notifications.length === 0) {
    return null;
  }

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'success':
        return 'check-circle';
      case 'error':
        return 'error';
      case 'warning':
        return 'warning';
      case 'info':
      default:
        return 'info';
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'success':
        return '#4caf50';
      case 'error':
        return '#f44336';
      case 'warning':
        return '#ff9800';
      case 'info':
      default:
        return '#2196f3';
    }
  };

  return (
    <SafeAreaView style={styles.container} pointerEvents="box-none">
      <View style={styles.notificationsContainer}>
        {notifications.map((notification) => (
          <Animated.View
            key={notification.id}
            style={[
              styles.notification,
              { borderLeftColor: getNotificationColor(notification.type) }
            ]}
          >
            <View style={styles.notificationContent}>
              <View style={styles.notificationHeader}>
                <MaterialIcons
                  name={getNotificationIcon(notification.type)}
                  size={20}
                  color={getNotificationColor(notification.type)}
                />
                <Text style={styles.notificationTitle}>
                  {notification.title || 'Notificación'}
                </Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => hideNotification(notification.id)}
                >
                  <MaterialIcons name="close" size={18} color="#999" />
                </TouchableOpacity>
              </View>
              {notification.message && (
                <Text style={styles.notificationMessage}>
                  {notification.message}
                </Text>
              )}
            </View>
          </Animated.View>
        ))}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  notificationsContainer: {
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  notification: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 8,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  notificationContent: {
    padding: 16,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  notificationTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  closeButton: {
    padding: 4,
  },
  notificationMessage: {
    fontSize: 14,
    color: '#666',
    marginLeft: 28,
    lineHeight: 18,
  },
});

export default NotificationSystem;
