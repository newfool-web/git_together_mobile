import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import { useSelector } from 'react-redux';
import api from '../utils/api';
import { colors } from '../utils/colors';
import { createSocketConnection } from '../utils/socket';

const ChatScreen = ({ route, navigation }) => {
  const { targetUserId, targetUserName } = route?.params || {};
  const user = useSelector((store) => store.user);

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isLoadingOlder, setIsLoadingOlder] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState('');

  const socketRef = useRef(null);

  // Set navigation header title to target user's name
  useEffect(() => {
    if (targetUserName) {
      navigation.setOptions({ title: targetUserName });
    }
  }, [navigation, targetUserName]);

  // Initial load and socket connection
  useEffect(() => {
    if (!targetUserId || !user?._id) return;

    let isMounted = true;

    const fetchInitialMessages = async () => {
      try {
        setIsInitialLoading(true);
        setError('');
        const res = await api.get('/chat/' + targetUserId, {
          params: { limit: 20, skip: 0 },
        });

        if (isMounted) {
          setMessages(res.data?.messages || []);
          setHasMore(Boolean(res.data?.hasMore));
        }
      } catch (err) {
        if (isMounted) {
          if (err?.response?.status === 403) {
            setError('You can only chat with your connections');
          } else {
            setError(
              err?.response?.data?.message ||
                err?.message ||
                'Failed to load messages'
            );
          }
        }
      } finally {
        if (isMounted) {
          setIsInitialLoading(false);
        }
      }
    };

    fetchInitialMessages();

    // Setup socket connection
    const socket = createSocketConnection();
    socketRef.current = socket;

    socket.emit('joinChat', {
      firstName: user.firstName,
      userId: user._id,
      targetUserId,
    });

    socket.on('messageReceived', (data) => {
      if (isMounted && data) {
        setMessages((prev) => [...prev, data]);
      }
    });

    return () => {
      isMounted = false;
      socket.disconnect();
      socketRef.current = null;
    };
  }, [targetUserId, user?._id, user?.firstName]);

  // Send message via socket
  const handleSend = () => {
    const textToSend = newMessage.trim();
    if (!textToSend || !socketRef.current) return;

    socketRef.current.emit('sendMessage', {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      userId: user?._id,
      targetUserId,
      text: newMessage,
    });

    setNewMessage('');
  };

  // Load older messages for pagination
  const handleLoadOlder = async () => {
    if (isLoadingOlder || !hasMore) return;

    try {
      setIsLoadingOlder(true);
      const res = await api.get('/chat/' + targetUserId, {
        params: { limit: 20, skip: messages.length },
      });

      const olderMessages = res.data?.messages || [];
      setMessages((prev) => [...olderMessages, ...prev]);
      setHasMore(Boolean(res.data?.hasMore));
    } catch {
      // Retain current message state on failure
    } finally {
      setIsLoadingOlder(false);
    }
  };

  // Format timestamp helper
  const formatTime = (createdAt) => {
    if (!createdAt) return '';
    try {
      const date = new Date(createdAt);
      if (isNaN(date.getTime())) return '';
      return date.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  };

  // Determine if a message was sent by the current user
  const isMyMessage = (message) => {
    if (!message || !user?._id) return false;
    if (message.senderId && typeof message.senderId === 'object') {
      return message.senderId._id === user._id;
    }
    if (message.senderId) {
      return message.senderId === user._id;
    }
    if (message.userId) {
      return message.userId === user._id;
    }
    return false;
  };

  // Extract sender firstName
  const getSenderFirstName = (message, isMe) => {
    if (
      message.senderId &&
      typeof message.senderId === 'object' &&
      message.senderId.firstName
    ) {
      return message.senderId.firstName;
    }
    if (message.firstName) {
      return message.firstName;
    }
    return isMe ? user?.firstName || 'You' : targetUserName || 'Connection';
  };

  // FlatList inverted data (newest first)
  const reversedMessages = useMemo(() => {
    return [...messages].reverse();
  }, [messages]);

  // Render individual message bubble
  const renderMessageItem = ({ item }) => {
    const isMe = isMyMessage(item);
    const firstName = getSenderFirstName(item, isMe);
    const formattedTime = formatTime(item.createdAt);

    return (
      <View
        style={[
          styles.bubbleWrapper,
          isMe ? styles.bubbleWrapperMe : styles.bubbleWrapperOther,
        ]}
      >
        <View
          style={[
            styles.bubble,
            isMe ? styles.bubbleMe : styles.bubbleOther,
          ]}
        >
          {firstName ? (
            <Text
              style={[
                styles.senderName,
                isMe ? styles.senderNameMe : styles.senderNameOther,
              ]}
            >
              {firstName}
            </Text>
          ) : null}

          <Text
            style={[
              styles.messageText,
              isMe ? styles.messageTextMe : styles.messageTextOther,
            ]}
          >
            {item.text}
          </Text>

          {formattedTime ? (
            <Text
              style={[
                styles.timeText,
                isMe ? styles.timeTextMe : styles.timeTextOther,
              ]}
            >
              {formattedTime}
            </Text>
          ) : null}
        </View>
      </View>
    );
  };

  // Render footer component for inverted FlatList (appears at top of chat)
  const renderFooter = () => {
    if (!hasMore) return null;

    return (
      <View style={styles.loadOlderContainer}>
        {isLoadingOlder ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : (
          <Pressable
            style={styles.loadOlderButton}
            onPress={handleLoadOlder}
            accessibilityRole="button"
            accessibilityLabel="Load older messages"
          >
            <Text style={styles.loadOlderText}>Load older messages</Text>
          </Pressable>
        )}
      </View>
    );
  };

  // Error State
  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  // Initial Loading State
  if (isInitialLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {messages.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No messages yet. Say hello!</Text>
        </View>
      ) : (
        <FlatList
          data={reversedMessages}
          keyExtractor={(item, index) =>
            item._id || item.id || `msg-${index}-${item.createdAt || ''}`
          }
          renderItem={renderMessageItem}
          inverted
          ListFooterComponent={renderFooter}
          contentContainerStyle={styles.listContent}
        />
      )}

      {/* Bottom input bar */}
      <View style={styles.inputBar}>
        <TextInput
          style={styles.input}
          value={newMessage}
          onChangeText={setNewMessage}
          placeholder="Type a message..."
          placeholderTextColor={colors.textMuted}
          multiline
          maxLength={1000}
        />
        <Pressable
          style={[
            styles.sendButton,
            !newMessage.trim() && styles.sendButtonDisabled,
          ]}
          onPress={handleSend}
          disabled={!newMessage.trim()}
          accessibilityRole="button"
          accessibilityLabel="Send message"
        >
          <Text
            style={[
              styles.sendButtonText,
              !newMessage.trim() && styles.sendButtonTextDisabled,
            ]}
          >
            Send
          </Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
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
  errorText: {
    fontSize: 16,
    color: colors.error,
    textAlign: 'center',
    lineHeight: 22,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  bubbleWrapper: {
    marginVertical: 4,
    maxWidth: '80%',
  },
  bubbleWrapperMe: {
    alignSelf: 'flex-end',
  },
  bubbleWrapperOther: {
    alignSelf: 'flex-start',
  },
  bubble: {
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleMe: {
    backgroundColor: colors.primary,
  },
  bubbleOther: {
    backgroundColor: colors.surface,
  },
  senderName: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
  },
  senderNameMe: {
    color: '#e0e7ff',
    alignSelf: 'flex-end',
  },
  senderNameOther: {
    color: colors.textSecondary,
    alignSelf: 'flex-start',
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  messageTextMe: {
    color: colors.white,
  },
  messageTextOther: {
    color: colors.text,
  },
  timeText: {
    fontSize: 10,
    marginTop: 4,
  },
  timeTextMe: {
    color: '#e0e7ff',
    alignSelf: 'flex-end',
  },
  timeTextOther: {
    color: colors.textMuted,
    alignSelf: 'flex-end',
  },
  loadOlderContainer: {
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadOlderButton: {
    minHeight: 44,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadOlderText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 100,
    backgroundColor: colors.background,
    color: colors.text,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
  },
  sendButton: {
    minHeight: 44,
    minWidth: 64,
    backgroundColor: colors.primary,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    paddingHorizontal: 12,
  },
  sendButtonDisabled: {
    backgroundColor: colors.surfaceLight,
    opacity: 0.6,
  },
  sendButtonText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '600',
  },
  sendButtonTextDisabled: {
    color: colors.textMuted,
  },
});

export default ChatScreen;
