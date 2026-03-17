import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import NerveSparksDrawer from '../components/NerveSparksDrawer';

export default function AboutScreen() {
  // 🔥 1. STATES MOVED INSIDE THE COMPONENT
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [touchStartX, setTouchStartX] = useState(0);

  // 🔥 2. SWIPE LOGIC MOVED INSIDE
  const handleTouchStart = (e: any) => setTouchStartX(e.nativeEvent.pageX);
  const handleTouchEnd = (e: any) => {
    if (e.nativeEvent.pageX - touchStartX > 50) {
      setIsDrawerOpen(true);
    }
  };

  const features = [
    "Offline Functionality: Runs without the need for an internet connection.",
    "Privacy First: All data is processed locally on your device.",
    "Customizable Models: Download and use your preferred AI model with ease.",
    "Open Source: Built on the foundations of the llama.cpp Android example, enabling developers to contribute and modify."
  ];

  const faqs = [
    { q: "What is llama.cpp?", a: "llama.cpp is an open-source project that enables running large language models (LLMs) on edge devices such as smartphones and laptops." },
    { q: "Do I need an internet connection to use this app?", a: "Yes, but only to download models to your device. After that, the app operates entirely offline. All operations are performed locally on your device." }
  ];

  return (
    // 🔥 3. ATTACHED TOUCH EVENTS TO THE ROOT COMPONENT
    <LinearGradient 
      colors={['#050a14', '#051633']} 
      style={styles.container}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text style={styles.header}>Welcome to Iris</Text>
        <Text style={styles.body}>
          Iris is an offline Android chat application powered by the llama.cpp framework. Designed to operate entirely offline, it ensures privacy and independence from external servers. Whether you're a developer exploring AI applications or a privacy-conscious user, this app provides a seamless and secure way to experience conversational AI. Please note that the app may occasionally generate inaccurate results.
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

      {/* 🔥 4. PLACED THE DRAWER SAFELY AT THE BOTTOM OUTSIDE THE SCROLLVIEW */}
      <NerveSparksDrawer 
        visible={isDrawerOpen} 
        onClose={() => setIsDrawerOpen(false)} 
        activeModelName="No active model" 
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { color: 'white', fontSize: 20, fontWeight: 'bold', marginBottom: 12 },
  body: { color: 'white', fontSize: 16, lineHeight: 24 },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, paddingRight: 20 },
  iconCircle: { width: 20, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 12, marginTop: 2 },
  icon: { color: 'white', fontSize: 12, fontWeight: 'bold' },
  listItem: { color: 'white', fontSize: 16, lineHeight: 24 },
  faqBlock: { marginBottom: 16 },
  faqQ: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  faqA: { color: 'rgba(255,255,255,0.7)', fontSize: 14, marginLeft: 32, marginTop: 4, lineHeight: 20 }
});