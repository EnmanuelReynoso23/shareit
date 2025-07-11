import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const WidgetSettingsScreen = ({ navigation }) => {
  const widgetTypes = [
    { id: 'clock', name: 'Clock', icon: 'time-outline', description: 'Show current time' },
    { id: 'weather', name: 'Weather', icon: 'partly-sunny-outline', description: 'Current weather info' },
    { id: 'photos', name: 'Photos', icon: 'images-outline', description: 'Shared photo slideshow' },
    { id: 'notes', name: 'Notes', icon: 'document-text-outline', description: 'Quick notes widget' },
    { id: 'calendar', name: 'Calendar', icon: 'calendar-outline', description: 'Upcoming events' },
    { id: 'battery', name: 'Battery', icon: 'battery-half-outline', description: 'Device battery status' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Add Widget</Text>
        <View style={styles.placeholder} />
      </View>
      
      <ScrollView style={styles.scrollView}>
        <Text style={styles.sectionTitle}>Choose a Widget Type</Text>
        
        {widgetTypes.map((widget) => (
          <TouchableOpacity key={widget.id} style={styles.widgetOption}>
            <View style={styles.widgetIcon}>
              <Ionicons name={widget.icon} size={24} color="#007AFF" />
            </View>
            <View style={styles.widgetInfo}>
              <Text style={styles.widgetName}>{widget.name}</Text>
              <Text style={styles.widgetDescription}>{widget.description}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E1E1E1',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginTop: 20,
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  widgetOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E1E1E1',
  },
  widgetIcon: {
    width: 40,
    height: 40,
    backgroundColor: '#F0F8FF',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  widgetInfo: {
    flex: 1,
  },
  widgetName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  widgetDescription: {
    fontSize: 14,
    color: '#666',
  },
});

export default WidgetSettingsScreen;
