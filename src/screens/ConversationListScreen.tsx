// src/screens/ConversationListScreen.tsx
import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, SafeAreaView, Alert, TextInput,
  StatusBar, ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import {
  useConversations, useFolders, deleteConversation,
  togglePin, createConversation, searchConversations,
  Conversation,
} from '../services/conversationStore';
import { showConversationExportMenu } from '../services/conversationExport';
import { colors, spacing, radius, typography } from '../theme/irisTheme';
import ConversationItem from '../components/conversation/ConversationItem';

export default function ConversationListScreen() {
  const navigation = useNavigation<any>();
  const conversations = useConversations();
  const folders = useFolders();
  const [query, setQuery] = useState('');
  const [activeFolder, setActiveFolder] = useState<string | null>(null);
  const [showSearch, setShowSearch] = useState(false);

  const getFiltered = useCallback(() => {
    let list = query.trim() ? searchConversations(query) : conversations;
    if (activeFolder !== null) {
      list = list.filter(c => c.folderId === activeFolder);
    }
    return list;
  }, [conversations, query, activeFolder]);

  const pinned = getFiltered().filter(c => c.isPinned);
  const unpinned = getFiltered().filter(c => !c.isPinned);

  const handleOpen = (conv: Conversation) => {
    navigation.navigate('ConversationChat', { conversationId: conv.id });
  };

  const handleLongPress = (conv: Conversation) => {
    Alert.alert(conv.title, 'Choose an action', [
      { text: conv.isPinned ? 'Unpin' : 'Pin', onPress: () => togglePin(conv.id) },
      { text: 'Export', onPress: () => showConversationExportMenu(conv) },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => Alert.alert('Delete', 'This cannot be undone.', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: () => deleteConversation(conv.id) },
        ]),
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleNewChat = () => {
    const conv = createConversation(activeFolder);
    navigation.navigate('ConversationChat', { conversationId: conv.id });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />

      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>IRIS</Text>
          <Text style={styles.headerSub}>Conversations</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => setShowSearch(!showSearch)}
          >
            <Text style={styles.iconText}>⌕</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => navigation.navigate('FoldersScreen')}
          >
            <Text style={styles.iconText}>📁</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.newBtn}
            onPress={handleNewChat}
            activeOpacity={0.7}
          >
            <Text style={styles.newBtnText}>＋</Text>
          </TouchableOpacity>
        </View>
      </View>

      {showSearch && (
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>⌕</Text>
          <TextInput
            style={styles.searchInput}
            value={query}
            onChangeText={setQuery}
            placeholder="Search conversations..."
            placeholderTextColor={colors.textMuted}
            autoFocus
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')}>
              <Text style={styles.clearBtn}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.folderTabs}
        contentContainerStyle={styles.folderTabsContent}
      >
        <TouchableOpacity
          style={[styles.folderTab, activeFolder === null && styles.folderTabActive]}
          onPress={() => setActiveFolder(null)}
        >
          <Text style={[styles.folderTabText, activeFolder === null && styles.folderTabTextActive]}>
            All
          </Text>
        </TouchableOpacity>
        {folders.map(folder => (
          <TouchableOpacity
            key={folder.id}
            style={[
              styles.folderTab,
              activeFolder === folder.id && styles.folderTabActive,
              activeFolder === folder.id && { borderColor: folder.color },
            ]}
            onPress={() => setActiveFolder(activeFolder === folder.id ? null : folder.id)}
          >
            <View style={[styles.folderDot, { backgroundColor: folder.color }]} />
            <Text style={[styles.folderTabText, activeFolder === folder.id && styles.folderTabTextActive]}>
              {folder.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {pinned.length > 0 && (
        <>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>📌</Text>
            <Text style={styles.sectionLabel}>PINNED</Text>
          </View>
          {pinned.map(conv => (
            <ConversationItem
              key={conv.id}
              conversation={conv}
              searchQuery={query}
              onPress={handleOpen}
              onLongPress={handleLongPress}
            />
          ))}
        </>
      )}

      {pinned.length > 0 && unpinned.length > 0 && (
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>RECENT</Text>
        </View>
      )}

      <FlatList
        data={unpinned}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <ConversationItem
            conversation={item}
            searchQuery={query}
            onPress={handleOpen}
            onLongPress={handleLongPress}
          />
        )}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          pinned.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>💬</Text>
              <Text style={styles.emptyTitle}>
                {query ? 'No results found' : 'No conversations yet'}
              </Text>
              <Text style={styles.emptyHint}>
                {query ? 'Try different keywords' : 'Tap + to start chatting with IRIS'}
              </Text>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg, paddingBottom: spacing.md,
  },
  headerTitle: {
    color: colors.textPrimary, fontSize: typography.xxxl,
    fontWeight: '300', letterSpacing: 2,
  },
  headerSub: {
    color: colors.accent, fontSize: typography.xs,
    letterSpacing: 1.5, marginTop: 2,
  },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  iconBtn: {
    width: 36, height: 36, borderRadius: radius.full,
    backgroundColor: colors.bgSurface, alignItems: 'center', justifyContent: 'center',
  },
  iconText: { fontSize: 18, color: colors.textSecondary },
  newBtn: {
    width: 36, height: 36, borderRadius: radius.full,
    backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center',
  },
  newBtnText: { color: '#FFF', fontSize: 20, lineHeight: 24 },
  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.bgSurface, borderRadius: radius.md,
    marginHorizontal: spacing.lg, marginBottom: spacing.md,
    paddingHorizontal: spacing.md, height: 44,
    borderWidth: 1, borderColor: colors.border,
  },
  searchIcon: { color: colors.textMuted, fontSize: 18, marginRight: spacing.sm },
  searchInput: { flex: 1, color: colors.textPrimary, fontSize: typography.md },
  clearBtn: { color: colors.textMuted, fontSize: 14, padding: spacing.xs },
  folderTabs: { maxHeight: 44, marginBottom: spacing.sm },
  folderTabsContent: { paddingHorizontal: spacing.lg, gap: spacing.sm, alignItems: 'center' },
  folderTab: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.md, paddingVertical: spacing.xs + 2,
    borderRadius: radius.full, backgroundColor: colors.bgSurface,
    borderWidth: 1, borderColor: colors.border,
  },
  folderTabActive: { borderColor: colors.accent, backgroundColor: colors.accentSoft },
  folderTabText: { color: colors.textMuted, fontSize: typography.sm },
  folderTabTextActive: { color: colors.accent, fontWeight: '600' },
  folderDot: { width: 8, height: 8, borderRadius: radius.full, marginRight: spacing.xs },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.lg, paddingVertical: spacing.xs,
    gap: spacing.xs,
  },
  sectionIcon: { fontSize: 12 },
  sectionLabel: {
    color: colors.textMuted, fontSize: typography.xs,
    fontWeight: '600', letterSpacing: 1,
  },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyIcon: { fontSize: 48, marginBottom: spacing.lg },
  emptyTitle: {
    color: colors.textSecondary, fontSize: typography.lg,
    fontWeight: '600', marginBottom: spacing.sm,
  },
  emptyHint: {
    color: colors.textMuted, fontSize: typography.sm,
    textAlign: 'center', paddingHorizontal: spacing.xxl,
  },
});
