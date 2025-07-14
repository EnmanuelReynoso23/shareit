import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Image,
  ScrollView,
  AppState,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { updateWidgetSettings } from '../../store/slices/widgetsSlice';

const { width } = Dimensions.get('window');

const ClockWidget = ({ 
  widgetId, 
  size = 'medium', 
  theme = 'light',
  showDate = true,
  format24h = false,
  showSeconds = true,
  isShared = false,
  collaborators = [],
  onPress,
  onSharePress,
  style 
}) => {
  const dispatch = useDispatch();
  const widgetSettings = useSelector(state => 
    state.widgets.settings[widgetId] || {}
  );
  
  const [currentTime, setCurrentTime] = useState(new Date());
  const [userTimezone, setUserTimezone] = useState(null);
  const [scaleAnim] = useState(new Animated.Value(1));
  const [pulseAnim] = useState(new Animated.Value(1));
  const isMountedRef = useRef(true);

  // Detect and update timezone changes
  useEffect(() => {
    const detectTimezone = () => {
      try {
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const offset = new Date().getTimezoneOffset() * -1; // Convert to positive offset
        if (isMountedRef.current) {
          setUserTimezone({ name: timezone, offset });
        }
      } catch (error) {
        console.warn('Timezone detection failed:', error);
        // Fallback to basic offset detection
        const offset = new Date().getTimezoneOffset() * -1;
        if (isMountedRef.current) {
          setUserTimezone({ name: 'Local', offset });
        }
      }
    };

    // Initial detection
    detectTimezone();

    // Listen for app state changes (when user travels or changes system time)
    const handleAppStateChange = (nextAppState) => {
      if (nextAppState === 'active') {
        detectTimezone();
      }
    };

    // Re-detect timezone when app becomes active
    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      isMountedRef.current = false;
      subscription?.remove();
    };
  }, []);

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      if (isMountedRef.current) {
        setCurrentTime(new Date());
      }
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Pulse animation for seconds
  useEffect(() => {
    if (showSeconds) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [showSeconds, pulseAnim]);

  const handlePress = useCallback(() => {
    // Scale animation on press
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    if (onPress) {
      onPress();
    }
  }, [onPress, scaleAnim]);

  const toggleFormat = useCallback(() => {
    const newSettings = {
      ...widgetSettings,
      format24h: !format24h,
    };
    dispatch(updateWidgetSettings({ widgetId, settings: newSettings }));
  }, [dispatch, format24h, widgetId, widgetSettings]);

  const formatTime = useCallback((date) => {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const seconds = date.getSeconds();
    
    if (format24h) {
      return {
        time: `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`,
        seconds: seconds.toString().padStart(2, '0'),
        period: ''
      };
    } else {
      const period = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours % 12 || 12;
      return {
        time: `${displayHours}:${minutes.toString().padStart(2, '0')}`,
        seconds: seconds.toString().padStart(2, '0'),
        period: period
      };
    }
  }, [format24h]);

  const formatDate = useCallback((date) => {
    const options = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return date.toLocaleDateString('es-ES', options);
  }, []);

  // Get time for specific timezone
  const getTimeForTimezone = useCallback((timezone) => {
    const date = new Date();
    if (timezone === 'local') {
      return date;
    }
    
    // Create date in specific timezone
    const utc = date.getTime() + (date.getTimezoneOffset() * 60000);
    const targetTime = new Date(utc + (timezone * 3600000));
    return targetTime;
  }, []);

  // Get collaborator timezones
  const getCollaboratorTimezones = useCallback(() => {
    if (!isShared || collaborators.length === 0) return [];
    
    return collaborators
      .filter(c => c.timezone && c.timezone !== 'local')
      .slice(0, 3) // Max 3 additional timezones
      .map(collaborator => ({
        ...collaborator,
        time: getTimeForTimezone(collaborator.timezone),
        timezoneName: collaborator.timezoneName || `UTC${collaborator.timezone >= 0 ? '+' : ''}${collaborator.timezone}`
      }));
  }, [isShared, collaborators, getTimeForTimezone]);

  // Render collaborators avatars
  const renderCollaborators = () => {
    if (!isShared || collaborators.length === 0) return null;

    return (
      <View style={defaultStyles.collaboratorsContainer}>
        {collaborators.slice(0, 3).map((collaborator, index) => (
          <View
            key={collaborator.id || index}
            style={[
              defaultStyles.collaboratorAvatar,
              { 
                marginLeft: index > 0 ? -6 : 0,
                zIndex: collaborators.length - index 
              }
            ]}
          >
            {collaborator.photoURL ? (
              <Image
                source={{ uri: collaborator.photoURL }}
                style={defaultStyles.avatarImage}
              />
            ) : (
              <View style={[defaultStyles.avatarPlaceholder, { backgroundColor: styles.theme.iconColor }]}>
                <Text style={defaultStyles.avatarText}>
                  {collaborator.displayName?.[0]?.toUpperCase() || '?'}
                </Text>
              </View>
            )}
            {collaborator.isOnline && (
              <View style={defaultStyles.onlineIndicator} />
            )}
          </View>
        ))}
        {collaborators.length > 3 && (
          <View style={[defaultStyles.collaboratorAvatar, { marginLeft: -6 }]}>
            <View style={[defaultStyles.avatarPlaceholder, { backgroundColor: styles.theme.iconColor }]}>
              <Text style={defaultStyles.avatarText}>
                +{collaborators.length - 3}
              </Text>
            </View>
          </View>
        )}
      </View>
    );
  };

  // Render additional timezones
  const renderAdditionalTimezones = () => {
    const additionalTimezones = getCollaboratorTimezones();
    if (additionalTimezones.length === 0) return null;

    return (
      <ScrollView 
        style={defaultStyles.timezonesContainer}
        showsVerticalScrollIndicator={false}
      >
        {additionalTimezones.map((collaborator, index) => {
          const { time: collabTime, seconds: collabSeconds, period: collabPeriod } = formatTime(collaborator.time);
          
          return (
            <View key={collaborator.id || index} style={defaultStyles.timezoneItem}>
              <View style={defaultStyles.timezoneHeader}>
                <View style={defaultStyles.timezoneAvatar}>
                  {collaborator.photoURL ? (
                    <Image
                      source={{ uri: collaborator.photoURL }}
                      style={defaultStyles.timezoneAvatarImage}
                    />
                  ) : (
                    <View style={[defaultStyles.timezoneAvatarPlaceholder, { backgroundColor: styles.theme.iconColor }]}>
                      <Text style={defaultStyles.timezoneAvatarText}>
                        {collaborator.displayName?.[0]?.toUpperCase() || '?'}
                      </Text>
                    </View>
                  )}
                  {collaborator.isOnline && (
                    <View style={defaultStyles.timezoneOnlineIndicator} />
                  )}
                </View>
                
                <View style={defaultStyles.timezoneInfo}>
                  <Text style={[defaultStyles.collaboratorName, styles.theme.dateText]}>
                    {collaborator.displayName || 'Usuario'}
                  </Text>
                  <Text style={[defaultStyles.timezoneName, styles.theme.dateText]}>
                    {collaborator.timezoneName}
                  </Text>
                </View>
              </View>
              
              <View style={defaultStyles.collaboratorTimeContainer}>
                <Text style={[
                  defaultStyles.collaboratorTime,
                  styles.theme.timeText,
                  { fontSize: styles.size.timeText.fontSize * 0.7 }
                ]}>
                  {collabTime}
                </Text>
                
                {showSeconds && (
                  <Text style={[
                    defaultStyles.collaboratorSeconds,
                    styles.theme.secondsText,
                    { fontSize: styles.size.secondsText.fontSize * 0.7 }
                  ]}>
                    :{collabSeconds}
                  </Text>
                )}
                
                {collabPeriod && (
                  <Text style={[
                    defaultStyles.collaboratorPeriod,
                    styles.theme.periodText,
                    { fontSize: styles.size.periodText.fontSize * 0.7 }
                  ]}>
                    {collabPeriod}
                  </Text>
                )}
              </View>
            </View>
          );
        })}
      </ScrollView>
    );
  };

  const { time, seconds, period } = formatTime(currentTime);
  const dateString = formatDate(currentTime);

  const getStyles = useCallback(() => {
    const sizeStyles = {
      small: {
        container: { width: width * 0.4, height: 80 },
        timeText: { fontSize: 18 },
        secondsText: { fontSize: 12 },
        periodText: { fontSize: 14 },
        dateText: { fontSize: 10 },
      },
      medium: {
        container: { width: width * 0.6, height: 120 },
        timeText: { fontSize: 28 },
        secondsText: { fontSize: 16 },
        periodText: { fontSize: 18 },
        dateText: { fontSize: 12 },
      },
      large: {
        container: { width: width * 0.8, height: 160 },
        timeText: { fontSize: 36 },
        secondsText: { fontSize: 20 },
        periodText: { fontSize: 24 },
        dateText: { fontSize: 14 },
      },
    };

    const themeStyles = {
      light: {
        container: { backgroundColor: '#ffffff', borderColor: '#e0e0e0' },
        timeText: { color: '#333333' },
        secondsText: { color: '#666666' },
        periodText: { color: '#333333' },
        dateText: { color: '#666666' },
        iconColor: '#666666',
      },
      dark: {
        container: { backgroundColor: '#1a1a1a', borderColor: '#333333' },
        timeText: { color: '#ffffff' },
        secondsText: { color: '#cccccc' },
        periodText: { color: '#ffffff' },
        dateText: { color: '#cccccc' },
        iconColor: '#cccccc',
      },
      gradient: {
        container: { backgroundColor: '#667eea', borderColor: '#764ba2' },
        timeText: { color: '#ffffff' },
        secondsText: { color: '#f0f0f0' },
        periodText: { color: '#ffffff' },
        dateText: { color: '#f0f0f0' },
        iconColor: '#ffffff',
      },
    };

    return {
      size: sizeStyles[size],
      theme: themeStyles[theme],
    };
  }, [size, theme]);

  const styles = getStyles();

  return (
    <Animated.View style={[
      defaultStyles.container,
      styles.size.container,
      styles.theme.container,
      { transform: [{ scale: scaleAnim }] },
      style
    ]}>
      <TouchableOpacity
        onPress={handlePress}
        onLongPress={toggleFormat}
        style={defaultStyles.touchable}
        activeOpacity={0.8}
      >
        <View style={defaultStyles.header}>
          <View style={defaultStyles.titleContainer}>
            <Ionicons 
              name={isShared ? "globe-outline" : "time-outline"} 
              size={20} 
              color={isShared ? "#4CAF50" : styles.theme.iconColor} 
            />
            {isShared && (
              <View style={defaultStyles.sharedBadge}>
                <Text style={defaultStyles.sharedBadgeText}>ZONAS GLOBALES</Text>
              </View>
            )}
          </View>
          
          <View style={defaultStyles.headerActions}>
            {renderCollaborators()}
            {onSharePress && !isShared && (
              <TouchableOpacity onPress={onSharePress}>
                <Ionicons 
                  name="share-outline" 
                  size={18} 
                  color={styles.theme.iconColor} 
                />
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={toggleFormat}>
              <Text style={[
                defaultStyles.formatText,
                { color: styles.theme.iconColor }
              ]}>
                {format24h ? '24h' : '12h'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={defaultStyles.timeContainer}>
          <Text style={[
            defaultStyles.timeText,
            styles.size.timeText,
            styles.theme.timeText
          ]}>
            {time}
          </Text>
          
          {showSeconds && (
            <Animated.Text style={[
              defaultStyles.secondsText,
              styles.size.secondsText,
              styles.theme.secondsText,
              { transform: [{ scale: pulseAnim }] }
            ]}>
              :{seconds}
            </Animated.Text>
          )}
          
          {period && (
            <Text style={[
              defaultStyles.periodText,
              styles.size.periodText,
              styles.theme.periodText
            ]}>
              {period}
            </Text>
          )}
        </View>

        {showDate && (
          <Text style={[
            defaultStyles.dateText,
            styles.size.dateText,
            styles.theme.dateText
          ]}>
            {dateString}
          </Text>
        )}

        {/* Additional Timezones for Collaborators */}
        {renderAdditionalTimezones()}
      </TouchableOpacity>
    </Animated.View>
  );
};

const defaultStyles = StyleSheet.create({
  container: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    margin: 8,
  },
  touchable: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 8,
  },
  formatText: {
    fontSize: 12,
    fontWeight: '600',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  timeText: {
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  secondsText: {
    fontFamily: 'monospace',
    marginLeft: 2,
  },
  periodText: {
    fontWeight: '600',
    marginLeft: 8,
  },
  dateText: {
    textAlign: 'center',
    marginTop: 8,
    fontWeight: '500',
  },
  // Collaboration styles
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sharedBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 8,
  },
  sharedBadgeText: {
    color: '#fff',
    fontSize: 8,
    fontWeight: '600',
  },
  collaboratorsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  collaboratorAvatar: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#fff',
    position: 'relative',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 7,
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: 7,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 7,
    fontWeight: '600',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4CAF50',
    borderWidth: 1,
    borderColor: '#fff',
  },
  // Additional timezones styles
  timezonesContainer: {
    marginTop: 12,
    maxHeight: 80,
    width: '100%',
  },
  timezoneItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
    marginBottom: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
  },
  timezoneHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  timezoneAvatar: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 8,
    position: 'relative',
  },
  timezoneAvatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  timezoneAvatarPlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timezoneAvatarText: {
    color: '#fff',
    fontSize: 6,
    fontWeight: '600',
  },
  timezoneOnlineIndicator: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#4CAF50',
    borderWidth: 0.5,
    borderColor: '#fff',
  },
  timezoneInfo: {
    flex: 1,
  },
  collaboratorName: {
    fontSize: 8,
    fontWeight: '600',
    marginBottom: 1,
  },
  timezoneName: {
    fontSize: 7,
    opacity: 0.8,
  },
  collaboratorTimeContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  collaboratorTime: {
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  collaboratorSeconds: {
    fontFamily: 'monospace',
    marginLeft: 1,
  },
  collaboratorPeriod: {
    fontWeight: '600',
    marginLeft: 4,
  },
});

export default ClockWidget;
