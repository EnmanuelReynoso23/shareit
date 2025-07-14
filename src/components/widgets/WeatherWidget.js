import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Alert,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { updateWidgetSettings } from '../../store/slices/widgetsSlice';
import * as Location from 'expo-location';

const { width } = Dimensions.get('window');

const WeatherWidget = ({ 
  widgetId, 
  size = 'medium', 
  theme = 'light',
  showForecast = false,
  showDetails = true,
  units = 'metric', // 'metric' or 'imperial'
  onPress,
  style 
}) => {
  const dispatch = useDispatch();
  const widgetSettings = useSelector(state => 
    state.widgets.settings[widgetId] || {}
  );
  
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [location, setLocation] = useState(null);
  const [scaleAnim] = useState(new Animated.Value(1));
  const [refreshAnim] = useState(new Animated.Value(0));
  const isMountedRef = useRef(true);

  // Mock weather data for demonstration
  const mockWeatherData = {
    current: {
      temp: 28,
      feels_like: 32,
      humidity: 65,
      pressure: 1013,
      description: 'Soleado',
      icon: 'sunny',
      wind_speed: 5.2,
      uv_index: 7,
    },
    location: {
      name: 'Santo Domingo',
      country: 'DO',
    },
    forecast: [
      { day: 'Hoy', temp_max: 31, temp_min: 24, icon: 'sunny', description: 'Soleado' },
      { day: 'Mañana', temp_max: 29, temp_min: 23, icon: 'partly-sunny', description: 'Parcialmente nublado' },
      { day: 'Pasado', temp_max: 27, temp_min: 22, icon: 'rainy', description: 'Lluvia ligera' },
    ],
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (isMountedRef.current) {
      fetchWeather();
    }
  }, [units, widgetId]);

  const fetchWeather = async () => {
    if (!isMountedRef.current) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Request location permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        if (isMountedRef.current) {
          setError('Permisos de ubicación denegados');
          setWeather(mockWeatherData); // Use mock data
          setLoading(false);
        }
        return;
      }

      // Get current location
      const userLocation = await Location.getCurrentPositionAsync({});
      if (isMountedRef.current) {
        setLocation(userLocation.coords);
      }

      // For now, use mock data
      // In a real app, you would fetch from a weather API like OpenWeatherMap
      setTimeout(() => {
        if (isMountedRef.current) {
          setWeather(mockWeatherData);
          setLoading(false);
          setError(null); // Clear any previous errors
        }
      }, 1000);

    } catch (err) {
      console.error('Weather fetch error:', err);
      if (isMountedRef.current) {
        setError('Error al obtener el clima');
        setWeather(mockWeatherData); // Fallback to mock data
        setLoading(false);
      }
    }
  };

  const handlePress = () => {
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
  };

  const handleRefresh = () => {
    // Refresh animation
    Animated.timing(refreshAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start(() => {
      refreshAnim.setValue(0);
    });

    fetchWeather();
  };

  const toggleUnits = () => {
    const newUnits = units === 'metric' ? 'imperial' : 'metric';
    const newSettings = {
      ...widgetSettings,
      units: newUnits,
    };
    dispatch(updateWidgetSettings({ widgetId, settings: newSettings }));
  };

  const getWeatherIcon = (iconName) => {
    const iconMap = {
      'sunny': 'sunny',
      'partly-sunny': 'partly-sunny',
      'cloudy': 'cloudy',
      'rainy': 'rainy',
      'stormy': 'thunderstorm',
      'snowy': 'snow',
      'windy': 'cloudy-night',
    };
    return iconMap[iconName] || 'sunny';
  };

  const convertTemp = (temp) => {
    if (units === 'imperial') {
      return Math.round((temp * 9/5) + 32);
    }
    return Math.round(temp);
  };

  const getUnitSymbol = () => {
    return units === 'metric' ? '°C' : '°F';
  };

  const getStyles = () => {
    const sizeStyles = {
      small: {
        container: { width: width * 0.4, height: 120 },
        tempText: { fontSize: 24 },
        locationText: { fontSize: 10 },
        descriptionText: { fontSize: 9 },
        detailText: { fontSize: 8 },
        forecastTemp: { fontSize: 10 },
      },
      medium: {
        container: { width: width * 0.6, height: 200 },
        tempText: { fontSize: 32 },
        locationText: { fontSize: 12 },
        descriptionText: { fontSize: 11 },
        detailText: { fontSize: 10 },
        forecastTemp: { fontSize: 12 },
      },
      large: {
        container: { width: width * 0.8, height: 280 },
        tempText: { fontSize: 40 },
        locationText: { fontSize: 14 },
        descriptionText: { fontSize: 13 },
        detailText: { fontSize: 12 },
        forecastTemp: { fontSize: 14 },
      },
    };

    const themeStyles = {
      light: {
        container: { backgroundColor: '#ffffff', borderColor: '#e0e0e0' },
        tempText: { color: '#333333' },
        locationText: { color: '#666666' },
        descriptionText: { color: '#555555' },
        detailText: { color: '#666666' },
        iconColor: '#666666',
        errorText: { color: '#ff6b6b' },
      },
      dark: {
        container: { backgroundColor: '#1a1a1a', borderColor: '#333333' },
        tempText: { color: '#ffffff' },
        locationText: { color: '#cccccc' },
        descriptionText: { color: '#dddddd' },
        detailText: { color: '#aaaaaa' },
        iconColor: '#cccccc',
        errorText: { color: '#ff8a8a' },
      },
      gradient: {
        container: { backgroundColor: '#667eea', borderColor: '#764ba2' },
        tempText: { color: '#ffffff' },
        locationText: { color: '#f0f0f0' },
        descriptionText: { color: '#ffffff' },
        detailText: { color: '#e0e0e0' },
        iconColor: '#ffffff',
        errorText: { color: '#ffcccb' },
      },
    };

    return {
      size: sizeStyles[size],
      theme: themeStyles[theme],
    };
  };

  const styles = getStyles();

  const renderLoading = () => (
    <View style={defaultStyles.centerContent}>
      <Ionicons 
        name="refresh" 
        size={30} 
        color={styles.theme.iconColor} 
      />
      <Text style={[
        defaultStyles.loadingText,
        styles.theme.detailText
      ]}>
        Cargando clima...
      </Text>
    </View>
  );

  const renderError = () => (
    <View style={defaultStyles.centerContent}>
      <Ionicons 
        name="alert-circle" 
        size={30} 
        color={styles.theme.errorText} 
      />
      <Text style={[
        defaultStyles.errorText,
        styles.theme.errorText
      ]}>
        {error}
      </Text>
      <TouchableOpacity 
        onPress={handleRefresh}
        style={defaultStyles.retryButton}
      >
        <Text style={[
          defaultStyles.retryText,
          { color: styles.theme.iconColor }
        ]}>
          Reintentar
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderWeatherContent = () => {
    if (!weather) return null;

    return (
      <View style={defaultStyles.weatherContent}>
        {/* Header */}
        <View style={defaultStyles.header}>
          <View style={defaultStyles.locationContainer}>
            <Ionicons 
              name="location" 
              size={16} 
              color={styles.theme.iconColor} 
            />
            <Text style={[
              defaultStyles.locationText,
              styles.size.locationText,
              styles.theme.locationText
            ]}>
              {weather.location.name}
            </Text>
          </View>
          
          <View style={defaultStyles.headerActions}>
            <TouchableOpacity onPress={toggleUnits}>
              <Text style={[
                defaultStyles.unitText,
                styles.theme.detailText
              ]}>
                {getUnitSymbol()}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleRefresh}>
              <Animated.View style={{
                transform: [
                  {
                    rotate: refreshAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0deg', '360deg'],
                    }),
                  },
                ],
              }}>
                <Ionicons 
                  name="refresh" 
                  size={16} 
                  color={styles.theme.iconColor} 
                />
              </Animated.View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Main Weather Info */}
        <View style={defaultStyles.mainWeather}>
          <View style={defaultStyles.tempContainer}>
            <Ionicons 
              name={getWeatherIcon(weather.current.icon)} 
              size={size === 'small' ? 32 : size === 'medium' ? 40 : 48} 
              color={styles.theme.iconColor} 
            />
            <Text style={[
              defaultStyles.tempText,
              styles.size.tempText,
              styles.theme.tempText
            ]}>
              {convertTemp(weather.current.temp)}{getUnitSymbol()}
            </Text>
          </View>
          
          <Text style={[
            defaultStyles.descriptionText,
            styles.size.descriptionText,
            styles.theme.descriptionText
          ]}>
            {weather.current.description}
          </Text>
        </View>

        {/* Weather Details */}
        {showDetails && (
          <View style={defaultStyles.detailsContainer}>
            <View style={defaultStyles.detailRow}>
              <View style={defaultStyles.detailItem}>
                <Ionicons name="water" size={14} color={styles.theme.iconColor} />
                <Text style={[
                  defaultStyles.detailText,
                  styles.size.detailText,
                  styles.theme.detailText
                ]}>
                  {weather.current.humidity}%
                </Text>
              </View>
              <View style={defaultStyles.detailItem}>
                <Ionicons name="speedometer" size={14} color={styles.theme.iconColor} />
                <Text style={[
                  defaultStyles.detailText,
                  styles.size.detailText,
                  styles.theme.detailText
                ]}>
                  {weather.current.wind_speed} km/h
                </Text>
              </View>
            </View>
            
            <View style={defaultStyles.detailRow}>
              <View style={defaultStyles.detailItem}>
                <Ionicons name="thermometer" size={14} color={styles.theme.iconColor} />
                <Text style={[
                  defaultStyles.detailText,
                  styles.size.detailText,
                  styles.theme.detailText
                ]}>
                  {convertTemp(weather.current.feels_like)}{getUnitSymbol()}
                </Text>
              </View>
              <View style={defaultStyles.detailItem}>
                <Ionicons name="sunny" size={14} color={styles.theme.iconColor} />
                <Text style={[
                  defaultStyles.detailText,
                  styles.size.detailText,
                  styles.theme.detailText
                ]}>
                  UV {weather.current.uv_index}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Forecast */}
        {showForecast && size !== 'small' && (
          <View style={defaultStyles.forecastContainer}>
            {weather.forecast.slice(0, 3).map((day, index) => (
              <View key={index} style={defaultStyles.forecastItem}>
                <Text style={[
                  defaultStyles.forecastDay,
                  styles.size.detailText,
                  styles.theme.detailText
                ]}>
                  {day.day}
                </Text>
                <Ionicons 
                  name={getWeatherIcon(day.icon)} 
                  size={16} 
                  color={styles.theme.iconColor} 
                />
                <Text style={[
                  defaultStyles.forecastTemp,
                  styles.size.forecastTemp,
                  styles.theme.detailText
                ]}>
                  {convertTemp(day.temp_max)}°/{convertTemp(day.temp_min)}°
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

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
        style={defaultStyles.touchable}
        activeOpacity={0.8}
      >
        {loading ? renderLoading() : error ? renderError() : renderWeatherContent()}
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
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    fontSize: 12,
  },
  errorText: {
    marginTop: 8,
    fontSize: 12,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 8,
    padding: 8,
  },
  retryText: {
    fontSize: 12,
    fontWeight: '600',
  },
  weatherContent: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    marginLeft: 4,
    fontWeight: '500',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  unitText: {
    fontSize: 12,
    fontWeight: '600',
  },
  mainWeather: {
    alignItems: 'center',
    marginBottom: 16,
  },
  tempContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  tempText: {
    fontWeight: 'bold',
    marginLeft: 8,
  },
  descriptionText: {
    fontWeight: '500',
    textAlign: 'center',
  },
  detailsContainer: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  detailText: {
    marginLeft: 6,
    fontWeight: '500',
  },
  forecastContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  forecastItem: {
    alignItems: 'center',
    flex: 1,
  },
  forecastDay: {
    fontSize: 10,
    fontWeight: '500',
    marginBottom: 4,
  },
  forecastTemp: {
    fontSize: 10,
    fontWeight: '500',
    marginTop: 4,
  },
});

export default WeatherWidget;
