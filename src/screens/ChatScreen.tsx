import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet,
  KeyboardAvoidingView, Platform, Keyboard, Image, ToastAndroid,
} from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import RNFS from 'react-native-fs';
import { initLlama } from 'llama.rn';
import Voice, { SpeechResultsEvent } from '@react-native-voice/voice';
import Tts from 'react-native-tts';
import LinearGradient from 'react-native-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ALL_MODELS, downloadModel, IrisModel } from '../services/ModelService';
import IrisSidebar from '../components/IrisSidebar';
import {
  Conversation,
  createConversation,
  addMessage as storeAddMessage,
  toggleStarMessage,
  togglePinMessage,
  togglePin,
  getConversation,
} from '../services/conversationStore';
import { showConversationExportMenu } from '../services/conversationExport';
// ── Inline PDF/HTML builder — generates a shareable HTML file, no extra deps
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
        <div style="font-size:14px;color:#e2e8f0;white-space:pre-wrap">${m.text.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</div>
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

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp?: string;
  isStarred?: boolean;
  isPinned?: boolean;
}

const PROMPTS = [
  "Explain how to develop a consistent reading habit.",
  "Write an email to your manager requesting leave for a day.",
  "Suggest time management strategies for handling multiple deadlines effectively.",
  "Draft a professional LinkedIn message to connect with a recruiter."
];

export default function ChatScreen({ navigation }: any) {
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [needsModel, setNeedsModel] = useState(false);
  const [downloading, setDownloading] = useState<{ [key: string]: boolean }>({});
  const [progresses, setProgresses] = useState<{ [key: string]: number }>({});
  const [llamaContext, setLlamaContext] = useState<any>(null);
  const [currentLoadedPath, setCurrentLoadedPath] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const activeConversationId = useRef<string | null>(null);
  const pendingFolderId = useRef<string | null>(null);
  const [currentActiveModel, setCurrentActiveModel] = useState("No active model");
  const isFocused = useIsFocused();
  const flatListRef = useRef<FlatList>(null);

  const loadEngine = async () => {
    let activeModelPath = null;
    let modelNameForDrawer = "No active model";
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
          activeModelPath = `${RNFS.DocumentDirectoryPath}/${ggufFile.name}`;
          modelNameForDrawer = ggufFile.name;
          await AsyncStorage.setItem('ACTIVE_MODEL_NAME', ggufFile.name);
        }
      } catch (e) { console.log("Failed to scan directory", e); }
    }
    setCurrentActiveModel(modelNameForDrawer);
    if (!activeModelPath) { setNeedsModel(true); return; }
    setNeedsModel(false);
    if (activeModelPath !== currentLoadedPath) {
      if (llamaContext) { try { await llamaContext.release(); } catch(e) {} }
      try {
        const ctx = await initLlama({ model: activeModelPath, use_mlock: false, n_ctx: 2048 });
        setLlamaContext(ctx);
        setCurrentLoadedPath(activeModelPath);
      } catch (err) { console.error("Engine failed:", err); }
    }
  };

  useEffect(() => {
    Tts.setDefaultLanguage('en-US');
    Tts.setDefaultRate(0.5);
    Voice.onSpeechStart = () => { setIsListening(true); Tts.stop(); };
    Voice.onSpeechEnd = () => setIsListening(false);
    Voice.onSpeechError = () => setIsListening(false);
    Voice.onSpeechPartialResults = (e: SpeechResultsEvent) => { if (e.value && e.value.length > 0) setInputText(e.value[0]); };
    Voice.onSpeechResults = (e: SpeechResultsEvent) => { if (e.value && e.value.length > 0) setInputText(e.value[0]); };
    if (isFocused) loadEngine();
    return () => { Voice.destroy().then(Voice.removeAllListeners); Tts.stop(); };
  }, [isFocused]);

  const startListening = async () => {
    if (isListening) await Voice.stop();
    else { setInputText(''); await Voice.start('en-US'); }
  };

  const clearChat = () => {
    Keyboard.dismiss();
    activeConversationId.current = null;
    setTimeout(() => {
      if (isGenerating && llamaContext) { try { llamaContext.stopCompletion(); } catch (e) {} }
      Tts.stop();
      setMessages([]);
      setInputText('');
      setIsGenerating(false);
    }, 50);
  };

  // Load conversation messages from sidebar selection
  const handleSelectConversation = (conv: Conversation) => {
    activeConversationId.current = conv.id;
    pendingFolderId.current = conv.folderId;
    const mapped: Message[] = conv.messages.map(m => ({
      id: m.id,
      text: m.text,
      isUser: m.sender === 'user',
      timestamp: m.timestamp,
      isStarred: m.isStarred,
      isPinned: m.isPinned,
    }));
    setMessages(mapped);
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: false }), 100);
  };

  const handleExportCurrentConversation = () => {
    const convId = activeConversationId.current;
    if (!convId) {
      ToastAndroid.show('No conversation to export yet.', ToastAndroid.SHORT);
      return;
    }
    const conv = getConversation(convId);
    if (!conv) {
      ToastAndroid.show('Conversation not found.', ToastAndroid.SHORT);
      return;
    }
    showConversationExportMenu(conv);
  };

  const handleToggleStarMessage = (messageId: string) => {
    const convId = activeConversationId.current;
    if (!convId) return;

    toggleStarMessage(convId, messageId);
    setMessages(prev =>
      prev.map(msg =>
        msg.id === messageId ? { ...msg, isStarred: !msg.isStarred } : msg
      )
    );
  };

  const handleTogglePinMessage = (messageId: string) => {
    const convId = activeConversationId.current;
    if (!convId) return;

    togglePinMessage(convId, messageId);
    setMessages(prev =>
      prev.map(msg =>
        msg.id === messageId ? { ...msg, isPinned: !msg.isPinned } : msg
      )
    );
  };

  const handleTogglePinConversation = () => {
    const convId = activeConversationId.current;
    if (!convId) {
      ToastAndroid.show('No conversation to pin yet.', ToastAndroid.SHORT);
      return;
    }

    const current = getConversation(convId);
    togglePin(convId);
    ToastAndroid.show(
      current?.isPinned ? 'Conversation unpinned' : 'Conversation pinned',
      ToastAndroid.SHORT
    );
  };

  const handleDownload = async (model: IrisModel) => {
    setDownloading(prev => ({ ...prev, [model.name]: true }));
    try {
      const destPath = `${RNFS.DocumentDirectoryPath}/${model.destination}`;
      if (await RNFS.exists(destPath)) await RNFS.unlink(destPath);
    } catch (cleanupError) { console.log("File locked, overwriting..."); }
    try {
      await downloadModel(model, (p) => setProgresses(prev => ({ ...prev, [model.name]: Math.round(p * 100) })));
      await AsyncStorage.setItem('ACTIVE_MODEL_NAME', model.name);
      setNeedsModel(false);
      ToastAndroid.show("Download Complete! Loading AI...", ToastAndroid.SHORT);
      loadEngine();
    } catch (error: any) {
      ToastAndroid.show(`Failed: ${error.message || "Unknown error"}`, ToastAndroid.LONG);
    } finally {
      setDownloading(prev => ({ ...prev, [model.name]: false }));
    }
  };

  const cancelDownload = async (model: IrisModel) => {
    setDownloading(prev => ({ ...prev, [model.name]: false }));
    setProgresses(prev => ({ ...prev, [model.name]: 0 }));
    ToastAndroid.show("Download cancelled", ToastAndroid.SHORT);
    try {
      const destPath = `${RNFS.DocumentDirectoryPath}/${model.destination}`;
      if (await RNFS.exists(destPath)) await RNFS.unlink(destPath);
    } catch (e) { console.log("Cleanup failed", e); }
  };

  const sendMessage = async (text: string = inputText) => {
    if (!text.trim() || isGenerating) return;
    if (isListening) await Voice.stop();
    Tts.stop();

    // Auto-create a conversation on the first message of a blank chat
    if (!activeConversationId.current) {
      const conv = createConversation(pendingFolderId.current);
      activeConversationId.current = conv.id;
      pendingFolderId.current = conv.folderId;
    }
    const convId = activeConversationId.current!;

    const storedUserMsg = storeAddMessage(convId, text, 'user');
    const newUserMsg: Message = {
      id: storedUserMsg.id,
      text,
      isUser: true,
      timestamp: storedUserMsg.timestamp,
      isStarred: storedUserMsg.isStarred,
      isPinned: storedUserMsg.isPinned,
    };
    const botMsgId = (Date.now() + 1).toString();
    const newBotMsg: Message = {
      id: botMsgId,
      text: '',
      isUser: false,
      timestamp: new Date().toISOString(),
      isStarred: false,
      isPinned: false,
    };
    setMessages(prev => [...prev, newUserMsg, newBotMsg]);
    setInputText('');
    setIsGenerating(true);
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);

    if (!llamaContext) {
      const errText = "Error: AI not loaded.";
      setMessages(prev => prev.map(msg => msg.id === botMsgId ? { ...msg, text: errText } : msg));
      const storedBotMsg = storeAddMessage(convId, errText, 'assistant');
      setMessages(prev => prev.map(msg => msg.id === botMsgId ? {
        ...msg,
        id: storedBotMsg.id,
          timestamp: storedBotMsg.timestamp,
          isPinned: storedBotMsg.isPinned,
        } : msg));
      setIsGenerating(false); return;
    }
    const formattedPrompt = `<|begin_of_text|><|start_header_id|>user<|end_header_id|>\n\n${text}<|eot_id|><|start_header_id|>assistant<|end_header_id|>\n\n`;
    let fullResponse = "";
    try {
      await llamaContext.completion(
        { prompt: formattedPrompt, n_predict: 256, temperature: 0.7 },
        (result: any) => {
          fullResponse += result.token;
          setMessages(prev => prev.map(msg => msg.id === botMsgId ? { ...msg, text: msg.text + result.token } : msg));
        }
      );
      if (fullResponse.trim().length > 0) {
        Tts.speak(fullResponse.replace(/<[^>]*>?/gm, ''));
        const storedBotMsg = storeAddMessage(convId, fullResponse, 'assistant');
        setMessages(prev => prev.map(msg => msg.id === botMsgId ? {
          ...msg,
          id: storedBotMsg.id,
          timestamp: storedBotMsg.timestamp,
          isStarred: storedBotMsg.isStarred,
          isPinned: storedBotMsg.isPinned,
        } : msg));
      }
    } catch (error) { console.error("Generation crashed:", error); }
    finally { setIsGenerating(false); }
  };

  return (
    <LinearGradient colors={['#050a14', '#051633']} style={styles.container}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        {needsModel && isFocused && (
          <View style={[StyleSheet.absoluteFill, styles.modalOverlay]}>
            <View style={styles.modalBox}>
              <Text style={styles.modalTitle}>Download Required</Text>
              {ALL_MODELS.map((model) => (
                <View key={model.name} style={styles.modelCard}>
                  <Text style={styles.modelNameText}>{model.name}</Text>
                  <TouchableOpacity
                    style={[styles.downloadBtn, downloading[model.name] && { backgroundColor: '#ef4444' }]}
                    onPress={() => downloading[model.name] ? cancelDownload(model) : handleDownload(model)}
                  >
                    <Text style={styles.downloadBtnText}>
                      {downloading[model.name] ? `Stop Download (${progresses[model.name] || 0}%)` : 'Download'}
                    </Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ── Header ── */}
        <View style={styles.header}>
          {/* ☰ Hamburger → opens ChatGPT-style sidebar */}
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
            <TouchableOpacity
              onPress={handleTogglePinConversation}
              style={{ padding: 10 }}
              hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
            >
              <Text style={styles.exportText}>Pin</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleExportCurrentConversation}
              style={{ padding: 10 }}
              hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
            >
              <Text style={styles.exportText}>Export</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => { Keyboard.dismiss(); navigation.navigate('Settings'); }}
              style={{ padding: 10 }}
              hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
            >
              <Image source={require('../assets/icons/settings.png')} style={styles.headerIconImage} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                pendingFolderId.current = null;
                clearChat();
              }}
              style={{ padding: 10 }}
              hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
            >
              <Image source={require('../assets/icons/new_chat.png')} style={styles.headerIconImage} />
            </TouchableOpacity>
          </View>
        </View>

        {messages.length === 0 ? (
          <View style={styles.emptyChatContainer}>
            <Text style={styles.helloText}>Hello, Ask me Anything</Text>
            <View style={{ height: 120 }}>
              <FlatList
                data={PROMPTS} horizontal showsHorizontalScrollIndicator={false} keyExtractor={(item) => item}
                contentContainerStyle={styles.promptsContainer}
                keyboardShouldPersistTaps="handled"
                renderItem={({ item }) => (
                  <TouchableOpacity style={styles.promptCard} onPress={() => sendMessage(item)}>
                    <Text style={styles.promptText}>{item}</Text>
                  </TouchableOpacity>
                )}
              />
            </View>
          </View>
        ) : (
          <>
            {messages.some(item => item.isPinned) && (() => {
              const pinnedIndex = [...messages].map((m, i) => ({ m, i })).reverse().find(({ m }) => m.isPinned)?.i ?? -1;
              return (
                <TouchableOpacity
                  activeOpacity={0.75}
                  style={styles.pinnedBar}
                  onPress={() => {
                    if (pinnedIndex >= 0) {
                      flatListRef.current?.scrollToIndex({ index: pinnedIndex, animated: true, viewPosition: 0.3 });
                    }
                  }}
                >
                  <Text style={styles.pinnedLabel}>📌 Pinned — tap to jump</Text>
                  <Text style={styles.pinnedText} numberOfLines={2}>
                    {messages[pinnedIndex]?.text}
                  </Text>
                </TouchableOpacity>
              );
            })()}
            <FlatList
              ref={flatListRef} data={messages} keyExtractor={(item) => item.id}
              contentContainerStyle={styles.chatContainer}
              keyboardShouldPersistTaps="handled"
              onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
              onScrollToIndexFailed={(info) => {
                setTimeout(() => flatListRef.current?.scrollToIndex({ index: info.index, animated: true, viewPosition: 0.3 }), 300);
              }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  activeOpacity={0.9}
                  delayLongPress={250}
                  onLongPress={() =>
                    requestAnimationFrame(() => Alert.alert('Message actions', 'Choose an action', [
                      {
                        text: item.isPinned ? 'Unpin' : 'Pin',
                        onPress: () => handleTogglePinMessage(item.id),
                      },
                      {
                        text: item.isStarred ? 'Unstar' : 'Star',
                        onPress: () => handleToggleStarMessage(item.id),
                      },
                      { text: 'Cancel', style: 'cancel' },
                    ]))
                  }
                  style={[styles.messageBubble, item.isUser ? styles.userBubble : styles.botBubble]}
                >
                  <Text style={styles.messageText}>{item.text}</Text>
                  <View style={styles.messageMeta}>
                    {!!item.isPinned && <Text style={styles.pinBadge}>PIN</Text>}
                    {!!item.isStarred && <Text style={styles.starBadge}>STAR</Text>}
                  </View>
                </TouchableOpacity>
              )}
            />
          </>
        )}

        <View style={styles.inputAreaWrapper}>
          <View style={styles.inputContainer}>
            <TouchableOpacity onPress={startListening} disabled={needsModel || isGenerating}>
              <Image
                source={require('../assets/icons/mic.png')}
                style={[styles.micIconImage, isListening && { tintColor: '#ff4444' }]}
              />
            </TouchableOpacity>
            <TextInput
              style={styles.input} placeholder="Message" placeholderTextColor="#666666"
              value={inputText} onChangeText={setInputText} editable={!needsModel && !isGenerating}
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

      {/* Unified Iris Sidebar — conversation management + brand info */}
      <IrisSidebar
        visible={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onSelectConversation={handleSelectConversation}
        activeModelName={currentActiveModel}
        onNewChat={(folderId) => {
          pendingFolderId.current = folderId ?? null;
          clearChat();
        }}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 16,
    marginTop: 10,
  },
  hamburgerBtn: { padding: 10, gap: 5, justifyContent: 'center' },
  hamburgerLine: { width: 22, height: 2, backgroundColor: '#ffffff', borderRadius: 2 },
  headerTitle: { color: '#ffffff', fontSize: 28, fontWeight: '500' },
  headerIcons: { flexDirection: 'row', gap: 24 },
  exportText: { color: '#ffffff', fontSize: 14, fontWeight: '600' },
  headerIconImage: { width: 24, height: 24, tintColor: '#ffffff' },
  micIconImage: { width: 24, height: 24, tintColor: '#ffffff', marginRight: 12 },
  sendIconImage: { width: 24, height: 24, tintColor: '#ffffff', marginLeft: 12 },
  stopBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#ef4444', alignItems: 'center',
    justifyContent: 'center', marginLeft: 8,
  },
  stopBtnText: { fontSize: 14, color: '#ffffff' },
  emptyChatContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  helloText: { color: '#ffffff', fontSize: 32, fontWeight: '300', textAlign: 'center', marginBottom: 40 },
  pinnedBar: {
    marginHorizontal: 16,
    marginBottom: 4,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#171E2C',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  pinnedLabel: { color: '#F59E0B', fontSize: 11, fontWeight: '700', marginBottom: 4, textTransform: 'uppercase' },
  pinnedText: { color: '#E2E8F0', fontSize: 13, lineHeight: 18 },
  promptsContainer: { paddingHorizontal: 16, gap: 12 },
  promptCard: { backgroundColor: 'rgba(255, 255, 255, 0.05)', width: 200, height: 100, justifyContent: 'center', alignItems: 'center', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  promptText: { color: '#A0A0A5', fontSize: 13, textAlign: 'center' },
  chatContainer: { padding: 16, flexGrow: 1, justifyContent: 'flex-end' },
  messageBubble: { maxWidth: '85%', padding: 14, borderRadius: 18, marginBottom: 12 },
  userBubble: { alignSelf: 'flex-end', backgroundColor: '#171E2C', borderBottomRightRadius: 4 },
  botBubble: { alignSelf: 'flex-start', backgroundColor: 'transparent' },
  messageText: { color: '#E2E8F0', fontSize: 16, lineHeight: 24 },
  messageMeta: { flexDirection: 'row', gap: 8, marginTop: 6 },
  pinBadge: { color: '#F59E0B', fontSize: 11, fontWeight: '700' },
  starBadge: { color: '#F59E0B', fontSize: 11, fontWeight: '700' },
  inputAreaWrapper: { padding: 12, paddingBottom: Platform.OS === 'ios' ? 24 : 12 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#171E2C', borderRadius: 24, paddingHorizontal: 16, paddingVertical: 6, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  input: { flex: 1, color: '#ffffff', fontSize: 16, paddingVertical: 10 },
  modalOverlay: { backgroundColor: 'rgba(5, 10, 20, 0.95)', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  modalBox: { backgroundColor: '#1e293b', width: '85%', borderRadius: 16, padding: 24, alignItems: 'center' },
  modalTitle: { color: '#ffffff', fontSize: 20, fontWeight: 'bold', marginBottom: 20 },
  modelCard: { backgroundColor: '#0f172a', width: '100%', borderRadius: 12, padding: 16, marginBottom: 12, alignItems: 'center' },
  modelNameText: { color: '#94a3b8', fontSize: 14, marginBottom: 12, textAlign: 'center' },
  downloadBtn: { backgroundColor: '#2563EB', width: '100%', paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  downloadBtnText: { color: '#ffffff', fontWeight: 'bold', fontSize: 16 },
});
