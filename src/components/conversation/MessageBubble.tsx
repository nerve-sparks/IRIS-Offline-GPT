// src/components/conversation/MessageBubble.tsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Message } from '../../services/conversationStore';
import { colors, spacing, radius, typography } from '../../theme/irisTheme';
import BranchNavigator from './BranchNavigator';

interface Props {
  message: Message;
  searchQuery?: string;
  onStar?: () => void;
  onPin?: () => void;
  onEdit?: () => void;
  onRetry?: () => void;
  onFork?: () => void;
  onPrevVariant?: () => void;
  onNextVariant?: () => void;
}

const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

export default function MessageBubble({
  message, searchQuery = '',
  onStar, onPin,
  onEdit, onRetry, onFork,
  onPrevVariant, onNextVariant,
}: Props) {
  const isUser = message.sender === 'user';
  const [showActions, setShowActions] = useState(false);

  const variantTotal = message.variants ? message.variants.length : 0;
  const activeVariantIndex = message.activeVariantIndex ?? (variantTotal > 0 ? variantTotal - 1 : 0);
  const displayText = variantTotal > 0 && message.variants
    ? (message.variants[activeVariantIndex]?.text ?? message.text)
    : message.text;

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onLongPress={() => setShowActions(prev => !prev)}
      style={[styles.row, isUser ? styles.rowUser : styles.rowAI]}
    >
      {!isUser && (
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>I</Text>
        </View>
      )}

      <View style={styles.contentWrap}>
        <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAI]}>
          {isUser && !!message.editedFrom && (
            <Text style={styles.editedBadge}>edited</Text>
          )}
          <Text style={[styles.text, isUser ? styles.textUser : styles.textAI]}>
            {displayText}
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

        {(variantTotal > 1 || (!isUser && !!onRetry)) && (
          <BranchNavigator
            current={activeVariantIndex + 1}
            total={variantTotal}
            onPrev={onPrevVariant}
            onNext={onNextVariant}
            onRetry={!isUser ? onRetry : undefined}
          />
        )}

        {showActions && (
          <View style={styles.actionRow}>
            <TouchableOpacity onPress={() => { onPin?.(); setShowActions(false); }}>
              <Text style={styles.actionBtn}>
                {message.isPinned ? 'Unpin' : 'Pin'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { onStar?.(); setShowActions(false); }}>
              <Text style={styles.actionBtn}>
                {message.isStarred ? 'Unstar' : 'Star'}
              </Text>
            </TouchableOpacity>
            {isUser && onEdit && (
              <TouchableOpacity onPress={() => { onEdit(); setShowActions(false); }}>
                <Text style={styles.actionBtn}>Edit</Text>
              </TouchableOpacity>
            )}
            {isUser && onFork && (
              <TouchableOpacity onPress={() => { onFork(); setShowActions(false); }}>
                <Text style={styles.actionBtn}>Fork</Text>
              </TouchableOpacity>
            )}
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
  editedBadge: {
    color: colors.textMuted,
    fontSize: 10,
    fontStyle: 'italic',
    marginBottom: 2,
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
    flexWrap: 'wrap',
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
