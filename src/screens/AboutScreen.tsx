import React from 'react'; // 🔥 FIX: Removed unused useState
import { 
  View, 
  Text, 
  ScrollView, 
  StyleSheet 
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

export default function AboutScreen() {

  const features = [
    "Offline Functionality: Runs entirely without the need for an internet connection.",
    "Privacy First: All conversations and data are processed locally on your device.",
    "Cross-Platform: Built with React Native to run seamlessly on both iOS and Android.",
    "Powered by llama.rn: Leverages the powerful llama.rn library to execute complex GGUF models directly on mobile hardware."
  ];

  const faqs = [
    { 
      q: "What is llama.rn?", 
      a: "llama.rn is a React Native binding for the popular llama.cpp project. It enables developers to run Large Language Models (LLMs) locally on mobile devices (iOS & Android) with high performance and minimal memory usage." 
    },
    { 
      q: "Do I need an internet connection to use this app?", 
      a: "Only initially to download your preferred AI models. Once downloaded, Iris operates 100% offline, ensuring maximum privacy and zero latency from external servers." 
    }
  ];

  return (
    <LinearGradient 
      colors={['#050a14', '#051633']} 
      style={styles.container}
    >
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text style={styles.header}>Welcome to Iris</Text>
        <Text style={styles.body}>
          Iris is a secure, cross-platform chat application powered by the llama.rn framework. Designed to operate entirely offline, it ensures absolute privacy and independence from cloud servers. Whether you are an AI enthusiast exploring edge computing or a privacy-conscious user, Iris provides a seamless and secure conversational AI experience directly from your pocket. Please note that the AI may occasionally generate inaccurate results.
        </Text>

        <Text style={[styles.header, { marginTop: 24 }]}>Features</Text>
        {features.map((f, i) => (
          <View key={i} style={styles.row}>
            <View style={[styles.iconCircle, { backgroundColor: '#4CAF50' }]}><Text style={styles.icon}>✓</Text></View>
            <Text style={styles.listItem}>{f}</Text>
          </View>
        ))}

        <Text style={[styles.header, { marginTop: 24 }]}>FAQs</Text>
        {faqs.map((faq, i) => (
          <View key={i} style={styles.faqBlock}>
            <View style={styles.row}>
              <View style={[styles.iconCircle, { backgroundColor: '#1b384f' }]}><Text style={styles.icon}>★</Text></View>
              <Text style={styles.faqQ}>{faq.q}</Text>
            </View>
            <Text style={styles.faqA}>{faq.a}</Text>
          </View>
        ))}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { color: 'white', fontSize: 20, fontWeight: 'bold', marginBottom: 12 },
  body: { color: 'white', fontSize: 16, lineHeight: 24 },
  row: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12, paddingRight: 20 }, // Changed alignItems to flex-start for better multi-line wrapping
  iconCircle: { width: 20, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 12, marginTop: 2 },
  icon: { color: 'white', fontSize: 12, fontWeight: 'bold' },
  listItem: { color: 'white', fontSize: 16, lineHeight: 24, flex: 1 }, // Added flex: 1 to prevent text clipping
  faqBlock: { marginBottom: 16 },
  faqQ: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  faqA: { color: 'rgba(255,255,255,0.7)', fontSize: 14, marginLeft: 32, marginTop: 4, lineHeight: 20 }
});


// import React, { useState, useEffect } from 'react';
// import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
// import Tts from 'react-native-tts';
// import LinearGradient from 'react-native-linear-gradient';

// export default function AboutScreen() {
//   // 🔥 Sirf ek simple state jo strictly Native Engine control karega
//   const [isSpeaking, setIsSpeaking] = useState(false);

//   const sampleText = "Hello Arindam bro! This is a test. If I stop when you click the button, that means our isolated logic is 100 percent perfect.";

//   useEffect(() => {
//     // Setup Engine
//     Tts.setDefaultLanguage('en-US');
    
//     // 🔥 THE NATIVE LISTENERS (Fixed: Removed tts-error)
//     const onStart = () => setIsSpeaking(true);
//     const onFinish = () => setIsSpeaking(false);
//     const onCancel = () => setIsSpeaking(false);

//     // Add Listeners
//     Tts.addEventListener('tts-start', onStart);
//     Tts.addEventListener('tts-finish', onFinish);
//     Tts.addEventListener('tts-cancel', onCancel);

//     // Cleanup on screen exit
//     return () => {
//       Tts.stop(false);
//       try {
//         Tts.removeAllListeners('tts-start');
//         Tts.removeAllListeners('tts-finish');
//         Tts.removeAllListeners('tts-cancel');
//       } catch (e) {
//         console.log("Cleanup error:", e);
//       }
//     };
//   }, []);

//   // 🔥 THE TOGGLE LOGIC
//   const handleToggleSpeech = () => {
//     if (isSpeaking) {
//       // Agar bol raha hai, toh force stop
//       Tts.stop(false); 
//       // State automatically 'tts-cancel' listener se false ho jayegi
//     } else {
//       // Agar chup hai, toh bolna shuru karo
//       Tts.speak(sampleText);
//       // State automatically 'tts-start' listener se true ho jayegi
//     }
//   };

//   return (
//     <LinearGradient colors={['#050a14', '#051633']} style={styles.container}>
//       <SafeAreaView style={styles.content}>
        
//         <Text style={styles.title}>TTS Sandbox 🧪</Text>
        
//         <View style={styles.card}>
//           <Text style={styles.textToRead}>{sampleText}</Text>
//         </View>

//         <TouchableOpacity 
//           onPress={handleToggleSpeech} 
//           style={[styles.button, isSpeaking ? styles.buttonStop : styles.buttonStart]}
//           activeOpacity={0.7}
//         >
//           <Text style={styles.buttonText}>
//             {isSpeaking ? "🛑 STOP READING" : "🔊 START READING"}
//           </Text>
//         </TouchableOpacity>

//       </SafeAreaView>
//     </LinearGradient>
//   );
// }

// const styles = StyleSheet.create({
//   container: { flex: 1 },
//   content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
//   title: { color: '#ffffff', fontSize: 28, fontWeight: 'bold', marginBottom: 40 },
//   card: { 
//     backgroundColor: '#0f172a', 
//     padding: 20, 
//     borderRadius: 12, 
//     borderWidth: 1, 
//     borderColor: '#333333',
//     marginBottom: 40 
//   },
//   textToRead: { color: '#E2E8F0', fontSize: 18, lineHeight: 28, textAlign: 'center' },
//   button: { 
//     paddingVertical: 16, 
//     paddingHorizontal: 32, 
//     borderRadius: 30, 
//     elevation: 5,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.25,
//     shadowRadius: 3.84,
//   },
//   buttonStart: { backgroundColor: '#2563EB' }, // Blue
//   buttonStop: { backgroundColor: '#EF4444' }, // Red
//   buttonText: { color: '#ffffff', fontSize: 18, fontWeight: 'bold' }
// });