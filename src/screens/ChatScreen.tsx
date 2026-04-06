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
// import Clipboard from '@react-native-clipboard/clipboard';
// import Svg, { Path } from 'react-native-svg'; // 🔥 ADDED SVG IMPORTS
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
//   // 🔥 BULLETPROOF TTS STOP (WITH iOS FIX)
//   const safeTtsStop = () => {
//     try {
//       Tts.stop(false); // iOS false parameter fix
//     } catch (e) {
//       console.log(e);
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
//   const [touchStartY, setTouchStartY] = useState(0);
//   const [currentActiveModel, setCurrentActiveModel] = useState("No active model");
//   const [speakingId, setSpeakingId] = useState<string | null>(null);
  
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
//     if (Platform.OS === 'android') {
//       Tts.setDefaultRate(0.5);
//     }
    
//     // 🔥 TTS LISTENERS
//     const onStart = () => {};
//     const onFinish = () => setSpeakingId(null);
//     const onCancel = () => setSpeakingId(null);

//     Tts.addEventListener('tts-start', onStart);
//     Tts.addEventListener('tts-finish', onFinish);
//     Tts.addEventListener('tts-cancel', onCancel);

//     Voice.onSpeechStart = () => { setIsListening(true); safeTtsStop(); };
//     Voice.onSpeechEnd = () => setIsListening(false);
//     Voice.onSpeechError = () => setIsListening(false);
//     Voice.onSpeechPartialResults = (e: SpeechResultsEvent) => { if (e.value && e.value.length > 0) setInputText(e.value[0]); };
//     Voice.onSpeechResults = (e: SpeechResultsEvent) => { if (e.value && e.value.length > 0) setInputText(e.value[0]); };

//     if (isFocused) loadEngine();
    
//     return () => { 
//       Voice.destroy().then(Voice.removeAllListeners); 
//       safeTtsStop(); 
//       // 🔥 SAFE CLEANUP
//       try {
//         Tts.removeAllListeners('tts-start');
//         Tts.removeAllListeners('tts-finish');
//         Tts.removeAllListeners('tts-cancel');
//       } catch (e) {
//         console.log(e);
//       }
//     };
//   }, [isFocused]);

//   const startListening = async () => {
//     if (isListening) await Voice.stop();
//     else { setInputText(''); await Voice.start('en-US'); }
//   };

//   const clearChat = () => {
//     Keyboard.dismiss();
    
//     setSpeakingId(null); 
//     safeTtsStop(); 
//     setTimeout(() => {
//       if (isGenerating && llamaContext) {
//         try { llamaContext.stopCompletion(); } catch (e) { console.log(e); }
//       }
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

//   // 🔥 CROSS-PLATFORM COPY TOAST
//   const handleCopyText = (text: string) => {
//     Clipboard.setString(text);
//     if (Platform.OS === 'android') {
//       ToastAndroid.show("Text Copied!", ToastAndroid.SHORT);
//     } else {
//       Alert.alert("Copied", "Text copied to clipboard");
//     }
//   };

//   // 🔥 THE PERFECT TOGGLE LOGIC
//   const handleSpeakText = (text: string, id: string) => {
//     const isStopping = speakingId === id;
    
//     safeTtsStop();
//     setSpeakingId(null);

//     if (!isStopping) {
//       setTimeout(() => {
//         setSpeakingId(id); 
//         Tts.speak(text);   
//       }, 100); 
//     }
//   };

//   const sendMessage = async (text: string = inputText) => {
//     if (!text.trim() || isGenerating) return;
//     if (isListening) await Voice.stop();
    
//     setSpeakingId(null);
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
//     setTouchStartY(e.nativeEvent.pageY);
//   };

//   const handleTouchEnd = (e: any) => {
//     const screenWidth = Dimensions.get('window').width;
//     const screenHeight = Dimensions.get('window').height;
    
//     if (touchStartY > screenHeight * 0.7) {
//       return; 
//     }

//     const startedInLeftZone = touchStartX <= (screenWidth * 0.2);
//     const swipeDistance = e.nativeEvent.pageX - touchStartX;

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

//             <View style={styles.header}>
//               <Text style={styles.headerTitle}>Iris</Text>
//               <View style={styles.headerIcons}>
//                 <TouchableOpacity 
//                   onPress={() => { Keyboard.dismiss(); navigation.navigate('Settings'); }}
//                   style={{ padding: 8 }}
//                 >
//                   {/* 🔥 SETTINGS SVG */}
//                   <Svg width={24} height={24} viewBox="0 0 30 30" fill="none">
//                     <Path fill="#E6E9EB" fillRule="evenodd" d="M14.14 1.3a1.7 1.7 0 0 0-1.656 1.324l-.217.96c-.16.704-.7 1.254-1.367 1.53-.669.278-1.432.266-2.045-.12l-.827-.522a1.7 1.7 0 0 0-2.11.236L4.706 5.92a1.7 1.7 0 0 0-.236 2.108l.524.833c.385.611.397 1.373.12 2.04-.276.667-.826 1.208-1.53 1.367l-.96.218A1.7 1.7 0 0 0 1.3 14.144v1.714a1.7 1.7 0 0 0 1.324 1.658l.96.218c.704.16 1.253.7 1.529 1.365.277.67.267 1.434-.12 2.046l-.523.827a1.7 1.7 0 0 0 .236 2.11l1.214 1.212a1.7 1.7 0 0 0 2.108.236l.83-.523c.613-.386 1.375-.398 2.043-.121.666.276 1.206.826 1.366 1.53l.217.96a1.7 1.7 0 0 0 1.658 1.324h1.714a1.7 1.7 0 0 0 1.658-1.324l.217-.959c.16-.704.7-1.254 1.368-1.53.668-.277 1.43-.266 2.043.12l.83.523a1.7 1.7 0 0 0 2.108-.236l1.212-1.212a1.699 1.699 0 0 0 .236-2.108l-.522-.83c-.386-.611-.396-1.375-.12-2.044.277-.667.827-1.207 1.53-1.367l.96-.217a1.7 1.7 0 0 0 1.324-1.658v-1.714a1.7 1.7 0 0 0-1.324-1.66l-.958-.216c-.705-.16-1.255-.7-1.531-1.367-.277-.668-.265-1.43.12-2.042l.523-.829a1.7 1.7 0 0 0-.236-2.11l-1.212-1.212a1.7 1.7 0 0 0-2.11-.236l-.828.522c-.612.386-1.38.395-2.048.118-.668-.277-1.203-.825-1.364-1.529l-.218-.959A1.7 1.7 0 0 0 15.856 1.3H14.14ZM8.604 6.846c.749.472 1.698.426 2.496.042a9 9 0 0 1 .92-.382c.834-.293 1.537-.93 1.733-1.793l.2-.877a1.073 1.073 0 0 1 2.093 0l.199.876c.196.863.899 1.501 1.734 1.794.313.11.62.237.92.381.797.384 1.746.43 2.495-.042l.76-.478a1.074 1.074 0 0 1 1.48 1.481l-.478.758c-.473.749-.425 1.698-.041 2.495.143.298.27.604.38.919.293.835.93 1.54 1.794 1.736l.876.198a1.073 1.073 0 0 1-.001 2.093l-.876.199c-.863.195-1.5.898-1.794 1.733-.11.314-.237.622-.381.922-.384.797-.43 1.746.041 2.494l.48.76a1.073 1.073 0 0 1-1.481 1.48l-.76-.479c-.748-.471-1.697-.425-2.494-.042-.3.144-.606.27-.92.38-.835.293-1.538.931-1.734 1.794l-.2.876a1.073 1.073 0 0 1-2.093 0l-.199-.876c-.196-.863-.899-1.501-1.733-1.794a9.009 9.009 0 0 1-.918-.38c-.798-.384-1.747-.43-2.496.042l-.76.479a1.074 1.074 0 0 1-1.48-1.481l.48-.76c.471-.747.425-1.695.042-2.493a9.005 9.005 0 0 1-.382-.922c-.293-.835-.931-1.538-1.794-1.732l-.875-.198a1.073 1.073 0 0 1-.002-2.093l.877-.199c.863-.196 1.501-.899 1.794-1.733.11-.313.237-.618.38-.917.384-.799.43-1.749-.041-2.499l-.48-.763a1.073 1.073 0 0 1 1.48-1.479l.76.48ZM18.052 15a3.05 3.05 0 1 1-6.1 0 3.05 3.05 0 0 1 6.1 0Zm1.8 0a4.85 4.85 0 1 1-9.7 0 4.85 4.85 0 0 1 9.7 0Z" clipRule="evenodd" />
//                   </Svg>
//                 </TouchableOpacity>

//                 <TouchableOpacity 
//                   onPress={clearChat}
//                   style={{ padding: 8 }}
//                 >
//                   {/* 🔥 NEW CHAT SVG */}
//                   <Svg width={24} height={24} viewBox="0 0 30 30" fill="none">
//                     <Path stroke="#E6E9EB" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12.547 13.786a2.599 2.599 0 0 0-.761 1.84v3.66h3.682c.69 0 1.353-.275 1.841-.763L28.165 7.66a2.599 2.599 0 0 0 0-3.681l-1.073-1.073a2.599 2.599 0 0 0-3.682 0l-10.863 10.88Z" />
//                     <Path stroke="#E6E9EB" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M26.786 15c0 5.304.495 10.058-1.152 11.705-1.648 1.648-4.3 1.648-9.603 1.648-5.302 0-7.955 0-9.602-1.648-1.648-1.647-1.648-4.3-1.648-9.602 0-5.303-.536-7.42 1.112-9.067C7.54 6.388 10.729 5.853 16.03 5.853" />
//                   </Svg>
//                 </TouchableOpacity>
//               </View>
//             </View>

//             {messages.length === 0 ? (
//               <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
//                 <View style={styles.emptyChatContainer}>
                  
//                   <View style={styles.topSection}>
//                     <Text style={styles.helloText}>Hello, Ask me{'\n'}Anything</Text>
                    
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
//                 extraData={speakingId}
//                 contentContainerStyle={styles.chatContainer}
//                 keyboardDismissMode="on-drag"
//                 keyboardShouldPersistTaps="handled"
//                 onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
//                 renderItem={({ item }) => (
//                   <View style={[styles.messageWrapper, item.isUser ? styles.userBubble : styles.botBubble]}>
//                     {item.isUser ? (
//                       <Text style={styles.messageText}>{item.text}</Text>
//                     ) : (
//                       <View>
//                         <Markdown style={markdownStyles}>
//                           {item.text}
//                         </Markdown>
                        
//                         {/* 🔥 ICONS IMPLEMENTED HERE */}
//                         {item.text.length > 0 && (
//                           <View style={styles.botActionRow}>
//                             {/* Copy Icon Button */}
//                             <TouchableOpacity onPress={() => handleCopyText(item.text)} style={styles.actionBtn}>
//                               <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
//                                 <Path stroke="#cbd5e1" strokeLinecap="round" strokeWidth={1.5} d="M20.998 10c-.012-2.175-.108-3.353-.877-4.121C19.243 5 17.828 5 15 5h-3c-2.828 0-4.243 0-5.121.879C6 6.757 6 8.172 6 11v5c0 2.828 0 4.243.879 5.121C7.757 22 9.172 22 12 22h3c2.828 0 4.243 0 5.121-.879C21 20.243 21 18.828 21 16v-1" />
//                                 <Path stroke="#cbd5e1" strokeLinecap="round" strokeWidth={1.5} d="M3 10v6a3 3 0 0 0 3 3M18 5a3 3 0 0 0-3-3h-4C7.229 2 5.343 2 4.172 3.172 3.518 3.825 3.229 4.7 3.102 6" />
//                               </Svg>
//                             </TouchableOpacity>
                            
//                             {/* Speak/Stop Icon Button */}
//                             <TouchableOpacity 
//                               onPress={() => handleSpeakText(item.text, item.id)} 
//                               style={styles.actionBtn}
//                             >
//                               {speakingId === item.id ? (
//                                 // STOP ICON
//                                 <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
//                                   <Path fill="#ef4444" fillRule="evenodd" d="M12 1.5a10.5 10.5 0 1 0 0 21 10.5 10.5 0 0 0 0-21ZM9 8.25a.75.75 0 0 0-.75.75v6a.75.75 0 0 0 .75.75h6a.75.75 0 0 0 .75-.75V9a.75.75 0 0 0-.75-.75H9Z" clipRule="evenodd" />
//                                 </Svg>
//                               ) : (
//                                 // SPEAKER ICON
//                                 <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
//                                   <Path fill="#cbd5e1" d="M12.914 4.5 8.414 9h-4.5v6h4.5l4.5 4.5v-15Zm2.412 1.297-.218.815A5.574 5.574 0 0 1 19.242 12a5.574 5.574 0 0 1-4.134 5.388l.218.815A6.426 6.426 0 0 0 20.086 12a6.425 6.425 0 0 0-4.76-6.203Zm-.582 2.173-.219.815A3.324 3.324 0 0 1 16.992 12a3.325 3.325 0 0 1-2.467 3.215l.219.815A4.176 4.176 0 0 0 17.836 12a4.176 4.176 0 0 0-3.092-4.03Zm-.582 2.174-.219.815c.473.127.8.551.8 1.041 0 .49-.327.915-.8 1.041l.219.815A1.925 1.925 0 0 0 15.585 12c0-.868-.586-1.632-1.425-1.856Z" />
//                                 </Svg>
//                               )}
//                             </TouchableOpacity>
//                           </View>
//                         )}
//                       </View>
//                     )}
//                   </View>
//                 )}
//               />
//             )}

//             <View style={styles.inputAreaWrapper}>
//               <View style={styles.inputContainer}>
//                 <TouchableOpacity onPress={startListening} disabled={needsModel || isGenerating}>
//                   {/* 🔥 MIC SVG (Dynamic Color) */}
//                   <Svg width={24} height={24} viewBox="0 0 35 35" fill="none" style={{ marginRight: 12 }}>
//                     <Path fill={isListening ? "#ff4444" : "#ffffff"} fillRule="evenodd" clipRule="evenodd" d="M13.125 9.48a4.375 4.375 0 1 1 8.75 0v8.75a4.375 4.375 0 0 1-8.75 0V9.48ZM17.5 6.562a2.917 2.917 0 0 0-2.917 2.916v8.75a2.916 2.916 0 1 0 5.834 0V9.48A2.917 2.917 0 0 0 17.5 6.563ZM10.208 17.5a.73.73 0 0 1 .73.73 6.563 6.563 0 1 0 13.125 0 .73.73 0 0 1 1.458 0 8.02 8.02 0 0 1-7.292 7.988v2.22h3.646a.73.73 0 0 1 0 1.458h-8.75a.729.729 0 1 1 0-1.458h3.646v-2.22a8.02 8.02 0 0 1-7.292-7.989.73.73 0 0 1 .73-.729Z" />
//                   </Svg>
//                 </TouchableOpacity>
//                 <TextInput
//                   style={styles.input} placeholder="Message" placeholderTextColor="#666666"
//                   value={inputText} onChangeText={setInputText} editable={!needsModel && !isGenerating}
//                   onSubmitEditing={() => sendMessage()}
//                 />
//                 <TouchableOpacity onPress={() => sendMessage()} disabled={needsModel || isGenerating}>
//                   {/* 🔥 SEND SVG */}
//                   <Svg width={24} height={24} viewBox="0 0 32 32" fill="none" style={{ marginLeft: 12 }}>
//                     <Path d="M21.8157 9.82093L12.7494 18.8362C12.4367 18.5217 12.0588 18.272 11.6362 18.1055L2.80233 14.6583C-0.0226779 13.5555 0.0982063 9.51894 2.98256 8.58628L26.6955 0.913599C29.2066 0.0996277 31.5787 2.48515 30.7505 4.99162L22.945 28.6596C21.995 31.5398 17.9566 31.6367 16.871 28.8067L13.4715 19.9558C13.3104 19.537 13.0637 19.1565 12.7471 18.8385" stroke="#ffffff" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"/>
//                   </Svg>
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
//   outerWrapper: { flex: 1, backgroundColor: '#050a14' },
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
  
//   infoPill: { 
//     flexDirection: 'row', 
//     alignItems: 'center', 
//     backgroundColor: '#010825', 
//     paddingVertical: 14, 
//     paddingHorizontal: 16, 
//     borderRadius: 12, 
//     marginBottom: 12 
//   },
//   infoIconWrapper: { 
//     width: 24, height: 24, borderRadius: 12, 
//     backgroundColor: '#ffffff', 
//     justifyContent: 'center', alignItems: 'center', marginRight: 14 
//   },
//   infoIconText: { 
//     color: '#1C3270', 
//     fontSize: 14, fontWeight: 'bold', fontStyle: 'italic',
//     marginTop: Platform.OS === 'ios' ? 2 : 0 
//   },
//   infoText: { 
//     color: '#ffffff', 
//     fontSize: 14, flex: 1, fontWeight: '500' 
//   },

//   promptsContainer: { paddingLeft:6 ,paddingRight: 6, gap: 12 },
//   promptCard: { 
//     backgroundColor: '#010825',
//     width: 200, height: 100, justifyContent: 'center', alignItems: 'center', 
//     borderRadius: 12, padding: 12, 
//     borderWidth: 1, borderColor: '#111D36' 
//   },
//   promptText: { color: '#ffffff', fontSize: 13, textAlign: 'center' },
  
//   chatContainer: { paddingHorizontal: 16, paddingBottom: 20, paddingTop: 20, flexGrow: 1, justifyContent: 'flex-end' },
//   messageWrapper: { marginBottom: 16 }, 
  
//   userBubble: { alignSelf: 'flex-end', backgroundColor: '#171E2C', padding: 14, borderRadius: 18, borderBottomRightRadius: 4, maxWidth: '85%' },
//   botBubble: { alignSelf: 'flex-start', backgroundColor: 'transparent', maxWidth: '95%' },
  
//   messageText: { color: '#E2E8F0', fontSize: 16, lineHeight: 24 },
  
//   botActionRow: { flexDirection: 'row', marginTop: 12, gap: 12 },
//   actionBtn: { paddingVertical: 8, paddingHorizontal: 12, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },

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
import { 
  View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, 
  KeyboardAvoidingView, Platform, Keyboard, Image, ToastAndroid, 
  Dimensions, Alert, TouchableWithoutFeedback, ActivityIndicator, 
  Modal, Animated 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useIsFocused } from '@react-navigation/native';
import RNFS from 'react-native-fs';
import { initLlama } from 'llama.rn';
import Voice, { SpeechResultsEvent } from '@react-native-voice/voice';
import Tts from 'react-native-tts';
import LinearGradient from 'react-native-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Markdown from 'react-native-markdown-display';
import Clipboard from '@react-native-clipboard/clipboard';
import Svg, { Path } from 'react-native-svg';
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
  const safeTtsStop = () => {
    try {
      Tts.stop(false); 
    } catch (e) {
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

  // 🔥 NEW: Animation & Loading States
  const [isEngineLoading, setIsEngineLoading] = useState(true);
  const [loadingModelName, setLoadingModelName] = useState<string>("Iris Engine");
  const loadingAnim = useRef(new Animated.Value(0)).current;

  // 🔥 NEW: Keyboard State for Android Fix
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [touchStartX, setTouchStartX] = useState(0);
  const [touchStartY, setTouchStartY] = useState(0);
  const [currentActiveModel, setCurrentActiveModel] = useState("No active model");
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  
  const isFocused = useIsFocused();
  const flatListRef = useRef<FlatList>(null);

  // 🔥 NEW: Keyboard Listener (Hides prompts ONLY on Android to prevent overlap)
  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSubscription = Keyboard.addListener(showEvent, () => setKeyboardVisible(true));
    const hideSubscription = Keyboard.addListener(hideEvent, () => setKeyboardVisible(false));

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  // 🔥 NEW: Loading Animation Loop
  useEffect(() => {
    if (isEngineLoading) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(loadingAnim, { toValue: 1, duration: 1200, useNativeDriver: false }),
          Animated.timing(loadingAnim, { toValue: 0, duration: 1200, useNativeDriver: false })
        ])
      ).start();
    } else {
      loadingAnim.stopAnimation();
      loadingAnim.setValue(0);
    }
  }, [isEngineLoading]);

  const barWidth = loadingAnim.interpolate({ inputRange: [0, 1], outputRange: ['10%', '100%'] });

  const loadEngine = async () => {
    setIsEngineLoading(true);
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
    setLoadingModelName(modelNameForDrawer);

    if (!activeModelPath) {
      setNeedsModel(true);
      setIsEngineLoading(false);
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
          setIsEngineLoading(false);
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
    setIsEngineLoading(false);
  };

  useEffect(() => {
    Tts.setDefaultLanguage('en-US');
    if (Platform.OS === 'android') {
      Tts.setDefaultRate(0.5);
    }
    
    const onStart = () => {};
    const onFinish = () => setSpeakingId(null);
    const onCancel = () => setSpeakingId(null);

    Tts.addEventListener('tts-start', onStart);
    Tts.addEventListener('tts-finish', onFinish);
    Tts.addEventListener('tts-cancel', onCancel);

    Voice.onSpeechStart = () => { setIsListening(true); safeTtsStop(); };
    Voice.onSpeechEnd = () => setIsListening(false);
    Voice.onSpeechError = () => setIsListening(false);
    Voice.onSpeechPartialResults = (e: SpeechResultsEvent) => { if (e.value && e.value.length > 0) setInputText(e.value[0]); };
    Voice.onSpeechResults = (e: SpeechResultsEvent) => { if (e.value && e.value.length > 0) setInputText(e.value[0]); };

    if (isFocused) loadEngine();
    
    return () => { 
      Voice.destroy().then(Voice.removeAllListeners); 
      safeTtsStop(); 
      try {
        Tts.removeAllListeners('tts-start');
        Tts.removeAllListeners('tts-finish');
        Tts.removeAllListeners('tts-cancel');
      } catch (e) {
        console.log(e);
      }
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

  const handleCopyText = (text: string) => {
    Clipboard.setString(text);
    if (Platform.OS === 'android') {
      ToastAndroid.show("Text Copied!", ToastAndroid.SHORT);
    } else {
      Alert.alert("Copied", "Text copied to clipboard");
    }
  };

  const handleSpeakText = (text: string, id: string) => {
    const isStopping = speakingId === id;
    
    safeTtsStop();
    setSpeakingId(null);

    if (!isStopping) {
      setTimeout(() => {
        setSpeakingId(id); 
        Tts.speak(text);   
      }, 100); 
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
          {/* 🔥 FIX: Changed 'undefined' to 'padding' so Android box comes up cleanly */}
          <KeyboardAvoidingView 
            style={styles.container} 
            behavior="padding"
            keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
          >
            
            {/* 🔥 NEW: Engine Loading Modal */}
            <Modal visible={isEngineLoading && !needsModel} transparent animationType="fade">
              <View style={styles.loadingScreenOverlay}>
                <Text style={styles.loadingTitle}>Loading Model</Text>
                <Text style={styles.loadingSubtitle}>Please wait...</Text>
                <Text style={styles.loadingModelName}>{loadingModelName}</Text>
                <View style={styles.loadingTrack}>
                  <Animated.View style={[styles.loadingFill, { width: barWidth }]} />
                </View>
              </View>
            </Modal>

            {needsModel && isFocused && !isEngineLoading && (
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
                  <Svg width={24} height={24} viewBox="0 0 30 30" fill="none">
                    <Path fill="#E6E9EB" fillRule="evenodd" d="M14.14 1.3a1.7 1.7 0 0 0-1.656 1.324l-.217.96c-.16.704-.7 1.254-1.367 1.53-.669.278-1.432.266-2.045-.12l-.827-.522a1.7 1.7 0 0 0-2.11.236L4.706 5.92a1.7 1.7 0 0 0-.236 2.108l.524.833c.385.611.397 1.373.12 2.04-.276.667-.826 1.208-1.53 1.367l-.96.218A1.7 1.7 0 0 0 1.3 14.144v1.714a1.7 1.7 0 0 0 1.324 1.658l.96.218c.704.16 1.253.7 1.529 1.365.277.67.267 1.434-.12 2.046l-.523.827a1.7 1.7 0 0 0 .236 2.11l1.214 1.212a1.7 1.7 0 0 0 2.108.236l.83-.523c.613-.386 1.375-.398 2.043-.121.666.276 1.206.826 1.366 1.53l.217.96a1.7 1.7 0 0 0 1.658 1.324h1.714a1.7 1.7 0 0 0 1.658-1.324l.217-.959c.16-.704.7-1.254 1.368-1.53.668-.277 1.43-.266 2.043.12l.83.523a1.7 1.7 0 0 0 2.108-.236l1.212-1.212a1.699 1.699 0 0 0 .236-2.108l-.522-.83c-.386-.611-.396-1.375-.12-2.044.277-.667.827-1.207 1.53-1.367l.96-.217a1.7 1.7 0 0 0 1.324-1.658v-1.714a1.7 1.7 0 0 0-1.324-1.66l-.958-.216c-.705-.16-1.255-.7-1.531-1.367-.277-.668-.265-1.43.12-2.042l.523-.829a1.7 1.7 0 0 0-.236-2.11l-1.212-1.212a1.7 1.7 0 0 0-2.11-.236l-.828.522c-.612.386-1.38.395-2.048.118-.668-.277-1.203-.825-1.364-1.529l-.218-.959A1.7 1.7 0 0 0 15.856 1.3H14.14ZM8.604 6.846c.749.472 1.698.426 2.496.042a9 9 0 0 1 .92-.382c.834-.293 1.537-.93 1.733-1.793l.2-.877a1.073 1.073 0 0 1 2.093 0l.199.876c.196.863.899 1.501 1.734 1.794.313.11.62.237.92.381.797.384 1.746.43 2.495-.042l.76-.478a1.074 1.074 0 0 1 1.48 1.481l-.478.758c-.473.749-.425 1.698-.041 2.495.143.298.27.604.38.919.293.835.93 1.54 1.794 1.736l.876.198a1.073 1.073 0 0 1-.001 2.093l-.876.199c-.863.195-1.5.898-1.794 1.733-.11.314-.237.622-.381.922-.384.797-.43 1.746.041 2.494l.48.76a1.073 1.073 0 0 1-1.481 1.48l-.76-.479c-.748-.471-1.697-.425-2.494-.042-.3.144-.606.27-.92.38-.835.293-1.538.931-1.734 1.794l-.2.876a1.073 1.073 0 0 1-2.093 0l-.199-.876c-.196-.863-.899-1.501-1.733-1.794a9.009 9.009 0 0 1-.918-.38c-.798-.384-1.747-.43-2.496.042l-.76.479a1.074 1.074 0 0 1-1.48-1.481l.48-.76c.471-.747.425-1.695.042-2.493a9.005 9.005 0 0 1-.382-.922c-.293-.835-.931-1.538-1.794-1.732l-.875-.198a1.073 1.073 0 0 1-.002-2.093l.877-.199c.863-.196 1.501-.899 1.794-1.733.11-.313.237-.618.38-.917.384-.799.43-1.749-.041-2.499l-.48-.763a1.073 1.073 0 0 1 1.48-1.479l.76.48ZM18.052 15a3.05 3.05 0 1 1-6.1 0 3.05 3.05 0 0 1 6.1 0Zm1.8 0a4.85 4.85 0 1 1-9.7 0 4.85 4.85 0 0 1 9.7 0Z" clipRule="evenodd" />
                  </Svg>
                </TouchableOpacity>

                <TouchableOpacity 
                  onPress={clearChat}
                  style={{ padding: 8 }}
                >
                  <Svg width={24} height={24} viewBox="0 0 30 30" fill="none">
                    <Path stroke="#E6E9EB" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12.547 13.786a2.599 2.599 0 0 0-.761 1.84v3.66h3.682c.69 0 1.353-.275 1.841-.763L28.165 7.66a2.599 2.599 0 0 0 0-3.681l-1.073-1.073a2.599 2.599 0 0 0-3.682 0l-10.863 10.88Z" />
                    <Path stroke="#E6E9EB" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M26.786 15c0 5.304.495 10.058-1.152 11.705-1.648 1.648-4.3 1.648-9.603 1.648-5.302 0-7.955 0-9.602-1.648-1.648-1.647-1.648-4.3-1.648-9.602 0-5.303-.536-7.42 1.112-9.067C7.54 6.388 10.729 5.853 16.03 5.853" />
                  </Svg>
                </TouchableOpacity>
              </View>
            </View>

            {messages.length === 0 && !isEngineLoading ? (
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

                  {/* 🔥 FIX: Hide Prompts ONLY on Android when Keyboard is OPEN */}
                  {!(Platform.OS === 'android' && isKeyboardVisible) && (
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
                  )}
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
                  <View style={[styles.messageWrapper, item.isUser ? styles.userBubble : styles.botBubble]}>
                    {item.isUser ? (
                      <Text style={styles.messageText}>{item.text}</Text>
                    ) : (
                      <View>
                        {/* 🔥 NEW: Thinking UI exactly where it belongs */}
                        {item.text.length === 0 && isGenerating ? (
                          <View style={styles.thinkingContainer}>
                            <ActivityIndicator size="small" color="#2563EB" />
                            <Text style={styles.thinkingText}>Iris is thinking...</Text>
                          </View>
                        ) : (
                          <View>
                            <Markdown style={markdownStyles}>
                              {item.text}
                            </Markdown>
                            
                            {item.text.length > 0 && (
                              <View style={styles.botActionRow}>
                                <TouchableOpacity onPress={() => handleCopyText(item.text)} style={styles.actionBtn}>
                                  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                                    <Path stroke="#cbd5e1" strokeLinecap="round" strokeWidth={1.5} d="M20.998 10c-.012-2.175-.108-3.353-.877-4.121C19.243 5 17.828 5 15 5h-3c-2.828 0-4.243 0-5.121.879C6 6.757 6 8.172 6 11v5c0 2.828 0 4.243.879 5.121C7.757 22 9.172 22 12 22h3c2.828 0 4.243 0 5.121-.879C21 20.243 21 18.828 21 16v-1" />
                                    <Path stroke="#cbd5e1" strokeLinecap="round" strokeWidth={1.5} d="M3 10v6a3 3 0 0 0 3 3M18 5a3 3 0 0 0-3-3h-4C7.229 2 5.343 2 4.172 3.172 3.518 3.825 3.229 4.7 3.102 6" />
                                  </Svg>
                                </TouchableOpacity>
                                
                                <TouchableOpacity 
                                  onPress={() => handleSpeakText(item.text, item.id)} 
                                  style={styles.actionBtn}
                                >
                                  {speakingId === item.id ? (
                                    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                                      <Path fill="#ef4444" fillRule="evenodd" d="M12 1.5a10.5 10.5 0 1 0 0 21 10.5 10.5 0 0 0 0-21ZM9 8.25a.75.75 0 0 0-.75.75v6a.75.75 0 0 0 .75.75h6a.75.75 0 0 0 .75-.75V9a.75.75 0 0 0-.75-.75H9Z" clipRule="evenodd" />
                                    </Svg>
                                  ) : (
                                    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                                      <Path fill="#cbd5e1" d="M12.914 4.5 8.414 9h-4.5v6h4.5l4.5 4.5v-15Zm2.412 1.297-.218.815A5.574 5.574 0 0 1 19.242 12a5.574 5.574 0 0 1-4.134 5.388l.218.815A6.426 6.426 0 0 0 20.086 12a6.425 6.425 0 0 0-4.76-6.203Zm-.582 2.173-.219.815A3.324 3.324 0 0 1 16.992 12a3.325 3.325 0 0 1-2.467 3.215l.219.815A4.176 4.176 0 0 0 17.836 12a4.176 4.176 0 0 0-3.092-4.03Zm-.582 2.174-.219.815c.473.127.8.551.8 1.041 0 .49-.327.915-.8 1.041l.219.815A1.925 1.925 0 0 0 15.585 12c0-.868-.586-1.632-1.425-1.856Z" />
                                    </Svg>
                                  )}
                                </TouchableOpacity>
                              </View>
                            )}
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
                  <Svg width={24} height={24} viewBox="0 0 35 35" fill="none" style={{ marginRight: 12 }}>
                    <Path fill={isListening ? "#ff4444" : "#ffffff"} fillRule="evenodd" clipRule="evenodd" d="M13.125 9.48a4.375 4.375 0 1 1 8.75 0v8.75a4.375 4.375 0 0 1-8.75 0V9.48ZM17.5 6.562a2.917 2.917 0 0 0-2.917 2.916v8.75a2.916 2.916 0 1 0 5.834 0V9.48A2.917 2.917 0 0 0 17.5 6.563ZM10.208 17.5a.73.73 0 0 1 .73.73 6.563 6.563 0 1 0 13.125 0 .73.73 0 0 1 1.458 0 8.02 8.02 0 0 1-7.292 7.988v2.22h3.646a.73.73 0 0 1 0 1.458h-8.75a.729.729 0 1 1 0-1.458h3.646v-2.22a8.02 8.02 0 0 1-7.292-7.989.73.73 0 0 1 .73-.729Z" />
                  </Svg>
                </TouchableOpacity>
                <TextInput
                  style={styles.input} placeholder="Message" placeholderTextColor="#666666"
                  value={inputText} onChangeText={setInputText} editable={!needsModel && !isGenerating}
                  onSubmitEditing={() => sendMessage()}
                />
                <TouchableOpacity onPress={() => sendMessage()} disabled={needsModel || isGenerating}>
                  <Svg width={24} height={24} viewBox="0 0 32 32" fill="none" style={{ marginLeft: 12 }}>
                    <Path d="M21.8157 9.82093L12.7494 18.8362C12.4367 18.5217 12.0588 18.272 11.6362 18.1055L2.80233 14.6583C-0.0226779 13.5555 0.0982063 9.51894 2.98256 8.58628L26.6955 0.0913599C29.2066 0.0996277 31.5787 2.48515 30.7505 4.99162L22.945 28.6596C21.995 31.5398 17.9566 31.6367 16.871 28.8067L13.4715 19.9558C13.3104 19.537 13.0637 19.1565 12.7471 18.8385" stroke="#ffffff" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"/>
                  </Svg>
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

  // 🔥 NEW: Animation Styles Added Perfectly
  loadingScreenOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  loadingTitle: { color: '#ffffff', fontSize: 20, fontWeight: 'bold', marginBottom: 4 },
  loadingSubtitle: { color: '#e2e8f0', fontSize: 16, marginBottom: 24 },
  loadingModelName: { color: '#ffffff', fontSize: 16, fontWeight: 'bold', textAlign: 'center', marginBottom: 12 },
  loadingTrack: { width: '80%', height: 4, backgroundColor: '#334155', borderRadius: 2, overflow: 'hidden' },
  loadingFill: { height: '100%', backgroundColor: '#3b82f6', borderRadius: 2 },
  thinkingContainer: { flexDirection: 'row', alignItems: 'center', padding: 4, gap: 10 },
  thinkingText: { color: '#94a3b8', fontStyle: 'italic', fontSize: 15 },

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
  
  chatContainer: { paddingHorizontal: 16, paddingBottom: 20, paddingTop: 20, flexGrow: 1, justifyContent: 'flex-end' },
  messageWrapper: { marginBottom: 16 }, 
  
  userBubble: { alignSelf: 'flex-end', backgroundColor: '#171E2C', padding: 14, borderRadius: 18, borderBottomRightRadius: 4, maxWidth: '85%' },
  botBubble: { alignSelf: 'flex-start', backgroundColor: 'transparent', maxWidth: '95%' },
  
  messageText: { color: '#E2E8F0', fontSize: 16, lineHeight: 24 },
  
  botActionRow: { flexDirection: 'row', marginTop: 12, gap: 12 },
  actionBtn: { paddingVertical: 8, paddingHorizontal: 12, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },

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