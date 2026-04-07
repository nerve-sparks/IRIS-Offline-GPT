// src/screens/ConversationChatScreen.tsx
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  StyleSheet, SafeAreaView, KeyboardAvoidingView,
  Platform, StatusBar, ToastAndroid,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import {
  subscribe, getConversation, addMessage,
  simulateAIReply, toggleStarMessage, togglePinMessage,
  Conversation, Message,
  addMessageVariant, setActiveVariant, editUserMessage, forkConversation,
} from '../services/conversationStore';
import { showConversationExportMenu } from '../services/conversationExport';
import { colors, spacing, radius, typography } from '../theme/irisTheme';
import MessageBubble from '../components/conversation/MessageBubble';
import EditMessageModal from '../components/conversation/EditMessageModal';
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
  const [editingMessage, setEditingMessage] = useState<{ id: string; text: string } | null>(null);
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
    setTimeout(() => listRef.current?.scrollToEnd({ animated: false }), 100);
  }, []);

  useEffect(() => {
    scrollToEnd();
  }, [conversation?.messages?.length, isTyping, scrollToEnd]);

  const handleSend = useCallback(async (overrideText?: string) => {
    const text = (overrideText ?? inputText).trim();
    if (!text) return;
    if (!overrideText) setInputText('');
    const userMsg = addMessage(conversationId, text, 'user');
    setIsTyping(true);
    try {
      // Use addMessage with parentId so retry works correctly
      const conv = getConversation(conversationId);
      if (conv) {
        // simulateAIReply internally calls addMessage; we re-implement for parentId support
        await new Promise<void>(resolve => setTimeout(resolve, 900 + Math.random() * 600));
        const aiReplies = [
          "That's a great question! Let me think through this carefully for you.",
          "I understand what you're looking for. Here's my perspective on this...",
          "Interesting! Based on what you've shared, I'd suggest the following approach.",
          "Sure thing! I can definitely help with that. Here's what I'd recommend.",
          "Let me break that down for you in a clear and structured way.",
        ];
        const reply = aiReplies[Math.floor(Math.random() * aiReplies.length)];
        addMessage(conversationId, reply, 'assistant', userMsg.id);
      }
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

  // ── Branch handlers ───────────────────────────────────────────────────────

  const handleEditMessage = async (msgId: string, newText: string) => {
    if (isTyping) return;
    const updated = editUserMessage(conversationId, msgId, newText);
    setIsTyping(true);
    try {
      await new Promise<void>(resolve => setTimeout(resolve, 900 + Math.random() * 600));
      const aiReplies = [
        "That's a great question! Let me think through this carefully for you.",
        "I understand what you're looking for. Here's my perspective on this...",
        "Interesting! Based on what you've shared, I'd suggest the following approach.",
        "Sure thing! I can definitely help with that. Here's what I'd recommend.",
        "Let me break that down for you in a clear and structured way.",
      ];
      const reply = aiReplies[Math.floor(Math.random() * aiReplies.length)];
      const existingAssistant = updated?.messages.find(m => m.sender === 'assistant' && m.parentId === msgId);
      if (existingAssistant) addMessageVariant(conversationId, msgId, reply);
      else addMessage(conversationId, reply, 'assistant', msgId);
    } finally {
      setIsTyping(false);
    }
  };

  const handleRetry = async (assistantMsgId: string) => {
    if (isTyping) return;
    const conv = getConversation(conversationId);
    const assistantMsg = conv?.messages.find(m => m.id === assistantMsgId);
    if (!assistantMsg?.parentId) return;
    const userMsgId = assistantMsg.parentId;
    setIsTyping(true);
    try {
      await new Promise<void>(resolve => setTimeout(resolve, 900 + Math.random() * 600));
      const aiReplies = [
        "That's a great question! Let me think through this carefully for you.",
        "I understand what you're looking for. Here's my perspective on this...",
        "Interesting! Based on what you've shared, I'd suggest the following approach.",
        "Sure thing! I can definitely help with that. Here's what I'd recommend.",
        "Let me break that down for you in a clear and structured way.",
      ];
      const reply = aiReplies[Math.floor(Math.random() * aiReplies.length)];
      addMessageVariant(conversationId, userMsgId, reply);
    } finally {
      setIsTyping(false);
    }
  };

  const handleFork = (msgId: string) => {
    const forked = forkConversation(conversationId, msgId);
    if (!forked) {
      ToastAndroid.show('Could not fork conversation.', ToastAndroid.SHORT);
      return;
    }
    ToastAndroid.show('Conversation forked!', ToastAndroid.SHORT);
    navigation.replace('ConversationChat', { conversationId: forked.id });
  };

  const handlePrevVariant = (messageId: string) => {
    const conv = getConversation(conversationId);
    const msg = conv?.messages.find(m => m.id === messageId);
    if (!msg || !msg.variants) return;
    const current = msg.activeVariantIndex ?? msg.variants.length - 1;
    const next = Math.max(0, current - 1);
    setActiveVariant(conversationId, messageId, next);
  };

  const handleNextVariant = (messageId: string) => {
    const conv = getConversation(conversationId);
    const msg = conv?.messages.find(m => m.id === messageId);
    if (!msg || !msg.variants) return;
    const current = msg.activeVariantIndex ?? msg.variants.length - 1;
    const next = Math.min(msg.variants.length - 1, current + 1);
    setActiveVariant(conversationId, messageId, next);
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
                listRef.current?.scrollToIndex({ index: pinnedIndex, animated: false, viewPosition: 0.3 });
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
              onEdit={item.sender === 'user'
                ? () => setEditingMessage({ id: item.id, text: item.text })
                : undefined}
              onRetry={item.sender === 'assistant'
                ? () => handleRetry(item.id)
                : undefined}
              onFork={() => handleFork(item.id)}
              onPrevVariant={item.variants && item.variants.length > 1
                ? () => handlePrevVariant(item.id)
                : undefined}
              onNextVariant={item.variants && item.variants.length > 1
                ? () => handleNextVariant(item.id)
                : undefined}
              searchQuery=""
            />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={scrollToEnd}
          onScrollToIndexFailed={(info) => {
            setTimeout(() => listRef.current?.scrollToIndex({ index: info.index, animated: false, viewPosition: 0.3 }), 300);
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
            style={[styles.sendBtn, (!inputText.trim() || isTyping) && styles.sendBtnDisabled]}
            onPress={() => handleSend()}
            disabled={!inputText.trim() || isTyping}
            activeOpacity={0.7}
          >
            <Text style={styles.sendIcon}>✈</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
      <EditMessageModal
        visible={!!editingMessage}
        initialText={editingMessage?.text ?? ''}
        onCancel={() => setEditingMessage(null)}
        onConfirm={async (newText) => {
          if (!editingMessage) return;
          const editId = editingMessage.id;
          setEditingMessage(null);
          await handleEditMessage(editId, newText);
        }}
      />
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
