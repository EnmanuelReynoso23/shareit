import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';

// Import main screens
import HomeScreen from '../screens/main/HomeScreen';
import GalleryScreen from '../screens/main/GalleryScreen';
import FriendsScreen from '../screens/main/FriendsScreen';
import ProfileScreen from '../screens/main/ProfileScreen';
import CameraScreen from '../screens/main/CameraScreen';

// Import secondary screens
import WidgetSettingsScreen from '../screens/main/WidgetSettingsScreen';
import PhotoDetailScreen from '../screens/main/PhotoDetailScreen';
import ChatScreen from '../screens/main/ChatScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Stack navigators for each tab
function HomeStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="HomeMain" 
        component={HomeScreen}
        options={{ title: 'ShareIt' }}
      />
      <Stack.Screen 
        name="WidgetSettings" 
        component={WidgetSettingsScreen}
        options={{ title: 'Widget Settings' }}
      />
    </Stack.Navigator>
  );
}

function GalleryStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="GalleryMain" 
        component={GalleryScreen}
        options={{ title: 'Gallery' }}
      />
      <Stack.Screen 
        name="PhotoDetail" 
        component={PhotoDetailScreen}
        options={{ title: 'Photo' }}
      />
      <Stack.Screen 
        name="Camera" 
        component={CameraScreen}
        options={{ title: 'Camera' }}
      />
    </Stack.Navigator>
  );
}

function FriendsStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="FriendsMain" 
        component={FriendsScreen}
        options={{ title: 'Friends' }}
      />
      <Stack.Screen 
        name="Chat" 
        component={ChatScreen}
        options={{ title: 'Chat' }}
      />
    </Stack.Navigator>
  );
}

function ProfileStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="ProfileMain" 
        component={ProfileScreen}
        options={{ title: 'Profile' }}
      />
    </Stack.Navigator>
  );
}

const MainNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Gallery') {
            iconName = focused ? 'images' : 'images-outline';
          } else if (route.name === 'Friends') {
            iconName = focused ? 'people' : 'people-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeStack}
        options={{ title: 'Home' }}
      />
      <Tab.Screen 
        name="Gallery" 
        component={GalleryStack}
        options={{ title: 'Gallery' }}
      />
      <Tab.Screen 
        name="Friends" 
        component={FriendsStack}
        options={{ title: 'Friends' }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileStack}
        options={{ title: 'Profile' }}
      />
    </Tab.Navigator>
  );
};

export default MainNavigator;
