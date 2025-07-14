import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../../store/AppContext';

const { width } = Dimensions.get('window');

const HomeScreen = ({ navigation }) => {
  const { user } = useAuth();

  const widgets = [
    {
      id: '1',
      type: 'clock',
      title: 'Reloj',
      icon: 'access-time',
      color: '#667eea',
    },

    {
      id: '3',
      type: 'photos',
      title: 'Fotos',
      icon: 'photo-library',
      color: '#4caf50',
    },
    {
      id: '4',
      type: 'notes',
      title: 'Notas',
      icon: 'note',
      color: '#e91e63',
    },
  ];

  const quickActions = [
    {
      id: '1',
      title: 'Tomar Foto',
      icon: 'camera-alt',
      color: '#667eea',
      onPress: () => navigation.navigate('Camera'),
    },
    {
      id: '2',
      title: 'Ver Galería',
      icon: 'photo-library',
      color: '#4caf50',
      onPress: () => navigation.navigate('Gallery'),
    },
    {
      id: '3',
      title: 'Configurar Widgets',
      icon: 'settings',
      color: '#ff9800',
      onPress: () => navigation.navigate('WidgetSettings'),
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>¡Hola!</Text>
            <Text style={styles.userName}>
              {user?.displayName || user?.email || 'Usuario'}
            </Text>
          </View>
          <TouchableOpacity style={styles.profileButton}>
            <MaterialIcons name="account-circle" size={40} color="#667eea" />
          </TouchableOpacity>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Acciones Rápidas</Text>
          <View style={styles.quickActionsContainer}>
            {quickActions.map((action) => (
              <TouchableOpacity
                key={action.id}
                style={[styles.quickActionCard, { borderLeftColor: action.color }]}
                onPress={action.onPress}
              >
                <MaterialIcons name={action.icon} size={24} color={action.color} />
                <Text style={styles.quickActionText}>{action.title}</Text>
                <MaterialIcons name="arrow-forward-ios" size={16} color="#999" />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Widgets */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Mis Widgets</Text>
            <TouchableOpacity 
              style={styles.addButton}
              onPress={() => navigation.navigate('WidgetSettings')}
            >
              <MaterialIcons name="add" size={24} color="#667eea" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.widgetsGrid}>
            {widgets.map((widget) => (
              <TouchableOpacity key={widget.id} style={styles.widgetCard}>
                <View style={[styles.widgetIcon, { backgroundColor: widget.color }]}>
                  <MaterialIcons name={widget.icon} size={32} color="#fff" />
                </View>
                <Text style={styles.widgetTitle}>{widget.title}</Text>
                <Text style={styles.widgetStatus}>Activo</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Actividad Reciente</Text>
          <View style={styles.activityContainer}>
            <View style={styles.activityItem}>
              <MaterialIcons name="photo" size={20} color="#4caf50" />
              <Text style={styles.activityText}>Nueva foto compartida</Text>
              <Text style={styles.activityTime}>Hace 2 horas</Text>
            </View>
            <View style={styles.activityItem}>
              <MaterialIcons name="person-add" size={20} color="#2196f3" />
              <Text style={styles.activityText}>Nuevo amigo agregado</Text>
              <Text style={styles.activityTime}>Ayer</Text>
            </View>
            <View style={styles.activityItem}>
              <MaterialIcons name="widgets" size={20} color="#ff9800" />
              <Text style={styles.activityText}>Widget configurado</Text>
              <Text style={styles.activityTime}>Hace 3 días</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafe',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  greeting: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
  },
  userName: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  profileButton: {
    padding: 8,
  },
  section: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  addButton: {
    padding: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
  },
  quickActionsContainer: {
    gap: 12,
  },
  quickActionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  quickActionText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginLeft: 12,
  },
  widgetsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  widgetCard: {
    width: (width - 52) / 2,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  widgetIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  widgetTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  widgetStatus: {
    fontSize: 12,
    color: '#4caf50',
    fontWeight: '500',
  },
  activityContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  activityText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    marginLeft: 12,
  },
  activityTime: {
    fontSize: 12,
    color: '#999',
  },
});

export default HomeScreen;
