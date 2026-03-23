// src/components/conversation/ConversationItem.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Conversation } from '../../services/conversationStore';
import { colors, spacing, radius, typography } from '../../theme/irisTheme';

interface Props {
  conversation: Conversation;
  searchQuery?: string;
  onPress: (conv: Conversation) => void;
  onLongPress?: (conv: Conversation) => void;
}

const formatDate = (iso: string) => {
  const d = new Date(iso);
  const diffDays = Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return d.toLocaleDateString([], { weekday: 'short' });
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

// Highlight matching text in search
const HighlightedText = ({
  text, query, style,
}: { text: string; query: string; style: any }) => {
  if (!query.trim()) return <Text style={style}>{text}</Text>;
  const parts = text.split(new RegExp(`(${query})`, 'gi'));
  return (
    <Text style={style}>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <Text key={i} style={[style, styles.highlight]}>{part}</Text>
        ) : (
          <Text key={i}>{part}</Text>
        )
      )}
    </Text>
  );
};

export default function ConversationItem({ conversation, searchQuery = '', onPress, onLongPress }: Props) {
  const lastMsg = conversation.messages[conversation.messages.length - 1];
  const preview = lastMsg
    ? `${lastMsg.sender === 'user' ? 'You: ' : 'IRIS: '}${lastMsg.text}`
    : 'No messages yet';
  const timestamp = lastMsg ? lastMsg.timestamp : conversation.createdAt;

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onPress(conversation)}
      onLongPress={() => onLongPress && onLongPress(conversation)}
      activeOpacity={0.65}
    >
      {/* Avatar */}
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>I</Text>
        <View style={styles.onlineDot} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.titleRow}>
            {conversation.isPinned && (
              <Text style={styles.pinIcon}>📌</Text>
            )}
            <HighlightedText
              text={conversation.title}
              query={searchQuery}
              style={styles.title}
            />
          </View>
          <Text style={styles.time}>{formatDate(timestamp)}</Text>
        </View>
        <HighlightedText
          text={preview}
          query={searchQuery}
          style={styles.preview}
        />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md + 2,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  avatar: {
    width: 46, height: 46, borderRadius: radius.full,
    backgroundColor: colors.bgSurface, borderWidth: 1,
    borderColor: colors.accent, alignItems: 'center',
    justifyContent: 'center', marginRight: spacing.md,
  },
  avatarText: { color: colors.accent, fontSize: typography.lg, fontWeight: '700' },
  onlineDot: {
    position: 'absolute', bottom: 1, right: 1,
    width: 10, height: 10, borderRadius: radius.full,
    backgroundColor: colors.online, borderWidth: 1.5, borderColor: colors.bg,
  },
  content: { flex: 1 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: spacing.xs,
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: spacing.sm },
  pinIcon: { fontSize: 11, marginRight: spacing.xs },
  title: {
    color: colors.textPrimary, fontSize: typography.md,
    fontWeight: '600', flex: 1,
  },
  time: { color: colors.textMuted, fontSize: typography.xs },
  preview: {
    color: colors.textSecondary, fontSize: typography.sm, lineHeight: 18,
  },
  highlight: {
    backgroundColor: '#2563EB33', color: colors.accent, fontWeight: '600',
  },
});
