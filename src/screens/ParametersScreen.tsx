import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  ToastAndroid, 
  Platform, 
  Alert, // 🔥 Added Alert
  Dimensions
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Slider from '@react-native-community/slider';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NerveSparksDrawer from '../components/NerveSparksDrawer';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// 🔥 RENDER-SAFE SLIDER COMPONENT (Smoother & Cleaner)
const SettingSection = ({ title, description, value, onValueChange, min, max, step }: any) => (
  <View style={styles.section}>
    <Text style={styles.title}>{title}</Text>
    <Text style={styles.description}>{description}</Text>
    {/* 🔥 Correct Display: Fixed 2 decimals for floats, Round for integers */}
    <Text style={styles.valueText}>
      {step < 1 ? value.toFixed(2) : Math.round(value)}
    </Text>
    <Slider
      style={styles.slider}
      minimumValue={min} 
      maximumValue={max} 
      // 🔥 SMOOTH STEP: 0.05 step provides clean decimal values like your photo
      step={step} 
      value={value}
      onValueChange={onValueChange}
      // 🔥 CORRECT COLORS: Only minimum track is blue, max is gray (like photo)
      minimumTrackTintColor="#3b82f6" 
      maximumTrackTintColor="rgba(255,255,255,0.15)" // Subtle grey max track
      thumbTintColor="#3b82f6"
    />
  </View>
);

export default function ParametersScreen() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [touchStartX, setTouchStartX] = useState(0);

  const handleTouchStart = (e: any) => setTouchStartX(e.nativeEvent.pageX);
  const handleTouchEnd = (e: any) => {
    if (e.nativeEvent.pageX - touchStartX > 50) {
      setIsDrawerOpen(true);
    }
  };

  // 🔥 INITIALIZING VALUES FROM YOUR PHOTO (0, 0.70, 0.95, 40)
  const [thread, setThread] = useState(0);
  const [temp, setTemp] = useState(0.70);
  const [topP, setTopP] = useState(0.95);
  const [topK, setTopK] = useState(40);

  useEffect(() => {
    const loadSavedParameters = async () => {
      try {
        const savedData = await AsyncStorage.getItem('@iris_parameters');
        if (savedData) {
          const parsed = JSON.parse(savedData);
          setThread(parsed.thread ?? 0);
          setTemp(parsed.temp ?? 0.70);
          setTopP(parsed.topP ?? 0.95);
          setTopK(parsed.topK ?? 40);
        }
      } catch (error) { console.log(error); }
    };
    loadSavedParameters();
  }, []);

  const resetDefault = async () => {
    // defaults matching photo
    const defaults = { thread: 0, temp: 0.70, topP: 0.95, topK: 40 };
    setThread(defaults.thread); setTemp(defaults.temp); setTopP(defaults.topP); setTopK(defaults.topK);
    try {
      await AsyncStorage.setItem('@iris_parameters', JSON.stringify(defaults));
      // 🔥 Showing Native Alert for Reset
      Alert.alert("Reset Success", "Parameters restored to defaults.");
    } catch (error) { console.log(error); }
  };

  const saveChanges = async () => {
    try {
      const currentParams = { thread, temp, topP, topK };
      await AsyncStorage.setItem('@iris_parameters', JSON.stringify(currentParams));
      // 🔥 4. SHOWING NATIVE ALERT WHEN SAVING (with "OK" button)
      Alert.alert(
        "Save Successful ✅",
        "Your parameter changes are now saved.",
        [{ text: "OK" }] // Adding explicit OK button
      );
    } catch (error) {
      console.log(error);
      Alert.alert("Save Failed ❌", "Could not save your changes. Try again.");
    }
  };

  return (
    <LinearGradient colors={['#050a14', '#051633']} style={styles.container} onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      
      {/* ⚠️ CRITICAL: Not using edges=['bottom'] to force bottom spacing */}
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          <Text style={styles.warningText}>After changing please Save the changes</Text>
          
          {/* 🔥 1. FLOATING CARD WITH SPACING (as seen in photo) */}
          <View style={styles.card}>
            <SettingSection title="Thread Selection" description="Select thread for process, 0 for default" value={thread} min={0} max={8} step={1} onValueChange={setThread} />
            <View style={styles.divider} />
            
            {/* 🔥 2. SMOOTH SLIDER VALUES: Temperature at 0.70 */}
            <SettingSection title="Temperature" description="Adjust randomness (0.0 - 1.0)" value={temp} min={0} max={1} step={0.05} onValueChange={setTemp} />
            <View style={styles.divider} />
            
            {/* 🔥 2. SMOOTH SLIDER VALUES: Top P at 0.95 */}
            <SettingSection title="Top P" description="Nucleus sampling threshold (0.0 - 1.0)" value={topP} min={0} max={1} step={0.05} onValueChange={setTopP} />
            <View style={styles.divider} />
            
            <SettingSection title="Top K" description="Number of tokens to consider (0 - 50)" value={topK} min={0} max={50} step={1} onValueChange={setTopK} />
          </View>
        </ScrollView>

        {/* 🔥 3. SPACED BOTTOM BUTTONS (Finished in little up) */}
        <View style={styles.buttonRow}>
          <TouchableOpacity style={[styles.btn, styles.resetBtn]} onPress={resetDefault}>
            <Text style={styles.resetBtnText}>Reset Default</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.btn, styles.saveBtn]} onPress={saveChanges}>
            <Text style={styles.saveBtnText}>Save</Text>
          </TouchableOpacity>
        </View>

        <NerveSparksDrawer visible={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} activeModelName="No active model" />
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  scrollContent: { 
    // 🔥 Adding horizontal padding to ScrollView so the card floats
    paddingHorizontal: 16,
    // 🔥 PADDING FIX: Increase padding here so card has massive breathing room at bottom.
    paddingBottom: SCREEN_HEIGHT * 0.1, // 10% screen height padding at bottom
    paddingTop: 10
  },
  warningText: { color: '#f1f5f9', textAlign: 'center', marginBottom: 20, fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.5 },
  card: { 
    backgroundColor: '#0f172a', 
    borderRadius: 16, 
    // 🔥 Increased padding for spacious feel like photo
    padding: 24, 
    borderWidth: 1, 
    borderColor: 'rgba(255,255,255,0.05)', 
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 5
  },
  section: { 
    // 🔥 Massive gap between sections
    marginBottom: 20 
  },
  title: { color: '#ffffff', fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  description: { color: '#94a3b8', fontSize: 12, marginBottom: 12 },
  valueText: { color: '#3b82f6', fontSize: 15, fontWeight: '700', marginBottom: 2 },
  slider: { width: '100%', height: 40 },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.08)', marginVertical: 20 },
  buttonRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    paddingHorizontal: 16, 
    marginTop: 20, 
    gap: 12,
    // 🔥 THE BOTTOM SPACING FIX: Hardcoded significant spacing for iOS to match photo.
    paddingBottom: Platform.OS === 'ios' ? 45 : 20, 
  },
  btn: { flex: 1, paddingVertical: 16, borderRadius: 12, alignItems: 'center', justifyContent: 'center', elevation: 3 },
  resetBtn: { backgroundColor: '#334155' },
  saveBtn: { backgroundColor: '#3b82f6' },
  resetBtnText: { color: '#e2e8f0', fontWeight: '600', fontSize: 16 },
  saveBtnText: { color: 'white', fontWeight: 'bold', fontSize: 16 }
});