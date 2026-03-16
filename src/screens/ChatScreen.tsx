// import React, { useState, useEffect, useRef } from 'react';
// import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, KeyboardAvoidingView, Platform, Keyboard, Image } from 'react-native';
// import { useIsFocused } from '@react-navigation/native';
// import RNFS from 'react-native-fs';
// import { initLlama } from 'llama.rn';
// import Voice, { SpeechResultsEvent } from '@react-native-voice/voice';
// import Tts from 'react-native-tts';
// import LinearGradient from 'react-native-linear-gradient';
// import { ALL_MODELS, checkFileExists, downloadModel, IrisModel } from '../services/ModelService';

// interface Message {
//   id: string;
//   text: string;
//   isUser: boolean;
// }

// const PROMPTS = [
//   "Explain how to develop a consistent reading habit.",
//   "Write an email to your manager requesting leave for a day.",
//   "Suggest time management strategies for handling multiple deadlines effectively.",
//   "Draft a professional LinkedIn message to connect with a recruiter."
// ];

// export default function ChatScreen({ navigation }: any) {
//   const [inputText, setInputText] = useState('');
//   const [messages, setMessages] = useState<Message[]>([]);
//   const [needsModel, setNeedsModel] = useState(false);
//   const [downloading, setDownloading] = useState<{ [key: string]: boolean }>({});
//   const [progresses, setProgresses] = useState<{ [key: string]: number }>({});
//   const [llamaContext, setLlamaContext] = useState<any>(null);
//   const [isGenerating, setIsGenerating] = useState(false);
//   const [isListening, setIsListening] = useState(false);
  
//   const isFocused = useIsFocused();
//   const flatListRef = useRef<FlatList>(null);

//   useEffect(() => {
//     Tts.setDefaultLanguage('en-US');
//     Tts.setDefaultRate(0.5); 
    
//     Voice.onSpeechStart = () => { setIsListening(true); Tts.stop(); };
//     Voice.onSpeechEnd = () => setIsListening(false);
//     Voice.onSpeechError = () => setIsListening(false);
//     Voice.onSpeechPartialResults = (e: SpeechResultsEvent) => { if (e.value && e.value.length > 0) setInputText(e.value[0]); };
//     Voice.onSpeechResults = (e: SpeechResultsEvent) => { if (e.value && e.value.length > 0) setInputText(e.value[0]); };

//     const loadEngine = async () => {
//       let activeModelPath = null;
//       for (const model of ALL_MODELS) {
//         if (await checkFileExists(model.destination)) {
//           activeModelPath = `${RNFS.DocumentDirectoryPath}/${model.destination}`;
//           break;
//         }
//       }
//       if (!activeModelPath) return setNeedsModel(true);
//       setNeedsModel(false);
      
//       if (!llamaContext) {
//         try {
//           const ctx = await initLlama({ model: activeModelPath, use_mlock: true, n_ctx: 2048 });
//           setLlamaContext(ctx);
//         } catch (err) { console.error("Engine failed:", err); }
//       }
//     };

//     if (isFocused) loadEngine();
//     return () => { Voice.destroy().then(Voice.removeAllListeners); Tts.stop(); };
//   }, [isFocused]);

//   const startListening = async () => {
//     if (isListening) await Voice.stop();
//     else { setInputText(''); await Voice.start('en-US'); }
//   };

//   const clearChat = () => {
//     Keyboard.dismiss();
//     setTimeout(() => {
//       if (isGenerating && llamaContext) {
//         try { llamaContext.stopCompletion(); } catch (e) { console.log(e); }
//       }
//       Tts.stop();
//       setMessages([]);
//       setInputText(''); 
//       setIsGenerating(false);
//     }, 50);
//   };

//   const handleDownload = async (model: IrisModel) => {
//     setDownloading(prev => ({ ...prev, [model.name]: true }));
//     try {
//       await downloadModel(model, (p) => setProgresses(prev => ({ ...prev, [model.name]: Math.round(p * 100) })));
//       setNeedsModel(false); 
//     } finally { setDownloading(prev => ({ ...prev, [model.name]: false })); }
//   };

//   const sendMessage = async (text: string = inputText) => {
//     if (!text.trim() || isGenerating) return;
//     if (isListening) await Voice.stop();
//     Tts.stop();

//     const newUserMsg: Message = { id: Date.now().toString(), text, isUser: true };
//     const botMsgId = (Date.now() + 1).toString();
//     const newBotMsg: Message = { id: botMsgId, text: '', isUser: false };
    
//     setMessages(prev => [...prev, newUserMsg, newBotMsg]);
//     setInputText('');
//     setIsGenerating(true);
//     setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);

//     if (!llamaContext) {
//       setMessages(prev => prev.map(msg => msg.id === botMsgId ? { ...msg, text: "Error: AI not loaded." } : msg));
//       setIsGenerating(false); return;
//     }

//     const formattedPrompt = `<|begin_of_text|><|start_header_id|>user<|end_header_id|>\n\n${text}<|eot_id|><|start_header_id|>assistant<|end_header_id|>\n\n`;
//     let fullResponse = ""; 

//     try {
//       await llamaContext.completion(
//         { prompt: formattedPrompt, n_predict: 256, temperature: 0.7 },
//         (result: any) => {
//           fullResponse += result.token;
//           setMessages(prev => prev.map(msg => msg.id === botMsgId ? { ...msg, text: msg.text + result.token } : msg));
//         }
//       );
//       if (fullResponse.trim().length > 0) Tts.speak(fullResponse.replace(/<[^>]*>?/gm, '')); 
//     } catch (error) { console.error("Generation crashed:", error); } 
//     finally { setIsGenerating(false); }
//   };

//   return (
//     <LinearGradient colors={['#050a14', '#051633']} style={styles.container}>
//       <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        
//         {needsModel && isFocused && (
//           <View style={[StyleSheet.absoluteFill, styles.modalOverlay]}>
//             <View style={styles.modalBox}>
//               <Text style={styles.modalTitle}>Download Required</Text>
//               {ALL_MODELS.map((model) => (
//                 <View key={model.name} style={styles.modelCard}>
//                   <Text style={styles.modelNameText}>{model.name}</Text>
//                   <TouchableOpacity 
//                     style={[styles.downloadBtn, downloading[model.name] && styles.downloadBtnActive]}
//                     onPress={() => !downloading[model.name] && handleDownload(model)}
//                   >
//                     <Text style={styles.downloadBtnText}>
//                       {downloading[model.name] ? `Downloading... ${progresses[model.name] || 0}%` : 'Download'}
//                     </Text>
//                   </TouchableOpacity>
//                 </View>
//               ))}
//             </View>
//           </View>
//         )}

//         <View style={styles.header}>
//           <Text style={styles.headerTitle}>Iris</Text>
//           <View style={styles.headerIcons}>
            
//             <TouchableOpacity 
//               onPress={() => { Keyboard.dismiss(); navigation.navigate('Settings'); }}
//               style={{ padding: 10 }}
//             >
//               <Image source={require('../assets/icons/settings.png')} style={styles.headerIconImage} />
//             </TouchableOpacity>

//             <TouchableOpacity 
//               onPress={clearChat}
//               style={{ padding: 10 }}
//             >
//               <Image source={require('../assets/icons/new_chat.png')} style={styles.headerIconImage} />
//             </TouchableOpacity>

//           </View>
//         </View>

//         {messages.length === 0 ? (
//           <View style={styles.emptyChatContainer}>
//             <Text style={styles.helloText}>Hello, Ask me Anything</Text>
//             <View style={{ height: 120 }}> 
//               <FlatList 
//                 data={PROMPTS} horizontal showsHorizontalScrollIndicator={false} keyExtractor={(item) => item}
//                 contentContainerStyle={styles.promptsContainer}
//                 keyboardShouldPersistTaps="handled"
//                 renderItem={({ item }) => (
//                   <TouchableOpacity style={styles.promptCard} onPress={() => sendMessage(item)}>
//                     <Text style={styles.promptText}>{item}</Text>
//                   </TouchableOpacity>
//                 )}
//               />
//             </View>
//           </View>
//         ) : (
//           <FlatList
//             ref={flatListRef} data={messages} keyExtractor={(item) => item.id}
//             contentContainerStyle={styles.chatContainer}
//             keyboardShouldPersistTaps="handled"
//             onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
//             renderItem={({ item }) => (
//               <View style={[styles.messageBubble, item.isUser ? styles.userBubble : styles.botBubble]}>
//                 <Text style={styles.messageText}>{item.text}</Text>
//               </View>
//             )}
//           />
//         )}

//         <View style={styles.inputAreaWrapper}>
//           <View style={styles.inputContainer}>
//             <TouchableOpacity onPress={startListening} disabled={needsModel || isGenerating}>
//                <Image 
//                  source={require('../assets/icons/mic.png')} 
//                  style={[styles.micIconImage, isListening && { tintColor: '#ff4444' }]} 
//                />
//             </TouchableOpacity>
//             <TextInput
//               style={styles.input} placeholder="Message" placeholderTextColor="#666666"
//               value={inputText} onChangeText={setInputText} editable={!needsModel && !isGenerating}
//               onSubmitEditing={() => sendMessage()}
//             />
//             <TouchableOpacity onPress={() => sendMessage()} disabled={needsModel || isGenerating}>
//               <Image source={require('../assets/icons/send.png')} style={styles.sendIconImage} />
//             </TouchableOpacity>
//           </View>
//         </View>
//       </KeyboardAvoidingView>
//     </LinearGradient>
//   );
// }

// const styles = StyleSheet.create({
//   container: { flex: 1 },
//   header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, marginTop: 10 },
//   headerTitle: { color: '#ffffff', fontSize: 28, fontWeight: '500' },
//   headerIcons: { flexDirection: 'row', gap: 24 },
  
//   // 🔥 New Icon Styles
//   headerIconImage: { width: 24, height: 24, tintColor: '#ffffff' },
//   micIconImage: { width: 24, height: 24, tintColor: '#ffffff', marginRight: 12 },
//   sendIconImage: { width: 24, height: 24, tintColor: '#ffffff', marginLeft: 12 },

//   emptyChatContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
//   helloText: { color: '#ffffff', fontSize: 32, fontWeight: '300', textAlign: 'center', marginBottom: 40 },
//   promptsContainer: { paddingHorizontal: 16, gap: 12 },
//   promptCard: { backgroundColor: 'rgba(255, 255, 255, 0.05)', width: 200, height: 100, justifyContent: 'center', alignItems: 'center', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
//   promptText: { color: '#A0A0A5', fontSize: 13, textAlign: 'center' },
//   chatContainer: { padding: 16, flexGrow: 1, justifyContent: 'flex-end' },
//   messageBubble: { maxWidth: '85%', padding: 14, borderRadius: 18, marginBottom: 12 },
//   userBubble: { alignSelf: 'flex-end', backgroundColor: '#171E2C', borderBottomRightRadius: 4 },
//   botBubble: { alignSelf: 'flex-start', backgroundColor: 'transparent' },
//   messageText: { color: '#E2E8F0', fontSize: 16, lineHeight: 24 },
//   inputAreaWrapper: { padding: 12, paddingBottom: Platform.OS === 'ios' ? 24 : 12 },
//   inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#171E2C', borderRadius: 24, paddingHorizontal: 16, paddingVertical: 6, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
//   input: { flex: 1, color: '#ffffff', fontSize: 16, paddingVertical: 10 },
//   modalOverlay: { backgroundColor: 'rgba(5, 10, 20, 0.95)', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
//   modalBox: { backgroundColor: '#1e293b', width: '85%', borderRadius: 16, padding: 24, alignItems: 'center' },
//   modalTitle: { color: '#ffffff', fontSize: 20, fontWeight: 'bold', marginBottom: 20 },
//   modelCard: { backgroundColor: '#0f172a', width: '100%', borderRadius: 12, padding: 16, marginBottom: 12, alignItems: 'center' },
//   modelNameText: { color: '#94a3b8', fontSize: 14, marginBottom: 12, textAlign: 'center' },
//   downloadBtn: { backgroundColor: '#2563EB', width: '100%', paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
//   downloadBtnActive: { backgroundColor: '#475569' },
//   downloadBtnText: { color: '#ffffff', fontWeight: 'bold', fontSize: 16 }
// });

import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, KeyboardAvoidingView, Platform, Keyboard, Image } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import RNFS from 'react-native-fs';
import { initLlama } from 'llama.rn';
import Voice, { SpeechResultsEvent } from '@react-native-voice/voice';
import Tts from 'react-native-tts';
import LinearGradient from 'react-native-linear-gradient';
import { ALL_MODELS, checkFileExists, downloadModel, IrisModel } from '../services/ModelService';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
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
  const [isGenerating, setIsGenerating] = useState(false);
  const [isListening, setIsListening] = useState(false);
  
  const isFocused = useIsFocused();
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    Tts.setDefaultLanguage('en-US');
    Tts.setDefaultRate(0.5); 
    
    Voice.onSpeechStart = () => { setIsListening(true); Tts.stop(); };
    Voice.onSpeechEnd = () => setIsListening(false);
    Voice.onSpeechError = () => setIsListening(false);
    Voice.onSpeechPartialResults = (e: SpeechResultsEvent) => { if (e.value && e.value.length > 0) setInputText(e.value[0]); };
    Voice.onSpeechResults = (e: SpeechResultsEvent) => { if (e.value && e.value.length > 0) setInputText(e.value[0]); };

    const loadEngine = async () => {
      let activeModelPath = null;
      for (const model of ALL_MODELS) {
        if (await checkFileExists(model.destination)) {
          activeModelPath = `${RNFS.DocumentDirectoryPath}/${model.destination}`;
          break;
        }
      }
      if (!activeModelPath) return setNeedsModel(true);
      setNeedsModel(false);
      
      if (!llamaContext) {
        try {
          const ctx = await initLlama({ model: activeModelPath, use_mlock: true, n_ctx: 2048 });
          setLlamaContext(ctx);
        } catch (err) { console.error("Engine failed:", err); }
      }
    };

    if (isFocused) loadEngine();
    return () => { Voice.destroy().then(Voice.removeAllListeners); Tts.stop(); };
  }, [isFocused]);

  const startListening = async () => {
    if (isListening) await Voice.stop();
    else { setInputText(''); await Voice.start('en-US'); }
  };

  const clearChat = () => {
    Keyboard.dismiss();
    setTimeout(() => {
      if (isGenerating && llamaContext) {
        try { llamaContext.stopCompletion(); } catch (e) { console.log(e); }
      }
      Tts.stop();
      setMessages([]);
      setInputText(''); 
      setIsGenerating(false);
    }, 50);
  };

  const handleDownload = async (model: IrisModel) => {
    setDownloading(prev => ({ ...prev, [model.name]: true }));
    try {
      await downloadModel(model, (p) => setProgresses(prev => ({ ...prev, [model.name]: Math.round(p * 100) })));
      setNeedsModel(false); 
    } finally { setDownloading(prev => ({ ...prev, [model.name]: false })); }
  };

  const sendMessage = async (text: string = inputText) => {
    if (!text.trim() || isGenerating) return;
    if (isListening) await Voice.stop();
    Tts.stop();

    const newUserMsg: Message = { id: Date.now().toString(), text, isUser: true };
    const botMsgId = (Date.now() + 1).toString();
    const newBotMsg: Message = { id: botMsgId, text: '', isUser: false };
    
    setMessages(prev => [...prev, newUserMsg, newBotMsg]);
    setInputText('');
    setIsGenerating(true);
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);

    if (!llamaContext) {
      setMessages(prev => prev.map(msg => msg.id === botMsgId ? { ...msg, text: "Error: AI not loaded." } : msg));
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
      if (fullResponse.trim().length > 0) Tts.speak(fullResponse.replace(/<[^>]*>?/gm, '')); 
    } catch (error) { console.error("Generation crashed:", error); } 
    finally { setIsGenerating(false); }
  };

  return (
    <LinearGradient colors={['#050a14', '#051633']} style={styles.container}>
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        
        {needsModel && isFocused && (
          <View style={[StyleSheet.absoluteFill, styles.modalOverlay]}>
            <View style={styles.modalBox}>
              <Text style={styles.modalTitle}>Download Required</Text>
              {ALL_MODELS.map((model) => (
                <View key={model.name} style={styles.modelCard}>
                  <Text style={styles.modelNameText}>{model.name}</Text>
                  <TouchableOpacity 
                    style={[styles.downloadBtn, downloading[model.name] && styles.downloadBtnActive]}
                    onPress={() => !downloading[model.name] && handleDownload(model)}
                  >
                    <Text style={styles.downloadBtnText}>
                      {downloading[model.name] ? `Downloading... ${progresses[model.name] || 0}%` : 'Download'}
                    </Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={styles.header}>
          <Text style={styles.headerTitle}>Iris</Text>
          <View style={styles.headerIcons}>
            
            {/* 🔥 ADDED hitSlop TO MAKE IT SUPER EASY TO CLICK WITHOUT CHANGING LOGIC */}
            <TouchableOpacity 
              onPress={() => { Keyboard.dismiss(); navigation.navigate('Settings'); }}
              style={{ padding: 10 }}
              hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
            >
              <Image source={require('../assets/icons/settings.png')} style={styles.headerIconImage} />
            </TouchableOpacity>

            {/* 🔥 ADDED hitSlop HERE TOO JUST IN CASE */}
            <TouchableOpacity 
              onPress={clearChat}
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
          <FlatList
            ref={flatListRef} data={messages} keyExtractor={(item) => item.id}
            contentContainerStyle={styles.chatContainer}
            keyboardShouldPersistTaps="handled"
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            renderItem={({ item }) => (
              <View style={[styles.messageBubble, item.isUser ? styles.userBubble : styles.botBubble]}>
                <Text style={styles.messageText}>{item.text}</Text>
              </View>
            )}
          />
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
            <TouchableOpacity onPress={() => sendMessage()} disabled={needsModel || isGenerating}>
              <Image source={require('../assets/icons/send.png')} style={styles.sendIconImage} />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, marginTop: 10 },
  headerTitle: { color: '#ffffff', fontSize: 28, fontWeight: '500' },
  headerIcons: { flexDirection: 'row', gap: 24 },
  
  headerIconImage: { width: 24, height: 24, tintColor: '#ffffff' },
  micIconImage: { width: 24, height: 24, tintColor: '#ffffff', marginRight: 12 },
  sendIconImage: { width: 24, height: 24, tintColor: '#ffffff', marginLeft: 12 },

  emptyChatContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  helloText: { color: '#ffffff', fontSize: 32, fontWeight: '300', textAlign: 'center', marginBottom: 40 },
  promptsContainer: { paddingHorizontal: 16, gap: 12 },
  promptCard: { backgroundColor: 'rgba(255, 255, 255, 0.05)', width: 200, height: 100, justifyContent: 'center', alignItems: 'center', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  promptText: { color: '#A0A0A5', fontSize: 13, textAlign: 'center' },
  chatContainer: { padding: 16, flexGrow: 1, justifyContent: 'flex-end' },
  messageBubble: { maxWidth: '85%', padding: 14, borderRadius: 18, marginBottom: 12 },
  userBubble: { alignSelf: 'flex-end', backgroundColor: '#171E2C', borderBottomRightRadius: 4 },
  botBubble: { alignSelf: 'flex-start', backgroundColor: 'transparent' },
  messageText: { color: '#E2E8F0', fontSize: 16, lineHeight: 24 },
  inputAreaWrapper: { padding: 12, paddingBottom: Platform.OS === 'ios' ? 24 : 12 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#171E2C', borderRadius: 24, paddingHorizontal: 16, paddingVertical: 6, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  input: { flex: 1, color: '#ffffff', fontSize: 16, paddingVertical: 10 },
  modalOverlay: { backgroundColor: 'rgba(5, 10, 20, 0.95)', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  modalBox: { backgroundColor: '#1e293b', width: '85%', borderRadius: 16, padding: 24, alignItems: 'center' },
  modalTitle: { color: '#ffffff', fontSize: 20, fontWeight: 'bold', marginBottom: 20 },
  modelCard: { backgroundColor: '#0f172a', width: '100%', borderRadius: 12, padding: 16, marginBottom: 12, alignItems: 'center' },
  modelNameText: { color: '#94a3b8', fontSize: 14, marginBottom: 12, textAlign: 'center' },
  downloadBtn: { backgroundColor: '#2563EB', width: '100%', paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  downloadBtnActive: { backgroundColor: '#475569' },
  downloadBtnText: { color: '#ffffff', fontWeight: 'bold', fontSize: 16 }
});