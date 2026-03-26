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