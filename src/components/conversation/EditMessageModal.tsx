// src/components/conversation/EditMessageModal.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, Pressable,
} from 'react-native';
import { colors, spacing, radius, typography } from '../../theme/irisTheme';

interface Props {
  visible: boolean;
  initialText: string;
  onCancel: () => void;
  onConfirm: (newText: string) => void;
}

export default function EditMessageModal({ visible, initialText, onCancel, onConfirm }: Props) {
  const [text, setText] = useState(initialText);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (!visible) return;
    setText(initialText);
    const focusTimer = setTimeout(() => inputRef.current?.focus(), 120);
    return () => clearTimeout(focusTimer);
  }, [visible, initialText]);

  const canSend = text.trim().length > 0 && text.trim() !== initialText;

  return (
    <View 
      style={[styles.root, !visible && { opacity: 0, left: 10000 }]} 
      pointerEvents={visible ? "box-none" : "none"}
    >
      <Pressable style={styles.overlay} onPress={onCancel} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.kavWrapper}
        pointerEvents="box-none"
      >
        <View style={styles.sheet}>
          <Text style={styles.title}>Edit Message</Text>
          <Text style={styles.subtitle}>
            Messages after this will be removed and a new response generated.
          </Text>

          <TextInput
            ref={inputRef}
            style={styles.input}
            value={text}
            onChangeText={setText}
            multiline
            maxLength={2000}
            autoFocus={false}
            blurOnSubmit={false}
            placeholderTextColor={colors.textMuted}
            selectionColor={colors.accent}
          />

          <View style={styles.btnRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.sendBtn, !canSend && styles.sendBtnDisabled]}
              onPress={() => onConfirm(text.trim())}
              disabled={!canSend}
            >
              <Text style={styles.sendText}>Send Edited</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    zIndex: 1000,
    elevation: 1000,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  kavWrapper: {
    flex: 1,
    justifyContent: 'center',
  },
  sheet: {
    backgroundColor: colors.bgSurface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    width: '100%',
    maxWidth: 460,
    alignSelf: 'center',
  },
  title: {
    color: colors.textPrimary,
    fontSize: typography.lg,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: typography.sm,
    marginBottom: spacing.md,
    lineHeight: 18,
  },
  input: {
    backgroundColor: colors.bg,
    color: colors.textPrimary,
    fontSize: typography.md,
    lineHeight: 22,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    minHeight: 96,
    maxHeight: 180,
    textAlignVertical: 'top',
    marginBottom: spacing.md,
  },
  btnRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  cancelText: {
    color: colors.textSecondary,
    fontSize: typography.md,
    fontWeight: '600',
  },
  sendBtn: {
    flex: 2,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.lg,
    backgroundColor: colors.accent,
    alignItems: 'center',
  },
  sendBtnDisabled: { opacity: 0.4 },
  sendText: {
    color: '#fff',
    fontSize: typography.md,
    fontWeight: '700',
  },
});
