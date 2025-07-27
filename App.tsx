import React, { useEffect, useState } from 'react';
import { Provider } from 'react-redux';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar, View, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
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

// Types
export interface AppUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

const Stack = createStackNavigator();

function AppContent(): React.JSX.Element {
  const [initializing, setInitializing] = useState<boolean>(true);
  const { user, isAuthenticated, loading, initialized, setUser, clearUser, setAuthLoading } = useAuth();
  const { setNetworkStatus, showNotification } = useUI();

  useEffect(() => {
    let mounted = true;

    // Firebase Auth State Listener
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser: FirebaseUser | null) => {
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
  }, [initializing, setUser, clearUser, setNetworkStatus, showNotification, setAuthLoading]);

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

export default function App(): React.JSX.Element {
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