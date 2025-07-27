import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  ActivityIndicator,
  Easing,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { platformSelect, isElectron, getPlatformInfo } from '../utils/platform';

const { width, height } = Dimensions.get('window');

interface LoadingScreenProps {
  message?: string;
  progress?: number;
  showProgress?: boolean;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ 
  message = 'Cargando...', 
  progress = 0,
  showProgress = false 
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.3)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animación de entrada
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, scaleAnim]);

  useEffect(() => {
    // Animación de progreso
    if (showProgress) {
      Animated.timing(progressAnim, {
        toValue: progress,
        duration: 500,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start();
    }
  }, [progress, progressAnim, showProgress]);

  const platformInfo = getPlatformInfo();
  const containerStyle = [
    styles.container,
    platformInfo.isElectron && styles.desktopContainer,
    platformInfo.isWeb && styles.webContainer,
  ];

  return (
    <LinearGradient
      colors={['#667eea', '#764ba2']}
      style={containerStyle}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {/* Logo o icono */}
        <View style={styles.logoContainer}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>📸</Text>
          </View>
        </View>

        {/* Título */}
        <Text style={styles.title}>ShareIt</Text>
        
        {/* Mensaje de carga */}
        <Text style={styles.message}>{message}</Text>

        {/* Indicador de actividad */}
        <View style={styles.activityContainer}>
          <ActivityIndicator 
            size="large" 
            color="#ffffff" 
            style={styles.activityIndicator}
          />
        </View>

        {/* Barra de progreso (opcional) */}
        {showProgress && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBarBackground}>
              <Animated.View
                style={[
                  styles.progressBar,
                  {
                    width: progressAnim.interpolate({
                      inputRange: [0, 100],
                      outputRange: ['0%', '100%'],
                    }),
                  },
                ]}
              />
            </View>
            <Text style={styles.progressText}>{Math.round(progress)}%</Text>
          </View>
        )}

        {/* Platform indicator for development */}
        {__DEV__ && (
          <Text style={styles.platformText}>
            Platform: {isElectron() ? 'Electron Desktop' : 'Mobile/Web'}
          </Text>
        )}
      </Animated.View>

      {/* Elementos decorativos */}
      <View style={styles.decorativeElements}>
        {[...Array(5)].map((_, index) => (
          <Animated.View
            key={index}
            style={[
              styles.decorativeCircle,
              {
                opacity: fadeAnim,
                transform: [
                  {
                    translateY: fadeAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [50, 0],
                    }),
                  },
                ],
              },
              {
                left: `${20 + index * 15}%`,
                top: `${70 + (index % 2) * 10}%`,
              },
            ]}
          />
        ))}
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#667eea',
  },
  webContainer: {
    minHeight: height,
    width: '100%',
  },
  desktopContainer: {
    minHeight: height,
    borderRadius: 8,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    zIndex: 2,
  },
  logoContainer: {
    marginBottom: 30,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  logoText: {
    fontSize: 32,
    textAlign: 'center',
  },
  title: {
    fontSize: platformSelect({
      desktop: 32,
      web: 28,
      default: 24,
    }),
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 10,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  message: {
    fontSize: platformSelect({
      desktop: 18,
      web: 16,
      default: 14,
    }),
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 20,
  },
  activityContainer: {
    marginBottom: 20,
  },
  activityIndicator: {
    transform: [{ scale: 1.2 }],
  },
  progressContainer: {
    width: width * 0.7,
    maxWidth: platformSelect({
      desktop: 300,
      web: 400,
      default: width * 0.7,
    }),
    alignItems: 'center',
    marginTop: 20,
  },
  progressBarBackground: {
    width: '100%',
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 3,
  },
  progressText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 12,
    fontWeight: '600',
  },
  platformText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 10,
    marginTop: 20,
    fontStyle: 'italic',
  },
  decorativeElements: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    zIndex: 1,
  },
  decorativeCircle: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
});

export default LoadingScreen;