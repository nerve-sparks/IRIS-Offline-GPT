// src/components/conversation/TypingIndicator.tsx
import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { colors, spacing, radius } from '../../theme/irisTheme';

export default function TypingIndicator() {
  const dots = [
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
  ];

  useEffect(() => {
    const animations = dots.map((dot, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 150),
          Animated.timing(dot, { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0, duration: 300, useNativeDriver: true }),
          Animated.delay(600 - i * 150),
        ])
      )
    );
    animations.forEach(a => a.start());
    return () => animations.forEach(a => a.stop());
  }, []);

  return (
    <View style={styles.row}>
      <View style={styles.avatarSpace} />
      <View style={styles.bubble}>
        {dots.map((dot, i) => (
          <Animated.View
            key={i}
            style={[
              styles.dot,
              {
                opacity: dot,
                transform: [{
                  translateY: dot.interpolate({
                    inputRange: [0, 1], outputRange: [0, -4],
                  }),
                }],
              },
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
});
