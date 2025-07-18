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
  Dimensions,
  RefreshControl,
  Modal,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { LinearGradient } from 'expo-linear-gradient';

// Components
import LoadingScreen from '../../components/LoadingScreen';
import ErrorScreen from '../../components/ErrorScreen';
import EnhancedCard from '../../components/EnhancedCard';

// Utils
import { PhotoManager } from '../../utils/clientFunctions';

const { width, height } = Dimensions.get('window');
const GRID_ITEM_SIZE = (width - 60) / 3;

const EnhancedGalleryScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);
  const { photos, loading: photosLoading } = useSelector(state => state.photos);

  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [filterMode, setFilterMode] = useState('all'); // 'all' | 'mine' | 'shared'
  const [previewModalVisible, setPreviewModalVisible] = useState(false);

  const scrollY = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadPhotos();
    
    // Animación de entrada
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, []);

  const loadPhotos = async () => {
    setLoading(true);
    try {
      const result = await PhotoManager.getUserPhotos(user.uid);
      if (result.success) {
        // dispatch(setPhotos(result.photos));
      } else {
        Alert.alert('Error', 'No se pudieron cargar las fotos');
      }
    } catch (error) {
      console.error('Error loading photos:', error);
      Alert.alert('Error', 'Error al cargar las fotos');
    }
    setLoading(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPhotos();
    setRefreshing(false);
  };

  const handlePhotoPress = (photo) => {
    setSelectedPhoto(photo);
    setPreviewModalVisible(true);
  };

  const handleDeletePhoto = async (photoId) => {
    Alert.alert(
      'Eliminar Foto',
      '¿Estás seguro de que deseas eliminar esta foto?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              const result = await PhotoManager.deletePhoto(photoId);
              if (result.success) {
                Alert.alert('Éxito', 'Foto eliminada correctamente');
                await loadPhotos();
              } else {
                Alert.alert('Error', result.error);
              }
            } catch (error) {
              Alert.alert('Error', 'No se pudo eliminar la foto');
            }
            setLoading(false);
          },
        },
      ]
    );
  };

  const getFilteredPhotos = () => {
    if (!photos) return [];
    
    switch (filterMode) {
      case 'mine':
        return photos.filter(photo => photo.userId === user.uid);
      case 'shared':
        return photos.filter(photo => photo.userId !== user.uid);
      default:
        return photos;
    }
  };

  const renderHeader = () => {
    const headerOpacity = scrollY.interpolate({
      inputRange: [0, 50],
      outputRange: [1, 0.8],
      extrapolate: 'clamp',
    });

    return (
      <Animated.View style={[styles.headerContainer, { opacity: headerOpacity }]}>
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
            
            <Text style={styles.headerTitle}>Galería</Text>
            
            <TouchableOpacity
              style={styles.cameraButton}
              onPress={() => navigation.navigate('Camera')}
            >
              <Text style={styles.cameraButtonText}>📷</Text>
            </TouchableOpacity>
          </View>

          {/* Estadísticas */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{getFilteredPhotos().length}</Text>
              <Text style={styles.statLabel}>Fotos</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>
                {photos?.filter(p => p.userId === user.uid).length || 0}
              </Text>
              <Text style={styles.statLabel}>Mías</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>
                {photos?.filter(p => p.userId !== user.uid).length || 0}
              </Text>
              <Text style={styles.statLabel}>Compartidas</Text>
            </View>
          </View>
        </LinearGradient>
      </Animated.View>
    );
  };

  const renderFilterTabs = () => (
    <View style={styles.filterContainer}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterTabs}
      >
        {[
          { key: 'all', label: 'Todas', count: photos?.length || 0 },
          { key: 'mine', label: 'Mías', count: photos?.filter(p => p.userId === user.uid).length || 0 },
          { key: 'shared', label: 'Compartidas', count: photos?.filter(p => p.userId !== user.uid).length || 0 },
        ].map((filter) => (
          <TouchableOpacity
            key={filter.key}
            style={[
              styles.filterTab,
              filterMode === filter.key && styles.activeFilterTab,
            ]}
            onPress={() => setFilterMode(filter.key)}
          >
            <Text style={[
              styles.filterTabText,
              filterMode === filter.key && styles.activeFilterTabText,
            ]}>
              {filter.label} ({filter.count})
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.viewModeContainer}>
        <TouchableOpacity
          style={[
            styles.viewModeButton,
            viewMode === 'grid' && styles.activeViewMode,
          ]}
          onPress={() => setViewMode('grid')}
        >
          <Text style={styles.viewModeIcon}>⊞</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.viewModeButton,
            viewMode === 'list' && styles.activeViewMode,
          ]}
          onPress={() => setViewMode('list')}
        >
          <Text style={styles.viewModeIcon}>☰</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderGridView = () => {
    const filteredPhotos = getFilteredPhotos();
    
    if (filteredPhotos.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📸</Text>
          <Text style={styles.emptyTitle}>Sin fotos</Text>
          <Text style={styles.emptySubtitle}>
            {filterMode === 'all' 
              ? 'Toma tu primera foto para empezar'
              : `No hay fotos en la categoría "${filterMode}"`
            }
          </Text>
          <TouchableOpacity
            style={styles.emptyButton}
            onPress={() => navigation.navigate('Camera')}
          >
            <Text style={styles.emptyButtonText}>Tomar Foto</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.gridContainer}>
        {filteredPhotos.map((photo, index) => (
          <TouchableOpacity
            key={photo.id || index}
            style={styles.gridItem}
            onPress={() => handlePhotoPress(photo)}
          >
            <View style={styles.photoContainer}>
              <Image
                source={{ uri: photo.url || 'https://via.placeholder.com/150' }}
                style={styles.gridPhoto}
                resizeMode="cover"
              />
              
              {/* Overlay con información */}
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.7)']}
                style={styles.photoOverlay}
              >
                <View style={styles.photoInfo}>
                  <Text style={styles.photoOwner}>
                    {photo.userId === user.uid ? '📱' : '👤'}
                  </Text>
                  {photo.createdAt && (
                    <Text style={styles.photoDate}>
                      {new Date(photo.createdAt).toLocaleDateString()}
                    </Text>
                  )}
                </View>
              </LinearGradient>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderListView = () => {
    const filteredPhotos = getFilteredPhotos();
    
    return (
      <View style={styles.listContainer}>
        {filteredPhotos.map((photo, index) => (
          <EnhancedCard
            key={photo.id || index}
            title={photo.title || `Foto ${index + 1}`}
            subtitle={`${photo.userId === user.uid ? 'Tuya' : 'Compartida'} • ${
              photo.createdAt ? new Date(photo.createdAt).toLocaleDateString() : 'Sin fecha'
            }`}
            imageUri={photo.url}
            cardType="feature"
            onPress={() => handlePhotoPress(photo)}
            onLongPress={() => {
              if (photo.userId === user.uid) {
                handleDeletePhoto(photo.id);
              }
            }}
          />
        ))}
      </View>
    );
  };

  const renderPhotoPreview = () => (
    <Modal
      visible={previewModalVisible}
      animationType="fade"
      presentationStyle="fullScreen"
      onRequestClose={() => setPreviewModalVisible(false)}
    >
      <SafeAreaView style={styles.previewContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#000" />
        
        <View style={styles.previewHeader}>
          <TouchableOpacity
            style={styles.previewCloseButton}
            onPress={() => setPreviewModalVisible(false)}
          >
            <Text style={styles.previewCloseText}>✕</Text>
          </TouchableOpacity>
          
          {selectedPhoto?.userId === user.uid && (
            <TouchableOpacity
              style={styles.previewDeleteButton}
              onPress={() => {
                setPreviewModalVisible(false);
                handleDeletePhoto(selectedPhoto.id);
              }}
            >
              <Text style={styles.previewDeleteText}>🗑️</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.previewImageContainer}>
          <Image
            source={{ uri: selectedPhoto?.url || 'https://via.placeholder.com/400' }}
            style={styles.previewImage}
            resizeMode="contain"
          />
        </View>

        <View style={styles.previewInfo}>
          <Text style={styles.previewTitle}>
            {selectedPhoto?.title || 'Foto sin título'}
          </Text>
          <Text style={styles.previewDate}>
            {selectedPhoto?.createdAt 
              ? new Date(selectedPhoto.createdAt).toLocaleString()
              : 'Sin fecha'
            }
          </Text>
          <Text style={styles.previewOwner}>
            {selectedPhoto?.userId === user.uid ? 'Tu foto' : 'Foto compartida'}
          </Text>
        </View>
      </SafeAreaView>
    </Modal>
  );

  if (loading && !refreshing) {
    return <LoadingScreen message="Cargando galería..." />;
  }

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <StatusBar barStyle="light-content" backgroundColor="#667eea" />
      
      {renderHeader()}
      
      <Animated.ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#667eea']}
            tintColor="#667eea"
          />
        }
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        {renderFilterTabs()}
        
        {viewMode === 'grid' ? renderGridView() : renderListView()}
        
        <View style={styles.bottomSpacer} />
      </Animated.ScrollView>

      {renderPhotoPreview()}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafe',
  },
  headerContainer: {
    zIndex: 1000,
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
    marginBottom: 20,
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
  cameraButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraButtonText: {
    fontSize: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  content: {
    flex: 1,
  },
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  filterTabs: {
    flexDirection: 'row',
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 12,
    backgroundColor: '#f1f5f9',
  },
  activeFilterTab: {
    backgroundColor: '#667eea',
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  activeFilterTabText: {
    color: '#ffffff',
  },
  viewModeContainer: {
    flexDirection: 'row',
  },
  viewModeButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    backgroundColor: '#f1f5f9',
  },
  activeViewMode: {
    backgroundColor: '#667eea',
  },
  viewModeIcon: {
    fontSize: 16,
    color: '#666',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    justifyContent: 'space-between',
  },
  gridItem: {
    width: GRID_ITEM_SIZE,
    height: GRID_ITEM_SIZE,
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  photoContainer: {
    flex: 1,
    position: 'relative',
  },
  gridPhoto: {
    width: '100%',
    height: '100%',
  },
  photoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
    justifyContent: 'flex-end',
  },
  photoInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingBottom: 8,
  },
  photoOwner: {
    fontSize: 12,
  },
  photoDate: {
    fontSize: 10,
    color: '#ffffff',
    fontWeight: '600',
  },
  listContainer: {
    padding: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 80,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  emptyButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#667eea',
    borderRadius: 8,
  },
  emptyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  bottomSpacer: {
    height: 40,
  },
  // Preview Modal Styles
  previewContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  previewCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewCloseText: {
    fontSize: 18,
    color: '#ffffff',
    fontWeight: '600',
  },
  previewDeleteButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewDeleteText: {
    fontSize: 18,
  },
  previewImageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  previewInfo: {
    padding: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 8,
  },
  previewDate: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 4,
  },
  previewOwner: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
});

export default EnhancedGalleryScreen;
