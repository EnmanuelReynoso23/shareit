import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

const { width } = Dimensions.get('window');

const ErrorScreen = ({ 
  title = 'Algo salió mal', 
  message = 'Ha ocurrido un error inesperado. Por favor, intenta nuevamente.',
  onRetry,
  onGoBack,
  showRetry = true,
  showGoBack = true,
  type = 'error' // 'error', 'network', 'notFound'
}) => {
  const fadeAnim = new Animated.Value(0);
  const slideAnim = new Animated.Value(50);

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const getErrorIcon = () => {
    switch (type) {
      case 'network':
        return '📡';
      case 'notFound':
        return '🔍';
      default:
        return '⚠️';
    }
  };

  const getGradientColors = () => {
    switch (type) {
      case 'network':
        return ['#ff6b6b', '#ee5a52'];
      case 'notFound':
        return ['#4ecdc4', '#44a08d'];
      default:
        return ['#ff9a9e', '#fad0c4'];
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={getGradientColors()}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Animated.View
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* Error Icon */}
          <View style={styles.iconContainer}>
            <Text style={styles.errorIcon}>{getErrorIcon()}</Text>
          </View>

          {/* Error Title */}
          <Text style={styles.errorTitle}>{title}</Text>

          {/* Error Message */}
          <Text style={styles.errorMessage}>{message}</Text>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            {showRetry && (
              <TouchableOpacity
                style={[styles.button, styles.primaryButton]}
                onPress={onRetry}
                activeOpacity={0.8}
              >
                <Text style={styles.buttonTextPrimary}>🔄 Reintentar</Text>
              </TouchableOpacity>
            )}

            {showGoBack && (
              <TouchableOpacity
                style={[styles.button, styles.secondaryButton]}
                onPress={onGoBack}
                activeOpacity={0.8}
              >
                <Text style={styles.buttonTextSecondary}>← Volver</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Additional Info */}
          <View style={styles.infoContainer}>
            <Text style={styles.infoText}>
              Si el problema persiste, contacta con soporte
            </Text>
          </View>
        </Animated.View>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    maxWidth: width * 0.9,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  errorIcon: {
    fontSize: 50,
  },
  errorTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 15,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 5,
  },
  errorMessage: {
    fontSize: 16,
    color: '#ffffff',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
    opacity: 0.9,
    fontWeight: '400',
  },
  buttonContainer: {
    width: '100%',
    marginBottom: 30,
  },
  button: {
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 12,
    marginBottom: 15,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  primaryButton: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  secondaryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  buttonTextPrimary: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  buttonTextSecondary: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  infoContainer: {
    paddingHorizontal: 20,
  },
  infoText: {
    fontSize: 14,
    color: '#ffffff',
    textAlign: 'center',
    opacity: 0.7,
    fontStyle: 'italic',
  },
});

export default ErrorScreen;
