import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  FlatList,
  Pressable,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import api from '../utils/api';
import { colors } from '../utils/colors';
import { addConnections } from '../utils/connectionSlice';

const DEFAULT_AVATAR = 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png';

const ConnectionsScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const connections = useSelector((store) => store.connections);

  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchConnections = async (isPullToRefresh = false) => {
    try {
      if (isPullToRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);
      const res = await api.get('/user/connections');
      dispatch(addConnections(res?.data?.data || []));
    } catch (err) {
      console.error('Error fetching connections:', err);
      setError(err?.response?.data?.message || 'Failed to load connections.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchConnections();
  }, []);

  const handleChat = (item) => {
    const targetUserName = `${item.firstName || ''} ${item.lastName || ''}`.trim();
    navigation.navigate('Chat', {
      targetUserId: item._id,
      targetUserName: targetUserName || 'Developer',
    });
  };

  // Loading state (connections is null)
  if (connections === null || (loading && !connections)) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading connections...</Text>
      </View>
    );
  }

  // Error state
  if (error && (!connections || connections.length === 0)) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorTitle}>Could not load connections</Text>
        <Text style={styles.errorSubtitle}>{error}</Text>
        <Pressable
          style={({ pressed }) => [styles.retryButton, pressed && styles.buttonPressed]}
          onPress={() => fetchConnections()}
        >
          <Text style={styles.retryButtonText}>Try Again</Text>
        </Pressable>
      </View>
    );
  }

  // Empty state
  if (connections.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <View style={styles.emptyIconContainer}>
          <Text style={styles.emptyIcon}>👥</Text>
        </View>
        <Text style={styles.emptyTitle}>No connections yet</Text>
        <Text style={styles.emptySubtitle}>Start exploring to find your people!</Text>
        {navigation?.navigate ? (
          <Pressable
            style={({ pressed }) => [styles.exploreButton, pressed && styles.buttonPressed]}
            onPress={() => navigation.navigate('Feed')}
          >
            <Text style={styles.exploreButtonText}>Explore Developers</Text>
          </Pressable>
        ) : null}
      </View>
    );
  }

  const renderConnectionItem = ({ item }) => {
    const fullName = `${item.firstName || ''} ${item.lastName || ''}`.trim() || 'Anonymous Developer';
    const infoDetails = [
      item.age ? `${item.age} yrs` : null,
      item.gender ? item.gender.charAt(0).toUpperCase() + item.gender.slice(1) : null,
    ].filter(Boolean).join(' • ');

    return (
      <View style={styles.connectionCard}>
        <Image
          source={{ uri: item.photoUrl || DEFAULT_AVATAR }}
          style={styles.avatar}
          resizeMode="cover"
        />

        <View style={styles.infoContainer}>
          <Text style={styles.nameText} numberOfLines={1}>
            {fullName}
          </Text>

          {infoDetails ? (
            <Text style={styles.detailsText} numberOfLines={1}>
              {infoDetails}
            </Text>
          ) : null}

          {item.about ? (
            <Text style={styles.aboutText} numberOfLines={2}>
              {item.about}
            </Text>
          ) : null}
        </View>

        <Pressable
          style={({ pressed }) => [styles.chatButton, pressed && styles.buttonPressed]}
          onPress={() => handleChat(item)}
        >
          <Text style={styles.chatButtonText}>Chat</Text>
        </Pressable>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Connections</Text>
        <View style={styles.countBadge}>
          <Text style={styles.countBadgeText}>{connections.length}</Text>
        </View>
      </View>

      <FlatList
        data={connections}
        keyExtractor={(item) => item._id}
        renderItem={renderConnectionItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshing={refreshing}
        onRefresh={() => fetchConnections(true)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centerContainer: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    color: colors.textSecondary,
    fontSize: 16,
    marginTop: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '700',
  },
  countBadge: {
    backgroundColor: colors.surfaceLight,
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 12,
    marginLeft: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  countBadgeText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  listContent: {
    padding: 16,
  },
  connectionCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surfaceLight,
    borderWidth: 1,
    borderColor: colors.border,
  },
  infoContainer: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  nameText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  detailsText: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  aboutText: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 4,
    lineHeight: 18,
  },
  chatButton: {
    backgroundColor: colors.primary,
    minHeight: 48,
    paddingHorizontal: 18,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyIcon: {
    fontSize: 36,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtitle: {
    color: colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  exploreButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 160,
  },
  exploreButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  errorTitle: {
    color: colors.error,
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  errorSubtitle: {
    color: colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: colors.surfaceLight,
    paddingHorizontal: 24,
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  retryButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  buttonPressed: {
    opacity: 0.8,
  },
});

export default ConnectionsScreen;
