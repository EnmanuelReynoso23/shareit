import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  SafeAreaView,
  StatusBar,
  Dimensions,
  Platform,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import LinearGradient from 'react-native-linear-gradient';

// Components
import LoadingScreen from '../../components/LoadingScreen';
import ErrorScreen from '../../components/ErrorScreen';
import EnhancedCard, { StatsRow, FeatureList } from '../../components/EnhancedCard';

// Utils
import { RealtimeManager } from '../../utils/clientFunctions';

const { width, height } = Dimensions.get('window');

const HomeScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);
  const { widgets } = useSelector(state => state.widgets);
  const { friends } = useSelector(state => state.friends);
  const { photos } = useSelector(state => state.photos);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    widgets: 0,
    friends: 0,
    photos: 0,
    shared: 0,
  });

  useEffect(() => {
    loadHomeData();
  }, []);

  useEffect(() => {
    // Actualizar estadísticas cuando cambien los datos
    setStats({
      widgets: widgets?.length || 0,
      friends: friends?.length || 0,
      photos: photos?.length || 0,
      shared: widgets?.filter(w => w.shared)?.length || 0,
    });
  }, [widgets, friends, photos]);

  const loadHomeData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Simular carga de datos con progreso
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Aquí cargarías los datos reales desde Firebase
      // const userData = await UserManager.getUserData(user.uid);
      // dispatch(updateUserData(userData));

      setLoading(false);
    } catch (err) {
      console.error('Error loading home data:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadHomeData();
    setRefreshing(false);
  };

  const handleRetry = () => {
    setError(null);
    loadHomeData();
  };

  if (loading) {
    return (
      <LoadingScreen 
        message="Cargando tu dashboard..."
        progress={75}
      />
    );
  }

  if (error) {
    return (
      <ErrorScreen
        title="Error al cargar datos"
        message={error}
        onRetry={handleRetry}
        type="network"
      />
    );
  }

  const quickActions = [
    {
      icon: '📷',
      title: 'Tomar Foto',
      onPress: () => navigation.navigate('Camera'),
      gradient: ['#ff6b6b', '#ee5a52'],
    },
    {
      icon: '👥',
      title: 'Añadir Amigo',
      onPress: () => navigation.navigate('Friends'),
      gradient: ['#4ecdc4', '#44a08d'],
    },
    {
      icon: '🔧',
      title: 'Nuevo Widget',
      onPress: () => navigation.navigate('WidgetSettings'),
      gradient: ['#667eea', '#764ba2'],
    },
    {
      icon: '🖼️',
      title: 'Ver Galería',
      onPress: () => navigation.navigate('Gallery'),
      gradient: ['#feca57', '#ff9ff3'],
    },
  ];

  const recentFeatures = [
    { icon: '✨', text: 'Widgets colaborativos en tiempo real' },
    { icon: '🔒', text: 'Seguridad mejorada con Firebase' },
    { icon: '📱', text: 'Interfaz optimizada y moderna' },
    { icon: '⚡', text: 'Sincronización instantánea' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#667eea" />
      
      {/* Header con gradiente */}
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.welcomeText}>¡Hola!</Text>
            <Text style={styles.userName}>{user?.displayName || 'Usuario'}</Text>
          </View>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>
              {user?.displayName?.charAt(0) || '👤'}
            </Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#667eea']}
            tintColor="#667eea"
          />
        }
      >
        {/* Estadísticas principales */}
        <EnhancedCard
          title="📊 Tu Actividad"
          subtitle="Estadísticas de uso en ShareIt"
          cardType="stats"
          style={styles.statsCard}
        >
          <StatsRow
            stats={[
              { value: stats.widgets, label: 'Widgets' },
              { value: stats.friends, label: 'Amigos' },
              { value: stats.photos, label: 'Fotos' },
              { value: stats.shared, label: 'Compartidos' },
            ]}
          />
        </EnhancedCard>

        {/* Acciones rápidas */}
        <EnhancedCard
          title="⚡ Acciones Rápidas"
          subtitle="Accede rápidamente a las funciones principales"
          cardType="feature"
        >
          <View style={styles.quickActionsGrid}>
            {quickActions.map((action, index) => (
              <EnhancedCard
                key={index}
                icon={action.icon}
                title={action.title}
                cardType="action"
                gradient={action.gradient}
                onPress={action.onPress}
                style={styles.quickActionCard}
              />
            ))}
          </View>
        </EnhancedCard>

        {/* Widgets recientes */}
        <EnhancedCard
          title="🔧 Widgets Recientes"
          subtitle={`${stats.widgets} widgets disponibles`}
          cardType="feature"
          onPress={() => navigation.navigate('WidgetSettings')}
        >
          {stats.widgets > 0 ? (
            <View style={styles.widgetsPreview}>
              <Text style={styles.previewText}>
                Tienes {stats.widgets} widgets configurados
              </Text>
              <Text style={styles.previewSubtext}>
                {stats.shared} compartidos con amigos
              </Text>
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>
                🎨 Crea tu primer widget
              </Text>
              <Text style={styles.emptyStateSubtext}>
                Personaliza tu experiencia con widgets colaborativos
              </Text>
            </View>
          )}
        </EnhancedCard>

        {/* Novedades */}
        <EnhancedCard
          title="🚀 Novedades"
          subtitle="Últimas mejoras en ShareIt"
          cardType="feature"
        >
          <FeatureList features={recentFeatures} />
        </EnhancedCard>

        {/* Espacio extra para el tab bar */}
        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafe',
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 0 : StatusBar.currentHeight,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
  },
  welcomeText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '400',
  },
  userName: {
    fontSize: 24,
    color: '#ffffff',
    fontWeight: '700',
    marginTop: 4,
  },
  avatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  avatarText: {
    fontSize: 20,
    color: '#ffffff',
  },
  scrollContainer: {
    flex: 1,
  },
  statsCard: {
    marginTop: -10,
    marginHorizontal: 20,
    backgroundColor: '#ffffff',
    shadowColor: '#667eea',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 12,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  quickActionCard: {
    width: (width - 80) / 2,
    marginBottom: 12,
    marginHorizontal: 0,
  },
  widgetsPreview: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  previewText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  previewSubtext: {
    fontSize: 14,
    color: '#666',
  },
  emptyState: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#667eea',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  bottomPadding: {
    height: 100,
  },
});

export default HomeScreen;
