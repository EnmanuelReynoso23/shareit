import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring,
  interpolate,
} from 'react-native-reanimated';

// Screens
import HomeScreen from '../screens/main/HomeScreen';
import FriendsScreen from '../screens/main/FriendsScreen';
import CameraScreen from '../screens/main/CameraScreen';
import GalleryScreen from '../screens/main/GalleryScreen';
import ProfileScreen from '../screens/main/ProfileScreen';

const Tab = createBottomTabNavigator();

const CustomTabIcon = ({ focused, icon, label, index }) => {
  const scale = useSharedValue(focused ? 1 : 0.8);
  const opacity = useSharedValue(focused ? 1 : 0.6);

  React.useEffect(() => {
    scale.value = withSpring(focused ? 1.2 : 1);
    opacity.value = withSpring(focused ? 1 : 0.7);
  }, [focused]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
      opacity: opacity.value,
    };
  });

  const iconColors = ['#667eea', '#764ba2'];
  const activeColors = ['#ff6b6b', '#ee5a52'];

  return (
    <View style={styles.tabIconContainer}>
      <Animated.View style={[styles.iconWrapper, animatedStyle]}>
        {focused && (
          <LinearGradient
            colors={activeColors}
            style={styles.activeBackground}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
        )}
        <Text style={[
          styles.iconText,
          { color: focused ? '#ffffff' : '#8e8e93' }
        ]}>
          {icon}
        </Text>
      </Animated.View>
      <Text style={[
        styles.labelText,
        { 
          color: focused ? '#667eea' : '#8e8e93',
          fontWeight: focused ? '600' : '400'
        }
      ]}>
        {label}
      </Text>
    </View>
  );
};

const CustomTabBar = ({ state, descriptors, navigation }) => {
  return (
    <View style={styles.tabBarContainer}>
      <LinearGradient
        colors={['rgba(255, 255, 255, 0.95)', 'rgba(255, 255, 255, 0.9)']}
        style={styles.tabBarGradient}
      >
        <View style={styles.tabBar}>
          {state.routes.map((route, index) => {
            const { options } = descriptors[route.key];
            const isFocused = state.index === index;

            const onPress = () => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });

              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            };

            const onLongPress = () => {
              navigation.emit({
                type: 'tabLongPress',
                target: route.key,
              });
            };

            // Definir iconos para cada pantalla
            const getTabIcon = (routeName) => {
              switch (routeName) {
                case 'Home':
                  return '🏠';
                case 'Friends':
                  return '👥';
                case 'Camera':
                  return '📷';
                case 'Gallery':
                  return '🖼️';
                case 'Profile':
                  return '👤';
                default:
                  return '📱';
              }
            };

            const getTabLabel = (routeName) => {
              switch (routeName) {
                case 'Home':
                  return 'Inicio';
                case 'Friends':
                  return 'Amigos';
                case 'Camera':
                  return 'Cámara';
                case 'Gallery':
                  return 'Galería';
                case 'Profile':
                  return 'Perfil';
                default:
                  return routeName;
              }
            };

            return (
              <Animated.View
                key={route.key}
                style={[styles.tabItem, { flex: 1 }]}
              >
                <Animated.View
                  style={styles.touchableArea}
                  onTouchEnd={onPress}
                  onLongPress={onLongPress}
                >
                  <CustomTabIcon
                    focused={isFocused}
                    icon={getTabIcon(route.name)}
                    label={getTabLabel(route.name)}
                    index={index}
                  />
                </Animated.View>
              </Animated.View>
            );
          })}
        </View>
      </LinearGradient>
    </View>
  );
};

const MainNavigator = () => {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      }
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{
          title: 'Inicio',
        }}
      />
      <Tab.Screen 
        name="Friends" 
        component={FriendsScreen}
        options={{
          title: 'Amigos',
        }}
      />
      <Tab.Screen 
        name="Camera" 
        component={CameraScreen}
        options={{
          title: 'Cámara',
        }}
      />
      <Tab.Screen 
        name="Gallery" 
        component={GalleryScreen}
        options={{
          title: 'Galería',
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{
          title: 'Perfil',
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  tabBarGradient: {
    paddingBottom: Platform.OS === 'ios' ? 34 : 0,
  },
  tabBar: {
    flexDirection: 'row',
    height: 70,
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  touchableArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  tabIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    position: 'relative',
  },
  activeBackground: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 20,
  },
  iconText: {
    fontSize: 20,
    zIndex: 1,
  },
  labelText: {
    fontSize: 11,
    textAlign: 'center',
    marginTop: 2,
  },
});

export default MainNavigator;
