// import React, { useState, useEffect, useRef } from 'react';
// import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, KeyboardAvoidingView, Platform, Keyboard, Image, ToastAndroid } from 'react-native';
// import { useIsFocused } from '@react-navigation/native';
// import RNFS from 'react-native-fs';
// import { initLlama } from 'llama.rn';
// import Voice, { SpeechResultsEvent } from '@react-native-voice/voice';
// import Tts from 'react-native-tts';
// import LinearGradient from 'react-native-linear-gradient';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import { ALL_MODELS, checkFileExists, downloadModel, IrisModel } from '../services/ModelService';
// import NerveSparksDrawer from '../components/NerveSparksDrawer';

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
//   const [currentLoadedPath, setCurrentLoadedPath] = useState<string | null>(null);

//   const [isGenerating, setIsGenerating] = useState(false);
//   const [isListening, setIsListening] = useState(false);

//   const [isDrawerOpen, setIsDrawerOpen] = useState(false);
//   const [touchStartX, setTouchStartX] = useState(0);
//   const [currentActiveModel, setCurrentActiveModel] = useState("No active model");
  
//   const isFocused = useIsFocused();
//   const flatListRef = useRef<FlatList>(null);

//   // 🔥 MOVED OUTSIDE USE-EFFECT SO DOWNLOAD BUTTON CAN TRIGGER IT
//   const loadEngine = async () => {
//     let activeModelPath = null;
//     let modelNameForDrawer = "No active model";

//     const savedModelName = await AsyncStorage.getItem('ACTIVE_MODEL_NAME');

//     if (savedModelName) {
//       const modelObj = ALL_MODELS.find(m => m.name === savedModelName);
//       const potentialPath = modelObj ? modelObj.destination : savedModelName;
//       const fullPath = `${RNFS.DocumentDirectoryPath}/${potentialPath}`;
      
//       if (await RNFS.exists(fullPath)) {
//         activeModelPath = fullPath;
//         modelNameForDrawer = savedModelName;
//       }
//     }

//     if (!activeModelPath) {
//       for (const model of ALL_MODELS) {
//         if (await checkFileExists(model.destination)) {
//           activeModelPath = `${RNFS.DocumentDirectoryPath}/${model.destination}`;
//           modelNameForDrawer = model.name;
//           break;
//         }
//       }
//     }
    
//     setCurrentActiveModel(modelNameForDrawer);

//     if (!activeModelPath) return setNeedsModel(true);
//     setNeedsModel(false);
    
//     if (activeModelPath !== currentLoadedPath) {
//       if (llamaContext) {
//         try { await llamaContext.release(); } catch(e) {}
//       }
//       try {
//         const ctx = await initLlama({ model: activeModelPath, use_mlock: true, n_ctx: 2048 });
//         setLlamaContext(ctx);
//         setCurrentLoadedPath(activeModelPath);
//       } catch (err) { 
//         console.error("Engine failed:", err); 
//       }
//     }
//   };

//   useEffect(() => {
//     Tts.setDefaultLanguage('en-US');
//     Tts.setDefaultRate(0.5); 
    
//     Voice.onSpeechStart = () => { setIsListening(true); Tts.stop(); };
//     Voice.onSpeechEnd = () => setIsListening(false);
//     Voice.onSpeechError = () => setIsListening(false);
//     Voice.onSpeechPartialResults = (e: SpeechResultsEvent) => { if (e.value && e.value.length > 0) setInputText(e.value[0]); };
//     Voice.onSpeechResults = (e: SpeechResultsEvent) => { if (e.value && e.value.length > 0) setInputText(e.value[0]); };

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
    
//     // 🔥 FIX 1: SAFE DELETE - If file is locked, ignore the error and keep downloading
//     try {
//       const destPath = `${RNFS.DocumentDirectoryPath}/${model.destination}`;
//       if (await RNFS.exists(destPath)) {
//         await RNFS.unlink(destPath);
//       }
//     } catch (cleanupError) {
//       console.log("File is locked by engine, attempting to overwrite...");
//     }

//     try {
//       // 🔥 FIX 2: START DOWNLOAD PROPERLY
//       await downloadModel(model, (p) => setProgresses(prev => ({ ...prev, [model.name]: Math.round(p * 100) })));
      
//       await AsyncStorage.setItem('ACTIVE_MODEL_NAME', model.name);
//       setNeedsModel(false); 
      
//       ToastAndroid.show("Download Complete! Loading AI...", ToastAndroid.SHORT);
//       loadEngine(); // Force reload now that file is complete

//     } catch (error: any) {
//       console.log("Download stopped or failed", error);
//       // 🔥 FIX 3: SHOW EXACT ERROR IF IT FAILS
//       ToastAndroid.show(`Failed: ${error.message || "Unknown error"}`, ToastAndroid.LONG);
//     } finally { 
//       setDownloading(prev => ({ ...prev, [model.name]: false })); 
//     }
//   };

//   const cancelDownload = async (model: IrisModel) => {
//     setDownloading(prev => ({ ...prev, [model.name]: false }));
//     setProgresses(prev => ({ ...prev, [model.name]: 0 }));
//     ToastAndroid.show("Download cancelled", ToastAndroid.SHORT);

//     try {
//       const destPath = `${RNFS.DocumentDirectoryPath}/${model.destination}`;
//       if (await RNFS.exists(destPath)) {
//         await RNFS.unlink(destPath);
//       }
//     } catch (e) { console.log("Cleanup failed", e); }
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

//   const handleTouchStart = (e: any) => setTouchStartX(e.nativeEvent.pageX);
//   const handleTouchEnd = (e: any) => {
//     if (e.nativeEvent.pageX - touchStartX > 50) {
//       setIsDrawerOpen(true);
//     }
//   };

//   return (
//     <LinearGradient 
//       colors={['#050a14', '#051633']} 
//       style={styles.container}
//       onTouchStart={handleTouchStart} 
//       onTouchEnd={handleTouchEnd}     
//     >
//       <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        
//         {needsModel && isFocused && (
//           <View style={[StyleSheet.absoluteFill, styles.modalOverlay]}>
//             <View style={styles.modalBox}>
//               <Text style={styles.modalTitle}>Download Required</Text>
//               {ALL_MODELS.map((model) => (
//                 <View key={model.name} style={styles.modelCard}>
//                   <Text style={styles.modelNameText}>{model.name}</Text>
//                   <TouchableOpacity 
//                     style={[styles.downloadBtn, downloading[model.name] && { backgroundColor: '#ef4444' }]}
//                     onPress={() => downloading[model.name] ? cancelDownload(model) : handleDownload(model)}
//                   >
//                     <Text style={styles.downloadBtnText}>
//                       {downloading[model.name] ? `Stop Download (${progresses[model.name] || 0}%)` : 'Download'}
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
//               hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
//             >
//               <Image source={require('../assets/icons/settings.png')} style={styles.headerIconImage} />
//             </TouchableOpacity>

//             <TouchableOpacity 
//               onPress={clearChat}
//               style={{ padding: 10 }}
//               hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
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
      
//       <NerveSparksDrawer 
//         visible={isDrawerOpen} 
//         onClose={() => setIsDrawerOpen(false)} 
//         activeModelName={currentActiveModel} 
//       />

//     </LinearGradient>
//   );
// }

// const styles = StyleSheet.create({
//   container: { flex: 1 },
//   header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, marginTop: 10 },
//   headerTitle: { color: '#ffffff', fontSize: 28, fontWeight: '500' },
//   headerIcons: { flexDirection: 'row', gap: 24 },
  
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
//   downloadBtnText: { color: '#ffffff', fontWeight: 'bold', fontSize: 16 }
// });



// import React, { useState, useEffect, useRef } from 'react';
// import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, KeyboardAvoidingView, Platform, Keyboard, Image, ToastAndroid } from 'react-native';
// import { useIsFocused } from '@react-navigation/native';
// import RNFS from 'react-native-fs';
// import { initLlama } from 'llama.rn';
// import Voice, { SpeechResultsEvent } from '@react-native-voice/voice';
// import Tts from 'react-native-tts';
// import LinearGradient from 'react-native-linear-gradient';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import { ALL_MODELS, downloadModel, IrisModel } from '../services/ModelService';
// import NerveSparksDrawer from '../components/NerveSparksDrawer';

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
//   const [currentLoadedPath, setCurrentLoadedPath] = useState<string | null>(null);

//   const [isGenerating, setIsGenerating] = useState(false);
//   const [isListening, setIsListening] = useState(false);

//   const [isDrawerOpen, setIsDrawerOpen] = useState(false);
//   const [touchStartX, setTouchStartX] = useState(0);
//   const [currentActiveModel, setCurrentActiveModel] = useState("No active model");
  
//   const isFocused = useIsFocused();
//   const flatListRef = useRef<FlatList>(null);

//   const loadEngine = async () => {
//     let activeModelPath = null;
//     let modelNameForDrawer = "No active model";

//     const savedModelName = await AsyncStorage.getItem('ACTIVE_MODEL_NAME');

//     if (savedModelName) {
//       const modelObj = ALL_MODELS.find(m => m.name === savedModelName);
//       const potentialPath = modelObj ? modelObj.destination : savedModelName;
//       const fullPath = `${RNFS.DocumentDirectoryPath}/${potentialPath}`;
      
//       if (await RNFS.exists(fullPath)) {
//         activeModelPath = fullPath;
//         modelNameForDrawer = savedModelName;
//       }
//     }

//     if (!activeModelPath) {
//       try {
//         const files = await RNFS.readDir(RNFS.DocumentDirectoryPath);
//         const ggufFile = files.find(f => f.name.endsWith('.gguf'));
//         if (ggufFile) {
//           activeModelPath = `${RNFS.DocumentDirectoryPath}/${ggufFile.name}`;
//           modelNameForDrawer = ggufFile.name;
//           await AsyncStorage.setItem('ACTIVE_MODEL_NAME', ggufFile.name);
//         }
//       } catch (e) { console.log("Failed to scan directory", e); }
//     }
    
//     setCurrentActiveModel(modelNameForDrawer);

//     if (!activeModelPath) {
//       setNeedsModel(true);
//       return; 
//     }
    
//     setNeedsModel(false);
    
//     if (activeModelPath !== currentLoadedPath) {
//       if (llamaContext) {
//         try { await llamaContext.release(); } catch(e) {}
//       }
//       try {
//         const ctx = await initLlama({ model: activeModelPath, use_mlock: true, n_ctx: 2048 });
//         setLlamaContext(ctx);
//         setCurrentLoadedPath(activeModelPath);
//       } catch (err) { 
//         console.error("Engine failed:", err); 
//       }
//     }
//   };

//   useEffect(() => {
//     Tts.setDefaultLanguage('en-US');
//     Tts.setDefaultRate(0.5); 
    
//     Voice.onSpeechStart = () => { setIsListening(true); Tts.stop(); };
//     Voice.onSpeechEnd = () => setIsListening(false);
//     Voice.onSpeechError = () => setIsListening(false);
//     Voice.onSpeechPartialResults = (e: SpeechResultsEvent) => { if (e.value && e.value.length > 0) setInputText(e.value[0]); };
//     Voice.onSpeechResults = (e: SpeechResultsEvent) => { if (e.value && e.value.length > 0) setInputText(e.value[0]); };

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
//       const destPath = `${RNFS.DocumentDirectoryPath}/${model.destination}`;
//       if (await RNFS.exists(destPath)) {
//         await RNFS.unlink(destPath);
//       }
//     } catch (cleanupError) {
//       console.log("File is locked by engine, attempting to overwrite...");
//     }

//     try {
//       await downloadModel(model, (p) => setProgresses(prev => ({ ...prev, [model.name]: Math.round(p * 100) })));
      
//       await AsyncStorage.setItem('ACTIVE_MODEL_NAME', model.name);
//       setNeedsModel(false); 
      
//       ToastAndroid.show("Download Complete! Loading AI...", ToastAndroid.SHORT);
//       loadEngine(); 

//     } catch (error: any) {
//       console.log("Download stopped or failed", error);
//       ToastAndroid.show(`Failed: ${error.message || "Unknown error"}`, ToastAndroid.LONG);
//     } finally { 
//       setDownloading(prev => ({ ...prev, [model.name]: false })); 
//     }
//   };

//   const cancelDownload = async (model: IrisModel) => {
//     setDownloading(prev => ({ ...prev, [model.name]: false }));
//     setProgresses(prev => ({ ...prev, [model.name]: 0 }));
//     ToastAndroid.show("Download cancelled", ToastAndroid.SHORT);

//     try {
//       const destPath = `${RNFS.DocumentDirectoryPath}/${model.destination}`;
//       if (await RNFS.exists(destPath)) {
//         await RNFS.unlink(destPath);
//       }
//     } catch (e) { console.log("Cleanup failed", e); }
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

//     let formattedPrompt = "";
//     const activeModelLower = currentActiveModel.toLowerCase();
    
//     // 🔥 STRICT SYSTEM PROMPT (Controls length and behavior)
//     const sysPrompt = "You are Iris, a highly capable AI assistant. Keep your answers concise, clear, and strictly to the point. Do not write extra questions, tags, or user dialogues.";

//     if (activeModelLower.includes("llama")) {
//       formattedPrompt = `<|begin_of_text|><|start_header_id|>system<|end_header_id|>\n\n${sysPrompt}<|eot_id|><|start_header_id|>user<|end_header_id|>\n\n${text}<|eot_id|><|start_header_id|>assistant<|end_header_id|>\n\n`;
//     } else if (activeModelLower.includes("qwen")) {
//       formattedPrompt = `<|im_start|>system\n${sysPrompt}<|im_end|>\n<|im_start|>user\n${text}<|im_end|>\n<|im_start|>assistant\n`;
//     } else if (activeModelLower.includes("gemma")) {
//       formattedPrompt = `<start_of_turn>user\n${text}<end_of_turn>\n<start_of_turn>model\n`;
//     } else {
//       formattedPrompt = `System: ${sysPrompt}\nUser: ${text}\nAssistant:`;
//     }

//     let fullResponse = ""; 
//     let isStopped = false; // 🔥 Flag to stop generation

//     try {
//       await llamaContext.completion(
//         { 
//           prompt: formattedPrompt, 
//           n_predict: 256, 
//           temperature: 0.5, // 🔥 Lower creativity to prevent hallucination
//           stop: ["<|im_end|>", "<|eot_id|>", "<end_of_turn>", "<|end_of_text|>", "User:"] 
//         },
//         (result: any) => {
//           if (isStopped) return; 

//           fullResponse += result.token;

//           // 🔥 THE GATEKEEPER: Manually catch and kill rogue tags
//           const stopKeywords = ["<|im_end|>", "<|eot_id|>", "<end_of_turn>", "<|end_of_text|>", "User:", "<|start_header_id|>"];
          
//           for (const keyword of stopKeywords) {
//             if (fullResponse.includes(keyword)) {
//               isStopped = true;
//               fullResponse = fullResponse.split(keyword)[0]; 
//               try { llamaContext.stopCompletion(); } catch(e) {} 
//               break;
//             }
//           }

//           // Strip any partial tags before showing on UI
//           let cleanUIResponse = fullResponse.replace(/<\|.*?\|>/g, '').replace(/<start_of_turn>|<end_of_turn>/g, '').trimStart();

//           setMessages(prev => prev.map(msg => msg.id === botMsgId ? { ...msg, text: cleanUIResponse } : msg));
//         }
//       );
      
//       let spokenText = fullResponse.replace(/<think>[\s\S]*?<\/think>/g, '');
//       spokenText = spokenText.replace(/<[^>]*>?/gm, ''); 
//       if (spokenText.trim().length > 0) Tts.speak(spokenText); 

//     } catch (error) { 
//       console.error("Generation crashed:", error); 
//     } 
//     finally { setIsGenerating(false); }
//   };

//   const handleTouchStart = (e: any) => setTouchStartX(e.nativeEvent.pageX);
//   const handleTouchEnd = (e: any) => {
//     if (e.nativeEvent.pageX - touchStartX > 50) {
//       setIsDrawerOpen(true);
//     }
//   };

//   return (
//     <LinearGradient 
//       colors={['#050a14', '#051633']} 
//       style={styles.container}
//       onTouchStart={handleTouchStart} 
//       onTouchEnd={handleTouchEnd}     
//     >
//       {/* 🔥 FIX: ADDED PROPER BEHAVIOR AND OFFSET FOR ANDROID KEYBOARD */}
//       <KeyboardAvoidingView 
//         style={styles.container} 
//         behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
//         keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
//       >
        
//         {needsModel && isFocused && (
//           <View style={[StyleSheet.absoluteFill, styles.modalOverlay]}>
//             <View style={styles.modalBox}>
//               <Text style={styles.modalTitle}>Download Required</Text>
//               {ALL_MODELS.map((model) => (
//                 <View key={model.name} style={styles.modelCard}>
//                   <Text style={styles.modelNameText}>{model.name}</Text>
//                   <TouchableOpacity 
//                     style={[styles.downloadBtn, downloading[model.name] && { backgroundColor: '#ef4444' }]}
//                     onPress={() => downloading[model.name] ? cancelDownload(model) : handleDownload(model)}
//                   >
//                     <Text style={styles.downloadBtnText}>
//                       {downloading[model.name] ? `Stop Download (${progresses[model.name] || 0}%)` : 'Download'}
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
//               hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
//             >
//               <Image source={require('../assets/icons/settings.png')} style={styles.headerIconImage} />
//             </TouchableOpacity>

//             <TouchableOpacity 
//               onPress={clearChat}
//               style={{ padding: 10 }}
//               hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
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
      
//       <NerveSparksDrawer 
//         visible={isDrawerOpen} 
//         onClose={() => setIsDrawerOpen(false)} 
//         activeModelName={currentActiveModel} 
//       />

//     </LinearGradient>
//   );
// }

// const styles = StyleSheet.create({
//   container: { flex: 1 },
//   header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, marginTop: 10 },
//   headerTitle: { color: '#ffffff', fontSize: 28, fontWeight: '500' },
//   headerIcons: { flexDirection: 'row', gap: 24 },
  
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
//   downloadBtnText: { color: '#ffffff', fontWeight: 'bold', fontSize: 16 }
// });




import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, KeyboardAvoidingView, Platform, Keyboard, Image, ToastAndroid , Dimensions , Alert } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import RNFS from 'react-native-fs';
import { initLlama } from 'llama.rn';
import Voice, { SpeechResultsEvent } from '@react-native-voice/voice';
import Tts from 'react-native-tts';
import LinearGradient from 'react-native-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
// 🔥 IMPORT MARKDOWN LIBRARY
import Markdown from 'react-native-markdown-display';
import { ALL_MODELS, downloadModel, IrisModel } from '../services/ModelService';
import NerveSparksDrawer from '../components/NerveSparksDrawer';

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

const INFO_ITEMS = [
  "Explains complex topics simply.",
  "May sometimes be inaccurate.",
  "Unable to provide current affairs due to no internet connectivity.",
  "Long Press on messages to report."
];

export default function ChatScreen({ navigation }: any) {
  const safeTtsStop = ()=>{
    if (Platform.OS==='android'){
      Tts.stop()
    }
  };
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [needsModel, setNeedsModel] = useState(false);
  const [downloading, setDownloading] = useState<{ [key: string]: boolean }>({});
  const [progresses, setProgresses] = useState<{ [key: string]: number }>({});
  
  const [llamaContext, setLlamaContext] = useState<any>(null);
  const [currentLoadedPath, setCurrentLoadedPath] = useState<string | null>(null);

  const [isGenerating, setIsGenerating] = useState(false);
  const [isListening, setIsListening] = useState(false);

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [touchStartX, setTouchStartX] = useState(0);
  const [currentActiveModel, setCurrentActiveModel] = useState("No active model");
  
  const isFocused = useIsFocused();
  const flatListRef = useRef<FlatList>(null);

  // 🔥 1. FIXED: RAM FLUSHER, PATH SANITIZER & IOS MEMORY OPTIMIZED
  // 🔥 THE DETECTIVE ENGINE: Checks File Size & Uses Apple GPU
  // 🔥 THE BULLETPROOF ENGINE (Diagnose + Auto-Fallback)
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
          activeModelPath = ggufFile.path; // 🔥 Using absolute OS path safely
          modelNameForDrawer = ggufFile.name;
          await AsyncStorage.setItem('ACTIVE_MODEL_NAME', ggufFile.name);
        }
      } catch (e) { console.log(e); }
    }
    
    setCurrentActiveModel(modelNameForDrawer);

    if (!activeModelPath) {
      setNeedsModel(true);
      return; 
    }
    
    setNeedsModel(false);
    
    if (activeModelPath !== currentLoadedPath) {
      if (llamaContext) {
        try { await llamaContext.release(); } catch(e) {}
        setLlamaContext(null); 
      }

      await new Promise(resolve => setTimeout(resolve, 1000));

      try {
        // 🕵️‍♂️ 1. DETECTIVE MODE: Check Real File Size
        const stat = await RNFS.stat(activeModelPath);
        const sizeInMB = stat.size / (1024 * 1024);
        
        if (sizeInMB < 50) {
          Alert.alert(
            "Corrupt Download ❌", 
            `File size is only ${sizeInMB.toFixed(2)} MB. The model didn't download completely. Delete it and try downloading again.`
          );
          return;
        }

        // 🚀 2. ATTEMPT 1: FAST GPU LOAD
        const cleanPath = activeModelPath.replace(/^file:\/\//, '');
        
        const ctx = await initLlama({ 
          model: cleanPath, 
          use_mlock: false, // iOS strictly hates memory locks
          n_ctx: 1024,      // Safe context window
          n_gpu_layers: Platform.OS === 'ios' ? 50 : 0 // Enable Apple Metal GPU
        });
        
        setLlamaContext(ctx);
        setCurrentLoadedPath(activeModelPath);
        console.log("Loaded successfully on GPU!");

      } catch (err) { 
        console.error("GPU Load failed, trying Fallback CPU mode...", err); 
        
        // 🛡️ 3. ATTEMPT 2: SAFE CPU FALLBACK (Agar GPU/Metal reject kar de)
        try {
          const filePrefixedPath = `file://${activeModelPath.replace(/^file:\/\//, '')}`;
          
          const ctxFallback = await initLlama({ 
            model: filePrefixedPath, 
            use_mlock: false, 
            n_ctx: 1024,
            n_gpu_layers: 0 // Completely OFF for absolute safety
          });
          
          setLlamaContext(ctxFallback);
          setCurrentLoadedPath(activeModelPath);
          console.log("Loaded successfully on Fallback CPU!");

        } catch (fallbackErr) {
          Alert.alert(
            "Engine Crash ⚠️", 
            "The model file exists, but the AI engine refused to load it. It might be unsupported or requires more RAM than available."
          );
        }
      }
    }
  };

  useEffect(() => {
    Tts.setDefaultLanguage('en-US');
    if (Platform.OS ==='android'){
      Tts.setDefaultRate(0.5);
    }
     
    
    Voice.onSpeechStart = () => { setIsListening(true); safeTtsStop(); };
    Voice.onSpeechEnd = () => setIsListening(false);
    Voice.onSpeechError = () => setIsListening(false);
    Voice.onSpeechPartialResults = (e: SpeechResultsEvent) => { if (e.value && e.value.length > 0) setInputText(e.value[0]); };
    Voice.onSpeechResults = (e: SpeechResultsEvent) => { if (e.value && e.value.length > 0) setInputText(e.value[0]); };

    if (isFocused) loadEngine();
    return () => { Voice.destroy().then(Voice.removeAllListeners); safeTtsStop(); };
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
      safeTtsStop();
      setMessages([]);
      setInputText(''); 
      setIsGenerating(false);
    }, 50);
  };

  const handleDownload = async (model: IrisModel) => {
    setDownloading(prev => ({ ...prev, [model.name]: true }));
    
    try {
      const destPath = `${RNFS.DocumentDirectoryPath}/${model.destination}`;
      if (await RNFS.exists(destPath)) {
        await RNFS.unlink(destPath);
      }
    } catch (cleanupError) {
      console.log("File is locked by engine, attempting to overwrite...");
    }

    try {
      await downloadModel(model, (p) => setProgresses(prev => ({ ...prev, [model.name]: Math.round(p * 100) })));
      
      await AsyncStorage.setItem('ACTIVE_MODEL_NAME', model.name);
      setNeedsModel(false); 
      
      ToastAndroid.show("Download Complete! Loading AI...", ToastAndroid.SHORT);
      loadEngine(); 

    } catch (error: any) {
      console.log("Download stopped or failed", error);
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
      if (await RNFS.exists(destPath)) {
        await RNFS.unlink(destPath);
      }
    } catch (e) { console.log("Cleanup failed", e); }
  };

  // 🔥 2. FIXED: VOICE REMOVED FROM BOT REPLY
  const sendMessage = async (text: string = inputText) => {
    if (!text.trim() || isGenerating) return;
    if (isListening) await Voice.stop();
    safeTtsStop();

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

    let formattedPrompt = "";
    const activeModelLower = currentActiveModel.toLowerCase();
    
    const sysPrompt = "You are Iris, a highly capable AI assistant. Keep your answers concise, clear, and strictly to the point. Do not write extra questions, tags, or user dialogues.";

    if (activeModelLower.includes("llama")) {
      formattedPrompt = `<|begin_of_text|><|start_header_id|>system<|end_header_id|>\n\n${sysPrompt}<|eot_id|><|start_header_id|>user<|end_header_id|>\n\n${text}<|eot_id|><|start_header_id|>assistant<|end_header_id|>\n\n`;
    } else if (activeModelLower.includes("qwen")) {
      formattedPrompt = `<|im_start|>system\n${sysPrompt}<|im_end|>\n<|im_start|>user\n${text}<|im_end|>\n<|im_start|>assistant\n`;
    } else if (activeModelLower.includes("gemma")) {
      formattedPrompt = `<start_of_turn>user\n${text}<end_of_turn>\n<start_of_turn>model\n`;
    } else {
      formattedPrompt = `System: ${sysPrompt}\nUser: ${text}\nAssistant:`;
    }

    let fullResponse = ""; 
    let isStopped = false; 

    try {
      await llamaContext.completion(
        { 
          prompt: formattedPrompt, 
          n_predict: 256, 
          temperature: 0.5, 
          stop: ["<|im_end|>", "<|eot_id|>", "<end_of_turn>", "<|end_of_text|>", "User:"] 
        },
        (result: any) => {
          if (isStopped) return; 

          fullResponse += result.token;

          const stopKeywords = ["<|im_end|>", "<|eot_id|>", "<end_of_turn>", "<|end_of_text|>", "User:", "<|start_header_id|>"];
          
          for (const keyword of stopKeywords) {
            if (fullResponse.includes(keyword)) {
              isStopped = true;
              fullResponse = fullResponse.split(keyword)[0]; 
              try { llamaContext.stopCompletion(); } catch(e) {} 
              break;
            }
          }

          let cleanUIResponse = fullResponse.replace(/<\|.*?\|>/g, '').replace(/<start_of_turn>|<end_of_turn>/g, '').trimStart();

          setMessages(prev => prev.map(msg => msg.id === botMsgId ? { ...msg, text: cleanUIResponse } : msg));
        }
      );
      // Voice engine calls removed completely from here
    } catch (error) { 
      console.error("Generation crashed:", error); 
    } 
    finally { setIsGenerating(false); }
  };

  const handleTouchStart = (e: any) => setTouchStartX(e.nativeEvent.pageX);
  const handleTouchEnd = (e: any) => {
    if (e.nativeEvent.pageX - touchStartX > 50) {
      setIsDrawerOpen(true);
    }
  };

  return (
    <LinearGradient 
      colors={['#050a14', '#051633']} 
      style={styles.container}
      onTouchStart={handleTouchStart} 
      onTouchEnd={handleTouchEnd}     
    >
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

        <View style={styles.header}>
          <Text style={styles.headerTitle}>Iris</Text>
          <View style={styles.headerIcons}>
            
            <TouchableOpacity 
              onPress={() => { Keyboard.dismiss(); navigation.navigate('Settings'); }}
              style={{ padding: 10 }}
              hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
            >
              <Image source={require('../assets/icons/settings.png')} style={styles.headerIconImage} />
            </TouchableOpacity>

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
            {/* 1. TEXT RESIZED & SPLIT */}
            <Text style={styles.helloText}>Hello, Ask me{'\n'}Anything</Text>

            {/* 2. THE 4 INFO PILLS */}
            <View style={styles.infoItemsContainer}>
              {INFO_ITEMS.map((item, index) => (
                <View key={index} style={styles.infoPill}>
                  <View style={styles.infoIconWrapper}>
                    <Text style={styles.infoIconText}>i</Text>
                  </View>
                  <Text style={styles.infoText}>{item}</Text>
                </View>
              ))}
            </View>

            {/* 3. PROMPTS SLIDER (Logic untouched) */}
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
            // 🔥 3. FIXED: MARKDOWN FOR BOT MESSAGES
            renderItem={({ item }) => (
              <View style={[styles.messageBubble, item.isUser ? styles.userBubble : styles.botBubble]}>
                {item.isUser ? (
                  <Text style={styles.messageText}>{item.text}</Text>
                ) : (
                  <Markdown style={markdownStyles}>
                    {item.text}
                  </Markdown>
                )}
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
      
      <NerveSparksDrawer 
        visible={isDrawerOpen} 
        onClose={() => setIsDrawerOpen(false)} 
        activeModelName={currentActiveModel} 
      />

    </LinearGradient>
  );
}

// 🔥 ADDED MARKDOWN STYLES FOR DARK THEME
const markdownStyles = StyleSheet.create({
  body: { color: '#E2E8F0', fontSize: 16, lineHeight: 24 },
  strong: { fontWeight: 'bold', color: '#ffffff' },
  em: { fontStyle: 'italic', color: '#E2E8F0' },
  paragraph: { marginTop: 0, marginBottom: 10 },
  code_inline: { backgroundColor: '#2d3748', color: '#a78bfa', padding: 4, borderRadius: 4, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  fence: { backgroundColor: '#1e293b', color: '#e2e8f0', padding: 10, borderRadius: 8, marginTop: 5, marginBottom: 5, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  list_item: { color: '#E2E8F0', fontSize: 16, lineHeight: 24 },
  bullet_list: { marginTop: 0, marginBottom: 10 },
  ordered_list: { marginTop: 0, marginBottom: 10 },
});

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, marginTop: 10 },
  headerTitle: { color: '#ffffff', fontSize: 28, fontWeight: '500' },
  headerIcons: { flexDirection: 'row', gap: 24 },
  
  headerIconImage: { width: 24, height: 24, tintColor: '#ffffff' },
  micIconImage: { width: 24, height: 24, tintColor: '#ffffff', marginRight: 12 },
  sendIconImage: { width: 24, height: 24, tintColor: '#ffffff', marginLeft: 12 },

  emptyChatContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 16 },
  helloText: { color: '#f8fafc', fontSize: 34, fontWeight: '400', textAlign: 'center', marginBottom: 24 }, // Size reduced
  
  // 🔥 NAYE STYLES 4 PILLS KE LIYE
  infoItemsContainer: { width: '100%', marginBottom: 30, gap: 12 },
  infoPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255, 255, 255, 0.05)', paddingVertical: 14, paddingHorizontal: 16, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.03)' },
  infoIconWrapper: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#e2e8f0', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  infoIconText: { color: '#0f172a', fontSize: 13, fontWeight: 'bold', fontStyle: 'italic' },
  infoText: { color: '#e2e8f0', fontSize: 13, flex: 1, fontWeight: '400' },
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
  downloadBtnText: { color: '#ffffff', fontWeight: 'bold', fontSize: 16 }
});