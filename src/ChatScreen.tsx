// import React, { useState, useEffect } from 'react';
// import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
// import { useIsFocused } from '@react-navigation/native';
// import RNFS from 'react-native-fs';
// import { initLlama } from 'llama.rn';
// import Voice, { SpeechResultsEvent, SpeechErrorEvent } from '@react-native-voice/voice';
// import Tts from 'react-native-tts'; // 👈 IMPORTED TTS ENGINE
// import { ALL_MODELS, checkFileExists, downloadModel, IrisModel } from './ModelService';

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

// export default function ChatScreen() {
//   const [inputText, setInputText] = useState('');
//   const [messages, setMessages] = useState<Message[]>([]);
  
//   // Modal & Download State
//   const [needsModel, setNeedsModel] = useState(false);
//   const [downloading, setDownloading] = useState<{ [key: string]: boolean }>({});
//   const [progresses, setProgresses] = useState<{ [key: string]: number }>({});
  
//   // AI Engine State
//   const [llamaContext, setLlamaContext] = useState<any>(null);
//   const [isGenerating, setIsGenerating] = useState(false);
  
//   // Voice & TTS State
//   const [isListening, setIsListening] = useState(false);
//   const [isSpeaking, setIsSpeaking] = useState(false); // Matches your stateForTextToSpeech
  
//   const isFocused = useIsFocused();

//   // Initialize Engines
//   useEffect(() => {
//     // --- 1. TTS CONFIGURATION (Mirrors your Kotlin setup) ---
//     Tts.setDefaultLanguage('en-US');
//     Tts.setDefaultRate(0.5); // 0.5 in RN TTS is roughly equivalent to 1.0f in Kotlin
    
//     Tts.addEventListener('tts-start', (event) => setIsSpeaking(true));
//     Tts.addEventListener('tts-finish', (event) => setIsSpeaking(false));
//     Tts.addEventListener('tts-cancel', (event) => setIsSpeaking(false));
//     Tts.addEventListener('tts-error', (event) => {
//         console.error("TTS Error:", event);
//         setIsSpeaking(false);
//     });

//     // --- 2. VOICE RECOGNITION CONFIGURATION ---
//     Voice.onSpeechStart = () => {
//       setIsListening(true);
//       Tts.stop(); // Stop Iris from talking if you start talking (Mirrors your Kotlin logic)
//     };
//     Voice.onSpeechEnd = () => setIsListening(false);
//     Voice.onSpeechError = (e: SpeechErrorEvent) => setIsListening(false);
//     Voice.onSpeechPartialResults = (e: SpeechResultsEvent) => {
//       if (e.value && e.value.length > 0) setInputText(e.value[0]);
//     };
//     Voice.onSpeechResults = (e: SpeechResultsEvent) => {
//       if (e.value && e.value.length > 0) setInputText(e.value[0]);
//     };

//     // --- 3. LLAMA ENGINE CONFIGURATION ---
//     const verifyAndLoadEngine = async () => {
//       let activeModelPath = null;
//       for (const model of ALL_MODELS) {
//         if (await checkFileExists(model.destination)) {
//           activeModelPath = `${RNFS.DocumentDirectoryPath}/${model.destination}`;
//           break;
//         }
//       }
//       if (!activeModelPath) {
//         setNeedsModel(true);
//         return;
//       }
//       setNeedsModel(false);
//       if (!llamaContext && activeModelPath) {
//         try {
//           const ctx = await initLlama({ model: activeModelPath, use_mlock: true, n_ctx: 2048 });
//           setLlamaContext(ctx);
//         } catch (err) {
//           console.error("Engine failed to ignite:", err);
//         }
//       }
//     };

//     if (isFocused) verifyAndLoadEngine();

//     return () => {
//       Voice.destroy().then(Voice.removeAllListeners);
//       Tts.stop();
//     };
//   }, [isFocused]);

//   const startListening = async () => {
//     try {
//       if (isListening) await Voice.stop();
//       else {
//         setInputText(''); 
//         await Voice.start('en-US');
//       }
//     } catch (e) {
//       console.error("Button Error:", e);
//     }
//   };

//   const handleDownload = async (model: IrisModel) => {
//     setDownloading(prev => ({ ...prev, [model.name]: true }));
//     try {
//       await downloadModel(model, (percentage) => {
//         setProgresses(prev => ({ ...prev, [model.name]: Math.round(percentage * 100) }));
//       });
//       setNeedsModel(false); 
//     } catch (error) {
//       console.error("Download failed:", error);
//     } finally {
//       setDownloading(prev => ({ ...prev, [model.name]: false }));
//     }
//   };

//   const sendMessage = async (text: string = inputText) => {
//     if (!text.trim() || isGenerating) return;

//     if (isListening) await Voice.stop();
//     Tts.stop(); // Stop current speech if a new message is sent

//     const newUserMsg: Message = { id: Date.now().toString(), text, isUser: true };
//     const botMsgId = (Date.now() + 1).toString();
//     const newBotMsg: Message = { id: botMsgId, text: '', isUser: false };
    
//     setMessages((prev) => [...prev, newUserMsg, newBotMsg]);
//     setInputText('');
//     setIsGenerating(true);

//     if (!llamaContext) {
//       setMessages((prev) => prev.map(msg => msg.id === botMsgId ? { ...msg, text: "Error: AI Brain not loaded yet." } : msg));
//       setIsGenerating(false);
//       return;
//     }

//     const formattedPrompt = `<|begin_of_text|><|start_header_id|>user<|end_header_id|>\n\n${text}<|eot_id|><|start_header_id|>assistant<|end_header_id|>\n\n`;

//     let fullResponse = ""; // Accumulate the response to speak it later

//     try {
//       await llamaContext.completion(
//         { prompt: formattedPrompt, n_predict: 256, temperature: 0.7 },
//         (result: any) => {
//           fullResponse += result.token;
//           setMessages(prev => prev.map(msg => 
//             msg.id === botMsgId ? { ...msg, text: msg.text + result.token } : msg
//           ));
//         }
//       );
//       // 🔊 Read the final response out loud once generation finishes!
//       if (fullResponse.trim().length > 0) {
//         Tts.speak(fullResponse.replace(/<[^>]*>?/gm, '')); // Regex removes any lingering formatting tags
//       }
//     } catch (error) {
//       console.error("Generation crashed:", error);
//     } finally {
//       setIsGenerating(false);
//     }
//   };

//   return (
//     <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
//       {needsModel && isFocused && (
//         <View style={[StyleSheet.absoluteFill, styles.modalOverlay]}>
//           <View style={styles.modalBox}>
//             <Text style={styles.modalTitle}>Download Required</Text>
//             <Text style={styles.modalSubtitle}>Don't close or minimize the app!</Text>
//             <Text style={styles.modalHeading}>Download at least 1 model</Text>
//             {ALL_MODELS.map((model) => {
//               const isDownloading = downloading[model.name];
//               const progress = progresses[model.name] || 0;
//               return (
//                 <View key={model.name} style={styles.modelCard}>
//                   <Text style={styles.modelNameText}>{model.name}</Text>
//                   <TouchableOpacity 
//                     style={[styles.downloadBtn, isDownloading && styles.downloadBtnActive]}
//                     onPress={() => !isDownloading && handleDownload(model)}
//                     disabled={isDownloading}
//                   >
//                     <Text style={styles.downloadBtnText}>
//                       {isDownloading ? `Downloading... ${progress}%` : 'Download'}
//                     </Text>
//                   </TouchableOpacity>
//                 </View>
//               );
//             })}
//           </View>
//         </View>
//       )}

//       <View style={styles.header}>
//         <Text style={styles.headerTitle}>Iris</Text>
//         <View style={styles.headerIcons}>
//           <Text style={styles.iconPlaceholder}>⚙️</Text>
//           <Text style={styles.iconPlaceholder}>📝</Text>
//         </View>
//       </View>

//       {messages.length === 0 ? (
//         <View style={styles.emptyChatContainer}>
//           <Text style={styles.helloText}>Hello, Ask me Anything</Text>
//           <View style={{ height: 120 }}> 
//             <FlatList 
//               data={PROMPTS}
//               horizontal
//               showsHorizontalScrollIndicator={false}
//               keyExtractor={(item) => item}
//               contentContainerStyle={styles.promptsContainer}
//               renderItem={({ item }) => (
//                 <TouchableOpacity style={styles.promptCard} onPress={() => sendMessage(item)}>
//                   <Text style={styles.promptText}>{item}</Text>
//                 </TouchableOpacity>
//               )}
//             />
//           </View>
//         </View>
//       ) : (
//         <FlatList
//           data={messages}
//           keyExtractor={(item) => item.id}
//           contentContainerStyle={styles.chatContainer}
//           renderItem={({ item }) => (
//             <View style={[styles.messageBubble, item.isUser ? styles.userBubble : styles.botBubble]}>
//               <Text style={styles.messageText}>{item.text}</Text>
//             </View>
//           )}
//         />
//       )}

//       <View style={styles.inputAreaWrapper}>
//         <View style={styles.inputContainer}>
//           <TouchableOpacity onPress={startListening} disabled={needsModel || isGenerating}>
//             <Text style={[styles.micIcon, isListening && { color: 'red' }]}>{isListening ? '🔴' : '🎤'}</Text>
//           </TouchableOpacity>
//           <TextInput
//             style={styles.input}
//             placeholder="Message"
//             placeholderTextColor="#666666"
//             value={inputText}
//             onChangeText={setInputText}
//             editable={!needsModel && !isGenerating}
//           />
//           <TouchableOpacity onPress={() => sendMessage()} disabled={needsModel || isGenerating}>
//             <Text style={styles.sendIcon}>✈️</Text>
//           </TouchableOpacity>
//         </View>
//       </View>
//     </KeyboardAvoidingView>
//   );
// }

// const styles = StyleSheet.create({
//   container: { flex: 1, backgroundColor: '#050a14' },
//   header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, marginTop: 10 },
//   headerTitle: { color: '#ffffff', fontSize: 30, fontWeight: '500' },
//   headerIcons: { flexDirection: 'row', gap: 20 },
//   iconPlaceholder: { fontSize: 24, color: '#ffffff' },
//   emptyChatContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
//   helloText: { color: '#ffffff', fontSize: 40, fontWeight: '300', textAlign: 'center', marginBottom: 40, width: '80%' },
//   promptsContainer: { paddingHorizontal: 16, gap: 12 },
//   promptCard: { backgroundColor: '#030815', width: 200, height: 100, justifyContent: 'center', alignItems: 'center', borderRadius: 12, padding: 12 },
//   promptText: { color: '#A0A0A5', fontSize: 12, textAlign: 'center' },
//   chatContainer: { padding: 16, flexGrow: 1, justifyContent: 'flex-end' },
//   messageBubble: { maxWidth: '80%', padding: 12, borderRadius: 16, marginBottom: 12 },
//   userBubble: { alignSelf: 'flex-end', backgroundColor: '#171E2C', borderRadius: 12 },
//   botBubble: { alignSelf: 'flex-start', backgroundColor: 'transparent' },
//   messageText: { color: '#A0A0A5', fontSize: 16 },
//   inputAreaWrapper: { backgroundColor: '#050B16', padding: 12 },
//   inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#171E2C', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 4 },
//   micIcon: { fontSize: 20, marginRight: 12 },
//   sendIcon: { fontSize: 20, marginLeft: 12 },
//   input: { flex: 1, color: '#f5f5f5', fontSize: 16, paddingVertical: 12 },
//   modalOverlay: { backgroundColor: 'rgba(5, 10, 20, 0.95)', justifyContent: 'center', alignItems: 'center', zIndex: 1000, elevation: 10 },
//   modalBox: { backgroundColor: '#1e293b', width: '85%', borderRadius: 16, padding: 20, alignItems: 'center' },
//   modalTitle: { color: '#ffffff', fontSize: 18, fontWeight: 'bold' },
//   modalSubtitle: { color: '#ffffff', fontSize: 14, marginBottom: 16 },
//   modalHeading: { color: '#ffffff', fontSize: 20, fontWeight: 'bold', marginBottom: 20 },
//   modelCard: { backgroundColor: '#050a14', width: '100%', borderRadius: 12, padding: 16, marginBottom: 12, alignItems: 'center' },
//   modelNameText: { color: '#A0A0A5', fontSize: 14, marginBottom: 12 },
//   downloadBtn: { backgroundColor: '#2563EB', width: '80%', paddingVertical: 12, borderRadius: 20, alignItems: 'center' },
//   downloadBtnActive: { backgroundColor: '#475569' },
//   downloadBtnText: { color: '#ffffff', fontWeight: 'bold', fontSize: 16 }
// });