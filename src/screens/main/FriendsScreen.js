import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const FriendsScreen = ({ navigation }) => {
  // Mock data for friends
  const friends = [
    { id: '1', name: 'Ana García', email: 'ana@example.com', status: 'online' },
    { id: '2', name: 'Carlos López', email: 'carlos@example.com', status: 'offline' },
    { id: '3', name: 'María Rodríguez', email: 'maria@example.com', status: 'online' },
  ];

  const friendRequests = [
    { id: '1', name: 'Luis Martínez', email: 'luis@example.com' },
  ];

  const renderFriend = ({ item }) => (
    <TouchableOpacity 
      style={styles.friendItem}
      onPress={() => navigation.navigate('Chat', { friend: item })}
    >
      <View style={styles.friendInfo}>
        <View style={styles.avatar}>
          <MaterialIcons name="person" size={24} color="#667eea" />
        </View>
        <View style={styles.friendDetails}>
          <Text style={styles.friendName}>{item.name}</Text>
          <Text style={styles.friendEmail}>{item.email}</Text>
        </View>
      </View>
      <View style={styles.friendActions}>
        <View style={[
          styles.statusIndicator, 
          { backgroundColor: item.status === 'online' ? '#4caf50' : '#999' }
        ]} />
        <MaterialIcons name="chevron-right" size={20} color="#999" />
      </View>
    </TouchableOpacity>
  );

  const renderFriendRequest = ({ item }) => (
    <View style={styles.requestItem}>
      <View style={styles.friendInfo}>
        <View style={styles.avatar}>
          <MaterialIcons name="person-add" size={24} color="#ff9800" />
        </View>
        <View style={styles.friendDetails}>
          <Text style={styles.friendName}>{item.name}</Text>
          <Text style={styles.friendEmail}>{item.email}</Text>
        </View>
      </View>
      <View style={styles.requestActions}>
        <TouchableOpacity style={styles.acceptButton}>
          <MaterialIcons name="check" size={20} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.rejectButton}>
          <MaterialIcons name="close" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Amigos</Text>
        <TouchableOpacity style={styles.addButton}>
          <MaterialIcons name="person-add" size={24} color="#667eea" />
        </TouchableOpacity>
      </View>

      {/* Friend Requests Section */}
      {friendRequests.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Solicitudes de Amistad</Text>
          <FlatList
            data={friendRequests}
            renderItem={renderFriendRequest}
            keyExtractor={(item) => `request-${item.id}`}
            showsVerticalScrollIndicator={false}
          />
        </View>
      )}

      {/* Friends Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Mis Amigos ({friends.length})</Text>
        <FlatList
          data={friends}
          renderItem={renderFriend}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
        />
      </View>

      {/* Empty State */}
      {friends.length === 0 && friendRequests.length === 0 && (
        <View style={styles.emptyState}>
          <MaterialIcons name="people" size={80} color="#ccc" />
          <Text style={styles.emptyText}>No tienes amigos aún</Text>
          <Text style={styles.emptySubtext}>Agrega amigos para comenzar a compartir</Text>
          <TouchableOpacity style={styles.addFriendButton}>
            <MaterialIcons name="person-add" size={20} color="#fff" />
            <Text style={styles.addFriendText}>Agregar Amigo</Text>
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
  section: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  requestItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  friendInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  friendDetails: {
    flex: 1,
  },
  friendName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  friendEmail: {
    fontSize: 14,
    color: '#666',
  },
  friendActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  requestActions: {
    flexDirection: 'row',
    gap: 8,
  },
  acceptButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#4caf50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rejectButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f44336',
    justifyContent: 'center',
    alignItems: 'center',
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
  addFriendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#667eea',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
  },
  addFriendText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default FriendsScreen;
