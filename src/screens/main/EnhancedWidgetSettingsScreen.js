import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  SafeAreaView,
  StatusBar,
  Animated,
  Dimensions,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import LinearGradient from 'react-native-linear-gradient';

// Components
import LoadingScreen from '../../components/LoadingScreen';
import ErrorScreen from '../../components/ErrorScreen';
import EnhancedCard from '../../components/EnhancedCard';

// Utils
import { WidgetsManager } from '../../utils/clientFunctions';

const { width } = Dimensions.get('window');

const WidgetSettingsScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);
  const { widgets } = useSelector(state => state.widgets);

  const [loading, setLoading] = useState(false);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [selectedWidgetType, setSelectedWidgetType] = useState(null);
  const [widgetForm, setWidgetForm] = useState({
    title: '',
    content: '',
    settings: {},
  });

  const widgetTypes = [
    {
      type: 'clock',
      title: 'Reloj Mundial',
      icon: '⏰',
      description: 'Muestra la hora en diferentes zonas horarias',
      gradient: ['#667eea', '#764ba2'],
      defaultSettings: {
        timezone: 'America/Santo_Domingo',
        format24h: false,
      },
    },
    {
      type: 'notes',
      title: 'Notas Colaborativas',
      icon: '📝',
      description: 'Notas compartidas en tiempo real con amigos',
      gradient: ['#4ecdc4', '#44a08d'],
      defaultSettings: {
        allowEdit: true,
        showHistory: false,
      },
    },
    {
      type: 'photos',
      title: 'Galería Compartida',
      icon: '📸',
      description: 'Álbum de fotos colaborativo',
      gradient: ['#ff6b6b', '#ee5a52'],
      defaultSettings: {
        maxPhotos: 20,
        allowComments: true,
      },
    },
    {
      type: 'weather',
      title: 'Clima Actual',
      icon: '🌤️',
      description: 'Información meteorológica en tiempo real',
      gradient: ['#feca57', '#ff9ff3'],
      defaultSettings: {
        location: 'auto',
        units: 'metric',
      },
    },
  ];

  const handleCreateWidget = async () => {
    if (!selectedWidgetType || !widgetForm.title.trim()) {
      Alert.alert('Error', 'Por favor completa todos los campos requeridos');
      return;
    }

    setLoading(true);
    
    try {
      const widgetData = {
        type: selectedWidgetType.type,
        title: widgetForm.title,
        settings: {
          ...selectedWidgetType.defaultSettings,
          ...widgetForm.settings,
        },
        position: { x: 0, y: 0 },
        size: { width: 2, height: 2 },
      };

      if (selectedWidgetType.type === 'notes') {
        widgetData.settings.content = widgetForm.content;
      }

      const result = await WidgetsManager.createWidget(user.uid, widgetData);
      
      if (result.success) {
        Alert.alert('¡Éxito!', 'Widget creado correctamente');
        setCreateModalVisible(false);
        resetForm();
        // Actualizar lista de widgets
        // dispatch(refreshWidgets());
      } else {
        Alert.alert('Error', result.error);
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo crear el widget');
      console.error('Error creating widget:', error);
    }

    setLoading(false);
  };

  const resetForm = () => {
    setSelectedWidgetType(null);
    setWidgetForm({
      title: '',
      content: '',
      settings: {},
    });
  };

  const renderWidgetTypeSelector = () => (
    <View style={styles.widgetTypesContainer}>
      <Text style={styles.modalTitle}>Selecciona el tipo de widget</Text>
      <ScrollView showsVerticalScrollIndicator={false}>
        {widgetTypes.map((type, index) => (
          <TouchableOpacity
            key={type.type}
            style={[
              styles.widgetTypeCard,
              selectedWidgetType?.type === type.type && styles.selectedWidgetType,
            ]}
            onPress={() => setSelectedWidgetType(type)}
          >
            <LinearGradient
              colors={type.gradient}
              style={styles.widgetTypeGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.widgetTypeContent}>
                <Text style={styles.widgetTypeIcon}>{type.icon}</Text>
                <View style={styles.widgetTypeInfo}>
                  <Text style={styles.widgetTypeTitle}>{type.title}</Text>
                  <Text style={styles.widgetTypeDescription}>
                    {type.description}
                  </Text>
                </View>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderWidgetForm = () => (
    <View style={styles.widgetFormContainer}>
      <Text style={styles.modalTitle}>
        Configurar {selectedWidgetType?.title}
      </Text>
      
      <View style={styles.formGroup}>
        <Text style={styles.formLabel}>Título del Widget</Text>
        <TextInput
          style={styles.formInput}
          placeholder="Ej: Mi reloj personal"
          value={widgetForm.title}
          onChangeText={(text) => setWidgetForm(prev => ({ ...prev, title: text }))}
          maxLength={50}
        />
      </View>

      {selectedWidgetType?.type === 'notes' && (
        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>Contenido Inicial</Text>
          <TextInput
            style={[styles.formInput, styles.textArea]}
            placeholder="Escribe una nota inicial..."
            value={widgetForm.content}
            onChangeText={(text) => setWidgetForm(prev => ({ ...prev, content: text }))}
            multiline
            numberOfLines={4}
            maxLength={500}
          />
        </View>
      )}

      <View style={styles.formActions}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => setSelectedWidgetType(null)}
        >
          <Text style={styles.backButtonText}>← Atrás</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.createButton, loading && styles.disabledButton]}
          onPress={handleCreateWidget}
          disabled={loading}
        >
          <Text style={styles.createButtonText}>
            {loading ? 'Creando...' : 'Crear Widget'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#667eea" />
      
      {/* Header */}
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backIcon}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backIconText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Widgets</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setCreateModalVisible(true)}
          >
            <Text style={styles.addButtonText}>+</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Widgets existentes */}
        <View style={styles.widgetsSection}>
          <Text style={styles.sectionTitle}>Tus Widgets ({widgets?.length || 0})</Text>
          
          {widgets && widgets.length > 0 ? (
            widgets.map((widget, index) => (
              <EnhancedCard
                key={widget.id || index}
                title={widget.title}
                subtitle={`Tipo: ${widget.type} • ${widget.shared ? 'Compartido' : 'Privado'}`}
                icon={widgetTypes.find(t => t.type === widget.type)?.icon || '🔧'}
                cardType="feature"
                onPress={() => {
                  // Navegar a edición del widget
                  Alert.alert('Widget', `Editar ${widget.title}`);
                }}
              />
            ))
          ) : (
            <EnhancedCard
              title="Sin Widgets"
              subtitle="Crea tu primer widget para empezar"
              icon="🎨"
              cardType="default"
              onPress={() => setCreateModalVisible(true)}
            />
          )}
        </View>

        {/* Tipos de widgets disponibles */}
        <View style={styles.typesSection}>
          <Text style={styles.sectionTitle}>Tipos Disponibles</Text>
          <View style={styles.typesGrid}>
            {widgetTypes.map((type, index) => (
              <TouchableOpacity
                key={type.type}
                style={styles.typePreviewCard}
                onPress={() => {
                  setSelectedWidgetType(type);
                  setCreateModalVisible(true);
                }}
              >
                <LinearGradient
                  colors={type.gradient}
                  style={styles.typePreviewGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Text style={styles.typePreviewIcon}>{type.icon}</Text>
                  <Text style={styles.typePreviewTitle}>{type.title}</Text>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Modal de creación */}
      <Modal
        visible={createModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          setCreateModalVisible(false);
          resetForm();
        }}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => {
                setCreateModalVisible(false);
                resetForm();
              }}
            >
              <Text style={styles.modalCloseText}>✕</Text>
            </TouchableOpacity>
          </View>
          
          {!selectedWidgetType ? renderWidgetTypeSelector() : renderWidgetForm()}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafe',
  },
  header: {
    paddingTop: 10,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIconText: {
    fontSize: 20,
    color: '#ffffff',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: 24,
    color: '#ffffff',
    fontWeight: '300',
  },
  scrollContainer: {
    flex: 1,
  },
  widgetsSection: {
    padding: 20,
  },
  typesSection: {
    padding: 20,
    paddingTop: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  typesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  typePreviewCard: {
    width: (width - 60) / 2,
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  typePreviewGradient: {
    padding: 20,
    alignItems: 'center',
    minHeight: 100,
    justifyContent: 'center',
  },
  typePreviewIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  typePreviewTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    textAlign: 'center',
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#f8fafe',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 20,
    paddingBottom: 10,
  },
  modalCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  widgetTypesContainer: {
    flex: 1,
    padding: 20,
    paddingTop: 0,
  },
  widgetTypeCard: {
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedWidgetType: {
    borderColor: '#667eea',
  },
  widgetTypeGradient: {
    padding: 20,
  },
  widgetTypeContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  widgetTypeIcon: {
    fontSize: 28,
    marginRight: 16,
  },
  widgetTypeInfo: {
    flex: 1,
  },
  widgetTypeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  widgetTypeDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  widgetFormContainer: {
    flex: 1,
    padding: 20,
    paddingTop: 0,
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
  formActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 30,
  },
  backButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: '#e2e8f0',
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  createButton: {
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
    backgroundColor: '#667eea',
  },
  disabledButton: {
    opacity: 0.5,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});

export default WidgetSettingsScreen;
