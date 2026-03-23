// src/screens/FoldersScreen.tsx
import React, { useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, SafeAreaView, Alert, TextInput, Modal,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import {
  useFolders, useConversations, createFolder, deleteFolder, Folder,
} from '../services/conversationStore';
import { colors, spacing, radius, typography } from '../theme/irisTheme';

const FOLDER_COLORS = [
  '#2563EB', '#7C3AED', '#DB2777', '#DC2626',
  '#D97706', '#059669', '#0891B2', '#4F46E5',
];

export default function FoldersScreen() {
  const navigation = useNavigation<any>();
  const folders = useFolders();
  const conversations = useConversations();
  const [showModal, setShowModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [selectedColor, setSelectedColor] = useState(FOLDER_COLORS[0]);

  const getCount = (folderId: string) =>
    conversations.filter(c => c.folderId === folderId).length;

  const handleCreate = () => {
    if (!newFolderName.trim()) return;
    createFolder(newFolderName.trim(), selectedColor);
    setNewFolderName('');
    setSelectedColor(FOLDER_COLORS[0]);
    setShowModal(false);
  };

  const handleDelete = (folder: Folder) => {
    Alert.alert(
      `Delete "${folder.name}"?`,
      'Conversations will be moved out of this folder.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteFolder(folder.id) },
      ]
    );
  };

  const handleOpenFolder = (folder: Folder) => {
    navigation.navigate('ConversationList', { folderId: folder.id });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <FlatList
        data={folders}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <TouchableOpacity style={styles.createBtn} onPress={() => setShowModal(true)}>
            <Text style={styles.createBtnIcon}>＋</Text>
            <Text style={styles.createBtnText}>New Folder</Text>
          </TouchableOpacity>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.folderCard}
            onPress={() => handleOpenFolder(item)}
            onLongPress={() => handleDelete(item)}
            activeOpacity={0.7}
          >
            <View style={[styles.folderIcon, { backgroundColor: item.color + '33' }]}>
              <Text style={[styles.folderEmoji]}>📁</Text>
            </View>
            <View style={styles.folderInfo}>
              <Text style={styles.folderName}>{item.name}</Text>
              <Text style={styles.folderCount}>
                {getCount(item.id)} conversation{getCount(item.id) !== 1 ? 's' : ''}
              </Text>
            </View>
            <View style={[styles.folderDot, { backgroundColor: item.color }]} />
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📁</Text>
            <Text style={styles.emptyTitle}>No folders yet</Text>
            <Text style={styles.emptyHint}>Create folders to organize your conversations</Text>
          </View>
        }
      />

      {/* Create Folder Modal */}
      <Modal visible={showModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>New Folder</Text>
            <TextInput
              style={styles.modalInput}
              value={newFolderName}
              onChangeText={setNewFolderName}
              placeholder="Folder name..."
              placeholderTextColor={colors.textMuted}
              autoFocus
            />
            <Text style={styles.colorLabel}>Choose Color</Text>
            <View style={styles.colorRow}>
              {FOLDER_COLORS.map(color => (
                <TouchableOpacity
                  key={color}
                  style={[
                    styles.colorDot,
                    { backgroundColor: color },
                    selectedColor === color && styles.colorDotSelected,
                  ]}
                  onPress={() => setSelectedColor(color)}
                />
              ))}
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setShowModal(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.createActionBtn, !newFolderName.trim() && { opacity: 0.4 }]}
                onPress={handleCreate}
                disabled={!newFolderName.trim()}
              >
                <Text style={styles.createActionBtnText}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  list: { padding: spacing.lg },

  createBtn: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.bgSurface, borderRadius: radius.md,
    padding: spacing.md, marginBottom: spacing.md,
    borderWidth: 1, borderColor: colors.accent, borderStyle: 'dashed',
  },
  createBtnIcon: { color: colors.accent, fontSize: 20, marginRight: spacing.sm },
  createBtnText: { color: colors.accent, fontSize: typography.md, fontWeight: '600' },

  folderCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.bgSurface, borderRadius: radius.md,
    padding: spacing.md, marginBottom: spacing.sm,
    borderWidth: 1, borderColor: colors.border,
  },
  folderIcon: {
    width: 44, height: 44, borderRadius: radius.md,
    alignItems: 'center', justifyContent: 'center', marginRight: spacing.md,
  },
  folderEmoji: { fontSize: 22 },
  folderInfo: { flex: 1 },
  folderName: { color: colors.textPrimary, fontSize: typography.md, fontWeight: '600' },
  folderCount: { color: colors.textMuted, fontSize: typography.sm, marginTop: 2 },
  folderDot: { width: 10, height: 10, borderRadius: radius.full },

  empty: { alignItems: 'center', paddingTop: 60 },
  emptyIcon: { fontSize: 48, marginBottom: spacing.lg },
  emptyTitle: { color: colors.textSecondary, fontSize: typography.lg, fontWeight: '600' },
  emptyHint: { color: colors.textMuted, fontSize: typography.sm, textAlign: 'center', marginTop: spacing.sm },

  // Modal
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(5,10,20,0.9)',
    justifyContent: 'center', alignItems: 'center',
  },
  modalBox: {
    backgroundColor: colors.bgElevated, width: '85%',
    borderRadius: radius.lg, padding: spacing.xl,
    borderWidth: 1, borderColor: colors.border,
  },
  modalTitle: {
    color: colors.textPrimary, fontSize: typography.lg,
    fontWeight: '700', marginBottom: spacing.lg, textAlign: 'center',
  },
  modalInput: {
    backgroundColor: colors.bgSurface, borderRadius: radius.md,
    padding: spacing.md, color: colors.textPrimary,
    fontSize: typography.md, marginBottom: spacing.lg,
    borderWidth: 1, borderColor: colors.border,
  },
  colorLabel: { color: colors.textSecondary, fontSize: typography.sm, marginBottom: spacing.sm },
  colorRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.xl },
  colorDot: { width: 28, height: 28, borderRadius: radius.full },
  colorDotSelected: { borderWidth: 3, borderColor: '#fff' },
  modalActions: { flexDirection: 'row', gap: spacing.sm },
  cancelBtn: {
    flex: 1, padding: spacing.md, borderRadius: radius.md,
    backgroundColor: colors.bgSurface, alignItems: 'center',
    borderWidth: 1, borderColor: colors.border,
  },
  cancelBtnText: { color: colors.textSecondary, fontWeight: '600' },
  createActionBtn: {
    flex: 1, padding: spacing.md, borderRadius: radius.md,
    backgroundColor: colors.accent, alignItems: 'center',
  },
  createActionBtnText: { color: '#fff', fontWeight: '600' },
});
