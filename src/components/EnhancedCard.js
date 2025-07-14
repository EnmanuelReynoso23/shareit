import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Platform,
  Appearance,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

const { width } = Dimensions.get('window');

const EnhancedCard = ({
  title,
  subtitle,
  icon,
  children,
  onPress,
  gradient = ['#667eea', '#764ba2'],
  cardType = 'default', // 'default', 'feature', 'stats', 'action'
  theme = 'light', // 'light', 'dark', 'auto'
  style,
  disabled = false,
  loading = false,
}) => {
  const [currentTheme, setCurrentTheme] = useState(theme);
  const scaleValue = new Animated.Value(1);
  const opacityValue = new Animated.Value(1);

  // Auto theme detection
  useEffect(() => {
    if (theme === 'auto') {
      const colorScheme = Appearance.getColorScheme();
      setCurrentTheme(colorScheme === 'dark' ? 'dark' : 'light');

      const subscription = Appearance.addChangeListener(({ colorScheme }) => {
        setCurrentTheme(colorScheme === 'dark' ? 'dark' : 'light');
      });

      return () => subscription?.remove();
    } else {
      setCurrentTheme(theme);
    }
  }, [theme]);

  // Get theme-specific styles
  const getThemedStyles = () => {
    const isDark = currentTheme === 'dark';
    
    return {
      defaultCard: {
        ...styles.defaultCard,
        backgroundColor: isDark ? '#1a1a1a' : '#ffffff',
        shadowColor: isDark ? '#000' : '#000',
        shadowOpacity: isDark ? 0.3 : 0.1,
      },
      featureCard: {
        ...styles.featureCard,
        backgroundColor: isDark ? '#2a2a2a' : '#ffffff',
        borderColor: isDark ? 'rgba(102, 126, 234, 0.3)' : 'rgba(102, 126, 234, 0.1)',
        shadowColor: isDark ? '#667eea' : '#667eea',
      },
      statsCard: {
        ...styles.statsCard,
        backgroundColor: isDark ? '#2a2a2a' : '#f8fafe',
        borderColor: isDark ? '#404040' : '#e3e8ff',
      },
      iconContainer: {
        ...styles.iconContainer,
        backgroundColor: isDark ? '#404040' : '#f0f4ff',
      },
      title: {
        ...styles.title,
        color: isDark ? '#ffffff' : '#333',
      },
      featureTitle: {
        ...styles.featureTitle,
        color: isDark ? '#8b9bff' : '#667eea',
      },
      statsTitle: {
        ...styles.statsTitle,
        color: isDark ? '#cccccc' : '#4a5568',
      },
      subtitle: {
        ...styles.subtitle,
        color: isDark ? '#cccccc' : '#666',
      },
      featureSubtitle: {
        ...styles.featureSubtitle,
        color: isDark ? '#a78bfa' : '#7c3aed',
      },
      loadingOverlay: {
        ...styles.loadingOverlay,
        backgroundColor: isDark ? 'rgba(26, 26, 26, 0.8)' : 'rgba(255, 255, 255, 0.8)',
      },
      statValue: {
        ...styles.statValue,
        color: isDark ? '#8b9bff' : '#667eea',
      },
      statLabel: {
        ...styles.statLabel,
        color: isDark ? '#cccccc' : '#666',
      },
      featureText: {
        ...styles.featureText,
        color: isDark ? '#cccccc' : '#4a5568',
      },
    };
  };

  const themedStyles = getThemedStyles();

  const handlePressIn = () => {
    if (disabled || loading) return;
    
    Animated.parallel([
      Animated.spring(scaleValue, {
        toValue: 0.98,
        useNativeDriver: true,
      }),
      Animated.timing(opacityValue, {
        toValue: 0.8,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    if (disabled || loading) return;
    
    Animated.parallel([
      Animated.spring(scaleValue, {
        toValue: 1,
        useNativeDriver: true,
      }),
      Animated.timing(opacityValue, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const getCardStyle = () => {
    switch (cardType) {
      case 'feature':
        return themedStyles.featureCard;
      case 'stats':
        return themedStyles.statsCard;
      case 'action':
        return styles.actionCard;
      default:
        return themedStyles.defaultCard;
    }
  };

  const CardContent = () => (
    <View style={[getCardStyle(), style]}>
      {/* Header */}
      {(title || subtitle || icon) && (
        <View style={styles.cardHeader}>
          {icon && (
            <View style={themedStyles.iconContainer}>
              <Text style={styles.icon}>{icon}</Text>
            </View>
          )}
          <View style={styles.textContainer}>
            {title && (
              <Text style={[
                themedStyles.title,
                cardType === 'feature' && themedStyles.featureTitle,
                cardType === 'stats' && themedStyles.statsTitle,
              ]}>
                {title}
              </Text>
            )}
            {subtitle && (
              <Text style={[
                themedStyles.subtitle,
                cardType === 'feature' && themedStyles.featureSubtitle,
              ]}>
                {subtitle}
              </Text>
            )}
          </View>
        </View>
      )}

      {/* Content */}
      {children && (
        <View style={styles.cardContent}>
          {children}
        </View>
      )}

      {/* Loading Overlay */}
      {loading && (
        <View style={themedStyles.loadingOverlay}>
          <View style={styles.loadingSpinner} />
        </View>
      )}
    </View>
  );

  if (onPress && !disabled && !loading) {
    return (
      <Animated.View
        style={{
          transform: [{ scale: scaleValue }],
          opacity: opacityValue,
        }}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
        >
          {cardType === 'action' ? (
            <LinearGradient
              colors={gradient}
              style={styles.gradientWrapper}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <CardContent />
            </LinearGradient>
          ) : (
            <CardContent />
          )}
        </TouchableOpacity>
      </Animated.View>
    );
  }

  return (
    <View style={[disabled && styles.disabledCard]}>
      {cardType === 'action' ? (
        <LinearGradient
          colors={gradient}
          style={styles.gradientWrapper}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <CardContent />
        </LinearGradient>
      ) : (
        <CardContent />
      )}
    </View>
  );
};

// Stats Component for displaying metrics
const StatsRow = ({ stats }) => (
  <View style={styles.statsRow}>
    {stats.map((stat, index) => (
      <View key={index} style={styles.statItem}>
        <Text style={styles.statValue}>{stat.value}</Text>
        <Text style={styles.statLabel}>{stat.label}</Text>
      </View>
    ))}
  </View>
);

// Feature List Component
const FeatureList = ({ features }) => (
  <View style={styles.featureList}>
    {features.map((feature, index) => (
      <View key={index} style={styles.featureItem}>
        <Text style={styles.featureIcon}>{feature.icon}</Text>
        <Text style={styles.featureText}>{feature.text}</Text>
      </View>
    ))}
  </View>
);

const styles = StyleSheet.create({
  defaultCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginVertical: 8,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  featureCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    marginVertical: 10,
    marginHorizontal: 16,
    shadowColor: '#667eea',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 12,
    borderWidth: 1,
    borderColor: 'rgba(102, 126, 234, 0.1)',
  },
  statsCard: {
    backgroundColor: '#f8fafe',
    borderRadius: 16,
    padding: 20,
    marginVertical: 8,
    marginHorizontal: 16,
    borderWidth: 2,
    borderColor: '#e3e8ff',
  },
  actionCard: {
    borderRadius: 16,
    marginVertical: 8,
    marginHorizontal: 16,
    overflow: 'hidden',
  },
  gradientWrapper: {
    borderRadius: 16,
    padding: 20,
  },
  disabledCard: {
    opacity: 0.5,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f0f4ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  icon: {
    fontSize: 24,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  featureTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#667eea',
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4a5568',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  featureSubtitle: {
    fontSize: 15,
    color: '#7c3aed',
    fontWeight: '500',
  },
  cardContent: {
    flex: 1,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
  },
  loadingSpinner: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#667eea',
    borderTopColor: 'transparent',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#667eea',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  featureList: {
    paddingVertical: 8,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  featureIcon: {
    fontSize: 16,
    marginRight: 12,
  },
  featureText: {
    fontSize: 15,
    color: '#4a5568',
    flex: 1,
  },
});

// Export components
export default EnhancedCard;
export { StatsRow, FeatureList };
