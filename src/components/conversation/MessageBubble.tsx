import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Message } from '../../services/conversationStore';
import { colors, spacing, radius, typography } from '../../theme/irisTheme';

interface Props {
  message: Message;
  searchQuery?: string;
  onStar?: () => void;
  onPin?: () => void;
}

const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

export default function MessageBubble({ message, searchQuery = '', onStar, onPin }: Props) {
  const isUser = message.sender === 'user';
  const [showActions, setShowActions] = useState(false);

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onLongPress={() => setShowActions(!showActions)}
      style={[styles.row, isUser ? styles.rowUser : styles.rowAI]}
    >
      {!isUser && (
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>I</Text>
        </View>
      )}

      <View style={styles.contentWrap}>
        <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAI]}>
          <Text style={[styles.text, isUser ? styles.textUser : styles.textAI]}>
            {message.text}
          </Text>
          <View style={styles.meta}>
            <Text style={[styles.time, isUser ? styles.timeUser : styles.timeAI]}>
              {formatTime(message.timestamp)}
            </Text>
            {message.isPinned && (
              <Text style={styles.pinBadge}>PIN</Text>
            )}
            {message.isStarred && (
              <Text style={styles.starBadge}>STAR</Text>
            )}
          </View>
        </View>

        {showActions && (
          <View style={styles.actionRow}>
            <TouchableOpacity onPress={onPin}>
              <Text style={styles.actionBtn}>
                {message.isPinned ? 'Unpin' : 'Pin'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onStar}>
              <Text style={styles.actionBtn}>
                {message.isStarred ? 'Unstar' : 'Star'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    marginVertical: spacing.xs,
    paddingHorizontal: spacing.lg,
    alignItems: 'flex-end',
  },
  rowUser: { justifyContent: 'flex-end' },
  rowAI: { justifyContent: 'flex-start' },

  avatar: {
    width: 28,
    height: 28,
    borderRadius: radius.full,
    backgroundColor: colors.bgSurface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
    marginBottom: 2,
  },
  avatarText: { color: colors.accent, fontSize: typography.sm, fontWeight: '700' },

  contentWrap: { maxWidth: '75%' },

  bubble: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.lg,
  },
  bubbleUser: {
    backgroundColor: colors.bgSurface,
    borderBottomRightRadius: radius.sm,
  },
  bubbleAI: {
    backgroundColor: 'transparent',
    borderBottomLeftRadius: radius.sm,
  },

  text: { fontSize: typography.md, lineHeight: 22 },
  textUser: { color: colors.textSecondary },
  textAI: { color: colors.textSecondary },

  meta: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.xs, gap: spacing.xs },
  time: { fontSize: typography.xs },
  timeUser: { color: colors.textMuted, textAlign: 'right' },
  timeAI: { color: colors.textMuted },
  pinBadge: { fontSize: 10, color: colors.pinned, fontWeight: '700' },
  starBadge: { fontSize: 10, color: colors.starred, fontWeight: '700' },

  actionRow: {
    flexDirection: 'row',
    marginTop: spacing.xs,
    paddingHorizontal: spacing.sm,
    gap: spacing.xs,
  },
  actionBtn: {
    color: colors.accent,
    fontSize: typography.sm,
    backgroundColor: colors.bgSurface,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
  },
});
