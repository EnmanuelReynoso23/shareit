import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const imageSize = (width - 60) / 3;

const GalleryScreen = ({ navigation }) => {
  // Mock data for photos
  const photos = [
    { id: '1', uri: null, title: 'Foto 1' },
    { id: '2', uri: null, title: 'Foto 2' },
    { id: '3', uri: null, title: 'Foto 3' },
    { id: '4', uri: null, title: 'Foto 4' },
    { id: '5', uri: null, title: 'Foto 5' },
    { id: '6', uri: null, title: 'Foto 6' },
  ];

  const renderPhoto = ({ item }) => (
    <TouchableOpacity 
      style={styles.photoContainer}
      onPress={() => navigation.navigate('PhotoDetail', { photo: item })}
    >
      <View style={styles.photoPlaceholder}>
        <MaterialIcons name="photo" size={40} color="#999" />
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Galería</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => navigation.navigate('Camera')}
        >
          <MaterialIcons name="add-a-photo" size={24} color="#667eea" />
        </TouchableOpacity>
      </View>

      {/* Gallery Grid */}
      <FlatList
        data={photos}
        renderItem={renderPhoto}
        numColumns={3}
        contentContainerStyle={styles.grid}
        showsVerticalScrollIndicator={false}
        keyExtractor={(item) => item.id}
      />

      {/* Empty State */}
      {photos.length === 0 && (
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
});

export default GalleryScreen;
