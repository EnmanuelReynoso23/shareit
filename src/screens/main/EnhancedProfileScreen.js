import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  SafeAreaView,
  StatusBar,
  Animated,
  TextInput,
  Modal,
  Switch,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import LinearGradient from 'react-native-linear-gradient';

// Components
import LoadingScreen from '../../components/LoadingScreen';
import ErrorScreen from '../../components/ErrorScreen';
import EnhancedCard from '../../components/EnhancedCard';

// Utils
import { UserManager } from '../../utils/clientFunctions';

const EnhancedProfileScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);
  const { photos } = useSelector(state => state.photos);
  const { friends } = useSelector(state => state.friends);

  const [loading, setLoading] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [settingsModalVisible, setSettingsModalVisible] = useState(false);
  const [userProfile, setUserProfile] = useState({
    displayName: user?.displayName || '',
    bio: user?.bio || '',
    location: user?.location || '',
    website: user?.website || '',
  });
  const [settings, setSettings] = useState({
    notifications: true,
    publicProfile: false,
    shareLocation: false,
    autoBackup: true,
  });

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    // Animación de entrada
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleUpdateProfile = async () => {
    setLoading(true);
    try {
      const result = await UserManager.updateUserProfile(user.uid, userProfile);
      if (result.success) {
        Alert.alert('Éxito', 'Perfil actualizado correctamente');
        setEditModalVisible(false);
        // dispatch(updateUser(userProfile));
      } else {
        Alert.alert('Error', result.error);
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo actualizar el perfil');
      console.error('Error updating profile:', error);
    }
    setLoading(false);
  };

  const handleSignOut = () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro de que deseas cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar Sesión',
          style: 'destructive',
          onPress: () => {
            // dispatch(signOut());
            navigation.reset({
              index: 0,
              routes: [{ name: 'Auth' }],
            });
          },
        },
      ]
    );
  };

  const getStats = () => {
    return {
      photos: photos?.filter(p => p.userId === user.uid).length || 0,
      friends: friends?.length || 0,
      widgets: 3, // placeholder
    };
  };

  const renderProfileHeader = () => {
    const stats = getStats();
    
    return (
      <Animated.View 
        style={[
          styles.profileHeader, 
          { 
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}
      >
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          style={styles.headerGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {/* Header Controls */}
          <View style={styles.headerControls}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.backButtonText}>←</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.settingsButton}
              onPress={() => setSettingsModalVisible(true)}
            >
              <Text style={styles.settingsButtonText}>⚙️</Text>
            </TouchableOpacity>
          </View>

          {/* Profile Info */}
          <View style={styles.profileInfo}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatarBorder}>
                <Image
                  source={{
                    uri: user?.photoURL || 'https://via.placeholder.com/120/667eea/ffffff?text=👤'
                  }}
                  style={styles.avatar}
                />
              </View>
              <TouchableOpacity style={styles.avatarEditButton}>
                <Text style={styles.avatarEditText}>✏️</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.displayName}>
              {user?.displayName || 'Usuario'}
            </Text>
            
            <Text style={styles.email}>{user?.email}</Text>
            
            {userProfile.bio && (
              <Text style={styles.bio}>{userProfile.bio}</Text>
            )}

            <TouchableOpacity
              style={styles.editProfileButton}
              onPress={() => setEditModalVisible(true)}
            >
              <Text style={styles.editProfileText}>Editar Perfil</Text>
            </TouchableOpacity>
          </View>

          {/* Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.photos}</Text>
              <Text style={styles.statLabel}>Fotos</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.friends}</Text>
              <Text style={styles.statLabel}>Amigos</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.widgets}</Text>
              <Text style={styles.statLabel}>Widgets</Text>
            </View>
          </View>
        </LinearGradient>
      </Animated.View>
    );
  };

  const renderQuickActions = () => (
    <View style={styles.quickActionsContainer}>
      <Text style={styles.sectionTitle}>Acciones Rápidas</Text>
      
      <View style={styles.actionsGrid}>
        <TouchableOpacity 
          style={styles.actionItem}
          onPress={() => navigation.navigate('Camera')}
        >
          <LinearGradient
            colors={['#ff6b6b', '#ee5a52']}
            style={styles.actionGradient}
          >
            <Text style={styles.actionIcon}>📷</Text>
            <Text style={styles.actionText}>Cámara</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionItem}
          onPress={() => navigation.navigate('Gallery')}
        >
          <LinearGradient
            colors={['#4ecdc4', '#44a08d']}
            style={styles.actionGradient}
          >
            <Text style={styles.actionIcon}>🖼️</Text>
            <Text style={styles.actionText}>Galería</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionItem}
          onPress={() => navigation.navigate('Friends')}
        >
          <LinearGradient
            colors={['#feca57', '#ff9ff3']}
            style={styles.actionGradient}
          >
            <Text style={styles.actionIcon}>👥</Text>
            <Text style={styles.actionText}>Amigos</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionItem}
          onPress={() => navigation.navigate('WidgetSettings')}
        >
          <LinearGradient
            colors={['#a8e6cf', '#7fcdcd']}
            style={styles.actionGradient}
          >
            <Text style={styles.actionIcon}>🎨</Text>
            <Text style={styles.actionText}>Widgets</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderAccountSection = () => (
    <View style={styles.accountSection}>
      <Text style={styles.sectionTitle}>Cuenta</Text>
      
      <EnhancedCard
        title="Información Personal"
        subtitle="Administra tu información básica"
        icon="👤"
        cardType="feature"
        onPress={() => setEditModalVisible(true)}
      />

      <EnhancedCard
        title="Privacidad y Seguridad"
        subtitle="Controla quién puede ver tu información"
        icon="🔒"
        cardType="feature"
        onPress={() => setSettingsModalVisible(true)}
      />

      <EnhancedCard
        title="Notificaciones"
        subtitle="Configura cómo recibes notificaciones"
        icon="🔔"
        cardType="feature"
        onPress={() => Alert.alert('Notificaciones', 'Configuración de notificaciones')}
      />

      <EnhancedCard
        title="Ayuda y Soporte"
        subtitle="¿Necesitas ayuda? Contáctanos"
        icon="❓"
        cardType="feature"
        onPress={() => Alert.alert('Ayuda', 'Centro de ayuda de ShareIt')}
      />

      <TouchableOpacity
        style={styles.signOutButton}
        onPress={handleSignOut}
      >
        <Text style={styles.signOutText}>Cerrar Sesión</Text>
      </TouchableOpacity>
    </View>
  );

  const renderEditModal = () => (
    <Modal
      visible={editModalVisible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setEditModalVisible(false)}
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity
            style={styles.modalCancelButton}
            onPress={() => setEditModalVisible(false)}
          >
            <Text style={styles.modalCancelText}>Cancelar</Text>
          </TouchableOpacity>
          
          <Text style={styles.modalTitle}>Editar Perfil</Text>
          
          <TouchableOpacity
            style={styles.modalSaveButton}
            onPress={handleUpdateProfile}
            disabled={loading}
          >
            <Text style={styles.modalSaveText}>
              {loading ? 'Guardando...' : 'Guardar'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Nombre de Usuario</Text>
            <TextInput
              style={styles.formInput}
              value={userProfile.displayName}
              onChangeText={(text) => setUserProfile(prev => ({ ...prev, displayName: text }))}
              placeholder="Tu nombre de usuario"
              maxLength={50}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Biografía</Text>
            <TextInput
              style={[styles.formInput, styles.textArea]}
              value={userProfile.bio}
              onChangeText={(text) => setUserProfile(prev => ({ ...prev, bio: text }))}
              placeholder="Cuéntanos algo sobre ti..."
              multiline
              numberOfLines={4}
              maxLength={200}
            />
            <Text style={styles.characterCount}>
              {userProfile.bio.length}/200 caracteres
            </Text>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Ubicación</Text>
            <TextInput
              style={styles.formInput}
              value={userProfile.location}
              onChangeText={(text) => setUserProfile(prev => ({ ...prev, location: text }))}
              placeholder="Tu ciudad o país"
              maxLength={100}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Sitio Web</Text>
            <TextInput
              style={styles.formInput}
              value={userProfile.website}
              onChangeText={(text) => setUserProfile(prev => ({ ...prev, website: text }))}
              placeholder="https://tu-sitio.com"
              keyboardType="url"
              maxLength={200}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );

  const renderSettingsModal = () => (
    <Modal
      visible={settingsModalVisible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setSettingsModalVisible(false)}
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity
            style={styles.modalCancelButton}
            onPress={() => setSettingsModalVisible(false)}
          >
            <Text style={styles.modalCancelText}>Cerrar</Text>
          </TouchableOpacity>
          
          <Text style={styles.modalTitle}>Configuración</Text>
          
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.modalContent}>
          <View style={styles.settingsSection}>
            <Text style={styles.settingsTitle}>Privacidad</Text>
            
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Perfil Público</Text>
                <Text style={styles.settingDescription}>
                  Permite que otros usuarios puedan encontrar tu perfil
                </Text>
              </View>
              <Switch
                value={settings.publicProfile}
                onValueChange={(value) => setSettings(prev => ({ ...prev, publicProfile: value }))}
                trackColor={{ false: '#f1f5f9', true: '#667eea' }}
                thumbColor="#ffffff"
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Compartir Ubicación</Text>
                <Text style={styles.settingDescription}>
                  Incluir información de ubicación en las fotos
                </Text>
              </View>
              <Switch
                value={settings.shareLocation}
                onValueChange={(value) => setSettings(prev => ({ ...prev, shareLocation: value }))}
                trackColor={{ false: '#f1f5f9', true: '#667eea' }}
                thumbColor="#ffffff"
              />
            </View>
          </View>

          <View style={styles.settingsSection}>
            <Text style={styles.settingsTitle}>Notificaciones</Text>
            
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Notificaciones Push</Text>
                <Text style={styles.settingDescription}>
                  Recibir notificaciones en tiempo real
                </Text>
              </View>
              <Switch
                value={settings.notifications}
                onValueChange={(value) => setSettings(prev => ({ ...prev, notifications: value }))}
                trackColor={{ false: '#f1f5f9', true: '#667eea' }}
                thumbColor="#ffffff"
              />
            </View>
          </View>

          <View style={styles.settingsSection}>
            <Text style={styles.settingsTitle}>Almacenamiento</Text>
            
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Respaldo Automático</Text>
                <Text style={styles.settingDescription}>
                  Respaldar fotos automáticamente en la nube
                </Text>
              </View>
              <Switch
                value={settings.autoBackup}
                onValueChange={(value) => setSettings(prev => ({ ...prev, autoBackup: value }))}
                trackColor={{ false: '#f1f5f9', true: '#667eea' }}
                thumbColor="#ffffff"
              />
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );

  if (loading) {
    return <LoadingScreen message="Actualizando perfil..." />;
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#667eea" />
      
      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {renderProfileHeader()}
        {renderQuickActions()}
        {renderAccountSection()}
        
        <View style={styles.bottomSpacer} />
      </ScrollView>

      {renderEditModal()}
      {renderSettingsModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafe',
  },
  scrollContainer: {
    flex: 1,
  },
  profileHeader: {
    marginBottom: 20,
  },
  headerGradient: {
    paddingTop: 10,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  headerControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 20,
    color: '#ffffff',
    fontWeight: '600',
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsButtonText: {
    fontSize: 18,
  },
  profileInfo: {
    alignItems: 'center',
    marginBottom: 30,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatarBorder: {
    width: 124,
    height: 124,
    borderRadius: 62,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  avatarEditButton: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#667eea',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  avatarEditText: {
    fontSize: 14,
  },
  displayName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 8,
  },
  bio: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  editProfileButton: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  editProfileText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  quickActionsContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionItem: {
    width: '48%',
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  actionGradient: {
    padding: 20,
    alignItems: 'center',
    minHeight: 80,
    justifyContent: 'center',
  },
  actionIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  accountSection: {
    padding: 20,
    paddingTop: 0,
  },
  signOutButton: {
    marginTop: 20,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#ff6b6b',
    alignItems: 'center',
  },
  signOutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  bottomSpacer: {
    height: 40,
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#f8fafe',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  modalCancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  modalCancelText: {
    fontSize: 16,
    color: '#666',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  modalSaveButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  modalSaveText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#667eea',
  },
  placeholder: {
    width: 60,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  formInput: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: '#ffffff',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  characterCount: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
    marginTop: 4,
  },
  settingsSection: {
    marginBottom: 30,
  },
  settingsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 18,
  },
});

export default EnhancedProfileScreen;
