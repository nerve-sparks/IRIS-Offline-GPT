import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, ToastAndroid } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Slider from '@react-native-community/slider';
import NerveSparksDrawer from '../components/NerveSparksDrawer';

export default function ParametersScreen() {
  // 🔥 1. DRAWER STATES MOVED PROPERLY INSIDE THIS COMPONENT
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [touchStartX, setTouchStartX] = useState(0);

  // 🔥 2. SWIPE LOGIC
  const handleTouchStart = (e: any) => setTouchStartX(e.nativeEvent.pageX);
  const handleTouchEnd = (e: any) => {
    if (e.nativeEvent.pageX - touchStartX > 50) {
      setIsDrawerOpen(true);
    }
  };

  const [thread, setThread] = useState(0);
  const [temp, setTemp] = useState(0.7);
  const [topP, setTopP] = useState(0.9);
  const [topK, setTopK] = useState(40);

  const resetDefault = () => {
    setThread(0); setTemp(0.0); setTopK(0); setTopP(0.0);
    ToastAndroid.show("Settings reset to default", ToastAndroid.SHORT);
  };

  const saveChanges = () => {
    ToastAndroid.show("Changes have been saved", ToastAndroid.SHORT);
  };

  const SettingSection = ({ title, description, value, onValueChange, min, max, step }: any) => (
    <View style={styles.section}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
      <Text style={styles.valueText}>{typeof value === 'number' && step < 1 ? value.toFixed(2) : value}</Text>
      <Slider
        style={{ width: '100%', height: 40 }}
        minimumValue={min} maximumValue={max} step={step} value={value}
        onValueChange={onValueChange}
        minimumTrackTintColor="#2563EB" maximumTrackTintColor="gray" thumbTintColor="#2563EB"
      />
    </View>
  );

  return (
    // 🔥 3. ATTACHED SWIPE HANDLERS TO THE ROOT ELEMENT
    <LinearGradient 
      colors={['#050a14', '#051633']} 
      style={styles.container}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <Text style={styles.warningText}>After changing please Save the changes</Text>
      
      <View style={styles.card}>
        <ScrollView style={{ padding: 15 }}>
          <SettingSection title="Thread Selection" description="Select thread for process, 0 for default" value={thread} min={0} max={8} step={1} onValueChange={setThread} />
          <View style={styles.divider} />
          <SettingSection title="Temperature" description="Adjust randomness (0.0 - 1.0)" value={temp} min={0} max={1} step={0.05} onValueChange={setTemp} />
          <View style={styles.divider} />
          <SettingSection title="Top P" description="Nucleus sampling threshold (0.0 - 1.0)" value={topP} min={0} max={1} step={0.05} onValueChange={setTopP} />
          <View style={styles.divider} />
          <SettingSection title="Top K" description="Number of tokens to consider (0 - 50)" value={topK} min={0} max={50} step={1} onValueChange={setTopK} />
        </ScrollView>
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity style={[styles.btn, { backgroundColor: '#9CA3AF' }]} onPress={resetDefault}>
          <Text style={styles.btnText}>Reset Default</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.btn, { backgroundColor: '#2563EB' }]} onPress={saveChanges}>
          <Text style={styles.btnText}>Save</Text>
        </TouchableOpacity>
      </View>
      
      {/* 🔥 4. PLACED THE DRAWER SAFELY AT THE BOTTOM */}
      <NerveSparksDrawer 
        visible={isDrawerOpen} 
        onClose={() => setIsDrawerOpen(false)} 
        activeModelName="No active model" 
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  warningText: { color: 'white', textAlign: 'center', marginBottom: 8 },
  card: { flex: 1, backgroundColor: '#0f172a', borderRadius: 8, elevation: 4 },
  section: { marginBottom: 16 },
  title: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  description: { color: 'gray', fontSize: 12, marginBottom: 8 },
  valueText: { color: 'white', marginBottom: -10 },
  divider: { height: 1, backgroundColor: '#333333', marginVertical: 8 },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16, gap: 8 },
  btn: { flex: 1, paddingVertical: 12, borderRadius: 8, alignItems: 'center', elevation: 3 },
  btnText: { color: 'white', fontWeight: 'bold' }
});