import React, { useEffect, useState } from 'react';
import { Provider } from 'react-redux';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar, View, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { onAuthStateChanged } from 'firebase/auth';
import NetInfo from '@react-native-community/netinfo';

// Store
import { store } from './src/store';
import { AppProvider, useUI, useAuth } from './src/store/AppContext';
import { auth } from './config/firebase';

// Navigation
import AuthNavigator from './src/navigation/AuthNavigator';
import MainNavigator from './src/navigation/MainNavigator';

// Components
import LoadingScreen from './src/components/LoadingScreen';
import NotificationSystem from './src/components/NotificationSystem';
import ErrorBoundary from './src/components/ErrorBoundary';

const Stack = createStackNavigator();

function AppContent() {
  const [initializing, setInitializing] = useState(true);
  const { user, isAuthenticated, loading, initialized, setUser, clearUser, setAuthLoading } = useAuth();
  const { setNetworkStatus, showNotification } = useUI();

  useEffect(() => {
    let mounted = true;

    // Firebase Auth State Listener
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (!mounted) return;

      if (firebaseUser) {
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
        });
      } else {
        clearUser();
      }
      
      if (initializing) {
        setInitializing(false);
        setAuthLoading(false);
      }
    });

    // Network Status Listener
    const networkUnsubscribe = NetInfo.addEventListener(state => {
      if (!mounted) return;

      const status = state.isConnected ? 'online' : 'offline';
      setNetworkStatus(status);
      
      if (!state.isConnected) {
        showNotification({
          type: 'warning',
          title: 'Sin Conexión',
          message: 'Verifica tu conexión a internet',
          duration: 3000,
        });
      }
    });

    // Cleanup
    return () => {
      mounted = false;
      unsubscribe();
      networkUnsubscribe();
    };
  }, [initializing, setUser, clearUser, setNetworkStatus, showNotification]);

  // Show loading screen while checking auth state
  if (initializing || loading || !initialized) {
    return (
      <LoadingScreen 
        message="Iniciando ShareIt..."
        showProgress={true}
        progress={85}
      />
    );
  }

  return (
    <ErrorBoundary>
      <View style={styles.container}>
        <StatusBar 
          barStyle="light-content" 
          backgroundColor="#667eea" 
          translucent={false}
        />
        <NavigationContainer>
          <Stack.Navigator
            screenOptions={{
              headerShown: false,
              cardStyle: { backgroundColor: '#f8fafe' },
            }}
          >
            {isAuthenticated ? (
              <Stack.Screen 
                name="Main" 
                component={MainNavigator}
                options={{
                  animationTypeForReplace: !user ? 'pop' : 'push',
                }}
              />
            ) : (
              <Stack.Screen 
                name="Auth" 
                component={AuthNavigator} 
              />
            )}
          </Stack.Navigator>
        </NavigationContainer>
        <NotificationSystem />
      </View>
    </ErrorBoundary>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <Provider store={store}>
        <AppProvider>
          <SafeAreaProvider>
            <AppContent />
          </SafeAreaProvider>
        </AppProvider>
      </Provider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafe',
  },
});
