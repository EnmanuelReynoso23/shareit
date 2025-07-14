import React, { useState, useEffect, useCallback, useMemo, useRef, startTransition } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
  InteractionManager,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSelector, useDispatch } from 'react-redux';

const { width } = Dimensions.get('window');
const imageSize = (width - 60) / 3;
const INITIAL_LOAD_SIZE = 15; // Reduced for better performance
const PAGE_SIZE = 10;
const MEMORY_LIMIT = 100; // Maximum photos to keep in memory

const GalleryScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { photos: allPhotos, loading, error } = useSelector(state => state.photos);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [visiblePhotos, setVisiblePhotos] = useState([]);
  
  // Refs for memory management
  const flatListRef = useRef(null);
  const loadingTimeoutRef = useRef(null);
  const viewabilityConfig = useRef({
    minimumViewTime: 100,
    viewAreaCoveragePercentThreshold: 50,
  });

  // Memory-optimized photos with pagination
  const photos = useMemo(() => {
    const startIndex = 0;
    const endIndex = currentPage * PAGE_SIZE;
    let paginatedPhotos = allPhotos.slice(startIndex, endIndex);
    
    // Memory management: limit photos in memory
    if (paginatedPhotos.length > MEMORY_LIMIT) {
      paginatedPhotos = paginatedPhotos.slice(-MEMORY_LIMIT);
    }
    
    // Check if we have more photos to load
    setHasMore(endIndex < allPhotos.length);
    
    return paginatedPhotos;
  }, [allPhotos, currentPage]);

  // Generate mock data if no photos exist
  const mockPhotos = useMemo(() => {
    if (allPhotos.length > 0) return [];
    
    return Array.from({ length: 50 }, (_, index) => ({
      id: `mock_${index + 1}`,
      uri: null,
      title: `Foto ${index + 1}`,
      createdAt: new Date(Date.now() - index * 86400000).toISOString(),
      isMock: true,
    }));
  }, [allPhotos.length]);

  const displayPhotos = photos.length > 0 ? photos : mockPhotos;

  // Cleanup function to clear timeouts
  useEffect(() => {
    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, []);

  // Track visible photos to manage memory
  const onViewableItemsChanged = useCallback(({ viewableItems }) => {
    const visibleIds = viewableItems.map(item => item.item.id);
    setVisiblePhotos(visibleIds);
  }, []);

  // Load more photos when reaching end with debouncing
  const loadMorePhotos = useCallback(() => {
    if (loadingMore || !hasMore) return;
    
    setLoadingMore(true);
    
    // Clear previous timeout
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
    }
    
    // Use InteractionManager for better performance
    InteractionManager.runAfterInteractions(() => {
      loadingTimeoutRef.current = setTimeout(() => {
        setCurrentPage(prev => prev + 1);
        setLoadingMore(false);
      }, 300); // Reduced delay for better UX
    });
  }, [loadingMore, hasMore]);

  // Refresh photos with cleanup
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setCurrentPage(1);
    setVisiblePhotos([]);
    
    // Clear any pending timeouts
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
    }
    
    InteractionManager.runAfterInteractions(() => {
      setTimeout(() => {
        setRefreshing(false);
      }, 800); // Reduced delay
    });
  }, []);

  // Memoized render function to prevent unnecessary re-renders
  const renderPhoto = useCallback(({ item }) => (
    <TouchableOpacity 
      style={styles.photoContainer}
      onPress={() => navigation.navigate('PhotoDetail', { photo: item })}
    >
      <View style={[styles.photoPlaceholder, item.isMock && styles.mockPhoto]}>
        <MaterialIcons 
          name="photo" 
          size={40} 
          color={item.isMock ? "#ccc" : "#999"} 
        />
        {item.isMock && (
          <Text style={styles.mockLabel}>Mock</Text>
        )}
      </View>
    </TouchableOpacity>
  ), [navigation]);

  // Render footer with loading indicator
  const renderFooter = useCallback(() => {
    if (!loadingMore) return null;
    
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#667eea" />
        <Text style={styles.loadingText}>Cargando más fotos...</Text>
      </View>
    );
  }, [loadingMore]);

  // Get item layout for performance optimization
  const getItemLayout = useCallback((data, index) => {
    const rowIndex = Math.floor(index / 3);
    return {
      length: imageSize + 10,
      offset: (imageSize + 10) * rowIndex,
      index,
    };
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Galería</Text>
        <View style={styles.headerActions}>
          <Text style={styles.photoCount}>
            {displayPhotos.length} fotos
          </Text>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => navigation.navigate('Camera')}
          >
            <MaterialIcons name="add-a-photo" size={24} color="#667eea" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Gallery Grid */}
      {displayPhotos.length > 0 ? (
        <FlatList
          ref={flatListRef}
          data={displayPhotos}
          renderItem={renderPhoto}
          numColumns={3}
          contentContainerStyle={styles.grid}
          showsVerticalScrollIndicator={false}
          keyExtractor={(item) => item.id}
          
          // Enhanced performance optimizations
          removeClippedSubviews={true}
          maxToRenderPerBatch={12} // Optimized for 3 columns
          windowSize={8} // Reduced window size
          initialNumToRender={INITIAL_LOAD_SIZE}
          getItemLayout={getItemLayout}
          
          // Memory management
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig.current}
          
          // Infinite scroll with improved threshold
          onEndReached={loadMorePhotos}
          onEndReachedThreshold={0.3} // Reduced threshold for better performance
          ListFooterComponent={renderFooter}
          
          // Pull to refresh
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#667eea']}
              tintColor="#667eea"
            />
          }
          
          // Additional performance props
          legacyImplementation={false}
          disableVirtualization={false}
          updateCellsBatchingPeriod={100}
          maintainVisibleContentPosition={
            hasMore ? { minIndexForVisible: 0, autoscrollToTopThreshold: 100 } : null
          }
        />
      ) : (
        <View style={styles.emptyState}>
          <MaterialIcons name="photo-library" size={80} color="#ccc" />
          <Text style={styles.emptyText}>No hay fotos aún</Text>
          <Text style={styles.emptySubtext}>Toma tu primera foto para comenzar</Text>
          <TouchableOpacity 
            style={styles.cameraButton}
            onPress={() => navigation.navigate('Camera')}
          >
            <MaterialIcons name="camera-alt" size={20} color="#fff" />
            <Text style={styles.cameraButtonText}>Tomar Foto</Text>
          </TouchableOpacity>
        </View>
      )}
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
    justifyContent: 'space-between',
    alignItems: 'center',
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  photoCount: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  addButton: {
    padding: 8,
  },
  grid: {
    padding: 20,
  },
  photoContainer: {
    width: imageSize,
    height: imageSize,
    marginRight: 10,
    marginBottom: 10,
  },
  photoPlaceholder: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  cameraButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#667eea',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
  },
  cameraButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  mockPhoto: {
    backgroundColor: '#f8f8f8',
    borderStyle: 'dashed',
  },
  mockLabel: {
    fontSize: 10,
    color: '#999',
    marginTop: 4,
    fontWeight: '500',
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    fontSize: 14,
    color: '#666',
  },
});

export default GalleryScreen;
