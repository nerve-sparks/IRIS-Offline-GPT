// src/screens/ConversationChatScreen.tsx
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  StyleSheet, SafeAreaView, KeyboardAvoidingView,
  Platform, StatusBar,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import {
  subscribe, getConversation, addMessage,
  simulateAIReply, toggleStarMessage, togglePinMessage,
  Conversation,
} from '../services/conversationStore';
import { showConversationExportMenu } from '../services/conversationExport';
import { colors, spacing, radius, typography } from '../theme/irisTheme';
import MessageBubble from '../components/conversation/MessageBubble';
import TypingIndicator from '../components/conversation/TypingIndicator';

export default function ConversationChatScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { conversationId } = route.params;

  const [conversation, setConversation] = useState<Conversation | null>(
    getConversation(conversationId)
  );
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const listRef = useRef<FlatList>(null);

  useEffect(() => {
    return subscribe(convs => {
      const updated = convs.find(c => c.id === conversationId);
      if (updated) setConversation(updated);
    });
  }, [conversationId]);

  useEffect(() => {
    if (conversation) {
      navigation.setOptions({ title: conversation.title });
    }
  }, [conversation, navigation]);

  const scrollToEnd = useCallback(() => {
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
  }, []);

  useEffect(() => {
    scrollToEnd();
  }, [conversation?.messages?.length, isTyping, scrollToEnd]);

  const handleSend = useCallback(async () => {
    const text = inputText.trim();
    if (!text) return;
    setInputText('');
    addMessage(conversationId, text, 'user');
    setIsTyping(true);
    try {
      await simulateAIReply(conversationId);
    } finally {
      setIsTyping(false);
    }
  }, [inputText, conversationId]);

  const handleStarMessage = (messageId: string) => {
    toggleStarMessage(conversationId, messageId);
  };

  const handlePinMessage = (messageId: string) => {
    togglePinMessage(conversationId, messageId);
  };

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={() => conversation && showConversationExportMenu(conversation)}
          style={{ marginRight: spacing.md }}
        >
          <Text style={{ color: colors.accent, fontSize: typography.md }}>Export</Text>
        </TouchableOpacity>
      ),
    });
  }, [conversation, navigation]);

  if (!conversation) {
    return (
      <SafeAreaView style={styles.safe}>
        <Text style={{ color: colors.textMuted, textAlign: 'center', marginTop: 40 }}>
          Conversation not found.
        </Text>
      </SafeAreaView>
    );
  }

  const pinnedMessage = [...conversation.messages].reverse().find(message => message.isPinned);
  const pinnedIndex = pinnedMessage
    ? conversation.messages.findIndex(m => m.id === pinnedMessage.id)
    : -1;

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />
      <KeyboardAvoidingView
        style={styles.kav}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
      >
        {pinnedMessage && (
          <TouchableOpacity
            activeOpacity={0.75}
            style={styles.pinnedBar}
            onPress={() => {
              if (pinnedIndex >= 0) {
                listRef.current?.scrollToIndex({ index: pinnedIndex, animated: true, viewPosition: 0.3 });
              }
            }}
          >
            <Text style={styles.pinnedLabel}>📌 Pinned - tap to jump</Text>
            <Text style={styles.pinnedText} numberOfLines={2}>
              {pinnedMessage.text}
            </Text>
          </TouchableOpacity>
        )}
        <FlatList
          ref={listRef}
          data={conversation.messages}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <MessageBubble
              message={item}
              onPin={() => handlePinMessage(item.id)}
              onStar={() => handleStarMessage(item.id)}
              searchQuery=""
            />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={scrollToEnd}
          onScrollToIndexFailed={(info) => {
            setTimeout(() => listRef.current?.scrollToIndex({ index: info.index, animated: true, viewPosition: 0.3 }), 300);
          }}
          ListEmptyComponent={
            <View style={styles.emptyChat}>
              <Text style={styles.emptyChatTitle}>Hello, Ask me Anything</Text>
              <Text style={styles.emptyChatHint}>
                Start a conversation with IRIS
              </Text>
            </View>
          }
          ListFooterComponent={isTyping ? <TypingIndicator /> : null}
        />

        <View style={styles.inputBar}>
          <View style={styles.inputWrap}>
            <TextInput
              style={styles.input}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Message IRIS..."
              placeholderTextColor={colors.textMuted}
              multiline
              maxLength={2000}
            />
          </View>
          <TouchableOpacity
            style={[styles.sendBtn, !inputText.trim() && styles.sendBtnDisabled]}
            onPress={handleSend}
            disabled={!inputText.trim() || isTyping}
            activeOpacity={0.7}
          >
            <Text style={styles.sendIcon}>✈</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  kav: { flex: 1 },
  pinnedBar: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.bgSurface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pinnedLabel: {
    color: colors.pinned,
    fontSize: typography.xs,
    fontWeight: '700',
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
  },
  pinnedText: {
    color: colors.textPrimary,
    fontSize: typography.sm,
    lineHeight: 18,
  },
  listContent: {
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    flexGrow: 1,
    justifyContent: 'flex-end',
  },
  emptyChat: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingTop: 120, paddingHorizontal: spacing.xxl,
  },
  emptyChatTitle: {
    color: colors.textPrimary, fontSize: typography.xxxl,
    fontWeight: '300', textAlign: 'center', marginBottom: spacing.md,
  },
  emptyChatHint: {
    color: colors.textSecondary, fontSize: typography.md, textAlign: 'center',
  },
  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end',
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
    borderTopWidth: 1, borderTopColor: colors.border,
    backgroundColor: colors.bg, gap: spacing.sm,
  },
  inputWrap: {
    flex: 1, backgroundColor: colors.bgSurface,
    borderRadius: radius.xl, paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2, minHeight: 44, maxHeight: 120,
  },
  input: {
    color: colors.textPrimary, fontSize: typography.md,
    lineHeight: 22, paddingTop: 0, paddingBottom: 0,
  },
  sendBtn: {
    width: 44, height: 44, borderRadius: radius.full,
    backgroundColor: colors.bgSurface, alignItems: 'center', justifyContent: 'center',
  },
  sendBtnDisabled: { opacity: 0.4 },
  sendIcon: { fontSize: 20 },
});
