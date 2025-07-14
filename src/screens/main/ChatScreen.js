import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSelector, useDispatch } from 'react-redux';
import { selectUser } from '../../store/slices/userSlice';
import { useUI } from '../../store/AppContext';

const { width, height } = Dimensions.get('window');

const ChatScreen = ({ navigation, route }) => {
  const { chatId, chatName, chatType = 'direct' } = route.params || {};
  const user = useSelector(selectUser);
  const dispatch = useDispatch();
  const { showNotification } = useUI();
  
  // State
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('connected');
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  
  // Refs
  const flatListRef = useRef(null);
  const inputRef = useRef(null);
  const animatedValue = useRef(new Animated.Value(0)).current;
  
  // Animation for typing indicator
  useEffect(() => {
    if (isTyping) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(animatedValue, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(animatedValue, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [isTyping, animatedValue]);

  // Load initial messages
  useEffect(() => {
    if (chatId) {
      loadMessages();
    } else {
      // Mock messages for demo
      setMessages([
        {
          id: '1',
          text: 'Hola! ¿Cómo estás?',
          userId: 'other-user',
          userName: 'Amigo',
          timestamp: new Date(Date.now() - 60000 * 5),
          type: 'text',
        },
        {
          id: '2',
          text: '¡Hola! Todo bien, gracias por preguntar 😊',
          userId: user?.uid || 'current-user',
          userName: user?.displayName || 'Tú',
          timestamp: new Date(Date.now() - 60000 * 3),
          type: 'text',
        },
        {
          id: '3',
          text: '¿Qué tal el nuevo widget que compartiste?',
          userId: 'other-user',
          userName: 'Amigo',
          timestamp: new Date(Date.now() - 60000 * 2),
          type: 'text',
        },
        {
          id: '4',
          text: '¡Está genial! Me encanta cómo se ve el widget de fotos',
          userId: user?.uid || 'current-user',
          userName: user?.displayName || 'Tú',
          timestamp: new Date(Date.now() - 60000),
          type: 'text',
        },
      ]);
    }
  }, [chatId, user]);

  const loadMessages = useCallback(async () => {
    setIsLoading(true);
    try {
      // TODO: Implement real chat loading
      // const chatMessages = await chatService.getMessages(chatId);
      // setMessages(chatMessages);
      
      // Simulate loading
      setTimeout(() => {
        setIsLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error loading messages:', error);
      showNotification({
        type: 'error',
        title: 'Error',
        message: 'No se pudieron cargar los mensajes',
      });
      setIsLoading(false);
    }
  }, [chatId, showNotification]);

  const sendMessage = useCallback(async () => {
    if (!inputText.trim()) return;

    const messageText = inputText.trim();
    setInputText('');
    
    const newMessage = {
      id: Date.now().toString(),
      text: messageText,
      userId: user?.uid || 'current-user',
      userName: user?.displayName || 'Tú',
      timestamp: new Date(),
      type: 'text',
      status: 'sending',
    };

    setMessages(prev => [...prev, newMessage]);
    
    try {
      // TODO: Implement real message sending
      // await chatService.sendMessage(chatId, messageText);
      
      // Simulate sending
      setTimeout(() => {
        setMessages(prev => 
          prev.map(msg => 
            msg.id === newMessage.id 
              ? { ...msg, status: 'sent' }
              : msg
          )
        );
      }, 1000);
      
      // Scroll to bottom
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error('Error sending message:', error);
      showNotification({
        type: 'error',
        title: 'Error',
        message: 'No se pudo enviar el mensaje',
      });
      
      // Mark message as failed
      setMessages(prev => 
        prev.map(msg => 
          msg.id === newMessage.id 
            ? { ...msg, status: 'failed' }
            : msg
        )
      );
    }
  }, [inputText, user, chatId, showNotification]);

  const renderMessage = useCallback(({ item }) => {
    const isOwnMessage = item.userId === (user?.uid || 'current-user');
    const isFirstInGroup = true; // TODO: Implement proper grouping logic
    
    return (
      <View style={[
        styles.messageContainer,
        isOwnMessage ? styles.ownMessage : styles.otherMessage
      ]}>
        <View style={[
          styles.messageBubble,
          isOwnMessage ? styles.ownBubble : styles.otherBubble,
          isFirstInGroup && styles.firstInGroup
        ]}>
          <Text style={[
            styles.messageText,
            isOwnMessage ? styles.ownMessageText : styles.otherMessageText
          ]}>
            {item.text}
          </Text>
          <View style={styles.messageFooter}>
            <Text style={[
              styles.messageTime,
              isOwnMessage ? styles.ownMessageTime : styles.otherMessageTime
            ]}>
              {item.timestamp.toLocaleTimeString('es-ES', {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </Text>
            {isOwnMessage && (
              <View style={styles.messageStatus}>
                {item.status === 'sending' && (
                  <ActivityIndicator size="small" color="#999" />
                )}
                {item.status === 'sent' && (
                  <Ionicons name="checkmark" size={16} color="#667eea" />
                )}
                {item.status === 'failed' && (
                  <Ionicons name="alert-circle" size={16} color="#ff4757" />
                )}
              </View>
            )}
          </View>
        </View>
      </View>
    );
  }, [user]);

  const renderTypingIndicator = useCallback(() => {
    if (!isTyping) return null;
    
    return (
      <View style={[styles.messageContainer, styles.otherMessage]}>
        <View style={[styles.messageBubble, styles.otherBubble, styles.typingBubble]}>
          <Animated.View style={[
            styles.typingIndicator,
            { opacity: animatedValue }
          ]}>
            <Text style={styles.typingText}>
              Escribiendo...
            </Text>
          </Animated.View>
        </View>
      </View>
    );
  }, [isTyping, animatedValue]);

  const renderConnectionStatus = useCallback(() => {
    if (connectionStatus === 'connected') return null;
    
    return (
      <View style={styles.connectionBanner}>
        <Ionicons 
          name={connectionStatus === 'connecting' ? 'refresh' : 'warning'} 
          size={16} 
          color="#fff" 
        />
        <Text style={styles.connectionText}>
          {connectionStatus === 'connecting' ? 'Conectando...' : 'Sin conexión'}
        </Text>
      </View>
    );
  }, [connectionStatus]);

  const handleLoadMore = useCallback(() => {
    if (!hasMoreMessages || isLoading) return;
    
    // TODO: Implement pagination
    console.log('Loading more messages...');
  }, [hasMoreMessages, isLoading]);

  if (isLoading && messages.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#667eea" />
          </TouchableOpacity>
          <Text style={styles.title}>
            {chatName || 'Chat'}
          </Text>
          <TouchableOpacity style={styles.headerButton}>
            <Ionicons name="videocam" size={24} color="#667eea" />
          </TouchableOpacity>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#667eea" />
          <Text style={styles.loadingText}>Cargando mensajes...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {renderConnectionStatus()}
      
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#667eea" />
        </TouchableOpacity>
        <View style={styles.headerTitle}>
          <Text style={styles.title}>
            {chatName || 'Chat'}
          </Text>
          <Text style={styles.subtitle}>
            {chatType === 'group' ? 'Grupo' : 'En línea'}
          </Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerButton}>
            <Ionicons name="videocam" size={24} color="#667eea" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton}>
            <Ionicons name="call" size={24} color="#667eea" />
          </TouchableOpacity>
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.chatContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          style={styles.messagesList}
          contentContainerStyle={styles.messagesContainer}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.1}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={renderTypingIndicator}
          maintainVisibleContentPosition={{
            minIndexForVisible: 0,
            autoscrollToTopThreshold: 100,
          }}
        />

        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <TextInput
              ref={inputRef}
              style={styles.textInput}
              placeholder="Escribe un mensaje..."
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={1000}
              onFocus={() => {
                setTimeout(() => {
                  flatListRef.current?.scrollToEnd({ animated: true });
                }, 100);
              }}
            />
            <TouchableOpacity
              style={styles.attachButton}
              onPress={() => {
                Alert.alert(
                  'Adjuntar',
                  'Esta función estará disponible pronto',
                  [{ text: 'OK' }]
                );
              }}
            >
              <Ionicons name="attach" size={20} color="#999" />
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={[
              styles.sendButton,
              inputText.trim() ? styles.sendButtonActive : styles.sendButtonInactive
            ]}
            onPress={sendMessage}
            disabled={!inputText.trim()}
          >
            <Ionicons 
              name="send" 
              size={20} 
              color={inputText.trim() ? '#fff' : '#999'} 
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafe',
  },
  connectionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ff4757',
    paddingVertical: 8,
    paddingHorizontal: 16,
    gap: 8,
  },
  connectionText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitle: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  subtitle: {
    fontSize: 12,
    color: '#667eea',
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerButton: {
    padding: 8,
  },
  chatContainer: {
    flex: 1,
  },
  messagesList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  messagesContainer: {
    paddingVertical: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#999',
  },
  messageContainer: {
    marginVertical: 2,
  },
  ownMessage: {
    alignItems: 'flex-end',
  },
  otherMessage: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: width * 0.75,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    marginVertical: 2,
  },
  ownBubble: {
    backgroundColor: '#667eea',
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  firstInGroup: {
    marginTop: 8,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  ownMessageText: {
    color: '#fff',
  },
  otherMessageText: {
    color: '#333',
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  messageTime: {
    fontSize: 12,
    opacity: 0.7,
  },
  ownMessageTime: {
    color: '#fff',
  },
  otherMessageTime: {
    color: '#999',
  },
  messageStatus: {
    marginLeft: 8,
  },
  typingBubble: {
    minWidth: 60,
  },
  typingIndicator: {
    alignItems: 'center',
  },
  typingText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    gap: 12,
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    minHeight: 40,
    maxHeight: 120,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    textAlignVertical: 'center',
    paddingTop: Platform.OS === 'ios' ? 8 : 0,
  },
  attachButton: {
    padding: 8,
    marginLeft: 8,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonActive: {
    backgroundColor: '#667eea',
  },
  sendButtonInactive: {
    backgroundColor: '#e0e0e0',
  },
});

export default ChatScreen;
