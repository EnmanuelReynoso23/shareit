import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const PhotosWidget = ({ widget }) => {
  // Mock photo count - in a real app, this would come from Redux store
  const photoCount = 0;

  return (
    <View style={styles.container}>
      <Ionicons name="images" size={32} color="#007AFF" />
      <Text style={styles.count}>{photoCount}</Text>
      <Text style={styles.label}>Shared Photos</Text>
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
  count: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
    marginTop: 8,
    marginBottom: 4,
  },
  label: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
});

export default PhotosWidget;
