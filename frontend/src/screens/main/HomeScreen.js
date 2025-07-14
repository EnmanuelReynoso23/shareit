import React, { useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  RefreshControl,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { fetchUserWidgets, fetchSharedWidgets } from '../../store/slices/widgetsSlice';
import { logoutUser } from '../../store/slices/authSlice';

// Import widget components
import ClockWidget from '../../components/widgets/ClockWidget';
import WeatherWidget from '../../components/widgets/WeatherWidget';
import PhotosWidget from '../../components/widgets/PhotosWidget';
import NotesWidget from '../../components/widgets/NotesWidget';

const HomeScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { profile } = useSelector((state) => state.user);
  const { activeWidgets, loading } = useSelector((state) => state.widgets);
  const [refreshing, setRefreshing] = React.useState(false);

  useEffect(() => {
    if (user?.uid) {
      dispatch(fetchUserWidgets({ userId: user.uid }));
      dispatch(fetchSharedWidgets({ userId: user.uid }));
    }
  }, [dispatch, user?.uid]);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    if (user?.uid) {
      await dispatch(fetchUserWidgets({ userId: user.uid }));
      await dispatch(fetchSharedWidgets({ userId: user.uid }));
    }
    setRefreshing(false);
  }, [dispatch, user?.uid]);

  const handleLogout = () => {
    dispatch(logoutUser());
  };

  const renderWidget = (widget) => {
    switch (widget.type) {
      case 'clock':
        return <ClockWidget key={widget.id} widget={widget} />;
      case 'weather':
        return <WeatherWidget key={widget.id} widget={widget} />;
      case 'photos':
        return <PhotosWidget key={widget.id} widget={widget} />;
      case 'notes':
        return <NotesWidget key={widget.id} widget={widget} />;
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.greeting}>
            Hello, {profile?.displayName || user?.displayName || 'User'}!
          </Text>
          <Text style={styles.subtitle}>Welcome to ShareIt</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => navigation.navigate('WidgetSettings')}
          >
            <Ionicons name="add" size={24} color="#007AFF" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={handleLogout}
          >
            <Ionicons name="log-out-outline" size={24} color="#007AFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Widget Grid */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {widgets.length > 0 ? (
          <View style={styles.widgetGrid}>
            {widgets.map((widget) => renderWidget(widget))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="apps-outline" size={80} color="#E1E1E1" />
            <Text style={styles.emptyTitle}>No Widgets Yet</Text>
            <Text style={styles.emptySubtitle}>
              Add your first widget to get started
            </Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => navigation.navigate('WidgetSettings')}
            >
              <Ionicons name="add" size={20} color="#fff" />
              <Text style={styles.addButtonText}>Add Widget</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => navigation.navigate('Camera')}
            >
              <Ionicons name="camera" size={24} color="#007AFF" />
              <Text style={styles.actionText}>Take Photo</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => navigation.navigate('Friends')}
            >
              <Ionicons name="people" size={24} color="#007AFF" />
              <Text style={styles.actionText}>Add Friends</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => navigation.navigate('Gallery')}
            >
              <Ionicons name="images" size={24} color="#007AFF" />
              <Text style={styles.actionText}>View Gallery</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => navigation.navigate('Profile')}
            >
              <Ionicons name="person" size={24} color="#007AFF" />
              <Text style={styles.actionText}>Profile</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E1E1E1',
  },
  headerLeft: {
    flex: 1,
  },
  greeting: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  widgetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1a1a',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
  quickActions: {
    marginTop: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionCard: {
    width: '48%',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E1E1E1',
  },
  actionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginTop: 8,
    textAlign: 'center',
  },
});

export default HomeScreen;
