import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  Modal,
  SafeAreaView,
  ActivityIndicator,
  TextInput,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

const PhotoPreview = ({
  visible,
  photo,
  onSave,
  onDiscard,
  onClose,
  saving = false,
  allowEditing = true,
}) => {
  const [photoTitle, setPhotoTitle] = useState('');
  const [photoTags, setPhotoTags] = useState('');
  const [showMetadata, setShowMetadata] = useState(false);

  const handleSave = () => {
    const photoData = {
      ...photo,
      title: photoTitle.trim() || null,
      tags: photoTags
        .split(',')
        .map(tag => tag.trim().toLowerCase())
        .filter(tag => tag.length > 0),
    };
    onSave(photoData);
  };

  const handleDiscard = () => {
    setPhotoTitle('');
    setPhotoTags('');
    setShowMetadata(false);
    onDiscard();
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return 'Unknown';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDimensions = () => {
    if (photo?.width && photo?.height) {
      return `${photo.width} × ${photo.height}`;
    }
    return 'Unknown';
  };

  if (!visible || !photo) {
    return null;
  }

  return (
    <Modal
      animationType="slide"
      transparent={false}
      visible={visible}
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.container}>
        {/* Header */}
        <SafeAreaView style={styles.header}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={handleDiscard}
          >
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Vista Previa</Text>

          <TouchableOpacity
            style={[styles.headerButton, styles.saveButton]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="checkmark" size={28} color="#fff" />
            )}
          </TouchableOpacity>
        </SafeAreaView>

        {/* Photo Display */}
        <View style={styles.photoContainer}>
          <Image
            source={{ uri: photo.uri }}
            style={styles.photo}
            resizeMode="contain"
          />

          {/* Metadata Toggle */}
          <TouchableOpacity
            style={styles.metadataToggle}
            onPress={() => setShowMetadata(!showMetadata)}
          >
            <Ionicons 
              name={showMetadata ? "information-circle" : "information-circle-outline"} 
              size={24} 
              color="#fff" 
            />
          </TouchableOpacity>

          {/* Metadata Overlay */}
          {showMetadata && (
            <View style={styles.metadataOverlay}>
              <Text style={styles.metadataText}>
                📐 {formatDimensions()}
              </Text>
              {photo.exif?.DateTime && (
                <Text style={styles.metadataText}>
                  📅 {new Date(photo.exif.DateTime).toLocaleString()}
                </Text>
              )}
              <Text style={styles.metadataText}>
                📁 {formatFileSize(photo.fileSize)}
              </Text>
              {photo.exif?.GPSLatitude && (
                <Text style={styles.metadataText}>
                  📍 {photo.exif.GPSLatitude.toFixed(6)}, {photo.exif.GPSLongitude.toFixed(6)}
                </Text>
              )}
            </View>
          )}
        </View>

        {/* Editing Panel */}
        {allowEditing && (
          <View style={styles.editingPanel}>
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Title Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Título (opcional)</Text>
                <TextInput
                  style={styles.textInput}
                  value={photoTitle}
                  onChangeText={setPhotoTitle}
                  placeholder="Agrega un título a tu foto..."
                  placeholderTextColor="#999"
                  maxLength={100}
                />
              </View>

              {/* Tags Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Etiquetas (separadas por comas)</Text>
                <TextInput
                  style={styles.textInput}
                  value={photoTags}
                  onChangeText={setPhotoTags}
                  placeholder="naturaleza, vacaciones, familia..."
                  placeholderTextColor="#999"
                  maxLength={200}
                />
              </View>

              {/* Quick Tags */}
              <View style={styles.quickTagsContainer}>
                <Text style={styles.inputLabel}>Etiquetas rápidas</Text>
                <View style={styles.quickTags}>
                  {['selfie', 'naturaleza', 'comida', 'viaje', 'familia', 'amigos'].map((tag) => (
                    <TouchableOpacity
                      key={tag}
                      style={[
                        styles.quickTag,
                        photoTags.includes(tag) && styles.quickTagSelected
                      ]}
                      onPress={() => {
                        const currentTags = photoTags.split(',').map(t => t.trim()).filter(t => t);
                        if (currentTags.includes(tag)) {
                          setPhotoTags(currentTags.filter(t => t !== tag).join(', '));
                        } else {
                          setPhotoTags([...currentTags, tag].join(', '));
                        }
                      }}
                    >
                      <Text style={[
                        styles.quickTagText,
                        photoTags.includes(tag) && styles.quickTagTextSelected
                      ]}>
                        {tag}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </ScrollView>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.discardButton}
            onPress={handleDiscard}
            disabled={saving}
          >
            <Ionicons name="trash-outline" size={20} color="#ff4757" />
            <Text style={styles.discardButtonText}>Descartar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.saveActionButton, saving && styles.savingButton]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <>
                <ActivityIndicator size="small" color="#fff" />
                <Text style={styles.saveButtonText}>Guardando...</Text>
              </>
            ) : (
              <>
                <Ionicons name="save-outline" size={20} color="#fff" />
                <Text style={styles.saveButtonText}>Guardar Foto</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButton: {
    backgroundColor: '#667eea',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  photoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  photo: {
    width: width,
    height: height * 0.6,
  },
  metadataToggle: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  metadataOverlay: {
    position: 'absolute',
    top: 70,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 8,
    padding: 12,
    maxWidth: width * 0.6,
  },
  metadataText: {
    color: '#fff',
    fontSize: 12,
    marginBottom: 4,
  },
  editingPanel: {
    backgroundColor: '#1a1a1a',
    maxHeight: height * 0.25,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    fontSize: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  quickTagsContainer: {
    marginBottom: 16,
  },
  quickTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  quickTagSelected: {
    backgroundColor: '#667eea',
    borderColor: '#667eea',
  },
  quickTagText: {
    color: '#ccc',
    fontSize: 12,
    fontWeight: '500',
  },
  quickTagTextSelected: {
    color: '#fff',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingBottom: 34, // Safe area bottom
    backgroundColor: '#1a1a1a',
  },
  discardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ff4757',
    backgroundColor: 'rgba(255, 71, 87, 0.1)',
    gap: 8,
  },
  discardButtonText: {
    color: '#ff4757',
    fontSize: 14,
    fontWeight: '600',
  },
  saveActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#667eea',
    gap: 8,
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  savingButton: {
    backgroundColor: '#5a6fd8',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default PhotoPreview;
