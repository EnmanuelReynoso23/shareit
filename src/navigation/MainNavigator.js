import React, { useState, useEffect } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { MaterialIcons } from '@expo/vector-icons';
import { View, Text, Platform } from 'react-native';
import HomeScreen from '../screens/main/HomeScreen';
import GalleryScreen from '../screens/main/GalleryScreen';
import ProfileScreen from '../screens/main/ProfileScreen';
import CameraScreen from '../screens/main/CameraScreen';
import WidgetSettingsScreen from '../screens/main/WidgetSettingsScreen';
import PhotoDetailScreen from '../screens/main/PhotoDetailScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const HomeStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="HomeMain" component={HomeScreen} />
      <Stack.Screen name="WidgetSettings" component={WidgetSettingsScreen} />
      <Stack.Screen name="Camera" component={CameraScreen} />
    </Stack.Navigator>
  );
};

const GalleryStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="GalleryMain" component={GalleryScreen} />
      <Stack.Screen name="PhotoDetail" component={PhotoDetailScreen} />
    </Stack.Navigator>
  );
};


const ProfileStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="ProfileMain" component={ProfileScreen} />
    </Stack.Navigator>
  );
};

// Enhanced Tab Icon Component with error handling
const TabIcon = ({ iconName, color, size, fallbackText }) => {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    // Reset error state when props change
    setHasError(false);
  }, [iconName, color, size]);

  const handleIconError = () => {
    console.warn(`Icon rendering failed for: ${iconName}`);
    setHasError(true);
  };

  if (hasError) {
    return (
      <View
        style={{
          width: size || 24,
          height: size || 24,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: color || '#757575',
          borderRadius: (size || 24) / 2,
        }}
      >
        <Text
          style={{
            color: '#ffffff',
            fontSize: Math.max(8, (size || 24) * 0.4),
            fontWeight: '600',
            textAlign: 'center',
          }}
        >
          {fallbackText}
        </Text>
      </View>
    );
  }

  try {
    return (
      <MaterialIcons 
        name={iconName} 
        size={size || 24} 
        color={color || '#757575'}
        onError={handleIconError}
      />
    );
  } catch (error) {
    console.warn(`MaterialIcons error for ${iconName}:`, error);
    setHasError(true);
    return null;
  }
};

const MainNavigator = () => {
  const [iconsLoaded, setIconsLoaded] = useState(false);

  useEffect(() => {
    // Preload icon fonts
    const loadIcons = async () => {
      try {
        // Give time for fonts to load
        setTimeout(() => {
          setIconsLoaded(true);
        }, 100);
      } catch (error) {
        console.warn('Icon loading warning:', error);
        setIconsLoaded(true); // Still proceed
      }
    };

    loadIcons();
  }, []);

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#e0e0e0',
          paddingBottom: Platform.OS === 'ios' ? 5 : 8,
          paddingTop: 5,
          height: Platform.OS === 'ios' ? 60 : 65,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        },
        tabBarActiveTintColor: '#667eea',
        tabBarInactiveTintColor: '#757575',
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          marginTop: 2,
        },
        tabBarIconStyle: {
          marginBottom: Platform.OS === 'android' ? 2 : 0,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeStack}
        options={{
          tabBarLabel: 'Inicio',
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon 
              iconName="home" 
              color={color} 
              size={focused ? size + 2 : size} 
              fallbackText="⌂"
            />
          ),
        }}
      />
      <Tab.Screen
        name="Gallery"
        component={GalleryStack}
        options={{
          tabBarLabel: 'Galería',
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon 
              iconName="photo-library" 
              color={color} 
              size={focused ? size + 2 : size} 
              fallbackText="📷"
            />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileStack}
        options={{
          tabBarLabel: 'Perfil',
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon 
              iconName="person" 
              color={color} 
              size={focused ? size + 2 : size} 
              fallbackText="👤"
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

export default MainNavigator;
