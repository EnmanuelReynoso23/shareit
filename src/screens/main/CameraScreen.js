import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  Dimensions,
  Animated,
  Image,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { Camera } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import * as MediaLibrary from 'expo-media-library';
import { useDispatch, useSelector } from 'react-redux';
import { addPhoto } from '../../store/slices/photosSlice';

const { width, height } = Dimensions.get('window');

const CameraScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const user = useSelector(state => state.auth.user);
  
  // Camera states
  const [hasPermission, setHasPermission] = useState(null);
  const cameraRef = useRef(null);
  const [type, setType] = useState(Camera.Constants.Type.back);
  const [flashMode, setFlashMode] = useState(Camera.Constants.FlashMode.off);
  const [zoom, setZoom] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [permissionsLoading, setPermissionsLoading] = useState(true);
  
  // Photo preview states
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [photoSaving, setPhotoSaving] = useState(false);
  
  // UI animations
  const [captureAnimation] = useState(new Animated.Value(1));
  const [flashAnimation] = useState(new Animated.Value(0));
  const [zoomAnimation] = useState(new Animated.Value(1));
  
  // Mount state reference
  const isMountedRef = useRef(true);

  useEffect(() => {
    requestPermissions();
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const requestPermissions = async () => {
    if (!isMountedRef.current) return;
    
    setPermissionsLoading(true);
    try {
      // Request permissions sequentially to avoid race conditions
      const { status: cameraStatus } = await Camera.requestCameraPermissionsAsync();
      
      if (cameraStatus !== 'granted') {
        if (isMountedRef.current) {
          setHasPermission(false);
          setPermissionsLoading(false);
          Alert.alert(
            'Permiso de cámara requerido',
            'La aplicación necesita acceso a la cámara para tomar fotos.',
            [
              { text: 'Configuración', onPress: () => navigation.goBack() },
              { text: 'Cancelar', onPress: () => navigation.goBack() }
            ]
          );
        }
        return;
      }

      const { status: mediaStatus } = await MediaLibrary.requestPermissionsAsync();
      
      if (mediaStatus !== 'granted') {
        if (isMountedRef.current) {
          setHasPermission(false);
          setPermissionsLoading(false);
          Alert.alert(
            'Permiso de galería requerido',
            'La aplicación necesita acceso a la galería para guardar fotos.',
            [
              { text: 'Configuración', onPress: () => navigation.goBack() },
              { text: 'Cancelar', onPress: () => navigation.goBack() }
            ]
          );
        }
        return;
      }

      if (isMountedRef.current) {
        setHasPermission(true);
        setPermissionsLoading(false);
      }
    } catch (error) {
      console.error('Error requesting permissions:', error);
      if (isMountedRef.current) {
        setHasPermission(false);
        setPermissionsLoading(false);
        Alert.alert(
          'Error de permisos',
          'Hubo un problema al solicitar los permisos. Inténtalo de nuevo.',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      }
    }
  };

  const handleCameraReady = () => {
    if (isMountedRef.current) {
      setIsCameraReady(true);
    }
  };

  const takePicture = async () => {
    if (cameraRef.current && isCameraReady) {
      try {
        // Capture animation
        Animated.sequence([
          Animated.timing(captureAnimation, {
            toValue: 0.8,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.timing(captureAnimation, {
            toValue: 1,
            duration: 100,
            useNativeDriver: true,
          }),
        ]).start();

        // Flash animation
        if (flashMode !== Camera.Constants.FlashMode.off) {
          Animated.timing(flashAnimation, {
            toValue: 1,
            duration: 100,
            useNativeDriver: true,
          }).start(() => {
            Animated.timing(flashAnimation, {
              toValue: 0,
              duration: 100,
              useNativeDriver: true,
            }).start();
          });
        }

        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          base64: false,
          exif: true,
        });

        if (isMountedRef.current) {
          setCapturedPhoto(photo);
          setPreviewVisible(true);
        }
      } catch (error) {
        console.error('Error taking picture:', error);
        Alert.alert('Error', 'No se pudo tomar la foto. Inténtalo de nuevo.');
      }
    }
  };

  const savePhoto = async () => {
    if (!capturedPhoto || !isMountedRef.current) return;
    
    setPhotoSaving(true);
    
    try {
      // Save to device gallery
      const asset = await MediaLibrary.createAssetAsync(capturedPhoto.uri);
      
      // Create photo object for Redux store
      const photoData = {
        id: Date.now().toString(),
        uri: capturedPhoto.uri,
        url: capturedPhoto.uri, // For local photos
        width: capturedPhoto.width,
        height: capturedPhoto.height,
        createdAt: new Date().toISOString(),
        userId: user?.uid,
        location: null, // Could add GPS location later
        tags: [],
        likes: 0,
        comments: [],
      };

      // Add to Redux store
      dispatch(addPhoto(photoData));
      
      if (isMountedRef.current) {
        Alert.alert(
          'Foto guardada',
          'La foto se ha guardado exitosamente en tu galería.',
          [
            { text: 'Ver galería', onPress: () => navigation.navigate('Gallery') },
            { text: 'Tomar otra', onPress: closePreview }
          ]
        );
      }
    } catch (error) {
      console.error('Error saving photo:', error);
      if (isMountedRef.current) {
        Alert.alert('Error', 'No se pudo guardar la foto.');
      }
    } finally {
      if (isMountedRef.current) {
        setPhotoSaving(false);
      }
    }
  };

  const closePreview = () => {
    if (isMountedRef.current) {
      setCapturedPhoto(null);
      setPreviewVisible(false);
    }
  };

  const toggleCameraType = () => {
    if (isMountedRef.current) {
      setType(
        type === Camera.Constants.Type.back
          ? Camera.Constants.Type.front
          : Camera.Constants.Type.back
      );
    }
  };

  const toggleFlashMode = () => {
    if (isMountedRef.current) {
      const modes = [
        Camera.Constants.FlashMode.off,
        Camera.Constants.FlashMode.on,
        Camera.Constants.FlashMode.auto,
      ];
      const currentIndex = modes.indexOf(flashMode);
      const nextIndex = (currentIndex + 1) % modes.length;
      setFlashMode(modes[nextIndex]);
    }
  };

  const handleZoom = (value) => {
    if (isMountedRef.current) {
      setZoom(value);
      Animated.timing(zoomAnimation, {
        toValue: 1 + value * 0.5,
        duration: 100,
        useNativeDriver: true,
      }).start();
    }
  };

  const openGallery = () => {
    navigation.navigate('Gallery');
  };

  const getFlashIcon = () => {
    switch (flashMode) {
      case Camera.Constants.FlashMode.on:
        return 'flash';
      case Camera.Constants.FlashMode.auto:
        return 'flash-auto';
      default:
        return 'flash-off';
    }
  };

  if (hasPermission === null) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#667eea" />
        <Text style={styles.loadingText}>Solicitando permisos...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.noPermissionContainer}>
        <Ionicons name="camera-off" size={64} color="#999" />
        <Text style={styles.noPermissionText}>
          Sin acceso a la cámara
        </Text>
        <Text style={styles.noPermissionSubtext}>
          Verifica los permisos en configuración
        </Text>
        <TouchableOpacity
          style={styles.permissionButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.permissionButtonText}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Flash Overlay */}
      <Animated.View 
        style={[
          styles.flashOverlay,
          {
            opacity: flashAnimation,
          }
        ]}
        pointerEvents="none"
      />

      {/* Camera View */}
      <Camera
        style={styles.camera}
        type={type}
        flashMode={flashMode}
        zoom={zoom}
        ref={cameraRef}
        onCameraReady={handleCameraReady}
      >
        {/* Header Controls */}
        <SafeAreaView style={styles.header}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.headerButton}
            onPress={toggleFlashMode}
          >
            <Ionicons name={getFlashIcon()} size={28} color="#fff" />
          </TouchableOpacity>
        </SafeAreaView>

        {/* Zoom Indicator */}
        {zoom > 0 && (
          <View style={styles.zoomIndicator}>
            <Text style={styles.zoomText}>{(1 + zoom).toFixed(1)}x</Text>
          </View>
        )}

        {/* Bottom Controls */}
        <View style={styles.bottomControls}>
          <TouchableOpacity
            style={styles.galleryButton}
            onPress={openGallery}
          >
            <Ionicons name="images" size={32} color="#fff" />
          </TouchableOpacity>

          <Animated.View style={{ transform: [{ scale: captureAnimation }] }}>
            <TouchableOpacity
              style={styles.captureButton}
              onPress={takePicture}
              disabled={!isCameraReady}
            >
              <View style={styles.captureInner} />
            </TouchableOpacity>
          </Animated.View>

          <TouchableOpacity
            style={styles.switchButton}
            onPress={toggleCameraType}
          >
            <Ionicons name="camera-reverse" size={32} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Zoom Slider */}
        <View style={styles.zoomSliderContainer}>
          <View style={styles.zoomSlider}>
            <View
              style={[styles.zoomProgress, { width: `${zoom * 100}%` }]}
            />
          </View>
        </View>
      </Camera>

      {/* Photo Preview Modal */}
      <Modal
        animationType="slide"
        transparent={false}
        visible={previewVisible}
        onRequestClose={closePreview}
      >
        <View style={styles.previewContainer}>
          <SafeAreaView style={styles.previewHeader}>
            <TouchableOpacity
              style={styles.previewButton}
              onPress={closePreview}
            >
              <Ionicons name="close" size={28} color="#fff" />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.previewButton, styles.saveButton]}
              onPress={savePhoto}
              disabled={photoSaving}
            >
              {photoSaving ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="checkmark" size={28} color="#fff" />
              )}
            </TouchableOpacity>
          </SafeAreaView>

          {capturedPhoto && (
            <Image
              source={{ uri: capturedPhoto.uri }}
              style={styles.previewImage}
              resizeMode="contain"
            />
          )}

          <View style={styles.previewActions}>
            <TouchableOpacity
              style={styles.previewActionButton}
              onPress={closePreview}
            >
              <Text style={styles.previewActionText}>Descartar</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.previewActionButton, styles.primaryAction]}
              onPress={savePhoto}
              disabled={photoSaving}
            >
              <Text style={[styles.previewActionText, styles.primaryActionText]}>
                {photoSaving ? 'Guardando...' : 'Guardar'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  loadingText: {
    color: '#fff',
    marginTop: 16,
    fontSize: 16,
  },
  noPermissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
    padding: 32,
  },
  noPermissionText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    textAlign: 'center',
  },
  noPermissionSubtext: {
    color: '#999',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  permissionButton: {
    backgroundColor: '#667eea',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 24,
  },
  permissionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  camera: {
    flex: 1,
  },
  flashOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#fff',
    zIndex: 999,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  zoomIndicator: {
    position: 'absolute',
    top: 100,
    alignSelf: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  zoomText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  bottomControls: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  galleryButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  captureInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#667eea',
  },
  switchButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  zoomSliderContainer: {
    position: 'absolute',
    bottom: 150,
    right: 20,
    width: 4,
    height: 120,
  },
  zoomSlider: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
  },
  zoomProgress: {
    backgroundColor: '#667eea',
    borderRadius: 2,
    height: '100%',
  },
  previewContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  previewButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButton: {
    backgroundColor: '#667eea',
  },
  previewImage: {
    flex: 1,
    width: '100%',
  },
  previewActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 30,
    paddingBottom: 50,
  },
  previewActionButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#667eea',
  },
  primaryAction: {
    backgroundColor: '#667eea',
  },
  previewActionText: {
    color: '#667eea',
    fontSize: 16,
    fontWeight: '600',
  },
  primaryActionText: {
    color: '#fff',
  },
});

export default CameraScreen;
