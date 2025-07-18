import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      errorId: Date.now().toString(),
    };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error: error,
      errorInfo: errorInfo,
    });

    // Report error to crash reporting service
    this.reportError(error, errorInfo);
  }

  reportError = (error, errorInfo) => {
    // In a real app, you would send this to a crash reporting service
    const errorReport = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    console.error('Error Report:', errorReport);
    
    // Example: Send to crash reporting service
    // crashReporting.recordError(errorReport);
  };

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const { error, errorInfo } = this.state;
      const isDevelopment = __DEV__;

      return (
        <SafeAreaView style={styles.container}>
          <View style={styles.content}>
            <Text style={styles.title}>🚨 Algo salió mal</Text>
            <Text style={styles.message}>
              La aplicación encontró un error inesperado. Nuestro equipo ha sido notificado.
            </Text>

            <View style={styles.actions}>
              <TouchableOpacity style={styles.retryButton} onPress={this.handleRetry}>
                <Text style={styles.retryButtonText}>Intentar de nuevo</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.reloadButton} onPress={this.handleReload}>
                <Text style={styles.reloadButtonText}>Recargar aplicación</Text>
              </TouchableOpacity>
            </View>

            {isDevelopment && error && (
              <ScrollView style={styles.errorDetails}>
                <Text style={styles.errorTitle}>Detalles del error (solo en desarrollo):</Text>
                <Text style={styles.errorText}>
                  {error.toString()}
                </Text>
                {errorInfo && (
                  <Text style={styles.errorStack}>
                    {errorInfo.componentStack}
                  </Text>
                )}
              </ScrollView>
            )}

            <Text style={styles.errorId}>
              ID del error: {this.state.errorId}
            </Text>
          </View>
        </SafeAreaView>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafe',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  actions: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 32,
  },
  retryButton: {
    backgroundColor: '#667eea',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  reloadButton: {
    backgroundColor: '#ff6b6b',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  reloadButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  errorDetails: {
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 8,
    maxHeight: 200,
    width: '100%',
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'monospace',
  },
  errorStack: {
    fontSize: 10,
    color: '#999',
    fontFamily: 'monospace',
    marginTop: 8,
  },
  errorId: {
    fontSize: 12,
    color: '#999',
    fontFamily: 'monospace',
  },
});

export default ErrorBoundary;