import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import api from '../utils/api';
import { colors } from '../utils/colors';
import { addFeed, removeUserFromFeed } from '../utils/feedSlice';

const DEFAULT_AVATAR = 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png';

const FeedScreen = () => {
  const dispatch = useDispatch();
  const feed = useSelector((store) => store.feed);

  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [imageError, setImageError] = useState(false);

  const fetchFeed = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/user/feed');
      dispatch(addFeed(res?.data?.data || []));
    } catch (err) {
      console.error('Error fetching feed:', err);
      setError(err?.response?.data?.message || 'Failed to load feed developers.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeed();
  }, []);

  const handleSendRequest = async (status, userId) => {
    if (actionLoading) return;
    try {
      setActionLoading(true);
      await api.post(`/request/send/${status}/${userId}`, {});
      dispatch(removeUserFromFeed(userId));
      setImageError(false);
    } catch (err) {
      console.error(`Error sending ${status} request:`, err);
      Alert.alert('Error', err?.response?.data?.message || 'Failed to process request.');
    } finally {
      setActionLoading(false);
    }
  };

  // Loading state (feed is null or first load)
  if (feed === null || (loading && !feed)) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Finding developers for you...</Text>
      </View>
    );
  }

  // Error state
  if (error && (!feed || feed.length === 0)) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorTitle}>Something went wrong</Text>
        <Text style={styles.errorSubtitle}>{error}</Text>
        <Pressable
          style={({ pressed }) => [styles.retryButton, pressed && styles.buttonPressed]}
          onPress={fetchFeed}
        >
          <Text style={styles.retryButtonText}>Try Again</Text>
        </Pressable>
      </View>
    );
  }

  // Empty state
  if (feed.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <View style={styles.emptyIconContainer}>
          <Text style={styles.emptyIcon}>🔍</Text>
        </View>
        <Text style={styles.emptyTitle}>No new developers found!</Text>
        <Text style={styles.emptySubtitle}>
          Check back later for new people to connect with.
        </Text>
        <Pressable
          style={({ pressed }) => [styles.refreshButton, pressed && styles.buttonPressed]}
          onPress={fetchFeed}
        >
          <Text style={styles.refreshButtonText}>Refresh</Text>
        </Pressable>
      </View>
    );
  }

  const currentUser = feed[0];
  const fullName = `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim();
  const photoUri = (!imageError && currentUser.photoUrl) ? currentUser.photoUrl : DEFAULT_AVATAR;

  // Normalize skills to an array
  const skillsList = Array.isArray(currentUser.skills)
    ? currentUser.skills
    : typeof currentUser.skills === 'string'
    ? currentUser.skills.split(',').map((s) => s.trim()).filter(Boolean)
    : [];

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <ScrollView
          style={styles.cardScroll}
          contentContainerStyle={styles.cardScrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Profile Photo */}
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: photoUri }}
              style={styles.profileImage}
              onError={() => setImageError(true)}
              resizeMode="cover"
            />
          </View>

          {/* User Name */}
          <Text style={styles.nameText}>{fullName || 'Anonymous Developer'}</Text>

          {/* Age & Gender Badges */}
          {(currentUser.age || currentUser.gender) ? (
            <View style={styles.badgeRow}>
              {currentUser.age ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{currentUser.age} yrs</Text>
                </View>
              ) : null}
              {currentUser.gender ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {currentUser.gender.charAt(0).toUpperCase() + currentUser.gender.slice(1)}
                  </Text>
                </View>
              ) : null}
            </View>
          ) : null}

          {/* About Text */}
          {currentUser.about ? (
            <Text style={styles.aboutText}>{currentUser.about}</Text>
          ) : null}

          {/* Skills Chips */}
          {skillsList.length > 0 ? (
            <View style={styles.skillsSection}>
              <Text style={styles.sectionTitle}>Skills</Text>
              <View style={styles.chipsRow}>
                {skillsList.map((skill, index) => (
                  <View key={`${skill}-${index}`} style={styles.skillChip}>
                    <Text style={styles.skillText}>{skill}</Text>
                  </View>
                ))}
              </View>
            </View>
          ) : null}
        </ScrollView>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <Pressable
            style={({ pressed }) => [
              styles.actionButton,
              styles.passButton,
              pressed && styles.buttonPressed,
              actionLoading && styles.disabledButton,
            ]}
            onPress={() => handleSendRequest('ignored', currentUser._id)}
            disabled={actionLoading}
          >
            {actionLoading ? (
              <ActivityIndicator size="small" color={colors.error} />
            ) : (
              <Text style={styles.passButtonText}>Pass</Text>
            )}
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.actionButton,
              styles.interestedButton,
              pressed && styles.buttonPressed,
              actionLoading && styles.disabledButton,
            ]}
            onPress={() => handleSendRequest('interested', currentUser._id)}
            disabled={actionLoading}
          >
            {actionLoading ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <Text style={styles.interestedButtonText}>Interested</Text>
            )}
          </Pressable>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
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
  refreshButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 140,
  },
  refreshButtonText: {
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
  card: {
    width: '100%',
    maxWidth: 380,
    maxHeight: '92%',
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
  cardScroll: {
    flexGrow: 0,
  },
  cardScrollContent: {
    padding: 20,
    alignItems: 'center',
  },
  imageContainer: {
    width: 280,
    height: 280,
    borderRadius: 140,
    overflow: 'hidden',
    backgroundColor: colors.surfaceLight,
    borderWidth: 2,
    borderColor: colors.border,
    marginBottom: 16,
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  nameText: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 12,
  },
  badge: {
    backgroundColor: colors.surfaceLight,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  badgeText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  aboutText: {
    color: colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  skillsSection: {
    width: '100%',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 8,
  },
  sectionTitle: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  skillChip: {
    backgroundColor: colors.surfaceLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  skillText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '500',
  },
  actionsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  actionButton: {
    flex: 1,
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  passButton: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.error,
  },
  passButtonText: {
    color: colors.error,
    fontSize: 16,
    fontWeight: '600',
  },
  interestedButton: {
    backgroundColor: colors.primary,
  },
  interestedButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  buttonPressed: {
    opacity: 0.8,
  },
  disabledButton: {
    opacity: 0.5,
  },
});

export default FeedScreen;
