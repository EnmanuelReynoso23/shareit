import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  TextInput,
  FlatList,
  Modal,
  Alert,
  Image,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { updateWidgetSettings } from '../../store/slices/widgetsSlice';

const { width } = Dimensions.get('window');

const NotesWidget = ({ 
  widgetId, 
  size = 'medium', 
  theme = 'light',
  maxNotes = 3,
  showTitle = true,
  editable = true,
  isShared = false,
  collaborators = [],
  activeEditors = [],
  onPress,
  onNotePress,
  onSharePress,
  onCollaborativeEdit,
  style 
}) => {
  const dispatch = useDispatch();
  const user = useSelector(state => state.auth.user);
  const widgetSettings = useSelector(state => 
    state.widgets.settings[widgetId] || {}
  );
  
  const [notes, setNotes] = useState(widgetSettings.notes || []);
  const [scaleAnim] = useState(new Animated.Value(1));
  const [modalVisible, setModalVisible] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [noteText, setNoteText] = useState('');
  const isMountedRef = useRef(true);

  // Update notes in widget settings when notes change
  useEffect(() => {
    if (isMountedRef.current) {
      const newSettings = {
        ...widgetSettings,
        notes: notes,
      };
      dispatch(updateWidgetSettings({ widgetId, settings: newSettings }));
    }
    return () => {
      isMountedRef.current = false;
    };
  }, [notes, widgetId, dispatch, widgetSettings]);

  const handlePress = useCallback(() => {
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
  }, [onPress, scaleAnim]);

  const handleNotePress = useCallback((note, index) => {
    if (onNotePress) {
      onNotePress(note, index);
    } else if (editable) {
      openEditModal(note, index);
    }
  }, [onNotePress, editable]);

  const openEditModal = useCallback((note = null, index = null) => {
    if (isMountedRef.current) {
      setEditingNote(index);
      setNoteText(note ? note.text : '');
      setModalVisible(true);
    }
  }, []);

  const closeModal = useCallback(() => {
    if (isMountedRef.current) {
      setModalVisible(false);
      setEditingNote(null);
      setNoteText('');
    }
  }, []);

  const saveNote = useCallback(() => {
    if (noteText.trim() === '') {
      Alert.alert('Error', 'La nota no puede estar vacía');
      return;
    }

    const newNote = {
      id: editingNote !== null ? notes[editingNote].id : Date.now().toString(),
      text: noteText.trim(),
      createdAt: editingNote !== null ? notes[editingNote].createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (editingNote !== null) {
      // Update existing note
      const updatedNotes = [...notes];
      updatedNotes[editingNote] = newNote;
      if (isMountedRef.current) {
        setNotes(updatedNotes);
      }
    } else {
      // Add new note
      if (isMountedRef.current) {
        setNotes(prev => [newNote, ...prev]);
      }
    }

    closeModal();
  }, [noteText, editingNote, notes, closeModal]);

  const deleteNote = useCallback((index) => {
    Alert.alert(
      'Eliminar nota',
      '¿Estás seguro de que quieres eliminar esta nota?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Eliminar', 
          style: 'destructive',
          onPress: () => {
            if (isMountedRef.current) {
              setNotes(prev => prev.filter((_, i) => i !== index));
            }
          }
        }
      ]
    );
  }, []);

  const formatDate = useCallback((dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      return 'Hoy';
    } else if (diffDays === 2) {
      return 'Ayer';
    } else if (diffDays <= 7) {
      return `${diffDays - 1} días`;
    } else {
      return date.toLocaleDateString();
    }
  }, []);

  const truncateText = useCallback((text, maxLength) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }, []);

  const getStyles = useMemo(() => {
    const sizeStyles = {
      small: {
        container: { width: width * 0.4, height: 120 },
        titleText: { fontSize: 12 },
        noteText: { fontSize: 10 },
        dateText: { fontSize: 8 },
        maxTextLength: 30,
      },
      medium: {
        container: { width: width * 0.6, height: 200 },
        titleText: { fontSize: 14 },
        noteText: { fontSize: 12 },
        dateText: { fontSize: 10 },
        maxTextLength: 60,
      },
      large: {
        container: { width: width * 0.8, height: 280 },
        titleText: { fontSize: 16 },
        noteText: { fontSize: 14 },
        dateText: { fontSize: 12 },
        maxTextLength: 100,
      },
    };

    const themeStyles = {
      light: {
        container: { backgroundColor: '#ffffff', borderColor: '#e0e0e0' },
        titleText: { color: '#333333' },
        noteText: { color: '#555555' },
        dateText: { color: '#666666' },
        emptyText: { color: '#999999' },
        iconColor: '#666666',
        noteBackground: '#f8f9fa',
        noteBorder: '#e9ecef',
        modalBackground: '#ffffff',
        inputBackground: '#f8f9fa',
        inputBorder: '#e9ecef',
      },
      dark: {
        container: { backgroundColor: '#1a1a1a', borderColor: '#333333' },
        titleText: { color: '#ffffff' },
        noteText: { color: '#cccccc' },
        dateText: { color: '#aaaaaa' },
        emptyText: { color: '#888888' },
        iconColor: '#cccccc',
        noteBackground: '#2a2a2a',
        noteBorder: '#404040',
        modalBackground: '#1a1a1a',
        inputBackground: '#2a2a2a',
        inputBorder: '#404040',
      },
      gradient: {
        container: { backgroundColor: '#667eea', borderColor: '#764ba2' },
        titleText: { color: '#ffffff' },
        noteText: { color: '#f0f0f0' },
        dateText: { color: '#e0e0e0' },
        emptyText: { color: '#d0d0d0' },
        iconColor: '#ffffff',
        noteBackground: '#764ba2',
        noteBorder: '#8b5fbf',
        modalBackground: '#667eea',
        inputBackground: '#764ba2',
        inputBorder: '#8b5fbf',
      },
    };

    return {
      size: sizeStyles[size],
      theme: themeStyles[theme],
    };
  }, [size, theme]);

  const styles = getStyles;
  const displayNotes = useMemo(() => notes.slice(0, maxNotes), [notes, maxNotes]);

  // Render collaborators avatars
  const renderCollaborators = () => {
    if (!isShared || collaborators.length === 0) return null;

    return (
      <View style={defaultStyles.collaboratorsContainer}>
        {collaborators.slice(0, 2).map((collaborator, index) => (
          <View
            key={collaborator.id || index}
            style={[
              defaultStyles.collaboratorAvatar,
              { 
                marginLeft: index > 0 ? -6 : 0,
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
        {collaborators.length > 2 && (
          <View style={[defaultStyles.collaboratorAvatar, { marginLeft: -6 }]}>
            <View style={[defaultStyles.avatarPlaceholder, { backgroundColor: styles.theme.iconColor }]}>
              <Text style={defaultStyles.avatarText}>
                +{collaborators.length - 2}
              </Text>
            </View>
          </View>
        )}
      </View>
    );
  };

  // Render active editors indicator
  const renderActiveEditors = () => {
    if (!isShared || activeEditors.length === 0) return null;

    return (
      <View style={defaultStyles.activeEditorsContainer}>
        <Animated.View style={[
          defaultStyles.editingIndicator,
          {
            opacity: scaleAnim.interpolate({
              inputRange: [0.95, 1],
              outputRange: [0.7, 1],
            })
          }
        ]}>
          <Ionicons name="create" size={12} color="#FF9800" />
        </Animated.View>
        <Text style={[defaultStyles.editingText, { color: "#FF9800" }]}>
          {activeEditors.length}
        </Text>
      </View>
    );
  };

  // Render note with collaboration indicators
  const renderNoteWithCollaboration = ({ item, index }) => {
    const isBeingEdited = activeEditors.some(editor => editor.noteId === item.id);
    const noteEditor = activeEditors.find(editor => editor.noteId === item.id);
    const lastEditor = collaborators.find(c => c.id === item.lastEditedBy);

    return (
      <View style={defaultStyles.noteContainer}>
        <TouchableOpacity
          onPress={() => handleNotePress(item, index)}
          onLongPress={() => editable && deleteNote(index)}
          style={[
            defaultStyles.noteItem,
            {
              backgroundColor: styles.theme.noteBackground,
              borderColor: isBeingEdited ? "#FF9800" : styles.theme.noteBorder,
              borderWidth: isBeingEdited ? 2 : 1,
            }
          ]}
          activeOpacity={0.8}
        >
          {/* Collaboration header */}
          {isShared && (
            <View style={defaultStyles.noteCollaborationHeader}>
              {lastEditor && lastEditor.id !== user?.uid && (
                <View style={defaultStyles.lastEditorInfo}>
                  <View style={defaultStyles.lastEditorAvatar}>
                    {lastEditor.photoURL ? (
                      <Image
                        source={{ uri: lastEditor.photoURL }}
                        style={defaultStyles.miniAvatarImage}
                      />
                    ) : (
                      <View style={[defaultStyles.miniAvatarPlaceholder, { backgroundColor: "#667eea" }]}>
                        <Text style={defaultStyles.miniAvatarText}>
                          {lastEditor.displayName?.[0]?.toUpperCase() || '?'}
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text style={[defaultStyles.lastEditorText, { color: styles.theme.dateText }]}>
                    {lastEditor.displayName}
                  </Text>
                </View>
              )}
              
              {isBeingEdited && noteEditor && (
                <View style={defaultStyles.currentEditorInfo}>
                  <Ionicons name="create" size={12} color="#FF9800" />
                  <Text style={[defaultStyles.editingByText, { color: "#FF9800" }]}>
                    {noteEditor.displayName} editando...
                  </Text>
                </View>
              )}
            </View>
          )}

          <Text style={[
            defaultStyles.noteText,
            styles.size.noteText,
            styles.theme.noteText
          ]}>
            {truncateText(item.text, styles.size.maxTextLength)}
          </Text>
          <Text style={[
            defaultStyles.dateText,
            styles.size.dateText,
            styles.theme.dateText
          ]}>
            {formatDate(item.updatedAt)}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderNote = ({ item, index }) => (
    <TouchableOpacity
      onPress={() => handleNotePress(item, index)}
      onLongPress={() => editable && deleteNote(index)}
      style={[
        defaultStyles.noteItem,
        {
          backgroundColor: styles.theme.noteBackground,
          borderColor: styles.theme.noteBorder,
        }
      ]}
      activeOpacity={0.8}
    >
      <Text style={[
        defaultStyles.noteText,
        styles.size.noteText,
        styles.theme.noteText
      ]}>
        {truncateText(item.text, styles.size.maxTextLength)}
      </Text>
      <Text style={[
        defaultStyles.dateText,
        styles.size.dateText,
        styles.theme.dateText
      ]}>
        {formatDate(item.updatedAt)}
      </Text>
    </TouchableOpacity>
  );

  const renderContent = () => {
    if (displayNotes.length === 0) {
      return (
        <View style={defaultStyles.centerContent}>
          <Ionicons 
            name="document-text-outline" 
            size={40} 
            color={styles.theme.iconColor} 
          />
          <Text style={[
            defaultStyles.emptyText,
            styles.theme.emptyText
          ]}>
            {isShared ? 'No hay notas compartidas' : 'No hay notas'}
          </Text>
          {isShared && (
            <Text style={[
              defaultStyles.emptySubtext,
              styles.theme.emptyText
            ]}>
              Los colaboradores pueden agregar notas
            </Text>
          )}
          {editable && (
            <TouchableOpacity
              onPress={() => openEditModal()}
              style={[
                defaultStyles.addButton,
                { backgroundColor: styles.theme.iconColor }
              ]}
            >
              <Text style={[
                defaultStyles.addButtonText,
                { color: styles.theme.container.backgroundColor }
              ]}>
                Agregar nota
              </Text>
            </TouchableOpacity>
          )}
        </View>
      );
    }

    return (
      <FlatList
        data={displayNotes}
        renderItem={isShared ? renderNoteWithCollaboration : renderNote}
        keyExtractor={(item) => item.id}
        contentContainerStyle={defaultStyles.notesContainer}
        showsVerticalScrollIndicator={false}
      />
    );
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
                name={isShared ? "people" : "document-text-outline"} 
                size={20} 
                color={isShared ? "#4CAF50" : styles.theme.iconColor} 
              />
              <Text style={[
                defaultStyles.titleText,
                styles.size.titleText,
                styles.theme.titleText
              ]}>
                {isShared ? 'Notas Compartidas' : 'Notas'}
              </Text>
              {isShared && (
                <View style={defaultStyles.sharedBadge}>
                  <Text style={defaultStyles.sharedBadgeText}>COLABORATIVO</Text>
                </View>
              )}
            </View>
            
            <View style={defaultStyles.headerActions}>
              {renderCollaborators()}
              {renderActiveEditors()}
              <Text style={[
                defaultStyles.countText,
                styles.size.dateText,
                styles.theme.dateText
              ]}>
                {notes.length}
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
              {editable && (
                <TouchableOpacity onPress={() => openEditModal()}>
                  <Ionicons 
                    name="add" 
                    size={18} 
                    color={styles.theme.iconColor} 
                  />
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        <View style={defaultStyles.content}>
          {renderContent()}
        </View>
      </TouchableOpacity>

      {/* Edit Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={closeModal}
      >
        <KeyboardAvoidingView 
          style={defaultStyles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView
            contentContainerStyle={defaultStyles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={[
              defaultStyles.modalContent,
              { backgroundColor: styles.theme.modalBackground }
            ]}>
              <View style={defaultStyles.modalHeader}>
                <Text style={[
                  defaultStyles.modalTitle,
                  styles.theme.titleText
                ]}>
                  {editingNote !== null ? 'Editar nota' : 'Nueva nota'}
                </Text>
                <TouchableOpacity onPress={closeModal}>
                  <Ionicons 
                    name="close" 
                    size={24} 
                    color={styles.theme.iconColor} 
                  />
                </TouchableOpacity>
              </View>

              <TextInput
                value={noteText}
                onChangeText={setNoteText}
                placeholder="Escribe tu nota aquí..."
                placeholderTextColor={styles.theme.dateText}
                multiline
                style={[
                  defaultStyles.textInput,
                  {
                    backgroundColor: styles.theme.inputBackground,
                    borderColor: styles.theme.inputBorder,
                    color: styles.theme.noteText,
                  }
                ]}
                autoFocus
                scrollEnabled={true}
              />

              <View style={defaultStyles.modalActions}>
                <TouchableOpacity
                  onPress={closeModal}
                  style={[
                    defaultStyles.modalButton,
                    defaultStyles.cancelButton
                  ]}
                >
                  <Text style={defaultStyles.cancelButtonText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={saveNote}
                  style={[
                    defaultStyles.modalButton,
                    defaultStyles.saveButton,
                    { backgroundColor: styles.theme.iconColor }
                  ]}
                >
                  <Text style={[
                    defaultStyles.saveButtonText,
                    { color: styles.theme.container.backgroundColor }
                  ]}>
                    Guardar
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
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
  emptyText: {
    marginTop: 8,
    fontSize: 12,
    textAlign: 'center',
  },
  addButton: {
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  notesContainer: {
    gap: 8,
  },
  noteItem: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  noteText: {
    fontWeight: '500',
    lineHeight: 18,
  },
  dateText: {
    marginTop: 4,
    fontWeight: '400',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  modalContent: {
    width: width * 0.9,
    maxHeight: '80%',
    borderRadius: 16,
    padding: 20,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    minHeight: 120,
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f1f3f4',
  },
  cancelButtonText: {
    color: '#5f6368',
    fontWeight: '600',
  },
  saveButton: {
    // backgroundColor set dynamically
  },
  saveButtonText: {
    fontWeight: '600',
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
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#fff',
    position: 'relative',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 7,
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: 7,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 7,
    fontWeight: '600',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4CAF50',
    borderWidth: 1,
    borderColor: '#fff',
  },
  activeEditorsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 4,
  },
  editingIndicator: {
    marginRight: 2,
  },
  editingText: {
    fontSize: 10,
    fontWeight: '600',
  },
  noteContainer: {
    position: 'relative',
  },
  noteCollaborationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  lastEditorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  lastEditorAvatar: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 4,
  },
  miniAvatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 6,
  },
  miniAvatarPlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  miniAvatarText: {
    color: '#fff',
    fontSize: 6,
    fontWeight: '600',
  },
  lastEditorText: {
    fontSize: 8,
    fontWeight: '500',
  },
  currentEditorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editingByText: {
    fontSize: 8,
    fontWeight: '600',
    marginLeft: 4,
  },
  emptySubtext: {
    marginTop: 4,
    fontSize: 10,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default NotesWidget;
