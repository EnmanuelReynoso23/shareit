import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const CameraScreen = ({ navigation }) => {
  const handleTakePhoto = () => {
    Alert.alert(
      'Funcionalidad de Cámara',
      'La funcionalidad de cámara se implementará próximamente',
      [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Cámara</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Camera Preview Placeholder */}
      <View style={styles.cameraPreview}>
        <MaterialIcons name="camera-alt" size={100} color="#999" />
        <Text style={styles.previewText}>Vista Previa de la Cámara</Text>
        <Text style={styles.subText}>Funcionalidad en desarrollo</Text>
      </View>

      {/* Camera Controls */}
      <View style={styles.controls}>
        <TouchableOpacity style={styles.galleryButton}>
          <MaterialIcons name="photo-library" size={30} color="#fff" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.captureButton}
          onPress={handleTakePhoto}
        >
          <View style={styles.captureInner} />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.switchButton}>
          <MaterialIcons name="flip-camera-ios" size={30} color="#fff" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  placeholder: {
    width: 40,
  },
  cameraPreview: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#222',
  },
  previewText: {
    fontSize: 18,
    color: '#999',
    marginTop: 16,
  },
  subText: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 40,
    paddingVertical: 30,
  },
  galleryButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
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
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default CameraScreen;
