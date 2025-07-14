import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Vibration,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { signOut } from 'firebase/auth';
import { auth } from '../../../config/firebase';
import { useAuth } from '../../store/AppContext';

const ProfileScreen = ({ navigation }) => {
  const { user, clearUser } = useAuth();
  
  // Edit profile state
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editingProfile, setEditingProfile] = useState({
    displayName: user?.displayName || '',
    email: user?.email || '',
    bio: '',
    phone: '',
  });
  const [validationErrors, setValidationErrors] = useState({});
  const [fieldStatus, setFieldStatus] = useState({}); // success, error, validating
  const [isLoading, setIsLoading] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [formTouched, setFormTouched] = useState({});
  
  // Refs for animations and timeouts
  const validationTimeouts = useRef({});
  const inputRefs = useRef({});
  const shakeAnimations = useRef({});
  const successAnimations = useRef({});
  
  // Initialize animations
  useEffect(() => {
    Object.keys(editingProfile).forEach(field => {
      shakeAnimations.current[field] = new Animated.Value(0);
      successAnimations.current[field] = new Animated.Value(0);
    });
  }, []);
  
  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      Object.values(validationTimeouts.current).forEach(timeout => {
        if (timeout) clearTimeout(timeout);
      });
    };
  }, []);

  // Enhanced validation functions with animations
  const validateField = useCallback((field, value) => {
    switch (field) {
      case 'displayName':
        if (!value.trim()) return 'El nombre es requerido';
        if (value.trim().length < 2) return 'El nombre debe tener al menos 2 caracteres';
        if (value.trim().length > 50) return 'El nombre no puede tener más de 50 caracteres';
        if (!/^[a-zA-ZÀ-ÿ\s]+$/.test(value.trim())) return 'El nombre solo puede contener letras';
        return null;
      
      case 'email':
        if (!value.trim()) return 'El email es requerido';
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) return 'Email inválido';
        // Check for common email providers
        const domain = value.split('@')[1]?.toLowerCase();
        if (domain && !['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com'].includes(domain)) {
          // Just a warning, not an error
        }
        return null;
      
      case 'phone':
        if (value && value.length > 0) {
          const cleanPhone = value.replace(/[\s\-\(\)]/g, '');
          const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
          if (!phoneRegex.test(cleanPhone)) {
            return 'Formato de teléfono inválido';
          }
          if (cleanPhone.length < 10) {
            return 'El teléfono debe tener al menos 10 dígitos';
          }
        }
        return null;
      
      case 'bio':
        if (value && value.length > 150) {
          return 'La biografía no puede tener más de 150 caracteres';
        }
        return null;
      
      default:
        return null;
    }
  }, []);

  // Animated validation
  const triggerShakeAnimation = useCallback((field) => {
    if (shakeAnimations.current[field]) {
      Animated.sequence([
        Animated.timing(shakeAnimations.current[field], {
          toValue: 10,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnimations.current[field], {
          toValue: -10,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnimations.current[field], {
          toValue: 0,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();
      
      if (Platform.OS === 'ios') {
        Vibration.vibrate([0, 100]);
      }
    }
  }, []);

  const triggerSuccessAnimation = useCallback((field) => {
    if (successAnimations.current[field]) {
      Animated.sequence([
        Animated.timing(successAnimations.current[field], {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(successAnimations.current[field], {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, []);

  const validateForm = useCallback(() => {
    const errors = {};
    const status = {};
    
    Object.keys(editingProfile).forEach(field => {
      const error = validateField(field, editingProfile[field]);
      if (error) {
        errors[field] = error;
        status[field] = 'error';
        triggerShakeAnimation(field);
      } else if (formTouched[field]) {
        status[field] = 'success';
        triggerSuccessAnimation(field);
      }
    });
    
    setValidationErrors(errors);
    setFieldStatus(status);
    return Object.keys(errors).length === 0;
  }, [editingProfile, validateField, formTouched, triggerShakeAnimation, triggerSuccessAnimation]);

  // Enhanced field change handler with debounced validation
  const handleFieldChange = useCallback((field, value) => {
    setEditingProfile(prev => ({ ...prev, [field]: value }));
    setFormTouched(prev => ({ ...prev, [field]: true }));
    setHasUnsavedChanges(true);
    
    // Clear previous timeout
    if (validationTimeouts.current[field]) {
      clearTimeout(validationTimeouts.current[field]);
    }
    
    // Set validating status
    setFieldStatus(prev => ({ ...prev, [field]: 'validating' }));
    
    // Clear previous error for this field
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
    
    // Debounced validation
    validationTimeouts.current[field] = setTimeout(() => {
      const error = validateField(field, value);
      if (error) {
        setValidationErrors(prev => ({ ...prev, [field]: error }));
        setFieldStatus(prev => ({ ...prev, [field]: 'error' }));
        triggerShakeAnimation(field);
      } else {
        setFieldStatus(prev => ({ ...prev, [field]: 'success' }));
        triggerSuccessAnimation(field);
      }
    }, 600);
  }, [validateField, validationErrors, triggerShakeAnimation, triggerSuccessAnimation]);

  // Handle field blur
  const handleFieldBlur = useCallback((field) => {
    const error = validateField(field, editingProfile[field]);
    if (error) {
      setValidationErrors(prev => ({ ...prev, [field]: error }));
      setFieldStatus(prev => ({ ...prev, [field]: 'error' }));
    } else if (formTouched[field]) {
      setFieldStatus(prev => ({ ...prev, [field]: 'success' }));
    }
  }, [editingProfile, validateField, formTouched]);

  // Handle field focus
  const handleFieldFocus = useCallback((field) => {
    setFieldStatus(prev => ({ ...prev, [field]: 'focus' }));
  }, []);

  // Open edit modal with reset
  const openEditModal = useCallback(() => {
    setEditingProfile({
      displayName: user?.displayName || '',
      email: user?.email || '',
      bio: user?.bio || '',
      phone: user?.phone || '',
    });
    setValidationErrors({});
    setFieldStatus({});
    setFormTouched({});
    setHasUnsavedChanges(false);
    setIsEditModalVisible(true);
  }, [user]);

  // Close edit modal with unsaved changes check
  const closeEditModal = useCallback(() => {
    if (hasUnsavedChanges) {
      Alert.alert(
        'Cambios sin guardar',
        '¿Estás seguro que quieres cerrar sin guardar los cambios?',
        [
          { text: 'Continuar editando', style: 'cancel' },
          {
            text: 'Descartar cambios',
            style: 'destructive',
            onPress: () => {
              setIsEditModalVisible(false);
              setValidationErrors({});
              setFieldStatus({});
              setFormTouched({});
              setHasUnsavedChanges(false);
            }
          }
        ]
      );
    } else {
      setIsEditModalVisible(false);
      setValidationErrors({});
      setFieldStatus({});
      setFormTouched({});
    }
  }, [hasUnsavedChanges]);

  // Enhanced save profile with better error handling
  const saveProfile = useCallback(async () => {
    if (!validateForm()) {
      Alert.alert(
        'Formulario incompleto',
        'Por favor corrige los errores marcados en rojo antes de continuar.',
        [{ text: 'OK' }]
      );
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Simulate API call with progress
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Here you would update the user profile via API
      console.log('Profile updated:', editingProfile);
      
      Alert.alert(
        'Perfil actualizado',
        'Tus cambios han sido guardados exitosamente.',
        [{
          text: 'OK',
          onPress: () => {
            setHasUnsavedChanges(false);
            setIsEditModalVisible(false);
            setValidationErrors({});
            setFieldStatus({});
            setFormTouched({});
          }
        }]
      );
    } catch (error) {
      Alert.alert(
        'Error al guardar',
        'No se pudo actualizar el perfil. Inténtalo de nuevo.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  }, [editingProfile, validateForm]);

  // Get field status icon
  const getFieldStatusIcon = useCallback((field) => {
    const status = fieldStatus[field];
    switch (status) {
      case 'validating':
        return <ActivityIndicator size="small" color="#667eea" />;
      case 'success':
        return <MaterialIcons name="check-circle" size={20} color="#4caf50" />;
      case 'error':
        return <MaterialIcons name="error" size={20} color="#f44336" />;
      default:
        return null;
    }
  }, [fieldStatus]);

  // Get field border color
  const getFieldBorderColor = useCallback((field) => {
    const status = fieldStatus[field];
    switch (status) {
      case 'focus':
        return '#667eea';
      case 'success':
        return '#4caf50';
      case 'error':
        return '#f44336';
      default:
        return '#e0e0e0';
    }
  }, [fieldStatus]);

  const handleLogout = () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro que deseas cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Cerrar Sesión', 
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut(auth);
              clearUser();
            } catch (error) {
              Alert.alert('Error', 'No se pudo cerrar sesión');
            }
          }
        }
      ]
    );
  };

  const profileOptions = [
    {
      id: '1',
      title: 'Editar Perfil',
      icon: 'edit',
      color: '#667eea',
      onPress: openEditModal,
    },
    {
      id: '2',
      title: 'Configuración',
      icon: 'settings',
      color: '#ff9800',
      onPress: () => Alert.alert('Funcionalidad', 'Configuración en desarrollo'),
    },
    {
      id: '3',
      title: 'Privacidad',
      icon: 'privacy-tip',
      color: '#4caf50',
      onPress: () => Alert.alert('Funcionalidad', 'Privacidad en desarrollo'),
    },
    {
      id: '4',
      title: 'Notificaciones',
      icon: 'notifications',
      color: '#e91e63',
      onPress: () => Alert.alert('Funcionalidad', 'Notificaciones en desarrollo'),
    },
    {
      id: '5',
      title: 'Ayuda y Soporte',
      icon: 'help',
      color: '#9c27b0',
      onPress: () => Alert.alert('Funcionalidad', 'Ayuda en desarrollo'),
    },
    {
      id: '6',
      title: 'Acerca de',
      icon: 'info',
      color: '#2196f3',
      onPress: () => Alert.alert('ShareIt v1.0.0', 'Aplicación de compartir fotos y widgets'),
    },
  ];

  const stats = [
    { label: 'Fotos', value: '12' },
    { label: 'Amigos', value: '3' },
    { label: 'Widgets', value: '4' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Perfil</Text>
        </View>

        {/* Profile Info */}
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <MaterialIcons name="person" size={60} color="#667eea" />
            </View>
            <TouchableOpacity style={styles.editAvatarButton}>
              <MaterialIcons name="camera-alt" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
          
          <Text style={styles.userName}>
            {user?.displayName || 'Usuario'}
          </Text>
          <Text style={styles.userEmail}>
            {user?.email || 'usuario@example.com'}
          </Text>

          {/* Stats */}
          <View style={styles.statsContainer}>
            {stats.map((stat, index) => (
              <View key={index} style={styles.statItem}>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Options */}
        <View style={styles.optionsSection}>
          {profileOptions.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={styles.optionItem}
              onPress={option.onPress}
            >
              <View style={styles.optionLeft}>
                <View style={[styles.optionIcon, { backgroundColor: option.color }]}>
                  <MaterialIcons name={option.icon} size={24} color="#fff" />
                </View>
                <Text style={styles.optionTitle}>{option.title}</Text>
              </View>
              <MaterialIcons name="chevron-right" size={20} color="#999" />
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout Button */}
        <View style={styles.logoutSection}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <MaterialIcons name="logout" size={24} color="#f44336" />
            <Text style={styles.logoutText}>Cerrar Sesión</Text>
          </TouchableOpacity>
        </View>

        {/* App Version */}
        <View style={styles.versionSection}>
          <Text style={styles.versionText}>ShareIt v1.0.0</Text>
        </View>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isEditModalVisible}
        onRequestClose={closeEditModal}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Editar Perfil</Text>
              <TouchableOpacity onPress={closeEditModal}>
                <MaterialIcons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {/* Display Name Field */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Nombre</Text>
                <TextInput
                  style={[styles.textInput, validationErrors.displayName && styles.inputError]}
                  value={editingProfile.displayName}
                  onChangeText={(value) => handleFieldChange('displayName', value)}
                  placeholder="Ingresa tu nombre"
                  maxLength={50}
                />
                {validationErrors.displayName && (
                  <Text style={styles.errorText}>{validationErrors.displayName}</Text>
                )}
              </View>

              {/* Email Field */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email</Text>
                <TextInput
                  style={[styles.textInput, validationErrors.email && styles.inputError]}
                  value={editingProfile.email}
                  onChangeText={(value) => handleFieldChange('email', value)}
                  placeholder="Ingresa tu email"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                {validationErrors.email && (
                  <Text style={styles.errorText}>{validationErrors.email}</Text>
                )}
              </View>

              {/* Phone Field */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Teléfono (opcional)</Text>
                <TextInput
                  style={[styles.textInput, validationErrors.phone && styles.inputError]}
                  value={editingProfile.phone}
                  onChangeText={(value) => handleFieldChange('phone', value)}
                  placeholder="Ingresa tu teléfono"
                  keyboardType="phone-pad"
                />
                {validationErrors.phone && (
                  <Text style={styles.errorText}>{validationErrors.phone}</Text>
                )}
              </View>

              {/* Bio Field */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Biografía (opcional)</Text>
                <TextInput
                  style={[styles.textInput, styles.textArea, validationErrors.bio && styles.inputError]}
                  value={editingProfile.bio}
                  onChangeText={(value) => handleFieldChange('bio', value)}
                  placeholder="Cuéntanos sobre ti..."
                  multiline
                  numberOfLines={3}
                  maxLength={150}
                />
                <Text style={styles.characterCount}>
                  {editingProfile.bio.length}/150
                </Text>
                {validationErrors.bio && (
                  <Text style={styles.errorText}>{validationErrors.bio}</Text>
                )}
              </View>
            </ScrollView>

            {/* Modal Actions */}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={closeEditModal}
                disabled={isLoading}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={saveProfile}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Text style={styles.saveButtonText}>Guardando...</Text>
                ) : (
                  <Text style={styles.saveButtonText}>Guardar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
  },
  profileSection: {
    backgroundColor: '#fff',
    alignItems: 'center',
    paddingVertical: 30,
    marginTop: 20,
    marginHorizontal: 20,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#667eea',
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#667eea',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingHorizontal: 40,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#667eea',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },
  optionsSection: {
    backgroundColor: '#fff',
    marginTop: 20,
    marginHorizontal: 20,
    borderRadius: 15,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  logoutSection: {
    marginTop: 20,
    marginHorizontal: 20,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    paddingVertical: 16,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#f44336',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f44336',
    marginLeft: 8,
  },
  versionSection: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  versionText: {
    fontSize: 12,
    color: '#999',
  },
});

export default ProfileScreen;
