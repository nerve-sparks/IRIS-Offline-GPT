
// import React, { useState, useEffect, useRef } from 'react';
// import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, KeyboardAvoidingView, Platform, Keyboard, Image, ToastAndroid, Dimensions, Alert, TouchableWithoutFeedback } from 'react-native';
// import { SafeAreaView } from 'react-native-safe-area-context';
// import { useIsFocused } from '@react-navigation/native';
// import RNFS from 'react-native-fs';
// import { initLlama } from 'llama.rn';
// import Voice, { SpeechResultsEvent } from '@react-native-voice/voice';
// import Tts from 'react-native-tts';
// import LinearGradient from 'react-native-linear-gradient';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import Markdown from 'react-native-markdown-display';
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

// const INFO_ITEMS = [
//   "Explains complex topics simply.",
//   "May sometimes be inaccurate.",
//   "Unable to provide current affairs due to no internet connectivity.",
//   "Long Press on messages to report."
// ];

// export default function ChatScreen({ navigation }: any) {
//   const safeTtsStop = () => {
//     if (Platform.OS === 'android') {
//       Tts.stop()
//     }
//   };
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
//   const [touchStartY, setTouchStartY] =useState(0);
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
//           activeModelPath = ggufFile.path; 
//           modelNameForDrawer = ggufFile.name;
//           await AsyncStorage.setItem('ACTIVE_MODEL_NAME', ggufFile.name);
//         }
//       } catch (e) { console.log(e); }
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
//         setLlamaContext(null); 
//       }

//       await new Promise(resolve => setTimeout(resolve, 1000));

//       try {
//         const stat = await RNFS.stat(activeModelPath);
//         const sizeInMB = stat.size / (1024 * 1024);
        
//         if (sizeInMB < 50) {
//           Alert.alert("Corrupt Download ❌", `File size is only ${sizeInMB.toFixed(2)} MB. Delete it and try downloading again.`);
//           return;
//         }

//         const cleanPath = activeModelPath.replace(/^file:\/\//, '');
//         const ctx = await initLlama({ 
//           model: cleanPath, 
//           use_mlock: false, 
//           n_ctx: 1024,      
//           n_gpu_layers: Platform.OS === 'ios' ? 50 : 0 
//         });
        
//         setLlamaContext(ctx);
//         setCurrentLoadedPath(activeModelPath);

//       } catch (err) { 
//         try {
//           const filePrefixedPath = `file://${activeModelPath.replace(/^file:\/\//, '')}`;
//           const ctxFallback = await initLlama({ 
//             model: filePrefixedPath, 
//             use_mlock: false, 
//             n_ctx: 1024,
//             n_gpu_layers: 0 
//           });
          
//           setLlamaContext(ctxFallback);
//           setCurrentLoadedPath(activeModelPath);
//         } catch (fallbackErr) {
//           Alert.alert("Engine Crash ⚠️", "The model file exists, but the AI engine refused to load it.");
//         }
//       }
//     }
//   };

//   useEffect(() => {
//     Tts.setDefaultLanguage('en-US');
//     if (Platform.OS ==='android'){
//       Tts.setDefaultRate(0.5);
//     }
    
//     Voice.onSpeechStart = () => { setIsListening(true); safeTtsStop(); };
//     Voice.onSpeechEnd = () => setIsListening(false);
//     Voice.onSpeechError = () => setIsListening(false);
//     Voice.onSpeechPartialResults = (e: SpeechResultsEvent) => { if (e.value && e.value.length > 0) setInputText(e.value[0]); };
//     Voice.onSpeechResults = (e: SpeechResultsEvent) => { if (e.value && e.value.length > 0) setInputText(e.value[0]); };

//     if (isFocused) loadEngine();
//     return () => { Voice.destroy().then(Voice.removeAllListeners); safeTtsStop(); };
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
//       safeTtsStop();
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
//     } catch (cleanupError) {}

//     try {
//       await downloadModel(model, (p) => setProgresses(prev => ({ ...prev, [model.name]: Math.round(p * 100) })));
//       await AsyncStorage.setItem('ACTIVE_MODEL_NAME', model.name);
//       setNeedsModel(false); 
//       ToastAndroid.show("Download Complete! Loading AI...", ToastAndroid.SHORT);
//       loadEngine(); 
//     } catch (error: any) {
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
//     } catch (e) {}
//   };

//   const sendMessage = async (text: string = inputText) => {
//     if (!text.trim() || isGenerating) return;
//     if (isListening) await Voice.stop();
//     safeTtsStop();

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
//     let isStopped = false; 

//     try {
//       await llamaContext.completion(
//         { prompt: formattedPrompt, n_predict: 256, temperature: 0.5, stop: ["<|im_end|>", "<|eot_id|>", "<end_of_turn>", "<|end_of_text|>", "User:"] },
//         (result: any) => {
//           if (isStopped) return; 
//           fullResponse += result.token;
//           const stopKeywords = ["<|im_end|>", "<|eot_id|>", "<end_of_turn>", "<|end_of_text|>", "User:", "<|start_header_id|>"];
//           for (const keyword of stopKeywords) {
//             if (fullResponse.includes(keyword)) {
//               isStopped = true;
//               fullResponse = fullResponse.split(keyword)[0]; 
//               try { llamaContext.stopCompletion(); } catch(e) {} 
//               break;
//             }
//           }
//           let cleanUIResponse = fullResponse.replace(/<\|.*?\|>/g, '').replace(/<start_of_turn>|<end_of_turn>/g, '').trimStart();
//           setMessages(prev => prev.map(msg => msg.id === botMsgId ? { ...msg, text: cleanUIResponse } : msg));
//         }
//       );
//     } catch (error) { 
//       console.error("Generation crashed:", error); 
//     } 
//     finally { setIsGenerating(false); }
//   };

//   const handleTouchStart = (e: any) => {
//     setTouchStartX(e.nativeEvent.pageX);
//     setTouchStartY(e.nativeEvent.pageY); // 🔥 Touch ki height record kar rahe hain
//   };

//   const handleTouchEnd = (e: any) => {
//     const screenWidth = Dimensions.get('window').width;
//     const screenHeight = Dimensions.get('window').height;
    
//     // 🔥 SAFE ZONE LOGIC: 
//     // Agar touch screen ke bottom 30% hisse mein (jahan prompts aur chat box hain) shuru hua hai, 
//     // toh isey yahi rok do (return) taaki FlatList aaram se scroll ho sake.
//     if (touchStartY > screenHeight * 0.7) {
//       return; 
//     }

//     // 1. Check if touch started in the left 30% of the screen
//     const startedInLeftZone = touchStartX <= (screenWidth * 0.2);
    
//     // 2. Calculate rightward swipe distance
//     const swipeDistance = e.nativeEvent.pageX - touchStartX;

//     // 3. Only open IF started on left edge AND swiped right
//     if (startedInLeftZone && swipeDistance > 50) {
//       setIsDrawerOpen(true);
//     }
//   };

//   return (
//     <View style={styles.outerWrapper}>
//       <LinearGradient 
//         colors={['#050a14', '#051633']} 
//         style={styles.container}
//         onTouchStart={handleTouchStart} 
//         onTouchEnd={handleTouchEnd}     
//       >
//         <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
//           <KeyboardAvoidingView 
//             style={styles.container} 
//             behavior={Platform.OS === 'ios' ? 'padding' : undefined}
//             keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
//           >
            
//             {needsModel && isFocused && (
//               <View style={[StyleSheet.absoluteFill, styles.modalOverlay]}>
//                 <View style={styles.modalBox}>
//                   <Text style={styles.modalTitle}>Download Required</Text>
//                   {ALL_MODELS.map((model) => (
//                     <View key={model.name} style={styles.modelCard}>
//                       <Text style={styles.modelNameText}>{model.name}</Text>
//                       <TouchableOpacity 
//                         style={[styles.downloadBtn, downloading[model.name] && { backgroundColor: '#ef4444' }]}
//                         onPress={() => downloading[model.name] ? cancelDownload(model) : handleDownload(model)}
//                       >
//                         <Text style={styles.downloadBtnText}>
//                           {downloading[model.name] ? `Stop Download (${progresses[model.name] || 0}%)` : 'Download'}
//                         </Text>
//                       </TouchableOpacity>
//                     </View>
//                   ))}
//                 </View>
//               </View>
//             )}

//             {/* 🔥 UI FIX: Header Aligned like Kotlin App */}
//             <View style={styles.header}>
//               <Text style={styles.headerTitle}>Iris</Text>
//               <View style={styles.headerIcons}>
//                 <TouchableOpacity 
//                   onPress={() => { Keyboard.dismiss(); navigation.navigate('Settings'); }}
//                   style={{ padding: 8 }}
//                 >
//                   <Image source={require('../assets/icons/settings.png')} style={styles.headerIconImage} />
//                 </TouchableOpacity>

//                 <TouchableOpacity 
//                   onPress={clearChat}
//                   style={{ padding: 8 }}
//                 >
//                   <Image source={require('../assets/icons/new_chat.png')} style={styles.headerIconImage} />
//                 </TouchableOpacity>
//               </View>
//             </View>

//             {messages.length === 0 ? (
//               // 🔥 UI FIX: TouchableWithoutFeedback added to dismiss keyboard on outside tap
//               <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
//                 <View style={styles.emptyChatContainer}>
                  
//                   <View style={styles.topSection}>
//                     <Text style={styles.helloText}>Hello, Ask me{'\n'}Anything</Text>
                    
//                     {/* 🔥 UI FIX: Proper boxes added to info pills */}
//                     <View style={styles.infoItemsContainer}>
//                       {INFO_ITEMS.map((item, index) => (
//                         <View key={index} style={styles.infoPill}>
//                           <View style={styles.infoIconWrapper}>
//                             <Text style={styles.infoIconText}>i</Text>
//                           </View>
//                           <Text style={styles.infoText}>{item}</Text>
//                         </View>
//                       ))}
//                     </View>
//                   </View>

//                   <View style={styles.bottomPromptsWrapper}> 
//                     <FlatList 
//                       data={PROMPTS} 
//                       horizontal 
//                       showsHorizontalScrollIndicator={false} 
//                       keyExtractor={(item) => item}
//                       contentContainerStyle={styles.promptsContainer}
//                       keyboardShouldPersistTaps="handled"
//                       renderItem={({ item }) => (
//                         <TouchableOpacity 
//                           style={[styles.promptCard, (!llamaContext || isGenerating) && { opacity: 0.5 }]} 
//                           onPress={() => sendMessage(item)}
//                           disabled={!llamaContext || isGenerating}
//                         >
//                           <Text style={styles.promptText}>{item}</Text>
//                         </TouchableOpacity>
//                       )}
//                     />
//                   </View>
//                 </View>
//               </TouchableWithoutFeedback>
//             ) : (
//               <FlatList
//                 ref={flatListRef} data={messages} keyExtractor={(item) => item.id}
//                 contentContainerStyle={styles.chatContainer}
//                 keyboardDismissMode="on-drag"
//                 keyboardShouldPersistTaps="handled"
//                 onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
//                 renderItem={({ item }) => (
//                   <View style={[styles.messageBubble, item.isUser ? styles.userBubble : styles.botBubble]}>
//                     {item.isUser ? (
//                       <Text style={styles.messageText}>{item.text}</Text>
//                     ) : (
//                       <Markdown style={markdownStyles}>
//                         {item.text}
//                       </Markdown>
//                     )}
//                   </View>
//                 )}
//               />
//             )}

//             <View style={styles.inputAreaWrapper}>
//               <View style={styles.inputContainer}>
//                 <TouchableOpacity onPress={startListening} disabled={needsModel || isGenerating}>
//                    <Image 
//                      source={require('../assets/icons/mic.png')} 
//                      style={[styles.micIconImage, isListening && { tintColor: '#ff4444' }]} 
//                    />
//                 </TouchableOpacity>
//                 <TextInput
//                   style={styles.input} placeholder="Message" placeholderTextColor="#666666"
//                   value={inputText} onChangeText={setInputText} editable={!needsModel && !isGenerating}
//                   onSubmitEditing={() => sendMessage()}
//                 />
//                 <TouchableOpacity onPress={() => sendMessage()} disabled={needsModel || isGenerating}>
//                   <Image source={require('../assets/icons/send.png')} style={styles.sendIconImage} />
//                 </TouchableOpacity>
//               </View>
//             </View>
//           </KeyboardAvoidingView>
//         </SafeAreaView>
//       </LinearGradient>
      
//       <NerveSparksDrawer 
//         visible={isDrawerOpen} 
//         onClose={() => setIsDrawerOpen(false)} 
//         activeModelName={currentActiveModel} 
//       />
//     </View>
//   );
// }

// const markdownStyles = StyleSheet.create({
//   body: { color: '#E2E8F0', fontSize: 16, lineHeight: 24 },
//   strong: { fontWeight: 'bold', color: '#ffffff' },
//   em: { fontStyle: 'italic', color: '#E2E8F0' },
//   paragraph: { marginTop: 0, marginBottom: 10 },
//   code_inline: { backgroundColor: '#2d3748', color: '#a78bfa', padding: 4, borderRadius: 4, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
//   fence: { backgroundColor: '#1e293b', color: '#e2e8f0', padding: 10, borderRadius: 8, marginTop: 5, marginBottom: 5, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
//   list_item: { color: '#E2E8F0', fontSize: 16, lineHeight: 24 },
//   bullet_list: { marginTop: 0, marginBottom: 10 },
//   ordered_list: { marginTop: 0, marginBottom: 10 },
// });

// const styles = StyleSheet.create({
//   outerWrapper: { flex: 1, backgroundColor: '#050a14' }, // Prevents white flashes
//   container: { flex: 1 },
//   header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 15 },
//   headerTitle: { color: '#ffffff', fontSize: 28, fontWeight: '600', letterSpacing: 0.5 },
//   headerIcons: { flexDirection: 'row', gap: 16 },
  
//   headerIconImage: { width: 24, height: 24, tintColor: '#ffffff' },
//   micIconImage: { width: 24, height: 24, tintColor: '#ffffff', marginRight: 12 },
//   sendIconImage: { width: 24, height: 24, tintColor: '#ffffff', marginLeft: 12 },

//   emptyChatContainer: { flex: 1, justifyContent: 'space-between' },
//   topSection: { alignItems: 'center', marginTop: Dimensions.get('window').height * 0.02, paddingHorizontal: 20 },
//   helloText: { color: '#f8fafc', fontSize: 60, fontWeight: '350', textAlign: 'center', marginBottom: 28 }, 
//   infoItemsContainer: { width: '100%'}, 
//   bottomPromptsWrapper: { height: 110, marginBottom: 0 }, 
  
//   // 🔥 INFO PILLS: Exact Match from Photo
//   infoPill: { 
//     flexDirection: 'row', 
//     alignItems: 'center', 
//     backgroundColor: '#010825', // <-- The exact rich vibrant navy blue from the photo
//     paddingVertical: 14, 
//     paddingHorizontal: 16, 
//     borderRadius: 12, 
//     marginBottom: 12 
//     // Border hata diya kyunki photo mein solid premium feel hai
//   },
//   infoIconWrapper: { 
//     width: 24, height: 24, borderRadius: 12, 
//     backgroundColor: '#ffffff', // <-- Solid white circle
//     justifyContent: 'center', alignItems: 'center', marginRight: 14 
//   },
//   infoIconText: { 
//     color: '#1C3270', // <-- Same as pill background to create the "cut-out" effect
//     fontSize: 14, fontWeight: 'bold', fontStyle: 'italic',
//     marginTop: Platform.OS === 'ios' ? 2 : 0 // slight tweak to center the 'i' perfectly
//   },
//   infoText: { 
//     color: '#ffffff', // <-- Pure white text
//     fontSize: 14, flex: 1, fontWeight: '500' 
//   },

//   // 🔥 PROMPTS: Super Dark Background
//   promptsContainer: { paddingHorizontal: 20, gap: 12 },
//   promptCard: { 
//     backgroundColor: '#020814',
//     width: 200, height: 100, justifyContent: 'center', alignItems: 'center', 
//     borderRadius: 12, padding: 12, 
//     borderWidth: 1, borderColor: '#111D36' // <-- Very subtle border so it doesn't look completely invisible
//   },
//   promptText: { color: '#E2E8F0', fontSize: 13, textAlign: 'center' },
  
//   chatContainer: { padding: 20, flexGrow: 1, justifyContent: 'flex-end' },
//   messageBubble: { maxWidth: '85%', padding: 14, borderRadius: 18, marginBottom: 12 },
//   userBubble: { alignSelf: 'flex-end', backgroundColor: '#171E2C', borderBottomRightRadius: 4 },
//   botBubble: { alignSelf: 'flex-start', backgroundColor: 'transparent' },
//   messageText: { color: '#E2E8F0', fontSize: 16, lineHeight: 24 },
//   inputAreaWrapper: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: Platform.OS === 'ios' ? 24 : 16 },
//   inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#21314A', borderRadius: 24, paddingHorizontal: 16, paddingVertical: 6, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
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
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, KeyboardAvoidingView, Platform, Keyboard, Image, ToastAndroid, Dimensions, Alert, TouchableWithoutFeedback } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useIsFocused } from '@react-navigation/native';
import RNFS from 'react-native-fs';
import { initLlama } from 'llama.rn';
import Voice, { SpeechResultsEvent } from '@react-native-voice/voice';
import Tts from 'react-native-tts';
import LinearGradient from 'react-native-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Markdown from 'react-native-markdown-display';
import Clipboard from '@react-native-clipboard/clipboard'; // 🔥 ADDED CLIPBOARD
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
  const safeTtsStop = () =>{
    try{
      Tts.stop();
    } catch (e){
      console.log(e);
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
  const [touchStartY, setTouchStartY] = useState(0);
  const [currentActiveModel, setCurrentActiveModel] = useState("No active model");
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  
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
          activeModelPath = ggufFile.path; 
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
        const stat = await RNFS.stat(activeModelPath);
        const sizeInMB = stat.size / (1024 * 1024);
        
        if (sizeInMB < 50) {
          Alert.alert("Corrupt Download ❌", `File size is only ${sizeInMB.toFixed(2)} MB. Delete it and try downloading again.`);
          return;
        }

        const cleanPath = activeModelPath.replace(/^file:\/\//, '');
        const ctx = await initLlama({ 
          model: cleanPath, 
          use_mlock: false, 
          n_ctx: 1024,      
          n_gpu_layers: Platform.OS === 'ios' ? 50 : 0 
        });
        
        setLlamaContext(ctx);
        setCurrentLoadedPath(activeModelPath);

      } catch (err) { 
        try {
          const filePrefixedPath = `file://${activeModelPath.replace(/^file:\/\//, '')}`;
          const ctxFallback = await initLlama({ 
            model: filePrefixedPath, 
            use_mlock: false, 
            n_ctx: 1024,
            n_gpu_layers: 0 
          });
          
          setLlamaContext(ctxFallback);
          setCurrentLoadedPath(activeModelPath);
        } catch (fallbackErr) {
          Alert.alert("Engine Crash ⚠️", "The model file exists, but the AI engine refused to load it.");
        }
      }
    }
  };

  useEffect(() => {
    Tts.setDefaultLanguage('en-US');
    if (Platform.OS === 'android') {
      Tts.setDefaultRate(0.5);
    }
    
    // 🔥 THE FIX: Adding TTS listeners to silence the yellow warnings
    const ttsStart = Tts.addEventListener('tts-start', () => {});
    const ttsProgress = Tts.addEventListener('tts-progress', () => {});
    const ttsFinish = Tts.addEventListener('tts-finish', (event) => {setSpeakingId(null)});
    const ttsCancel = Tts.addEventListener('tts-cancel', (event) => {setSpeakingId(null)});

    Voice.onSpeechStart = () => { setIsListening(true); safeTtsStop(); };
    Voice.onSpeechEnd = () => setIsListening(false);
    Voice.onSpeechError = () => setIsListening(false);
    Voice.onSpeechPartialResults = (e: SpeechResultsEvent) => { if (e.value && e.value.length > 0) setInputText(e.value[0]); };
    Voice.onSpeechResults = (e: SpeechResultsEvent) => { if (e.value && e.value.length > 0) setInputText(e.value[0]); };

    if (isFocused) loadEngine();
    
    return () => { 
      Voice.destroy().then(Voice.removeAllListeners); 
      safeTtsStop(); 
      // 🔥 THE FIX: Remove listeners when leaving the screen
      ttsStart.remove();
      ttsProgress.remove();
      ttsFinish.remove();
      ttsCancel.remove();
    };
  }, [isFocused]);

  const startListening = async () => {
    if (isListening) await Voice.stop();
    else { setInputText(''); await Voice.start('en-US'); }
  };

  const clearChat = () => {
    Keyboard.dismiss();
    
    setSpeakingId(null); 
    safeTtsStop(); 
    setTimeout(() => {
      if (isGenerating && llamaContext) {
        try { llamaContext.stopCompletion(); } catch (e) { console.log(e); }
      }
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
    } catch (cleanupError) {}

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
      if (await RNFS.exists(destPath)) {
        await RNFS.unlink(destPath);
      }
    } catch (e) {}
  };

  // 🔥 NEW FEATURE: Handle Copy
  const handleCopyText = (text: string) => {
    Clipboard.setString(text);
    if (Platform.OS === 'android') {
      ToastAndroid.show("Copied to clipboard!", ToastAndroid.SHORT);
    }
  };

  // 🔥 NEW FEATURE: Handle Speak
  // 🔥 NEW FEATURE: Handle Speak
  // 🔥 NEW FEATURE: Handle Speak (FIXED)
  // 🔥 NEW FEATURE: Handle Speak (The Final Fix)
  const handleSpeakText = (text: string, id: string) => {
    // 1. Pehle check karo ki kya hum same message ko rokne aaye hain?
    const isStopping = speakingId === id;

    // 2. Kuch bhi ho, pehle purana audio aur state CLEAN karo
    safeTtsStop();
    setSpeakingId(null);

    // 3. Agar user ne naya message play karne ko bola hai (Stop nahi dabaya tha)
    if (!isStopping) {
      setTimeout(() => {
        setSpeakingId(id); // Delay ke baad UI update karo
        Tts.speak(text);   // Naya audio play karo
      }, 200); // 200ms gap ensures ki purana engine theek se band ho gaya hai
    }
  };

  const sendMessage = async (text: string = inputText) => {
    if (!text.trim() || isGenerating) return;
    if (isListening) await Voice.stop();
    
    
    setSpeakingId(null);
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
        { prompt: formattedPrompt, n_predict: 256, temperature: 0.5, stop: ["<|im_end|>", "<|eot_id|>", "<end_of_turn>", "<|end_of_text|>", "User:"] },
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
    } catch (error) { 
      console.error("Generation crashed:", error); 
    } 
    finally { setIsGenerating(false); }
  };

  const handleTouchStart = (e: any) => {
    setTouchStartX(e.nativeEvent.pageX);
    setTouchStartY(e.nativeEvent.pageY);
  };

  const handleTouchEnd = (e: any) => {
    const screenWidth = Dimensions.get('window').width;
    const screenHeight = Dimensions.get('window').height;
    
    if (touchStartY > screenHeight * 0.7) {
      return; 
    }

    const startedInLeftZone = touchStartX <= (screenWidth * 0.2);
    const swipeDistance = e.nativeEvent.pageX - touchStartX;

    if (startedInLeftZone && swipeDistance > 50) {
      setIsDrawerOpen(true);
    }
  };

  return (
    <View style={styles.outerWrapper}>
      <LinearGradient 
        colors={['#050a14', '#051633']} 
        style={styles.container}
        onTouchStart={handleTouchStart} 
        onTouchEnd={handleTouchEnd}     
      >
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
          <KeyboardAvoidingView 
            style={styles.container} 
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
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
                  style={{ padding: 8 }}
                >
                  <Image source={require('../assets/icons/settings.png')} style={styles.headerIconImage} />
                </TouchableOpacity>

                <TouchableOpacity 
                  onPress={clearChat}
                  style={{ padding: 8 }}
                >
                  <Image source={require('../assets/icons/new_chat.png')} style={styles.headerIconImage} />
                </TouchableOpacity>
              </View>
            </View>

            {messages.length === 0 ? (
              <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
                <View style={styles.emptyChatContainer}>
                  
                  <View style={styles.topSection}>
                    <Text style={styles.helloText}>Hello, Ask me{'\n'}Anything</Text>
                    
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
                  </View>

                  <View style={styles.bottomPromptsWrapper}> 
                    <FlatList 
                      data={PROMPTS} 
                      horizontal 
                      showsHorizontalScrollIndicator={false} 
                      keyExtractor={(item) => item}
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
                </View>
              </TouchableWithoutFeedback>
            ) : (
              <FlatList
                ref={flatListRef} data={messages} keyExtractor={(item) => item.id}
                extraData={speakingId}
                contentContainerStyle={styles.chatContainer}
                keyboardDismissMode="on-drag"
                keyboardShouldPersistTaps="handled"
                onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                renderItem={({ item }) => (
                  // 🔥 UI FIX: Switched to independent styles for Bot and User bubbles
                  <View style={[styles.messageWrapper, item.isUser ? styles.userBubble : styles.botBubble]}>
                    {item.isUser ? (
                      <Text style={styles.messageText}>{item.text}</Text>
                    ) : (
                      <View>
                        <Markdown style={markdownStyles}>
                          {item.text}
                        </Markdown>
                        
                        {/* 🔥 NEW FEATURE: Copy and Speak Buttons */}
                        {item.text.length > 0 && (
                          <View style={styles.botActionRow}>
                            <TouchableOpacity onPress={() => handleCopyText(item.text)} style={styles.actionBtn}>
                              <Text style={styles.actionBtnText}>📋 Copy</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                              onPress={() => handleSpeakText(item.text, item.id)} 
                              style={styles.actionBtn}
                            >
                              <Text style={[styles.actionBtnText, speakingId === item.id && { color: '#ef4444' }]}>
                                {speakingId === item.id ? "🛑 Stop" : "🔊 Speak"}
                              </Text>
                            </TouchableOpacity>
                          </View>
                        )}
                      </View>
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
        </SafeAreaView>
      </LinearGradient>
      
      <NerveSparksDrawer 
        visible={isDrawerOpen} 
        onClose={() => setIsDrawerOpen(false)} 
        activeModelName={currentActiveModel} 
      />
    </View>
  );
}

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
  outerWrapper: { flex: 1, backgroundColor: '#050a14' },
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 15 },
  headerTitle: { color: '#ffffff', fontSize: 28, fontWeight: '600', letterSpacing: 0.5 },
  headerIcons: { flexDirection: 'row', gap: 16 },
  
  headerIconImage: { width: 24, height: 24, tintColor: '#ffffff' },
  micIconImage: { width: 24, height: 24, tintColor: '#ffffff', marginRight: 12 },
  sendIconImage: { width: 24, height: 24, tintColor: '#ffffff', marginLeft: 12 },

  emptyChatContainer: { flex: 1, justifyContent: 'space-between' },
  topSection: { alignItems: 'center', marginTop: Dimensions.get('window').height * 0.02, paddingHorizontal: 20 },
  helloText: { color: '#f8fafc', fontSize: 60, fontWeight: '350', textAlign: 'center', marginBottom: 28 }, 
  infoItemsContainer: { width: '100%'}, 
  bottomPromptsWrapper: { height: 110, marginBottom: 0 }, 
  
  infoPill: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#010825', 
    paddingVertical: 14, 
    paddingHorizontal: 16, 
    borderRadius: 12, 
    marginBottom: 12 
  },
  infoIconWrapper: { 
    width: 24, height: 24, borderRadius: 12, 
    backgroundColor: '#ffffff', 
    justifyContent: 'center', alignItems: 'center', marginRight: 14 
  },
  infoIconText: { 
    color: '#1C3270', 
    fontSize: 14, fontWeight: 'bold', fontStyle: 'italic',
    marginTop: Platform.OS === 'ios' ? 2 : 0 
  },
  infoText: { 
    color: '#ffffff', 
    fontSize: 14, flex: 1, fontWeight: '500' 
  },

  promptsContainer: { paddingLeft:6 ,paddingRight: 6, gap: 12 },
  promptCard: { 
    backgroundColor: '#010825',
    width: 200, height: 100, justifyContent: 'center', alignItems: 'center', 
    borderRadius: 12, padding: 12, 
    borderWidth: 1, borderColor: '#111D36' 
  },
  promptText: { color: '#ffffff', fontSize: 13, textAlign: 'center' },
  
  // 🔥 CHAT CONTAINER UI FIXES
  chatContainer: { paddingHorizontal: 16, paddingBottom: 20, paddingTop: 20, flexGrow: 1, justifyContent: 'flex-end' },
  messageWrapper: { marginBottom: 16 }, // Base spacing
  
  // 🔥 USER BUBBLE (Stays on right, has padding)
  userBubble: { alignSelf: 'flex-end', backgroundColor: '#171E2C', padding: 14, borderRadius: 18, borderBottomRightRadius: 4, maxWidth: '85%' },
  
  // 🔥 BOT BUBBLE (Extreme left, NO padding to push it away from edge)
  botBubble: { alignSelf: 'flex-start', backgroundColor: 'transparent', maxWidth: '95%' },
  
  messageText: { color: '#E2E8F0', fontSize: 16, lineHeight: 24 },
  
  // 🔥 NEW ACTION BUTTONS STYLES
  botActionRow: { flexDirection: 'row', marginTop: 12, gap: 12 },
  actionBtn: { paddingVertical: 6, paddingHorizontal: 14, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 20, flexDirection: 'row', alignItems: 'center' },
  actionBtnText: { color: '#cbd5e1', fontSize: 13, fontWeight: '600' },

  inputAreaWrapper: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: Platform.OS === 'ios' ? 24 : 16 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#21314A', borderRadius: 24, paddingHorizontal: 16, paddingVertical: 6, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  input: { flex: 1, color: '#ffffff', fontSize: 16, paddingVertical: 10 },
  modalOverlay: { backgroundColor: 'rgba(5, 10, 20, 0.95)', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  modalBox: { backgroundColor: '#1e293b', width: '85%', borderRadius: 16, padding: 24, alignItems: 'center' },
  modalTitle: { color: '#ffffff', fontSize: 20, fontWeight: 'bold', marginBottom: 20 },
  modelCard: { backgroundColor: '#0f172a', width: '100%', borderRadius: 12, padding: 16, marginBottom: 12, alignItems: 'center' },
  modelNameText: { color: '#94a3b8', fontSize: 14, marginBottom: 12, textAlign: 'center' },
  downloadBtn: { backgroundColor: '#2563EB', width: '100%', paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  downloadBtnText: { color: '#ffffff', fontWeight: 'bold', fontSize: 16 }
});