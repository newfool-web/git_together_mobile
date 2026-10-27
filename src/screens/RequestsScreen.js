import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  FlatList,
  Pressable,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import api from '../utils/api';
import { colors } from '../utils/colors';
import { addRequests, removeRequest } from '../utils/requestSlice';

const DEFAULT_AVATAR = 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png';

const RequestsScreen = () => {
  const dispatch = useDispatch();
  const requests = useSelector((store) => store.requests);

  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [processingIds, setProcessingIds] = useState({});

  const fetchRequests = async (isPullToRefresh = false) => {
    try {
      if (isPullToRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);
      const res = await api.get('/user/requests/received');
      dispatch(addRequests(res?.data?.data || []));
    } catch (err) {
      console.error('Error fetching received requests:', err);
      setError(err?.response?.data?.message || 'Failed to load requests.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleReviewRequest = async (status, requestId) => {
    if (processingIds[requestId]) return;
    try {
      setProcessingIds((prev) => ({ ...prev, [requestId]: status }));
      await api.post(`/request/review/${status}/${requestId}`, {});
      dispatch(removeRequest(requestId));
    } catch (err) {
      console.error(`Error ${status} request:`, err);
      Alert.alert('Error', err?.response?.data?.message || `Failed to ${status} request.`);
    } finally {
      setProcessingIds((prev) => {
        const updated = { ...prev };
        delete updated[requestId];
        return updated;
      });
    }
  };

  // Loading state (requests is null)
  if (requests === null || (loading && !requests)) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading requests...</Text>
      </View>
    );
  }

  // Error state
  if (error && (!requests || requests.length === 0)) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorTitle}>Could not load requests</Text>
        <Text style={styles.errorSubtitle}>{error}</Text>
        <Pressable
          style={({ pressed }) => [styles.retryButton, pressed && styles.buttonPressed]}
          onPress={() => fetchRequests()}
        >
          <Text style={styles.retryButtonText}>Try Again</Text>
        </Pressable>
      </View>
    );
  }

  // Empty state
  if (requests.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <View style={styles.emptyIconContainer}>
          <Text style={styles.emptyIcon}>📬</Text>
        </View>
        <Text style={styles.emptyTitle}>No pending requests</Text>
        <Text style={styles.emptySubtitle}>
          You do not have any pending connection requests right now.
        </Text>
        <Pressable
          style={({ pressed }) => [styles.refreshButton, pressed && styles.buttonPressed]}
          onPress={() => fetchRequests()}
        >
          <Text style={styles.refreshButtonText}>Check Again</Text>
        </Pressable>
      </View>
    );
  }

  const renderRequestItem = ({ item }) => {
    const fromUser = item.fromUserId || {};
    const fullName = `${fromUser.firstName || ''} ${fromUser.lastName || ''}`.trim() || 'Developer';
    const isProcessing = !!processingIds[item._id];
    const currentAction = processingIds[item._id];

    const infoDetails = [
      fromUser.age ? `${fromUser.age} yrs` : null,
      fromUser.gender ? fromUser.gender.charAt(0).toUpperCase() + fromUser.gender.slice(1) : null,
    ].filter(Boolean).join(' • ');

    return (
      <View style={styles.requestCard}>
        <View style={styles.cardHeader}>
          <Image
            source={{ uri: fromUser.photoUrl || DEFAULT_AVATAR }}
            style={styles.avatar}
            resizeMode="cover"
          />
          <View style={styles.userInfo}>
            <Text style={styles.nameText} numberOfLines={1}>
              {fullName}
            </Text>
            {infoDetails ? (
              <Text style={styles.detailsText} numberOfLines={1}>
                {infoDetails}
              </Text>
            ) : null}
          </View>
        </View>

        {fromUser.about ? (
          <Text style={styles.aboutText} numberOfLines={3}>
            {fromUser.about}
          </Text>
        ) : null}

        <View style={styles.actionsRow}>
          <Pressable
            style={({ pressed }) => [
              styles.actionButton,
              styles.rejectButton,
              pressed && styles.buttonPressed,
              isProcessing && styles.disabledButton,
            ]}
            onPress={() => handleReviewRequest('rejected', item._id)}
            disabled={isProcessing}
          >
            {isProcessing && currentAction === 'rejected' ? (
              <ActivityIndicator size="small" color={colors.error} />
            ) : (
              <Text style={styles.rejectButtonText}>Reject</Text>
            )}
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.actionButton,
              styles.acceptButton,
              pressed && styles.buttonPressed,
              isProcessing && styles.disabledButton,
            ]}
            onPress={() => handleReviewRequest('accepted', item._id)}
            disabled={isProcessing}
          >
            {isProcessing && currentAction === 'accepted' ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <Text style={styles.acceptButtonText}>Accept</Text>
            )}
          </Pressable>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Connection Requests</Text>
        <View style={styles.countBadge}>
          <Text style={styles.countBadgeText}>{requests.length}</Text>
        </View>
      </View>

      <FlatList
        data={requests}
        keyExtractor={(item) => item._id}
        renderItem={renderRequestItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshing={refreshing}
        onRefresh={() => fetchRequests(true)}
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
  requestCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginBottom: 12,
  },
  cardHeader: {
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
  userInfo: {
    flex: 1,
    marginLeft: 12,
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
    fontSize: 14,
    lineHeight: 20,
    marginTop: 12,
    marginBottom: 12,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  actionButton: {
    flex: 1,
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rejectButton: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.error,
  },
  rejectButtonText: {
    color: colors.error,
    fontSize: 15,
    fontWeight: '600',
  },
  acceptButton: {
    backgroundColor: colors.success,
  },
  acceptButtonText: {
    color: colors.white,
    fontSize: 15,
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
  buttonPressed: {
    opacity: 0.8,
  },
  disabledButton: {
    opacity: 0.5,
  },
});

export default RequestsScreen;
