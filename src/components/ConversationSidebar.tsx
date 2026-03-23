// src/components/ConversationSidebar.tsx
import React, { useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, FlatList, StyleSheet,
  Animated, Dimensions, TouchableWithoutFeedback, TextInput,
  StatusBar, Alert, Modal, ScrollView,
} from 'react-native';
import {
  useConversations, useFolders,
  createConversation, deleteConversation,
  togglePin, moveToFolder, createFolder,
  Conversation,
} from '../services/conversationStore';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DRAWER_WIDTH = SCREEN_WIDTH * 0.82;

const FOLDER_COLORS = [
  '#2563EB', '#7C3AED', '#DB2777', '#DC2626',
  '#D97706', '#059669', '#0891B2', '#4F46E5',
];

interface Props {
  visible: boolean;
  onClose: () => void;
  onSelectConversation: (conv: Conversation) => void;
  onNewChat: (folderId?: string | null) => void;
}

const formatDate = (iso: string) => {
  const d = new Date(iso);
  const diffDays = Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return d.toLocaleDateString([], { weekday: 'long' });
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

export default function ConversationSidebar({ visible, onClose, onSelectConversation, onNewChat }: Props) {
  const conversations = useConversations();
  const folders = useFolders();
  const slideAnim = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;

  const [query, setQuery] = React.useState('');
  const [activeFolder, setActiveFolder] = React.useState<string | null>(null);
  const [isMounted, setIsMounted] = React.useState(false);

  // New folder modal state
  const [showFolderModal, setShowFolderModal] = React.useState(false);
  const [newFolderName, setNewFolderName] = React.useState('');
  const [selectedColor, setSelectedColor] = React.useState(FOLDER_COLORS[0]);

  useEffect(() => {
    if (visible) {
      setIsMounted(true);
      Animated.parallel([
        Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 65, friction: 11 }),
        Animated.timing(overlayAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.spring(slideAnim, { toValue: -DRAWER_WIDTH, useNativeDriver: true, tension: 65, friction: 11 }),
        Animated.timing(overlayAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start(({ finished }) => {
        if (finished) setIsMounted(false);
      });
    }
  }, [visible]);

  // Filter conversations by search + active folder
  const filtered = React.useMemo(() => {
    let list = conversations;
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(c =>
        c.title.toLowerCase().includes(q) ||
        c.messages.some(m => m.text.toLowerCase().includes(q))
      );
    }
    if (activeFolder !== null) {
      list = list.filter(c => c.folderId === activeFolder);
    }
    return list;
  }, [conversations, query, activeFolder]);

  const pinned = filtered.filter(c => c.isPinned);
  const recent = filtered.filter(c => !c.isPinned);

  const handleNewChat = () => {
    onClose();
    setTimeout(() => onNewChat(activeFolder), 300);
  };

  const handleSelect = (conv: Conversation) => {
    onClose();
    setTimeout(() => onSelectConversation(conv), 300);
  };

  const handleLongPress = (conv: Conversation) => {
    const folderOptions = folders.map(f => ({
      text: `📁 ${f.name}`,
      onPress: () => moveToFolder(conv.id, f.id),
    }));

    Alert.alert(
      conv.title,
      'What would you like to do?',
      [
        {
          text: conv.isPinned ? '📌 Unpin' : '📌 Pin',
          onPress: () => togglePin(conv.id),
        },
        {
          text: '📂 Move to Folder',
          onPress: () => {
            const moveOptions = [
              ...folderOptions,
              { text: '🗂 No Folder', onPress: () => moveToFolder(conv.id, null) },
              { text: 'Cancel', style: 'cancel' as const },
            ];
            Alert.alert('Move to Folder', 'Select a folder:', moveOptions);
          },
        },
        {
          text: '🗑 Delete',
          style: 'destructive' as const,
          onPress: () => {
            Alert.alert('Delete Conversation', 'This cannot be undone.', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Delete', style: 'destructive', onPress: () => deleteConversation(conv.id) },
            ]);
          },
        },
        { text: 'Cancel', style: 'cancel' as const },
      ]
    );
  };

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) return;
    createFolder(newFolderName.trim(), selectedColor);
    setNewFolderName('');
    setSelectedColor(FOLDER_COLORS[0]);
    setShowFolderModal(false);
  };

  if (!visible && !isMounted) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {/* Dim overlay */}
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View style={[styles.overlay, { opacity: overlayAnim }]} />
      </TouchableWithoutFeedback>

      {/* Sidebar drawer */}
      <Animated.View style={[styles.drawer, { transform: [{ translateX: slideAnim }] }]}>

        {/* ── Search bar ── */}
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>⌕</Text>
          <TextInput
            style={styles.searchInput}
            value={query}
            onChangeText={setQuery}
            placeholder="Search conversations..."
            placeholderTextColor="#4a5568"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')}>
              <Text style={styles.clearBtn}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ── New chat ── */}
        <TouchableOpacity style={styles.newChatRow} onPress={handleNewChat} activeOpacity={0.7}>
          <View style={styles.newChatIconWrap}>
            <Text style={styles.newChatPlus}>＋</Text>
          </View>
          <Text style={styles.newChatText}>
            New chat{activeFolder ? ` in ${folders.find(f => f.id === activeFolder)?.name}` : ''}
          </Text>
        </TouchableOpacity>

        <View style={styles.divider} />

        {/* ── Folders Section ── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>FOLDERS</Text>
          <TouchableOpacity onPress={() => setShowFolderModal(true)} style={styles.addFolderBtn}>
            <Text style={styles.addFolderText}>＋ New</Text>
          </TouchableOpacity>
        </View>

        {/* Folder chips — horizontal scroll */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.chipScroll}
          contentContainerStyle={styles.chipRow}
        >
          {/* All chip */}
          <TouchableOpacity
            style={[styles.chip, activeFolder === null && styles.chipActive]}
            onPress={() => setActiveFolder(null)}
          >
            <Text style={[styles.chipText, activeFolder === null && styles.chipTextActive]}>
              All
            </Text>
          </TouchableOpacity>

          {folders.map(folder => (
            <TouchableOpacity
              key={folder.id}
              style={[
                styles.chip,
                activeFolder === folder.id && styles.chipActive,
                activeFolder === folder.id && { borderColor: folder.color },
              ]}
              onPress={() => setActiveFolder(activeFolder === folder.id ? null : folder.id)}
            >
              <View style={[styles.chipDot, { backgroundColor: folder.color }]} />
              <Text style={[styles.chipText, activeFolder === folder.id && { color: folder.color }]}>
                {folder.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {folders.length === 0 && (
          <TouchableOpacity style={styles.emptyFolders} onPress={() => setShowFolderModal(true)}>
            <Text style={styles.emptyFoldersText}>📁 Tap "+ New" to create a folder</Text>
          </TouchableOpacity>
        )}

        <View style={styles.divider} />

        {/* ── Conversation List ── */}
        <FlatList
          data={[
            ...(pinned.length > 0 ? [{ type: 'header', label: '📌 Pinned', id: '__pin__' }] : []),
            ...pinned,
            ...(recent.length > 0 ? [{ type: 'header', label: 'Recent', id: '__recent__' }] : []),
            ...recent,
          ]}
          keyExtractor={(item: any) => item.id}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }: any) => {
            if (item.type === 'header') {
              return <Text style={styles.listSectionLabel}>{item.label}</Text>;
            }
            const folder = folders.find(f => f.id === item.folderId);
            return (
              <TouchableOpacity
                style={styles.convRow}
                onPress={() => handleSelect(item)}
                onLongPress={() => handleLongPress(item)}
                activeOpacity={0.7}
              >
                <View style={styles.convContent}>
                  <Text style={styles.convTitle} numberOfLines={1}>{item.title}</Text>
                  <View style={styles.convMeta}>
                    <Text style={styles.convDate}>{formatDate(item.createdAt)}</Text>
                    {folder && (
                      <View style={[styles.folderBadge, { borderColor: folder.color }]}>
                        <View style={[styles.folderBadgeDot, { backgroundColor: folder.color }]} />
                        <Text style={[styles.folderBadgeText, { color: folder.color }]}>{folder.name}</Text>
                      </View>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>
                {query ? 'No results found' : 'No conversations yet'}
              </Text>
            </View>
          }
        />

        {/* ── Bottom user row ── */}
        <View style={styles.bottomRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>I</Text>
          </View>
          <Text style={styles.bottomText}>IRIS AI</Text>
        </View>
      </Animated.View>

      {/* ── New Folder Modal ── */}
      <Modal visible={showFolderModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>New Folder</Text>
            <TextInput
              style={styles.modalInput}
              value={newFolderName}
              onChangeText={setNewFolderName}
              placeholder="Folder name..."
              placeholderTextColor="#4a5568"
              autoFocus
            />
            <Text style={styles.colorLabel}>Choose colour</Text>
            <View style={styles.colorRow}>
              {FOLDER_COLORS.map(color => (
                <TouchableOpacity
                  key={color}
                  style={[styles.colorDot, { backgroundColor: color }, selectedColor === color && styles.colorDotSelected]}
                  onPress={() => setSelectedColor(color)}
                />
              ))}
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => { setShowFolderModal(false); setNewFolderName(''); }}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.createBtn, !newFolderName.trim() && { opacity: 0.4 }]}
                onPress={handleCreateFolder}
                disabled={!newFolderName.trim()}
              >
                <Text style={styles.createBtnText}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  drawer: {
    position: 'absolute',
    left: 0, top: 0, bottom: 0,
    width: DRAWER_WIDTH,
    backgroundColor: '#0d1117',
    paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight + 12 : 44,
    paddingBottom: 0,
  },

  // Search
  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#1a2233', borderRadius: 10,
    marginHorizontal: 16, marginBottom: 10,
    paddingHorizontal: 12, height: 40,
  },
  searchIcon: { color: '#4a5568', fontSize: 18, marginRight: 6 },
  searchInput: { flex: 1, color: '#ffffff', fontSize: 14 },
  clearBtn: { color: '#4a5568', fontSize: 12, padding: 4 },

  // New chat
  newChatRow: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 16, marginBottom: 12,
    backgroundColor: '#1a2233', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 11,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  newChatIconWrap: {
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: '#2563EB', alignItems: 'center', justifyContent: 'center',
    marginRight: 10,
  },
  newChatPlus: { color: '#fff', fontSize: 16, lineHeight: 20 },
  newChatText: { color: '#ffffff', fontSize: 14, fontWeight: '500' },

  divider: { height: 1, backgroundColor: '#1e293b', marginHorizontal: 16, marginBottom: 10 },

  // Folders section
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, marginBottom: 8,
  },
  sectionLabel: {
    color: '#4a5568', fontSize: 10, fontWeight: '700', letterSpacing: 1.2,
  },
  addFolderBtn: {
    backgroundColor: '#1a2233', borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 4,
    borderWidth: 1, borderColor: '#2563EB',
  },
  addFolderText: { color: '#2563EB', fontSize: 11, fontWeight: '600' },

  // Folder chips
  chipScroll: { maxHeight: 38, marginBottom: 8 },
  chipRow: { paddingHorizontal: 16, gap: 8, alignItems: 'center' },
  chip: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingVertical: 5,
    borderRadius: 16, backgroundColor: '#1a2233',
    borderWidth: 1, borderColor: '#2d3748',
  },
  chipActive: { borderColor: '#2563EB', backgroundColor: 'rgba(37,99,235,0.12)' },
  chipDot: { width: 7, height: 7, borderRadius: 4, marginRight: 5 },
  chipText: { color: '#6b7280', fontSize: 12, fontWeight: '500' },
  chipTextActive: { color: '#2563EB', fontWeight: '600' },

  emptyFolders: { alignItems: 'center', paddingVertical: 6, paddingHorizontal: 16, marginBottom: 8 },
  emptyFoldersText: { color: '#4a5568', fontSize: 12 },

  // List section labels
  listSectionLabel: {
    color: '#4a5568', fontSize: 10, fontWeight: '700', letterSpacing: 1,
    paddingHorizontal: 16, paddingTop: 10, paddingBottom: 4,
    textTransform: 'uppercase',
  },

  // Conversation row
  convRow: { paddingHorizontal: 16, paddingVertical: 9 },
  convContent: {},
  convTitle: { color: '#e2e8f0', fontSize: 14, fontWeight: '400', marginBottom: 3 },
  convMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  convDate: { color: '#4a5568', fontSize: 11 },
  folderBadge: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 5, borderWidth: 1,
    paddingHorizontal: 6, paddingVertical: 1,
  },
  folderBadgeDot: { width: 5, height: 5, borderRadius: 3, marginRight: 4 },
  folderBadgeText: { fontSize: 10, fontWeight: '500' },

  // Empty
  empty: { padding: 24, alignItems: 'center' },
  emptyText: { color: '#4a5568', fontSize: 14 },

  // Bottom
  bottomRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 12, paddingBottom: 20,
    borderTopWidth: 1, borderTopColor: '#1e293b', gap: 12,
  },
  avatar: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#2563EB', alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: '#ffffff', fontSize: 14, fontWeight: '700' },
  bottomText: { color: '#e2e8f0', fontSize: 14, fontWeight: '500' },

  // New Folder Modal
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(5,10,20,0.85)',
    justifyContent: 'center', alignItems: 'center',
  },
  modalBox: {
    backgroundColor: '#161d2b', width: '85%',
    borderRadius: 16, padding: 24,
    borderWidth: 1, borderColor: '#1e293b',
  },
  modalTitle: {
    color: '#ffffff', fontSize: 17, fontWeight: '700',
    textAlign: 'center', marginBottom: 16,
  },
  modalInput: {
    backgroundColor: '#0d1117', borderRadius: 10,
    padding: 12, color: '#ffffff',
    fontSize: 14, marginBottom: 16,
    borderWidth: 1, borderColor: '#2d3748',
  },
  colorLabel: { color: '#6b7280', fontSize: 12, marginBottom: 10 },
  colorRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  colorDot: { width: 28, height: 28, borderRadius: 14 },
  colorDotSelected: { borderWidth: 3, borderColor: '#fff' },
  modalActions: { flexDirection: 'row', gap: 10 },
  cancelBtn: {
    flex: 1, paddingVertical: 12, borderRadius: 10,
    backgroundColor: '#1a2233', alignItems: 'center',
    borderWidth: 1, borderColor: '#2d3748',
  },
  cancelBtnText: { color: '#6b7280', fontWeight: '600', fontSize: 14 },
  createBtn: {
    flex: 1, paddingVertical: 12, borderRadius: 10,
    backgroundColor: '#2563EB', alignItems: 'center',
  },
  createBtnText: { color: '#ffffff', fontWeight: '700', fontSize: 14 },
});
