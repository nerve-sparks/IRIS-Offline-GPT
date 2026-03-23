// src/services/conversationStore.ts
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ── Types ────────────────────────────────────────────────────────────────────
export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'assistant';
  timestamp: string;
  isStarred: boolean;
  isPinned: boolean;
}

export interface Conversation {
  id: string;
  title: string;
  folderId: string | null;
  isPinned: boolean;
  createdAt: string;
  messages: Message[];
}

export interface Folder {
  id: string;
  name: string;
  color: string;
  createdAt: string;
}

// ── Storage Key ──────────────────────────────────────────────────────────────
const STORAGE_KEY = '@iris_conversations';
const FOLDERS_KEY = '@iris_folders';

// ── In-memory State ──────────────────────────────────────────────────────────
let _conversations: Conversation[] = [
  {
    id: 'conv_1',
    title: 'Trip to Japan',
    folderId: null,
    isPinned: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    messages: [
      {
        id: 'msg_1a',
        text: 'Can you help me plan a 10-day trip to Japan?',
        sender: 'user',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
        isStarred: false,
        isPinned: false,
      },
      {
        id: 'msg_1b',
        text: "Absolutely! A 10-day itinerary could cover Tokyo, Kyoto, Osaka and a day trip to Nara. Want me to start with a day-by-day breakdown?",
        sender: 'assistant',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 47).toISOString(),
        isStarred: true,
        isPinned: true,
      },
    ],
  },
  {
    id: 'conv_2',
    title: 'React Native help',
    folderId: null,
    isPinned: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    messages: [
      {
        id: 'msg_2a',
        text: 'How do I use FlatList efficiently with large datasets?',
        sender: 'user',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
        isStarred: false,
        isPinned: false,
      },
      {
        id: 'msg_2b',
        text: 'Use getItemLayout to avoid dynamic measurement, set removeClippedSubviews to true, and control windowSize to limit off-screen rendering.',
        sender: 'assistant',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
        isStarred: false,
        isPinned: false,
      },
    ],
  },
  {
    id: 'conv_3',
    title: 'Weekly meal prep ideas',
    folderId: 'folder_1',
    isPinned: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
    messages: [
      {
        id: 'msg_3a',
        text: 'Give me 5 healthy meal prep ideas for the week',
        sender: 'user',
        timestamp: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
        isStarred: false,
        isPinned: false,
      },
      {
        id: 'msg_3b',
        text: 'Here are 5 ideas: Quinoa Bowls, Sheet-pan chicken, Overnight oats, Lentil soup, and Greek salad jars!',
        sender: 'assistant',
        timestamp: new Date(Date.now() - 1000 * 60 * 19).toISOString(),
        isStarred: false,
        isPinned: false,
      },
    ],
  },
];

let _folders: Folder[] = [
  {
    id: 'folder_1',
    name: 'Recipes',
    color: '#2563EB',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'folder_2',
    name: 'Work',
    color: '#7C3AED',
    createdAt: new Date().toISOString(),
  },
];

let _listeners: Array<(convs: Conversation[]) => void> = [];
let _folderListeners: Array<(folders: Folder[]) => void> = [];

const normalizeMessage = (message: Message): Message => ({
  ...message,
  isStarred: !!message.isStarred,
  isPinned: !!message.isPinned,
});

const normalizeConversation = (conversation: Conversation): Conversation => ({
  ...conversation,
  isPinned: !!conversation.isPinned,
  messages: (conversation.messages || []).map(normalizeMessage),
});

// ── Notify ───────────────────────────────────────────────────────────────────
const notify = () => _listeners.forEach(fn => fn([..._conversations]));
const notifyFolders = () => _folderListeners.forEach(fn => fn([..._folders]));

// ── Persist ──────────────────────────────────────────────────────────────────
const persist = async () => {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(_conversations));
  } catch (e) {
    console.error('Failed to save conversations:', e);
  }
};

const persistFolders = async () => {
  try {
    await AsyncStorage.setItem(FOLDERS_KEY, JSON.stringify(_folders));
  } catch (e) {
    console.error('Failed to save folders:', e);
  }
};

// ── Load from storage ────────────────────────────────────────────────────────
export const loadStore = async () => {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) _conversations = JSON.parse(raw).map(normalizeConversation);
    const rawFolders = await AsyncStorage.getItem(FOLDERS_KEY);
    if (rawFolders) _folders = JSON.parse(rawFolders);
  } catch (e) {
    console.error('Failed to load store:', e);
  }
};

// ── Getters ──────────────────────────────────────────────────────────────────
export const getConversations = () => [..._conversations];
export const getConversation = (id: string) => _conversations.find(c => c.id === id) || null;
export const getFolders = () => [..._folders];

// ── Conversation Actions ──────────────────────────────────────────────────────
export const createConversation = (folderId: string | null = null): Conversation => {
  const conv: Conversation = {
    id: `conv_${Date.now()}`,
    title: 'New Conversation',
    folderId,
    isPinned: false,
    createdAt: new Date().toISOString(),
    messages: [],
  };
  _conversations = [conv, ..._conversations];
  notify();
  persist();
  return conv;
};

export const addMessage = (
  conversationId: string,
  text: string,
  sender: 'user' | 'assistant' = 'user'
): Message => {
  const msg: Message = {
    id: `msg_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    text,
    sender,
    timestamp: new Date().toISOString(),
    isStarred: false,
    isPinned: false,
  };
  _conversations = _conversations.map(c => {
    if (c.id !== conversationId) return c;
    const messages = [...c.messages, msg];
    const title =
      c.messages.length === 0 && sender === 'user' ? text.slice(0, 40) : c.title;
    return { ...c, title, messages };
  });
  notify();
  persist();
  return msg;
};

export const deleteConversation = (id: string) => {
  _conversations = _conversations.filter(c => c.id !== id);
  notify();
  persist();
};

export const togglePin = (id: string) => {
  _conversations = _conversations.map(c =>
    c.id === id ? { ...c, isPinned: !c.isPinned } : c
  );
  notify();
  persist();
};

export const toggleStarMessage = (conversationId: string, messageId: string) => {
  _conversations = _conversations.map(c => {
    if (c.id !== conversationId) return c;
    const messages = c.messages.map(m =>
      m.id === messageId ? { ...m, isStarred: !m.isStarred } : m
    );
    return { ...c, messages };
  });
  notify();
  persist();
};

export const togglePinMessage = (conversationId: string, messageId: string) => {
  _conversations = _conversations.map(c => {
    if (c.id !== conversationId) return c;
    const messages = c.messages.map(m =>
      m.id === messageId ? { ...m, isPinned: !m.isPinned } : m
    );
    return { ...c, messages };
  });
  notify();
  persist();
};

export const moveToFolder = (conversationId: string, folderId: string | null) => {
  _conversations = _conversations.map(c =>
    c.id === conversationId ? { ...c, folderId } : c
  );
  notify();
  persist();
};

export const exportConversation = (conversationId: string, format: 'json' | 'markdown' | 'text'): string => {
  const conv = getConversation(conversationId);
  if (!conv) return '';

  if (format === 'json') {
    return JSON.stringify(conv, null, 2);
  }

  if (format === 'markdown') {
    let md = `# ${conv.title}\n\n`;
    conv.messages.forEach(m => {
      const pinned = m.isPinned ? ' [Pinned]' : '';
      md += `**${m.sender === 'user' ? 'You' : 'IRIS'}${pinned}:** ${m.text}\n\n`;
    });
    return md;
  }

  // plain text
  let txt = `${conv.title}\n${'='.repeat(conv.title.length)}\n\n`;
  conv.messages.forEach(m => {
    const pinned = m.isPinned ? ' [Pinned]' : '';
    txt += `${m.sender === 'user' ? 'You' : 'IRIS'}${pinned}: ${m.text}\n\n`;
  });
  return txt;
};

// ── Folder Actions ────────────────────────────────────────────────────────────
export const createFolder = (name: string, color: string): Folder => {
  const folder: Folder = {
    id: `folder_${Date.now()}`,
    name,
    color,
    createdAt: new Date().toISOString(),
  };
  _folders = [..._folders, folder];
  notifyFolders();
  persistFolders();
  return folder;
};

export const deleteFolder = (id: string) => {
  _folders = _folders.filter(f => f.id !== id);
  // Move conversations out of deleted folder
  _conversations = _conversations.map(c =>
    c.folderId === id ? { ...c, folderId: null } : c
  );
  notify();
  notifyFolders();
  persist();
  persistFolders();
};

// ── Subscribe ─────────────────────────────────────────────────────────────────
export const subscribe = (fn: (convs: Conversation[]) => void) => {
  _listeners.push(fn);
  return () => { _listeners = _listeners.filter(l => l !== fn); };
};

export const subscribeFolders = (fn: (folders: Folder[]) => void) => {
  _folderListeners.push(fn);
  return () => { _folderListeners = _folderListeners.filter(l => l !== fn); };
};

// ── Hooks ─────────────────────────────────────────────────────────────────────
export const useConversations = () => {
  const [conversations, setConversations] = useState<Conversation[]>(getConversations());
  useEffect(() => subscribe(setConversations), []);
  return conversations;
};

export const useConversation = (id: string) => {
  const convs = useConversations();
  return convs.find(c => c.id === id) || null;
};

export const useFolders = () => {
  const [folders, setFolders] = useState<Folder[]>(getFolders());
  useEffect(() => subscribeFolders(setFolders), []);
  return folders;
};

// ── Search ────────────────────────────────────────────────────────────────────
export const searchConversations = (query: string): Conversation[] => {
  if (!query.trim()) return getConversations();
  const q = query.toLowerCase();
  return _conversations.filter(c =>
    c.title.toLowerCase().includes(q) ||
    c.messages.some(m => m.text.toLowerCase().includes(q))
  );
};

// ── Simulated AI Reply ────────────────────────────────────────────────────────
const aiReplies = [
  "That's a great question! Let me think through this carefully for you.",
  "I understand what you're looking for. Here's my perspective on this...",
  "Interesting! Based on what you've shared, I'd suggest the following approach.",
  "Sure thing! I can definitely help with that. Here's what I'd recommend.",
  "Let me break that down for you in a clear and structured way.",
];

export const simulateAIReply = async (conversationId: string): Promise<Message> => {
  await new Promise(r => setTimeout(r, 900 + Math.random() * 600));
  const reply = aiReplies[Math.floor(Math.random() * aiReplies.length)];
  return addMessage(conversationId, reply, 'assistant');
};
