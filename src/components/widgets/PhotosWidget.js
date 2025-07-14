import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Image,
  FlatList,
  Alert,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { updateWidgetSettings } from '../../store/slices/widgetsSlice';
import { fetchPhotos } from '../../store/slices/photosSlice';
import photosService from '../../services/photosService';

const { width } = Dimensions.get('window');

const PhotosWidget = ({ 
  widgetId, 
  size = 'medium', 
  theme = 'light',
  maxPhotos = 6,
  showTitle = true,
  layout = 'grid',
  isShared = false,
  collaborators = [],
  sharedPhotos = [],
  onPress,
  onPhotoPress,
  onSharePress,
  style 
}) => {
  const dispatch = useDispatch();
  const widgetSettings = useSelector(state => 
    state.widgets.settings[widgetId] || {}
  );
  
  const photos = useSelector(state => state.photos.photos);
  const photosLoading = useSelector(state => state.photos.loading);
  const user = useSelector(state => state.auth.user);
  
  const [scaleAnim] = useState(new Animated.Value(1));
  const [fadeAnim] = useState(new Animated.Value(1));
  const [currentIndex, setCurrentIndex] = useState(0);
  const isMountedRef = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Fetch photos when component mounts
  useEffect(() => {
    if (user?.uid && isMountedRef.current) {
      dispatch(fetchPhotos(user.uid));
    }
  }, [dispatch, user?.uid]);

  // Auto-scroll for carousel layout
  useEffect(() => {
    if (layout === 'carousel' && photos.length > 1) {
      const timer = setInterval(() => {
        if (isMountedRef.current) {
          setCurrentIndex(prev => (prev + 1) % Math.min(photos.length, maxPhotos));
        }
      }, 3000);
      return () => clearInterval(timer);
    }
  }, [layout, photos.length, maxPhotos]);

  const handlePress = () => {
    // Scale animation on press
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    if (onPress) {
      onPress();
    }
  };

  const handlePhotoPress = (photo, index) => {
    if (onPhotoPress) {
      onPhotoPress(photo, index);
    }
  };

  const toggleLayout = () => {
    const layouts = ['grid', 'carousel', 'list'];
    const currentLayoutIndex = layouts.indexOf(layout);
    const newLayout = layouts[(currentLayoutIndex + 1) % layouts.length];
    
    const newSettings = {
      ...widgetSettings,
      layout: newLayout,
    };
    dispatch(updateWidgetSettings({ widgetId, settings: newSettings }));
  };

  const getDisplayPhotos = () => {
    return photos.slice(0, maxPhotos);
  };

  const getStyles = () => {
    const sizeStyles = {
      small: {
        container: { width: width * 0.4, height: 120 },
        photo: { width: 30, height: 30 },
        titleText: { fontSize: 12 },
        countText: { fontSize: 10 },
      },
      medium: {
        container: { width: width * 0.6, height: 200 },
        photo: { width: 60, height: 60 },
        titleText: { fontSize: 14 },
        countText: { fontSize: 12 },
      },
      large: {
        container: { width: width * 0.8, height: 280 },
        photo: { width: 80, height: 80 },
        titleText: { fontSize: 16 },
        countText: { fontSize: 14 },
      },
    };

    const themeStyles = {
      light: {
        container: { backgroundColor: '#ffffff', borderColor: '#e0e0e0' },
        titleText: { color: '#333333' },
        countText: { color: '#666666' },
        emptyText: { color: '#999999' },
        iconColor: '#666666',
      },
      dark: {
        container: { backgroundColor: '#1a1a1a', borderColor: '#333333' },
        titleText: { color: '#ffffff' },
        countText: { color: '#cccccc' },
        emptyText: { color: '#888888' },
        iconColor: '#cccccc',
      },
      gradient: {
        container: { backgroundColor: '#667eea', borderColor: '#764ba2' },
        titleText: { color: '#ffffff' },
        countText: { color: '#f0f0f0' },
        emptyText: { color: '#e0e0e0' },
        iconColor: '#ffffff',
      },
    };

    return {
      size: sizeStyles[size],
      theme: themeStyles[theme],
    };
  };

  const styles = getStyles();
  const displayPhotos = getDisplayPhotos();

  const renderGridLayout = () => {
    const numColumns = size === 'small' ? 2 : size === 'medium' ? 3 : 4;
    
    return (
      <FlatList
        data={displayPhotos}
        numColumns={numColumns}
        keyExtractor={(item, index) => `photo_${item.id || index}`}
        renderItem={({ item, index }) => (
          <TouchableOpacity
            onPress={() => handlePhotoPress(item, index)}
            style={[defaultStyles.gridPhoto, styles.size.photo]}
            activeOpacity={0.8}
          >
            <Image
              source={{ uri: item.url || item.uri }}
              style={[defaultStyles.photoImage, styles.size.photo]}
              resizeMode="cover"
            />
          </TouchableOpacity>
        )}
        contentContainerStyle={defaultStyles.gridContainer}
        showsVerticalScrollIndicator={false}
        scrollEnabled={true}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        windowSize={10}
        initialNumToRender={6}
        getItemLayout={(data, index) => ({
          length: styles.size.photo.width + 4,
          offset: (styles.size.photo.width + 4) * index,
          index,
        })}
      />
    );
  };

  const renderCarouselLayout = () => {
    if (displayPhotos.length === 0) return null;

    const currentPhoto = displayPhotos[currentIndex];
    
    return (
      <View style={defaultStyles.carouselContainer}>
        <TouchableOpacity
          onPress={() => handlePhotoPress(currentPhoto, currentIndex)}
          style={defaultStyles.carouselPhoto}
          activeOpacity={0.8}
        >
          <Image
            source={{ uri: currentPhoto.url || currentPhoto.uri }}
            style={defaultStyles.carouselImage}
            resizeMode="cover"
          />
        </TouchableOpacity>
        
        <View style={defaultStyles.carouselIndicators}>
          {displayPhotos.map((_, index) => (
            <View
              key={index}
              style={[
                defaultStyles.indicator,
                {
                  backgroundColor: index === currentIndex 
                    ? styles.theme.iconColor 
                    : `${styles.theme.iconColor}40`
                }
              ]}
            />
          ))}
        </View>
      </View>
    );
  };

  const renderListLayout = () => {
    return (
      <FlatList
        data={displayPhotos}
        keyExtractor={(item, index) => `photo_${index}`}
        renderItem={({ item, index }) => (
          <TouchableOpacity
            onPress={() => handlePhotoPress(item, index)}
            style={defaultStyles.listItem}
            activeOpacity={0.8}
          >
            <Image
              source={{ uri: item.url || item.uri }}
              style={[defaultStyles.listPhoto, styles.size.photo]}
              resizeMode="cover"
            />
            <View style={defaultStyles.listContent}>
              <Text style={[
                defaultStyles.listTitle,
                styles.theme.titleText
              ]}>
                {item.title || `Foto ${index + 1}`}
              </Text>
              <Text style={[
                defaultStyles.listDate,
                styles.theme.countText
              ]}>
                {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'Hoy'}
              </Text>
            </View>
          </TouchableOpacity>
        )}
        contentContainerStyle={defaultStyles.listContainer}
        showsVerticalScrollIndicator={false}
      />
    );
  };

  // Render collaborators avatars
  const renderCollaborators = () => {
    if (!isShared || collaborators.length === 0) return null;

    return (
      <View style={defaultStyles.collaboratorsContainer}>
        {collaborators.slice(0, 3).map((collaborator, index) => (
          <View
            key={collaborator.id || index}
            style={[
              defaultStyles.collaboratorAvatar,
              { 
                marginLeft: index > 0 ? -8 : 0,
                zIndex: collaborators.length - index 
              }
            ]}
          >
            {collaborator.photoURL ? (
              <Image
                source={{ uri: collaborator.photoURL }}
                style={defaultStyles.avatarImage}
              />
            ) : (
              <View style={[defaultStyles.avatarPlaceholder, { backgroundColor: styles.theme.iconColor }]}>
                <Text style={defaultStyles.avatarText}>
                  {collaborator.displayName?.[0]?.toUpperCase() || '?'}
                </Text>
              </View>
            )}
            {collaborator.isOnline && (
              <View style={defaultStyles.onlineIndicator} />
            )}
          </View>
        ))}
        {collaborators.length > 3 && (
          <View style={[defaultStyles.collaboratorAvatar, { marginLeft: -8 }]}>
            <View style={[defaultStyles.avatarPlaceholder, { backgroundColor: styles.theme.iconColor }]}>
              <Text style={defaultStyles.avatarText}>
                +{collaborators.length - 3}
              </Text>
            </View>
          </View>
        )}
      </View>
    );
  };

  // Render photo with sharing indicators
  const renderPhotoWithIndicators = (item, index, photoStyle) => {
    const isSharedPhoto = sharedPhotos.some(sp => sp.id === item.id);
    const photoOwner = collaborators.find(c => c.id === item.userId);
    
    return (
      <View style={defaultStyles.photoContainer}>
        <TouchableOpacity
          onPress={() => handlePhotoPress(item, index)}
          style={photoStyle}
          activeOpacity={0.8}
        >
          <Image
            source={{ uri: item.url || item.uri }}
            style={[defaultStyles.photoImage, photoStyle]}
            resizeMode="cover"
          />
          
          {/* Sharing indicator */}
          {isSharedPhoto && (
            <View style={defaultStyles.sharedIndicator}>
              <Ionicons name="people" size={12} color="#fff" />
            </View>
          )}
          
          {/* Owner indicator for shared photos */}
          {isShared && photoOwner && photoOwner.id !== user?.uid && (
            <View style={defaultStyles.ownerIndicator}>
              {photoOwner.photoURL ? (
                <Image
                  source={{ uri: photoOwner.photoURL }}
                  style={defaultStyles.ownerAvatar}
                />
              ) : (
                <View style={defaultStyles.ownerAvatarPlaceholder}>
                  <Text style={defaultStyles.ownerAvatarText}>
                    {photoOwner.displayName?.[0]?.toUpperCase() || '?'}
                  </Text>
                </View>
              )}
            </View>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  const renderContent = () => {
    if (photosLoading) {
      return (
        <View style={defaultStyles.centerContent}>
          <Ionicons 
            name="image-outline" 
            size={40} 
            color={styles.theme.iconColor} 
          />
          <Text style={[
            defaultStyles.loadingText,
            styles.theme.emptyText
          ]}>
            Cargando fotos...
          </Text>
        </View>
      );
    }

    if (displayPhotos.length === 0) {
      return (
        <View style={defaultStyles.centerContent}>
          <Ionicons 
            name="images-outline" 
            size={40} 
            color={styles.theme.iconColor} 
          />
          <Text style={[
            defaultStyles.emptyText,
            styles.theme.emptyText
          ]}>
            {isShared ? 'No hay fotos compartidas' : 'No hay fotos'}
          </Text>
          {isShared && (
            <Text style={[
              defaultStyles.emptySubtext,
              styles.theme.emptyText
            ]}>
              Los colaboradores pueden agregar fotos
            </Text>
          )}
        </View>
      );
    }

    switch (layout) {
      case 'carousel':
        return renderCarouselLayout();
      case 'list':
        return renderListLayout();
      default:
        return renderGridLayout();
    }
  };

  return (
    <Animated.View style={[
      defaultStyles.container,
      styles.size.container,
      styles.theme.container,
      { transform: [{ scale: scaleAnim }] },
      style
    ]}>
      <TouchableOpacity
        onPress={handlePress}
        style={defaultStyles.touchable}
        activeOpacity={0.8}
      >
        {showTitle && (
          <View style={defaultStyles.header}>
            <View style={defaultStyles.titleContainer}>
              <Ionicons 
                name={isShared ? "people" : "images-outline"} 
                size={20} 
                color={isShared ? "#4CAF50" : styles.theme.iconColor} 
              />
              <Text style={[
                defaultStyles.titleText,
                styles.size.titleText,
                styles.theme.titleText
              ]}>
                {isShared ? 'Fotos Compartidas' : 'Mis Fotos'}
              </Text>
              {isShared && (
                <View style={defaultStyles.sharedBadge}>
                  <Text style={defaultStyles.sharedBadgeText}>COMPARTIDO</Text>
                </View>
              )}
            </View>
            
            <View style={defaultStyles.headerActions}>
              {renderCollaborators()}
              <Text style={[
                defaultStyles.countText,
                styles.size.countText,
                styles.theme.countText
              ]}>
                {photos.length}
              </Text>
              {onSharePress && !isShared && (
                <TouchableOpacity onPress={onSharePress}>
                  <Ionicons 
                    name="share-outline" 
                    size={18} 
                    color={styles.theme.iconColor} 
                  />
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={toggleLayout}>
                <Ionicons 
                  name={layout === 'grid' ? 'grid-outline' : 
                        layout === 'carousel' ? 'play-circle-outline' : 
                        'list-outline'} 
                  size={18} 
                  color={styles.theme.iconColor} 
                />
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={defaultStyles.content}>
          {renderContent()}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const defaultStyles = StyleSheet.create({
  container: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    margin: 8,
  },
  touchable: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  titleText: {
    fontWeight: '600',
    marginLeft: 8,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  countText: {
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    fontSize: 12,
  },
  emptyText: {
    marginTop: 8,
    fontSize: 12,
    textAlign: 'center',
  },
  gridContainer: {
    gap: 4,
  },
  gridPhoto: {
    margin: 2,
    borderRadius: 8,
    overflow: 'hidden',
  },
  photoImage: {
    borderRadius: 8,
  },
  carouselContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  carouselPhoto: {
    flex: 1,
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
  },
  carouselImage: {
    width: '100%',
    height: '100%',
  },
  carouselIndicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
    gap: 4,
  },
  indicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  listContainer: {
    gap: 8,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  listPhoto: {
    borderRadius: 8,
  },
  listContent: {
    flex: 1,
  },
  listTitle: {
    fontSize: 12,
    fontWeight: '500',
  },
  listDate: {
    fontSize: 10,
    marginTop: 2,
  },
  // Collaboration styles
  sharedBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 8,
  },
  sharedBadgeText: {
    color: '#fff',
    fontSize: 8,
    fontWeight: '600',
  },
  collaboratorsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  collaboratorAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#fff',
    position: 'relative',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 8,
    fontWeight: '600',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
    borderWidth: 1,
    borderColor: '#fff',
  },
  photoContainer: {
    position: 'relative',
  },
  sharedIndicator: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 8,
    padding: 2,
  },
  ownerIndicator: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fff',
  },
  ownerAvatar: {
    width: '100%',
    height: '100%',
    borderRadius: 6,
  },
  ownerAvatarPlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: 6,
    backgroundColor: '#667eea',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ownerAvatarText: {
    color: '#fff',
    fontSize: 8,
    fontWeight: '600',
  },
  emptySubtext: {
    marginTop: 4,
    fontSize: 10,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default PhotosWidget;
