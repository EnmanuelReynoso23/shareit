import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const WeatherWidget = ({ widget }) => {
  // Mock weather data - in a real app, this would come from an API
  const weatherData = {
    temperature: '72°F',
    condition: 'Sunny',
    icon: 'sunny',
    location: 'New York',
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name={weatherData.icon} size={32} color="#FFA500" />
        <Text style={styles.temperature}>{weatherData.temperature}</Text>
      </View>
      <Text style={styles.condition}>{weatherData.condition}</Text>
      <Text style={styles.location}>{weatherData.location}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '48%',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E1E1E1',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  temperature: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
    marginLeft: 8,
  },
  condition: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  location: {
    fontSize: 12,
    color: '#666',
  },
});

export default WeatherWidget;
