// src/components/conversation/BranchNavigator.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, spacing, radius, typography } from '../../theme/irisTheme';

interface Props {
  current: number;
  total: number;
  onPrev?: () => void;
  onNext?: () => void;
  onRetry?: () => void;
}

export default function BranchNavigator({ current, total, onPrev, onNext, onRetry }: Props) {
  const canNavigate = total > 1 && !!onPrev && !!onNext;

  if (!canNavigate && !onRetry) return null;

  return (
    <View style={styles.container}>
      {canNavigate && (
        <>
          <TouchableOpacity
            onPress={onPrev}
            disabled={current <= 1}
            style={[styles.arrow, current <= 1 && styles.arrowDisabled]}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={[styles.arrowText, current <= 1 && styles.arrowTextDisabled]}>{"<"}</Text>
          </TouchableOpacity>
          <Text style={styles.label}>{current} / {total}</Text>
          <TouchableOpacity
            onPress={onNext}
            disabled={current >= total}
            style={[styles.arrow, current >= total && styles.arrowDisabled]}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={[styles.arrowText, current >= total && styles.arrowTextDisabled]}>{">"}</Text>
          </TouchableOpacity>
        </>
      )}
      {onRetry && (
        <TouchableOpacity onPress={onRetry} style={styles.retryBtn}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
    paddingHorizontal: spacing.sm,
    gap: 6,
    alignSelf: 'flex-start',
  },
  arrow: {
    width: 24,
    height: 24,
    borderRadius: radius.full,
    backgroundColor: colors.bgSurface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowDisabled: { opacity: 0.35 },
  arrowText: {
    color: colors.accent,
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '600',
  },
  arrowTextDisabled: { color: colors.textMuted },
  label: {
    color: colors.textMuted,
    fontSize: typography.xs,
    fontWeight: '500',
    minWidth: 30,
    textAlign: 'center',
  },
  retryBtn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    backgroundColor: colors.accent,
  },
  retryText: {
    color: '#fff',
    fontSize: typography.xs,
    fontWeight: '700',
  },
});
