import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Alert,
  Platform,
  ScrollView
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Slider from '@react-native-community/slider';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
// import NerveSparksDrawer from '../components/NerveSparksDrawer';

const SettingSection = ({ title, description, value, onValueChange, min, max, step }: any) => (
  <View style={styles.section}>
    <Text style={styles.title}>{title}</Text>
    <Text style={styles.description}>{description}</Text>
    <Text style={styles.valueText}>
      {step < 1 ? value.toFixed(2) : Math.round(value)}
    </Text>
    <Slider
      style={styles.slider}
      minimumValue={min} 
      maximumValue={max} 
      step={step} 
      value={value}
      onValueChange={onValueChange}
      minimumTrackTintColor="#3b82f6" 
      maximumTrackTintColor="rgba(255,255,255,0.15)"
      thumbTintColor="#3b82f6"
    />
  </View>
);

export default function ParametersScreen({ navigation }: any) {
  // const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  // const [touchStartX, setTouchStartX] = useState(0);

  // const handleTouchStart = (e: any) => setTouchStartX(e.nativeEvent.pageX);
  // const handleTouchEnd = (e: any) => {
  //   if (e.nativeEvent.pageX - touchStartX > 50) setIsDrawerOpen(true);
  // };

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
    const defaults = { thread: 0, temp: 0.70, topP: 0.95, topK: 40 };
    setThread(defaults.thread); setTemp(defaults.temp); setTopP(defaults.topP); setTopK(defaults.topK);
    try {
      await AsyncStorage.setItem('@iris_parameters', JSON.stringify(defaults));
      Alert.alert("Reset Success", "Parameters restored to defaults.");
    } catch (error) { console.log(error); }
  };

  const saveChanges = async () => {
    try {
      const currentParams = { thread, temp, topP, topK };
      await AsyncStorage.setItem('@iris_parameters', JSON.stringify(currentParams));
      
      Alert.alert(
        "Success ",
        "Parameters saved successfully!",
        [
          { 
            text: "OK", 
            onPress: () => navigation.goBack() 
          }
        ]
      );
    } catch (error) {
      console.log(error);
      Alert.alert("Error", "Could not save parameters.");
    }
  };

  return (
    <LinearGradient colors={['#050a14', '#051633']} style={styles.container}>
      {/* 🔥 THE FIX: Removed top/bottom automatic padding so it aligns exactly under your header */}
      <SafeAreaView style={styles.safeArea} edges={['left', 'right']}>
        
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} bounces={false}>
          {/* Text starts right at the top now */}
          <Text style={styles.warningText}>After changing please Save the changes</Text>
          
          <View style={styles.card}>
            <SettingSection title="Thread Selection" description="Select thread for process, 0 for default" value={thread} min={0} max={8} step={1} onValueChange={setThread} />
            <View style={styles.divider} />
            
            <SettingSection title="Temperature" description="Adjust randomness (0.0 - 1.0)" value={temp} min={0} max={1} step={0.01} onValueChange={setTemp} />
            <View style={styles.divider} />
            
            <SettingSection title="Top P" description="Nucleus sampling threshold (0.0 - 1.0)" value={topP} min={0} max={1} step={0.01} onValueChange={setTopP} />
            <View style={styles.divider} />
            
            <SettingSection title="Top K" description="Number of tokens to consider (0 - 50)" value={topK} min={0} max={50} step={1} onValueChange={setTopK} />
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity style={[styles.btn, styles.resetBtn]} onPress={resetDefault}>
              <Text style={styles.resetBtnText}>Reset Default</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.btn, styles.saveBtn]} onPress={saveChanges}>
              <Text style={styles.saveBtnText}>Save</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>

        {/* <NerveSparksDrawer visible={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} activeModelName="No active model" /> */}
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  scrollContent: { 
    paddingHorizontal: 16,
    // 🔥 Top padding is minimal now, making the content stick closer to the header
    paddingTop: 15,
    paddingBottom: 20 
  },
  warningText: { color: '#f1f5f9', textAlign: 'center', marginBottom: 12, fontSize: 13 },
  card: { 
    backgroundColor: '#0f172a', 
    borderRadius: 16, 
    padding: 16, 
    borderWidth: 1, 
    borderColor: 'rgba(255,255,255,0.05)', 
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 5
  },
  section: { 
    marginBottom: 4 
  },
  title: { color: '#ffffff', fontSize: 16, fontWeight: 'bold', marginBottom: 2 },
  description: { color: '#94a3b8', fontSize: 12, marginBottom: 4 },
  valueText: { color: '#3b82f6', fontSize: 14, fontWeight: '700', marginBottom: 0 },
  slider: { width: '100%', height: 35 }, 
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.08)', marginVertical: 12 }, 
  buttonRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginTop: 20, 
    gap: 12,
    // Bottom padding kept safely for iOS home indicator
    paddingBottom: Platform.OS === 'ios' ? 45 : 20, 
  },
  btn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  resetBtn: { backgroundColor: '#334155' },
  saveBtn: { backgroundColor: '#3b82f6' },
  resetBtnText: { color: '#e2e8f0', fontWeight: '600', fontSize: 16 },
  saveBtnText: { color: 'white', fontWeight: 'bold', fontSize: 16 }
});