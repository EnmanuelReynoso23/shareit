import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const WidgetSettingsScreen = ({ navigation }) => {
  const [widgetStates, setWidgetStates] = React.useState({
    clock: true,
    photos: false,
    notes: true,
  });

  const toggleWidget = (widgetType) => {
    setWidgetStates(prev => ({
      ...prev,
      [widgetType]: !prev[widgetType]
    }));
  };

  const widgets = [
    {
      id: '1',
      type: 'clock',
      title: 'Widget de Reloj',
      description: 'Muestra la hora actual y fecha',
      icon: 'access-time',
      color: '#667eea',
    },

    {
      id: '3',
      type: 'photos',
      title: 'Widget de Fotos',
      description: 'Carrusel de fotos recientes',
      icon: 'photo-library',
      color: '#4caf50',
    },
    {
      id: '4',
      type: 'notes',
      title: 'Widget de Notas',
      description: 'Notas rápidas y recordatorios',
      icon: 'note',
      color: '#e91e63',
    },
  ];

  const renderWidget = ({ item }) => (
    <View style={styles.widgetItem}>
      <View style={styles.widgetInfo}>
        <View style={[styles.widgetIcon, { backgroundColor: item.color }]}>
          <MaterialIcons name={item.icon} size={24} color="#fff" />
        </View>
        <View style={styles.widgetDetails}>
          <Text style={styles.widgetTitle}>{item.title}</Text>
          <Text style={styles.widgetDescription}>{item.description}</Text>
        </View>
      </View>
      <Switch
        value={widgetStates[item.type]}
        onValueChange={() => toggleWidget(item.type)}
        trackColor={{ false: '#ccc', true: item.color }}
        thumbColor="#fff"
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Configurar Widgets</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.sectionTitle}>Widgets Disponibles</Text>
        <Text style={styles.sectionSubtitle}>
          Activa o desactiva los widgets que deseas mostrar en tu pantalla principal
        </Text>

        <FlatList
          data={widgets}
          renderItem={renderWidget}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          style={styles.widgetsList}
        />

        {/* Info Section */}
        <View style={styles.infoSection}>
          <MaterialIcons name="info" size={20} color="#667eea" />
          <Text style={styles.infoText}>
            Los widgets activos aparecerán en tu pantalla principal. 
            Puedes cambiar su configuración en cualquier momento.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafe',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
    lineHeight: 22,
  },
  widgetsList: {
    flex: 1,
  },
  widgetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
    marginBottom: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  widgetInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  widgetIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  widgetDetails: {
    flex: 1,
  },
  widgetTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  widgetDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 18,
  },
  infoSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#f0f4ff',
    padding: 16,
    borderRadius: 12,
    marginTop: 20,
    marginBottom: 20,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#667eea',
    marginLeft: 12,
    lineHeight: 18,
  },
});

export default WidgetSettingsScreen;
