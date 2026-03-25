// src/components/conversation/TypingIndicator.tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors, spacing, radius } from '../../theme/irisTheme';

export default function TypingIndicator() {
  return (
    <View style={styles.row}>
      <View style={styles.avatarSpace} />
      <View style={styles.bubble}>
        {[0, 1, 2].map(i => (
          <View
            key={i}
            style={[
              styles.dot,
              i !== 1 && styles.dotDim,
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'flex-end',
    paddingHorizontal: spacing.lg, marginVertical: spacing.xs,
  },
  avatarSpace: { width: 28, marginRight: spacing.sm },
  bubble: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.bgSurface,
    borderRadius: radius.lg, borderBottomLeftRadius: radius.sm,
    paddingHorizontal: spacing.md, paddingVertical: spacing.md,
    gap: 5,
  },
  dot: {
    width: 7, height: 7, borderRadius: radius.full,
    backgroundColor: colors.accent,
  },
  dotDim: {
    opacity: 0.45,
  },
});
