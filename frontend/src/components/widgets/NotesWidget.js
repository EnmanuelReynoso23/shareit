import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const NotesWidget = ({ widget }) => {
  // Mock note - in a real app, this would come from widget config
  const note = "Remember to share photos with friends!";

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="document-text" size={20} color="#007AFF" />
        <Text style={styles.title}>Quick Note</Text>
      </View>
      <Text style={styles.note} numberOfLines={3}>
        {note}
      </Text>
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginLeft: 6,
  },
  note: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
  },
});

export default NotesWidget;
