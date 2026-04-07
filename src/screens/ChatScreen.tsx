import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet,
  KeyboardAvoidingView, Platform, Keyboard, Image, ToastAndroid, NativeModules,
  Dimensions, Alert, TouchableWithoutFeedback, ActivityIndicator,
  Modal, Animated, Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useIsFocused } from '@react-navigation/native';
import RNFS from 'react-native-fs';
import ReactNativeBlobUtil from 'react-native-blob-util';
import { initLlama } from 'llama.rn';
import Voice, { SpeechResultsEvent } from '@react-native-voice/voice';
import Tts from 'react-native-tts';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Markdown from 'react-native-markdown-display';
import Clipboard from '@react-native-clipboard/clipboard';
import Svg, { Path } from 'react-native-svg';
import { ALL_MODELS, downloadModel, IrisModel } from '../services/ModelService';
import IrisSidebar from '../components/IrisSidebar';
import MessageBubble from '../components/conversation/MessageBubble';
import EditMessageModal from '../components/conversation/EditMessageModal';
import TypingIndicator from '../components/conversation/TypingIndicator';
import {
  Conversation,
  createConversation,
  addMessage as storeAddMessage,
  toggleStarMessage,
  togglePinMessage,
  togglePin,
  getConversation,
  addMessageVariant,
  setActiveVariant,
  editUserMessage,
  forkConversation,
  exportConversation as buildConversationExport,
} from '../services/conversationStore';
import { exportConversationAsPdf } from '../services/pdfExport';
import { useIncognito } from '../services/incognitoContext';
import { addTempMessage, endTempSession } from '../services/tempChatStore';

// ── Inline HTML builder ───────────────────────────────────────────────────────
const buildConversationFile = async (conv: Conversation): Promise<string> => {
  const rows = conv.messages.map(m => {
    const sender = m.sender === 'user' ? 'You' : 'IRIS';
    const ts = new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const badge = [m.isPinned ? '[Pinned]' : '', m.isStarred ? '[Starred]' : ''].filter(Boolean).join(' ');
    const bg = m.sender === 'user' ? '#1e293b' : '#0f172a';
    const align = m.sender === 'user' ? 'right' : 'left';
    return `<div style="margin:8px 0;text-align:${align}">
      <div style="display:inline-block;max-width:80%;background:${bg};border-radius:12px;padding:10px 14px">
        <div style="font-size:11px;color:#94a3b8;margin-bottom:4px">${sender} · ${ts}${badge ? ' · ' + badge : ''}</div>
        <div style="font-size:14px;color:#e2e8f0;white-space:pre-wrap">${m.text.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
      </div></div>`;
  }).join('\n');

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
<title>${conv.title}</title>
<style>body{font-family:sans-serif;background:#050a14;padding:24px;max-width:700px;margin:0 auto}
h1{color:#fff;font-size:20px;margin-bottom:4px}
.sub{color:#64748b;font-size:12px;margin-bottom:24px}
</style></head><body>
<h1>${conv.title}</h1>
<div class="sub">Exported from IRIS · ${new Date().toLocaleString()}</div>
${rows}
</body></html>`;

  const safeTitle = conv.title.replace(/[^a-z0-9]/gi, '_').slice(0, 30);
  const filePath = `${RNFS.CachesDirectoryPath}/iris_${safeTitle}_${Date.now()}.html`;
  await RNFS.writeFile(filePath, html, 'utf8');
  return filePath;
};

const buildTextExportFile = async (
  title: string,
  content: string,
  extension: 'json' | 'md' | 'txt'
): Promise<string> => {
  const safeTitle = title.replace(/[^a-z0-9]/gi, '_').slice(0, 30) || 'conversation';
  const fileName = `iris_${safeTitle}_${Date.now()}.${extension}`;
  const tempDir = RNFS.CachesDirectoryPath || RNFS.DocumentDirectoryPath;
  const tempPath = `${tempDir}/${fileName}`;
  await RNFS.writeFile(tempPath, content, 'utf8');

  if (Platform.OS === 'android') {
    const mimeType =
      extension === 'json' ? 'application/json' :
      extension === 'md'   ? 'text/markdown' :
                             'text/plain';
    const uri = await ReactNativeBlobUtil.MediaCollection.copyToMediaStore(
      { name: fileName, parentFolder: 'IRIS', mimeType },
      'Download',
      tempPath
    );
    return uri;
  }
  return tempPath;
};

// ── Types ─────────────────────────────────────────────────────────────────────
interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp?: string;
  isStarred?: boolean;
  isPinned?: boolean;
  parentId?: string;
  variants?: Array<{ id: string; text: string; timestamp: string }>;
  activeVariantIndex?: number;
  editedFrom?: string;
}

const PROMPTS = [
  "Explain how to develop a consistent reading habit.",
  "Write an email to your manager requesting leave for a day.",
  "Suggest time management strategies for handling multiple deadlines effectively.",
  "Draft a professional LinkedIn message to connect with a recruiter.",
];

const INFO_ITEMS = [
  "Explains complex topics simply.",
  "May sometimes be inaccurate.",
  "Unable to provide current affairs due to no internet connectivity.",
  "Long Press on messages to report.",
];

// ── Component ─────────────────────────────────────────────────────────────────
export default function ChatScreen({ navigation }: any) {
  const { isIncognito, toggleIncognito } = useIncognito();
  const hasVoiceNativeModule = !!NativeModules.Voice;

  // Core state
  const [inputText, setInputText]                   = useState('');
  const [messages, setMessages]                     = useState<Message[]>([]);
  const [needsModel, setNeedsModel]                 = useState(false);
  const [downloading, setDownloading]               = useState<{ [key: string]: boolean }>({});
  const [progresses, setProgresses]                 = useState<{ [key: string]: number }>({});
  const [llamaContext, setLlamaContext]             = useState<any>(null);
  const [currentLoadedPath, setCurrentLoadedPath]   = useState<string | null>(null);
  const [isGenerating, setIsGenerating]             = useState(false);
  const [isListening, setIsListening]               = useState(false);
  const [currentActiveModel, setCurrentActiveModel] = useState('No active model');
  const [engineError, setEngineError]               = useState<string | null>(null);

  // UI state
  const [isSidebarOpen, setIsSidebarOpen]           = useState(false);
  const [editingMessage, setEditingMessage]         = useState<{ id: string; text: string } | null>(null);
  const [regeneratingMsgId, setRegeneratingMsgId]   = useState<string | null>(null);
  const [isExportSheetOpen, setIsExportSheetOpen]   = useState(false);
  const [isKeyboardVisible, setKeyboardVisible]     = useState(false);

  // Engine loading animation
  const [isEngineLoading, setIsEngineLoading]       = useState(true);
  const [loadingModelName, setLoadingModelName]     = useState('Iris Engine');
  const loadingAnim                                  = useRef(new Animated.Value(0)).current;

  // Refs
  const isFocused              = useIsFocused();
  const flatListRef            = useRef<FlatList>(null);
  const isTtsReadyRef          = useRef(false);
  const activeConversationId   = useRef<string | null>(null);
  const pendingFolderId        = useRef<string | null>(null);

  // ── TTS helpers ─────────────────────────────────────────────────────────────
  const stopSpeaking = async () => {
    if (!isTtsReadyRef.current) return;
    try { await Tts.stop(false); } catch {} // false = iOS fix (from master branch)
  };

  const speakText = async (text: string) => {
    const cleaned = text.replace(/<[^>]*>?/gm, '').trim();
    if (!cleaned || !isTtsReadyRef.current) return;
    try { await Tts.speak(cleaned); } catch {}
  };

  const describeEngineError = (error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes('Missing JSI bindings')) {
      return 'AI engine native module is unavailable. Clean and rebuild the Android app.';
    }
    return message;
  };

  // ── Effects ──────────────────────────────────────────────────────────────────

  // Reset on incognito change
  useEffect(() => {
    if (!isIncognito) {
      activeConversationId.current = null;
      setMessages([]);
      setInputText('');
    }
  }, [isIncognito]);

  // Keyboard visibility
  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSub = Keyboard.addListener(showEvent, () => setKeyboardVisible(true));
    const hideSub = Keyboard.addListener(hideEvent, () => setKeyboardVisible(false));
    return () => { showSub.remove(); hideSub.remove(); };
  }, []);

  // Loading animation loop
  useEffect(() => {
    if (isEngineLoading) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(loadingAnim, { toValue: 1, duration: 1200, useNativeDriver: false }),
          Animated.timing(loadingAnim, { toValue: 0, duration: 1200, useNativeDriver: false }),
        ])
      ).start();
    } else {
      loadingAnim.stopAnimation();
      loadingAnim.setValue(0);
    }
  }, [isEngineLoading]);

  const barWidth = loadingAnim.interpolate({ inputRange: [0, 1], outputRange: ['10%', '100%'] });

  // ── Engine loader (best of both branches) ────────────────────────────────────
  const loadEngine = async () => {
    setEngineError(null);
    setIsEngineLoading(true);

    let activeModelPath: string | null = null;
    let modelNameForDrawer = 'No active model';

    const savedModelName = await AsyncStorage.getItem('ACTIVE_MODEL_NAME');
    if (savedModelName) {
      const modelObj = ALL_MODELS.find(m => m.name === savedModelName);
      const potentialPath = modelObj ? modelObj.destination : savedModelName;
      const fullPath = `${RNFS.DocumentDirectoryPath}/${potentialPath}`;
      if (await RNFS.exists(fullPath)) {
        activeModelPath = fullPath;
        modelNameForDrawer = savedModelName;
      }
    }

    if (!activeModelPath) {
      try {
        const files = await RNFS.readDir(RNFS.DocumentDirectoryPath);
        const ggufFile = files.find(f => f.name.endsWith('.gguf'));
        if (ggufFile) {
          activeModelPath = ggufFile.path;
          modelNameForDrawer = ggufFile.name;
          await AsyncStorage.setItem('ACTIVE_MODEL_NAME', ggufFile.name);
        }
      } catch (e) { console.log(e); }
    }

    setCurrentActiveModel(modelNameForDrawer);
    setLoadingModelName(modelNameForDrawer);

    if (!activeModelPath) {
      setNeedsModel(true);
      setIsEngineLoading(false);
      return;
    }

    setNeedsModel(false);

    if (activeModelPath !== currentLoadedPath) {
      if (llamaContext) {
        try { await llamaContext.release(); } catch (e) {}
        setLlamaContext(null);
      }

      await new Promise(resolve => setTimeout(resolve, 500));

      try {
        // Guard: reject suspiciously small (corrupt) files
        const stat = await RNFS.stat(activeModelPath);
        const sizeInMB = stat.size / (1024 * 1024);
        if (sizeInMB < 50) {
          Alert.alert(
            'Corrupt Download ❌',
            `File size is only ${sizeInMB.toFixed(2)} MB. Delete it and try downloading again.`
          );
          setIsEngineLoading(false);
          return;
        }

        const cleanPath = activeModelPath.replace(/^file:\/\//, '');
        const ctx = await initLlama({
          model: cleanPath,
          use_mlock: false,
          n_ctx: 2048,
          n_gpu_layers: Platform.OS === 'ios' ? 50 : 0, // GPU acceleration on iOS
        });
        setLlamaContext(ctx);
        setCurrentLoadedPath(activeModelPath);

      } catch (err) {
        // Fallback: retry with explicit file:// prefix
        try {
          const filePrefixedPath = `file://${activeModelPath.replace(/^file:\/\//, '')}`;
          const ctxFallback = await initLlama({
            model: filePrefixedPath,
            use_mlock: false,
            n_ctx: 2048,
            n_gpu_layers: 0,
          });
          setLlamaContext(ctxFallback);
          setCurrentLoadedPath(activeModelPath);
        } catch (fallbackErr) {
          const message = describeEngineError(fallbackErr);
          setLlamaContext(null);
          setCurrentLoadedPath(null);
          setEngineError(message);
          if (Platform.OS === 'android') {
            ToastAndroid.show(message, ToastAndroid.LONG);
          } else {
            Alert.alert('Engine Crash ⚠️', message);
          }
          console.warn('Engine init failed:', message);
        }
      }
    }

    setIsEngineLoading(false);
  };

  // ── TTS + Voice setup ────────────────────────────────────────────────────────
  useEffect(() => {
    Tts.getInitStatus()
      .then(() => {
        isTtsReadyRef.current = true;
        Tts.setDefaultLanguage('en-US');
        Tts.setDefaultRate(0.5);
      })
      .catch((err: any) => {
        isTtsReadyRef.current = false;
        console.warn('TTS init failed:', err?.message || err);
      });

    if (hasVoiceNativeModule) {
      Voice.onSpeechStart          = () => { setIsListening(true); void stopSpeaking(); };
      Voice.onSpeechEnd            = () => setIsListening(false);
      Voice.onSpeechError          = () => setIsListening(false);
      Voice.onSpeechPartialResults = (e: SpeechResultsEvent) => {
        if (e.value && e.value.length > 0) setInputText(e.value[0]);
      };
      Voice.onSpeechResults = (e: SpeechResultsEvent) => {
        if (e.value && e.value.length > 0) setInputText(e.value[0]);
      };
    }

    if (isFocused) loadEngine();

    return () => {
      setIsListening(false);
      void stopSpeaking();
      if (hasVoiceNativeModule) Voice.removeAllListeners();
    };
  }, [hasVoiceNativeModule, isFocused]);

  // ── Voice ────────────────────────────────────────────────────────────────────
  const startListening = async () => {
    if (!hasVoiceNativeModule) return;
    if (isListening) await Voice.stop();
    else { setInputText(''); await Voice.start('en-US'); }
  };

  // ── Chat controls ─────────────────────────────────────────────────────────────
  const clearChat = () => {
    Keyboard.dismiss();
    activeConversationId.current = null;
    setTimeout(() => {
      if (isGenerating && llamaContext) { try { llamaContext.stopCompletion(); } catch (e) {} }
      void stopSpeaking();
      setMessages([]);
      setInputText('');
      setIsGenerating(false);
    }, 50);
  };

  // ── Conversation selection ────────────────────────────────────────────────────
  const handleSelectConversation = (conv: Conversation) => {
    activeConversationId.current = conv.id;
    pendingFolderId.current = conv.folderId ?? null;
    const mapped: Message[] = conv.messages.map(m => ({
      id: m.id, text: m.text, isUser: m.sender === 'user',
      timestamp: m.timestamp, isStarred: m.isStarred, isPinned: m.isPinned,
      parentId: m.parentId, variants: m.variants as any,
      activeVariantIndex: m.activeVariantIndex, editedFrom: m.editedFrom,
    }));
    setMessages(mapped);
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: false }), 100);
  };

  // ── Export ────────────────────────────────────────────────────────────────────
  const handleExportCurrentConversation = () => {
    const convId = activeConversationId.current;
    if (!convId) { Alert.alert('Export', 'No conversation to export yet.'); return; }
    if (!getConversation(convId)) { Alert.alert('Export', 'Conversation not found.'); return; }
    setIsExportSheetOpen(true);
  };

  const closeExportSheet = () => setIsExportSheetOpen(false);

  const getActiveConversationForExport = () => {
    const convId = activeConversationId.current;
    return convId ? getConversation(convId) : null;
  };

  const handleTextExport = async (format: 'json' | 'markdown' | 'text') => {
    const conv = getActiveConversationForExport();
    if (!conv) { Alert.alert('Export', 'Conversation not found.'); return; }
    try {
      const content = buildConversationExport(conv.id, format);
      if (!content.trim()) { Alert.alert('Export', 'Nothing to export yet.'); return; }
      if (Platform.OS === 'android') ToastAndroid.show(`Preparing ${format} export...`, ToastAndroid.SHORT);
      const extension = format === 'markdown' ? 'md' : format === 'text' ? 'txt' : 'json';
      const filePath = await buildTextExportFile(conv.title, content, extension);
      closeExportSheet();
      if (Platform.OS === 'android') {
        try { await ReactNativeBlobUtil.android.actionViewIntent(filePath, 'text/plain', 'Open export'); }
        catch { Alert.alert('Export complete', `Saved to:\n${filePath}`); }
        return;
      }
      await Share.share({ url: `file://${filePath}`, title: conv.title, message: conv.title });
    } catch (e: any) {
      if (Platform.OS === 'android') ToastAndroid.show(`Export failed: ${e?.message ?? 'unknown'}`, ToastAndroid.LONG);
      else Alert.alert('Export Error', e?.message ?? 'Failed to export');
    }
  };

  const handlePdfExport = async () => {
    const conv = getActiveConversationForExport();
    if (!conv) { Alert.alert('Export', 'Conversation not found.'); return; }
    try {
      if (Platform.OS === 'android') ToastAndroid.show('Preparing PDF export...', ToastAndroid.SHORT);
      const filePath = await exportConversationAsPdf(conv);
      closeExportSheet();
      if (Platform.OS === 'android') {
        try { await ReactNativeBlobUtil.android.actionViewIntent(filePath, 'application/pdf', 'Open PDF'); }
        catch { Alert.alert('Export complete', `Saved to:\n${filePath}`); }
        return;
      }
      await Share.share({ url: `file://${filePath}`, title: conv.title, message: conv.title });
    } catch (e: any) {
      if (Platform.OS === 'android') ToastAndroid.show(`PDF export failed: ${e?.message ?? 'unknown'}`, ToastAndroid.LONG);
      else Alert.alert('Export Error', e?.message ?? 'Failed to export PDF');
    }
  };

  // ── Star / Pin ────────────────────────────────────────────────────────────────
  const handleToggleStarMessage = (messageId: string) => {
    const convId = activeConversationId.current;
    if (!convId) return;
    toggleStarMessage(convId, messageId);
    setMessages(prev => prev.map(msg => msg.id === messageId ? { ...msg, isStarred: !msg.isStarred } : msg));
  };

  const handleTogglePinMessage = (messageId: string) => {
    const convId = activeConversationId.current;
    if (!convId) return;
    togglePinMessage(convId, messageId);
    setMessages(prev => prev.map(msg => msg.id === messageId ? { ...msg, isPinned: !msg.isPinned } : msg));
  };

  const handleTogglePinConversation = () => {
    if (isIncognito) { ToastAndroid.show('Pinning not available in Incognito mode.', ToastAndroid.SHORT); return; }
    const convId = activeConversationId.current;
    if (!convId) { ToastAndroid.show('No conversation to pin yet.', ToastAndroid.SHORT); return; }
    const current = getConversation(convId);
    togglePin(convId);
    ToastAndroid.show(current?.isPinned ? 'Conversation unpinned' : 'Conversation pinned', ToastAndroid.SHORT);
  };

  // ── Edit message ──────────────────────────────────────────────────────────────
  const handleEditMessage = async (msgId: string, newText: string) => {
    const convId = activeConversationId.current;
    if (!convId || isGenerating) return;
    const updatedConv = editUserMessage(convId, msgId, newText);
    if (!updatedConv) return;

    const userMsg = updatedConv.messages.find(m => m.id === msgId);
    if (!userMsg) return;

    const editedIndex = messages.findIndex(m => m.id === msgId);
    const nextMsg = editedIndex >= 0 ? messages[editedIndex + 1] : undefined;
    const assistantMsg =
      updatedConv.messages.find(m => m.sender === 'assistant' && m.parentId === msgId) ??
      (nextMsg && !nextMsg.isUser ? updatedConv.messages.find(m => m.id === nextMsg.id) : undefined);

    const mapped = updatedConv.messages.map(m => ({
      id: m.id, text: m.text, isUser: m.sender === 'user',
      timestamp: m.timestamp, isStarred: m.isStarred, isPinned: m.isPinned,
      parentId: m.parentId, variants: m.variants as any,
      activeVariantIndex: m.activeVariantIndex, editedFrom: m.editedFrom,
    }));

    const botMsgId = `edit_${Date.now()}`;
    if (assistantMsg) {
      setMessages(mapped.map(m => m.id === assistantMsg.id ? { ...m, text: '' } : m));
    } else {
      const userIdx = mapped.findIndex(m => m.id === msgId);
      const newBotBubble: Message = {
        id: botMsgId, text: '', isUser: false,
        timestamp: new Date().toISOString(), parentId: msgId,
        isStarred: false, isPinned: false,
      };
      mapped.splice(userIdx + 1, 0, newBotBubble);
      setMessages([...mapped]);
    }

    setIsGenerating(true);
    setRegeneratingMsgId(assistantMsg ? assistantMsg.id : botMsgId);
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: false }), 100);

    if (!llamaContext) {
      setMessages(prev => assistantMsg
        ? prev.map(m => m.id === assistantMsg.id ? { ...m, text: assistantMsg.text } : m)
        : prev.filter(m => m.id !== botMsgId));
      setIsGenerating(false); setRegeneratingMsgId(null); return;
    }

    const formattedPrompt = buildPrompt(userMsg.text);
    let fullResponse = '';
    try {
      await llamaContext.completion(
        { prompt: formattedPrompt, n_predict: 256, temperature: 0.7,
          stop: ['<|im_end|>', '<|eot_id|>', '<end_of_turn>', 'User:'] },
        (result: any) => {
          fullResponse += result.token;
          setMessages(prev => prev.map(m =>
            m.id === (assistantMsg?.id ?? botMsgId) ? { ...m, text: m.text + result.token } : m));
        }
      );
      if (fullResponse.trim().length > 0) {
        await speakText(fullResponse);
        if (assistantMsg) {
          addMessageVariant(convId, msgId, fullResponse);
          refreshFromStore(convId);
        } else {
          const storedBotMsg = storeAddMessage(convId, fullResponse, 'assistant', msgId);
          setMessages(prev => prev.map(m => m.id === botMsgId ? {
            ...m, id: storedBotMsg.id, text: fullResponse, timestamp: storedBotMsg.timestamp,
            isStarred: storedBotMsg.isStarred, isPinned: storedBotMsg.isPinned, parentId: storedBotMsg.parentId,
          } : m));
        }
      }
    } catch (err) {
      console.error('Edit regeneration crashed:', err);
      setMessages(prev => assistantMsg
        ? prev.map(m => m.id === assistantMsg.id ? { ...m, text: assistantMsg.text } : m)
        : prev.filter(m => m.id !== botMsgId));
    } finally {
      setIsGenerating(false); setRegeneratingMsgId(null);
    }
  };

  // ── Retry ─────────────────────────────────────────────────────────────────────
  const handleRetry = async (assistantMsgId: string) => {
    const convId = activeConversationId.current;
    if (!convId || isGenerating) return;
    const storedConv = getConversation(convId);
    const assistantMsg = storedConv?.messages.find(m => m.id === assistantMsgId);
    if (!assistantMsg?.parentId) return;
    const userMsg = storedConv?.messages.find(m => m.id === assistantMsg.parentId);
    if (!userMsg) return;

    const originalText = assistantMsg.text;
    setMessages(prev => prev.map(m => m.id === assistantMsgId ? { ...m, text: '' } : m));
    setIsGenerating(true);
    setRegeneratingMsgId(assistantMsgId);
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: false }), 100);

    if (!llamaContext) {
      setMessages(prev => prev.map(m => m.id === assistantMsgId ? { ...m, text: originalText } : m));
      setIsGenerating(false); setRegeneratingMsgId(null); return;
    }

    const formattedPrompt = buildPrompt(userMsg.text);
    let fullResponse = '';
    try {
      await llamaContext.completion(
        { prompt: formattedPrompt, n_predict: 256, temperature: 0.7,
          stop: ['<|im_end|>', '<|eot_id|>', '<end_of_turn>', 'User:'] },
        (result: any) => {
          fullResponse += result.token;
          setMessages(prev => prev.map(m => m.id === assistantMsgId ? { ...m, text: m.text + result.token } : m));
        }
      );
      if (fullResponse.trim().length > 0) {
        await speakText(fullResponse);
        addMessageVariant(convId, assistantMsg.parentId!, fullResponse);
        refreshFromStore(convId);
      } else {
        setMessages(prev => prev.map(m => m.id === assistantMsgId ? { ...m, text: originalText } : m));
      }
    } catch (err) {
      console.error('Retry crashed:', err);
      setMessages(prev => prev.map(m => m.id === assistantMsgId ? { ...m, text: originalText } : m));
    } finally {
      setIsGenerating(false); setRegeneratingMsgId(null);
    }
  };

  // ── Fork ──────────────────────────────────────────────────────────────────────
  const handleFork = (msgId: string) => {
    const convId = activeConversationId.current;
    if (!convId) { ToastAndroid.show('No active conversation to fork.', ToastAndroid.SHORT); return; }
    const forked = forkConversation(convId, msgId);
    if (!forked) { ToastAndroid.show('Could not fork conversation.', ToastAndroid.SHORT); return; }
    ToastAndroid.show('Conversation forked!', ToastAndroid.SHORT);
    handleSelectConversation(forked);
  };

  // ── Variants ──────────────────────────────────────────────────────────────────
  const refreshFromStore = (convId: string) => {
    const refreshed = getConversation(convId);
    if (!refreshed) return;
    setMessages(refreshed.messages.map(m => ({
      id: m.id, text: m.text, isUser: m.sender === 'user',
      timestamp: m.timestamp, isStarred: m.isStarred, isPinned: m.isPinned,
      parentId: m.parentId, variants: m.variants as any,
      activeVariantIndex: m.activeVariantIndex, editedFrom: m.editedFrom,
    })));
  };

  const handlePrevVariant = (assistantMsgId: string) => {
    const convId = activeConversationId.current;
    if (!convId) return;
    const msg = messages.find(m => m.id === assistantMsgId);
    if (!msg?.variants) return;
    const current = msg.activeVariantIndex ?? msg.variants.length - 1;
    setActiveVariant(convId, assistantMsgId, Math.max(0, current - 1));
    refreshFromStore(convId);
  };

  const handleNextVariant = (assistantMsgId: string) => {
    const convId = activeConversationId.current;
    if (!convId) return;
    const msg = messages.find(m => m.id === assistantMsgId);
    if (!msg?.variants) return;
    const current = msg.activeVariantIndex ?? msg.variants.length - 1;
    setActiveVariant(convId, assistantMsgId, Math.min(msg.variants.length - 1, current + 1));
    refreshFromStore(convId);
  };

  // ── Incognito ─────────────────────────────────────────────────────────────────
  const handleToggleIncognito = async () => {
    if (isGenerating) { ToastAndroid.show('Wait for the response to finish.', ToastAndroid.SHORT); return; }
    if (isListening) await Voice.stop();
    await stopSpeaking();
    Keyboard.dismiss();
    pendingFolderId.current = null;
    activeConversationId.current = null;
    setMessages([]);
    setInputText('');
    toggleIncognito();
  };

  // ── Download ──────────────────────────────────────────────────────────────────
  const handleDownload = async (model: IrisModel) => {
    setDownloading(prev => ({ ...prev, [model.name]: true }));
    try {
      const destPath = `${RNFS.DocumentDirectoryPath}/${model.destination}`;
      if (await RNFS.exists(destPath)) await RNFS.unlink(destPath);
    } catch (cleanupError) { console.log('File locked, overwriting...'); }
    try {
      await downloadModel(model, p => setProgresses(prev => ({ ...prev, [model.name]: Math.round(p * 100) })));
      await AsyncStorage.setItem('ACTIVE_MODEL_NAME', model.name);
      setNeedsModel(false);
      ToastAndroid.show('Download Complete! Loading AI...', ToastAndroid.SHORT);
      loadEngine();
    } catch (error: any) {
      ToastAndroid.show(`Failed: ${error.message || 'Unknown error'}`, ToastAndroid.LONG);
    } finally {
      setDownloading(prev => ({ ...prev, [model.name]: false }));
    }
  };

  const cancelDownload = async (model: IrisModel) => {
    setDownloading(prev => ({ ...prev, [model.name]: false }));
    setProgresses(prev => ({ ...prev, [model.name]: 0 }));
    ToastAndroid.show('Download cancelled', ToastAndroid.SHORT);
    try {
      const destPath = `${RNFS.DocumentDirectoryPath}/${model.destination}`;
      if (await RNFS.exists(destPath)) await RNFS.unlink(destPath);
    } catch (e) { console.log('Cleanup failed', e); }
  };

  // ── Prompt builder (model-aware) ──────────────────────────────────────────────
  const buildPrompt = (text: string): string => {
    const sysPrompt = 'You are Iris, a highly capable AI assistant. Keep your answers concise, clear, and strictly to the point. Do not write extra questions, tags, or user dialogues.';
    const ml = currentActiveModel.toLowerCase();
    if (ml.includes('llama')) {
      return `<|begin_of_text|><|start_header_id|>system<|end_header_id|>\n\n${sysPrompt}<|eot_id|><|start_header_id|>user<|end_header_id|>\n\n${text}<|eot_id|><|start_header_id|>assistant<|end_header_id|>\n\n`;
    }
    if (ml.includes('qwen')) {
      return `<|im_start|>system\n${sysPrompt}<|im_end|>\n<|im_start|>user\n${text}<|im_end|>\n<|im_start|>assistant\n`;
    }
    if (ml.includes('gemma')) {
      return `<start_of_turn>user\n${text}<end_of_turn>\n<start_of_turn>model\n`;
    }
    return `System: ${sysPrompt}\nUser: ${text}\nAssistant:`;
  };

  // ── Send message ──────────────────────────────────────────────────────────────
  const sendMessage = async (text: string = inputText) => {
    if (!text.trim() || isGenerating) return;
    if (isListening) await Voice.stop();
    await stopSpeaking();

    // INCOGNITO — RAM only, nothing persisted
    if (isIncognito) {
      const tempUser = addTempMessage(text, true);
      const botMsgId = `tmp_bot_${Date.now()}`;
      const tempBot: Message = {
        id: botMsgId, text: '', isUser: false,
        timestamp: new Date().toISOString(), isStarred: false, isPinned: false,
      };
      setMessages(prev => [...prev, { ...tempUser, isUser: true }, tempBot]);
      setInputText('');
      setIsGenerating(true);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: false }), 100);

      if (!llamaContext) {
        const errText = 'Error: AI not loaded.';
        setMessages(prev => prev.map(m => m.id === botMsgId ? { ...m, text: errText } : m));
        addTempMessage(errText, false);
        setIsGenerating(false); return;
      }

      let fullResponse = '';
      try {
        await llamaContext.completion(
          { prompt: buildPrompt(text), n_predict: 256, temperature: 0.7,
            stop: ['<|im_end|>', '<|eot_id|>', '<end_of_turn>', '<|end_of_text|>', 'User:'] },
          (result: any) => {
            fullResponse += result.token;
            setMessages(prev => prev.map(m =>
              m.id === botMsgId ? { ...m, text: m.text + result.token } : m));
          }
        );
        if (fullResponse.trim().length > 0) {
          await speakText(fullResponse);
          addTempMessage(fullResponse, false);
        }
      } catch (err) { console.error('Incognito generation crashed:', err); }
      finally { setIsGenerating(false); }
      return;
    }

    // NORMAL — persisted to conversationStore
    if (!activeConversationId.current) {
      const conv = createConversation(pendingFolderId.current);
      activeConversationId.current = conv.id;
      pendingFolderId.current = conv.folderId ?? null;
    }
    const convId = activeConversationId.current!;

    const storedUserMsg = storeAddMessage(convId, text, 'user');
    const newUserMsg: Message = {
      id: storedUserMsg.id, text, isUser: true,
      timestamp: storedUserMsg.timestamp, isStarred: storedUserMsg.isStarred, isPinned: storedUserMsg.isPinned,
    };
    const botMsgId = (Date.now() + 1).toString();
    const newBotMsg: Message = {
      id: botMsgId, text: '', isUser: false,
      timestamp: new Date().toISOString(), isStarred: false, isPinned: false,
    };

    setMessages(prev => [...prev, newUserMsg, newBotMsg]);
    setInputText('');
    setIsGenerating(true);
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: false }), 100);

    if (!llamaContext) {
      const errText = 'Error: AI not loaded.';
      setMessages(prev => prev.map(msg => msg.id === botMsgId ? { ...msg, text: errText } : msg));
      const storedBotMsg = storeAddMessage(convId, errText, 'assistant', storedUserMsg.id);
      setMessages(prev => prev.map(msg => msg.id === botMsgId ? {
        ...msg, id: storedBotMsg.id, timestamp: storedBotMsg.timestamp,
        isPinned: storedBotMsg.isPinned, parentId: storedBotMsg.parentId,
      } : msg));
      setIsGenerating(false); return;
    }

    let fullResponse = '';
    try {
      await llamaContext.completion(
        { prompt: buildPrompt(text), n_predict: 256, temperature: 0.5,
          stop: ['<|im_end|>', '<|eot_id|>', '<end_of_turn>', '<|end_of_text|>', 'User:'] },
        (result: any) => {
          fullResponse += result.token;
          setMessages(prev => prev.map(msg =>
            msg.id === botMsgId ? { ...msg, text: msg.text + result.token } : msg));
        }
      );
      if (fullResponse.trim().length > 0) {
        await speakText(fullResponse);
        const storedBotMsg = storeAddMessage(convId, fullResponse, 'assistant', storedUserMsg.id);
        setMessages(prev => prev.map(msg => msg.id === botMsgId ? {
          ...msg, id: storedBotMsg.id, timestamp: storedBotMsg.timestamp,
          isStarred: storedBotMsg.isStarred, isPinned: storedBotMsg.isPinned, parentId: storedBotMsg.parentId,
        } : msg));
      }
    } catch (error) { console.error('Generation crashed:', error); }
    finally { setIsGenerating(false); }
  };

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        {/* Engine loading modal */}
        <Modal visible={isEngineLoading && !needsModel} transparent animationType="fade">
          <View style={styles.loadingOverlay}>
            <Text style={styles.loadingTitle}>Loading Model</Text>
            <Text style={styles.loadingSubtitle}>Please wait...</Text>
            <Text style={styles.loadingModelName}>{loadingModelName}</Text>
            <View style={styles.loadingTrack}>
              <Animated.View style={[styles.loadingFill, { width: barWidth }]} />
            </View>
          </View>
        </Modal>

        {/* Download required */}
        {needsModel && isFocused && !isEngineLoading && (
          <View style={[StyleSheet.absoluteFill, styles.modalOverlay]}>
            <View style={styles.modalBox}>
              <Text style={styles.modalTitle}>Download Required</Text>
              {ALL_MODELS.map(model => (
                <View key={model.name} style={styles.modelCard}>
                  <Text style={styles.modelNameText}>{model.name}</Text>
                  <TouchableOpacity
                    style={[styles.downloadBtn, downloading[model.name] && { backgroundColor: '#ef4444' }]}
                    onPress={() => downloading[model.name] ? cancelDownload(model) : handleDownload(model)}
                  >
                    <Text style={styles.downloadBtnText}>
                      {downloading[model.name]
                        ? `Stop Download (${progresses[model.name] || 0}%)`
                        : 'Download'}
                    </Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Engine error banner */}
        {!!engineError && !needsModel && (
          <View style={styles.engineBanner}>
            <Text style={styles.engineBannerText}>{engineError}</Text>
          </View>
        )}

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => setIsSidebarOpen(true)}
            style={styles.hamburgerBtn}
            hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
          >
            <View style={styles.hamburgerLine} />
            <View style={styles.hamburgerLine} />
            <View style={styles.hamburgerLine} />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Iris</Text>

          <View style={styles.headerIcons}>
            <TouchableOpacity onPress={handleTogglePinConversation} style={{ padding: 10 }}>
              <Text style={styles.headerActionText}>Pin</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleExportCurrentConversation} style={{ padding: 10 }}>
              <Text style={styles.headerActionText}>Export</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { Keyboard.dismiss(); navigation.navigate('Settings'); }} style={{ padding: 10 }}>
              <Image source={require('../assets/icons/settings.png')} style={styles.headerIconImage} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { pendingFolderId.current = null; clearChat(); }} style={{ padding: 10 }}>
              <Image source={require('../assets/icons/new_chat.png')} style={styles.headerIconImage} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Incognito banner */}
        <TouchableOpacity
          activeOpacity={0.8}
          style={[styles.incognitoBanner, isIncognito && styles.incognitoBannerActive]}
          onPress={handleToggleIncognito}
        >
          <Text style={styles.incognitoIcon}>{isIncognito ? '●' : '○'}</Text>
          <Text style={styles.incognitoText}>
            {isIncognito ? 'Incognito on: this chat stays temporary' : 'Incognito off: tap for temporary chat'}
          </Text>
        </TouchableOpacity>

        {/* Messages / empty state */}
        {messages.length === 0 ? (
          <View style={styles.emptyChatContainer}>
            <Text style={styles.helloText}>Hello, Ask me Anything</Text>
            {/* Hide prompts on Android when keyboard is open */}
            {!(Platform.OS === 'android' && isKeyboardVisible) && (
              <View style={{ height: 120 }}>
                <FlatList
                  data={PROMPTS}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  keyExtractor={item => item}
                  contentContainerStyle={styles.promptsContainer}
                  keyboardShouldPersistTaps="handled"
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={[styles.promptCard, (!llamaContext || isGenerating) && { opacity: 0.5 }]}
                      onPress={() => sendMessage(item)}
                      disabled={!llamaContext || isGenerating}
                    >
                      <Text style={styles.promptText}>{item}</Text>
                    </TouchableOpacity>
                  )}
                />
              </View>
            )}
          </View>
        ) : (
          <>
            {/* Pinned message banner */}
            {messages.some(item => item.isPinned) && (() => {
              const pinnedIndex =
                [...messages].map((m, i) => ({ m, i })).reverse().find(({ m }) => m.isPinned)?.i ?? -1;
              return (
                <TouchableOpacity
                  activeOpacity={0.75}
                  style={styles.pinnedBar}
                  onPress={() =>
                    pinnedIndex >= 0 &&
                    flatListRef.current?.scrollToIndex({ index: pinnedIndex, animated: false, viewPosition: 0.3 })
                  }
                >
                  <Text style={styles.pinnedLabel}>📌 Pinned — tap to jump</Text>
                  <Text style={styles.pinnedText} numberOfLines={2}>{messages[pinnedIndex]?.text}</Text>
                </TouchableOpacity>
              );
            })()}

            <FlatList
              ref={flatListRef}
              data={messages}
              keyExtractor={item => item.id}
              contentContainerStyle={styles.chatContainer}
              keyboardShouldPersistTaps="handled"
              onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
              onScrollToIndexFailed={info => {
                setTimeout(() =>
                  flatListRef.current?.scrollToIndex({ index: info.index, animated: false, viewPosition: 0.3 }), 300);
              }}
              renderItem={({ item }) => {
                if (!item.isUser && item.id === regeneratingMsgId && item.text === '') {
                  return <TypingIndicator />;
                }
                const storeMsg = {
                  id: item.id, text: item.text,
                  sender: (item.isUser ? 'user' : 'assistant') as 'user' | 'assistant',
                  timestamp: item.timestamp ?? new Date().toISOString(),
                  isStarred: !!item.isStarred, isPinned: !!item.isPinned,
                  parentId: item.parentId, variants: item.variants as any,
                  activeVariantIndex: item.activeVariantIndex, editedFrom: item.editedFrom,
                };
                const convId = activeConversationId.current;
                return (
                  <MessageBubble
                    message={storeMsg}
                    onPin={() => handleTogglePinMessage(item.id)}
                    onStar={() => handleToggleStarMessage(item.id)}
                    onEdit={!isIncognito && convId && item.isUser
                      ? () => setEditingMessage({ id: item.id, text: item.text }) : undefined}
                    onRetry={!isIncognito && convId && !item.isUser
                      ? () => handleRetry(item.id) : undefined}
                    onFork={!isIncognito && convId ? () => handleFork(item.id) : undefined}
                    onPrevVariant={!isIncognito && convId && item.variants && item.variants.length > 1
                      ? () => handlePrevVariant(item.id) : undefined}
                    onNextVariant={!isIncognito && convId && item.variants && item.variants.length > 1
                      ? () => handleNextVariant(item.id) : undefined}
                  />
                );
              }}
            />
          </>
        )}

        {/* Input bar */}
        <View style={styles.inputAreaWrapper}>
          <View style={styles.inputContainer}>
            <TouchableOpacity onPress={startListening} disabled={needsModel || isGenerating}>
              <Image
                source={require('../assets/icons/mic.png')}
                style={[styles.micIconImage, isListening && { tintColor: '#ff4444' }]}
              />
            </TouchableOpacity>
            <TextInput
              style={styles.input}
              placeholder="Message"
              placeholderTextColor="#666666"
              value={inputText}
              onChangeText={setInputText}
              editable={!needsModel && !isGenerating}
              onSubmitEditing={() => sendMessage()}
            />
            {isGenerating ? (
              <TouchableOpacity
                onPress={() => {
                  try { llamaContext?.stopCompletion(); } catch (e) {}
                  setIsGenerating(false);
                }}
                style={styles.stopBtn}
              >
                <Text style={styles.stopBtnText}>⏹</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity onPress={() => sendMessage()} disabled={needsModel}>
                <Image source={require('../assets/icons/send.png')} style={styles.sendIconImage} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* Edit message modal */}
      <EditMessageModal
        visible={!!editingMessage}
        initialText={editingMessage?.text ?? ''}
        onCancel={() => setEditingMessage(null)}
        onConfirm={async newText => {
          if (!editingMessage) return;
          const editId = editingMessage.id;
          setEditingMessage(null);
          await handleEditMessage(editId, newText);
        }}
      />

      {/* Export bottom sheet */}
      {isExportSheetOpen && (
        <View style={styles.exportOverlay}>
          <TouchableOpacity style={styles.exportBackdrop} activeOpacity={1} onPress={closeExportSheet} />
          <View style={styles.exportSheet}>
            <Text style={styles.exportSheetTitle}>Export Conversation</Text>
            {(['json', 'markdown', 'text'] as const).map(fmt => (
              <TouchableOpacity key={fmt} style={styles.exportActionBtn} onPress={() => handleTextExport(fmt)}>
                <Text style={styles.exportActionBtnText}>{fmt.charAt(0).toUpperCase() + fmt.slice(1)}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.exportActionBtn} onPress={handlePdfExport}>
              <Text style={styles.exportActionBtnText}>PDF</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.exportActionBtn, styles.exportCancelBtn]} onPress={closeExportSheet}>
              <Text style={styles.exportCancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Sidebar */}
      <IrisSidebar
        visible={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onSelectConversation={handleSelectConversation}
        activeModelName={currentActiveModel}
        onNewChat={folderId => {
          pendingFolderId.current = folderId ?? null;
          clearChat();
        }}
      />
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const markdownStyles = StyleSheet.create({
  body:         { color: '#E2E8F0', fontSize: 16, lineHeight: 24 },
  strong:       { fontWeight: 'bold', color: '#ffffff' },
  em:           { fontStyle: 'italic', color: '#E2E8F0' },
  paragraph:    { marginTop: 0, marginBottom: 10 },
  code_inline:  { backgroundColor: '#2d3748', color: '#a78bfa', padding: 4, borderRadius: 4, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  fence:        { backgroundColor: '#1e293b', color: '#e2e8f0', padding: 10, borderRadius: 8, marginTop: 5, marginBottom: 5, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  list_item:    { color: '#E2E8F0', fontSize: 16, lineHeight: 24 },
  bullet_list:  { marginTop: 0, marginBottom: 10 },
  ordered_list: { marginTop: 0, marginBottom: 10 },
});

const styles = StyleSheet.create({
  container:            { flex: 1, backgroundColor: '#050a14' },

  // Header
  header:               { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 16, marginTop: 10 },
  hamburgerBtn:         { padding: 10, gap: 5, justifyContent: 'center' },
  hamburgerLine:        { width: 22, height: 2, backgroundColor: '#ffffff', borderRadius: 2 },
  headerTitle:          { color: '#ffffff', fontSize: 28, fontWeight: '500' },
  headerIcons:          { flexDirection: 'row', gap: 4 },
  headerActionText:     { color: '#ffffff', fontSize: 14, fontWeight: '600' },
  headerIconImage:      { width: 24, height: 24, tintColor: '#ffffff' },

  // Engine loading modal
  loadingOverlay:       { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  loadingTitle:         { color: '#ffffff', fontSize: 20, fontWeight: 'bold', marginBottom: 4 },
  loadingSubtitle:      { color: '#e2e8f0', fontSize: 16, marginBottom: 24 },
  loadingModelName:     { color: '#ffffff', fontSize: 16, fontWeight: 'bold', textAlign: 'center', marginBottom: 12 },
  loadingTrack:         { width: '80%', height: 4, backgroundColor: '#334155', borderRadius: 2, overflow: 'hidden' },
  loadingFill:          { height: '100%', backgroundColor: '#3b82f6', borderRadius: 2 },

  // Engine error
  engineBanner:         { marginHorizontal: 16, marginBottom: 8, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, backgroundColor: 'rgba(127,29,29,0.9)', borderWidth: 1, borderColor: 'rgba(248,113,113,0.45)' },
  engineBannerText:     { color: '#fecaca', fontSize: 12, lineHeight: 18, textAlign: 'center' },

  // Incognito banner
  incognitoBanner:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(88,28,135,0.35)', borderWidth: 1, borderColor: 'rgba(167,139,250,0.3)', marginHorizontal: 12, borderRadius: 10, gap: 6, marginBottom: 10, paddingHorizontal: 12, paddingVertical: 10 },
  incognitoBannerActive: { backgroundColor: 'rgba(88,28,135,0.55)', borderColor: 'rgba(196,181,253,0.6)' },
  incognitoIcon:         { fontSize: 14 },
  incognitoText:         { color: '#c4b5fd', fontSize: 12, fontWeight: '500', letterSpacing: 0.3 },

  // Empty / prompts
  emptyChatContainer:   { flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 40 },
  helloText:            { color: '#ffffff', fontSize: 32, fontWeight: '300', textAlign: 'center', marginBottom: 40 },
  promptsContainer:     { paddingHorizontal: 16, gap: 12 },
  promptCard:           { backgroundColor: 'rgba(255,255,255,0.05)', width: 200, height: 100, justifyContent: 'center', alignItems: 'center', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  promptText:           { color: '#A0A0A5', fontSize: 13, textAlign: 'center' },

  // Pinned bar
  pinnedBar:            { marginHorizontal: 16, marginBottom: 4, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, backgroundColor: '#171E2C', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  pinnedLabel:          { color: '#F59E0B', fontSize: 11, fontWeight: '700', marginBottom: 4, textTransform: 'uppercase' },
  pinnedText:           { color: '#E2E8F0', fontSize: 13, lineHeight: 18 },

  // Chat list
  chatContainer:        { padding: 16, flexGrow: 1, justifyContent: 'flex-end' },

  // Input
  inputAreaWrapper:     { padding: 12, paddingBottom: Platform.OS === 'ios' ? 24 : 12 },
  inputContainer:       { flexDirection: 'row', alignItems: 'center', backgroundColor: '#171E2C', borderRadius: 24, paddingHorizontal: 16, paddingVertical: 6, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  input:                { flex: 1, color: '#ffffff', fontSize: 16, paddingVertical: 10 },
  micIconImage:         { width: 24, height: 24, tintColor: '#ffffff', marginRight: 12 },
  sendIconImage:        { width: 24, height: 24, tintColor: '#ffffff', marginLeft: 12 },
  stopBtn:              { width: 32, height: 32, borderRadius: 16, backgroundColor: '#ef4444', alignItems: 'center', justifyContent: 'center', marginLeft: 8 },
  stopBtnText:          { fontSize: 14, color: '#ffffff' },

  // Download modal
  modalOverlay:         { backgroundColor: 'rgba(5,10,20,0.95)', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  modalBox:             { backgroundColor: '#1e293b', width: '85%', borderRadius: 16, padding: 24, alignItems: 'center' },
  modalTitle:           { color: '#ffffff', fontSize: 20, fontWeight: 'bold', marginBottom: 20 },
  modelCard:            { backgroundColor: '#0f172a', width: '100%', borderRadius: 12, padding: 16, marginBottom: 12, alignItems: 'center' },
  modelNameText:        { color: '#94a3b8', fontSize: 14, marginBottom: 12, textAlign: 'center' },
  downloadBtn:          { backgroundColor: '#2563EB', width: '100%', paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  downloadBtnText:      { color: '#ffffff', fontWeight: 'bold', fontSize: 16 },

  // Export sheet
  exportOverlay:        { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(2,6,23,0.45)', justifyContent: 'flex-end' },
  exportBackdrop:       { flex: 1 },
  exportSheet:          { backgroundColor: '#111827', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, borderTopWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  exportSheetTitle:     { color: '#ffffff', fontSize: 16, fontWeight: '700', marginBottom: 14 },
  exportActionBtn:      { paddingVertical: 14, paddingHorizontal: 14, borderRadius: 12, backgroundColor: '#1f2937', marginTop: 10 },
  exportActionBtnText:  { color: '#ffffff', fontSize: 14, fontWeight: '600' },
  exportCancelBtn:      { backgroundColor: '#0f172a', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', marginTop: 14 },
  exportCancelBtnText:  { color: '#94a3b8', fontSize: 14, fontWeight: '600' },
});
