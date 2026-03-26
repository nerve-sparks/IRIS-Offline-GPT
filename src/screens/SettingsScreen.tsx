import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Image } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
// import NerveSparksDrawer from '../components/NerveSparksDrawer'; // 🔥 Drawer Import kiya

export default function SettingsScreen({ navigation }: any) {
  // 🔥 DRAWER STATES
  // const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  // const [touchStartX, setTouchStartX] = useState(0);
  const [activeModel, setActiveModel] = useState("No active model");

  // 🔥 Fetch active model name for Drawer
  useEffect(() => {
    const fetchModel = async () => {
      try {
        const savedModel = await AsyncStorage.getItem('ACTIVE_MODEL_NAME');
        if (savedModel) setActiveModel(savedModel);
      } catch (e) { console.log(e); }
    };
    fetchModel();
  }, []);

  // 🔥 SWIPE GESTURE LOGIC (Right swipe to open)
  // const handleTouchStart = (e: any) => setTouchStartX(e.nativeEvent.pageX);
  // const handleTouchEnd = (e: any) => {
  //   if (e.nativeEvent.pageX - touchStartX > 50) {
  //     setIsDrawerOpen(true);
  //   }
  // };

  return (
    <LinearGradient 
      colors={['#050a14', '#051633']} 
      style={styles.container}
      // onTouchStart={handleTouchStart} // 🔥 Swipe Start
      // onTouchEnd={handleTouchEnd}      // 🔥 Swipe End
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.card}>
          
          <TouchableOpacity style={styles.row} onPress={() => navigation.navigate('Models')}>
            <Image source={require('../assets/icons/models.png')} style={styles.menuIcon} />
            <Text style={styles.rowText}>Models</Text>
            <Text style={styles.arrowIcon}>›</Text>
          </TouchableOpacity>
          <View style={styles.divider} />

          <TouchableOpacity style={styles.row} onPress={() => navigation.navigate('Parameters')}>
            <Image source={require('../assets/icons/parameters.png')} style={styles.menuIcon} />
            <Text style={styles.rowText}>Change Parameters</Text>
            <Text style={styles.arrowIcon}>›</Text>
          </TouchableOpacity>
          <View style={styles.divider} />

          <TouchableOpacity style={styles.row} onPress={() => navigation.navigate('Benchmark')}>
            <Image source={require('../assets/icons/benchmark.png')} style={styles.menuIcon} />
            <Text style={styles.rowText}>BenchMark</Text>
            <Text style={styles.arrowIcon}>›</Text>
          </TouchableOpacity>
          <View style={styles.divider} />

          <TouchableOpacity style={styles.row} onPress={() => navigation.navigate('About')}>
            <Image source={require('../assets/icons/about.png')} style={styles.menuIcon} />
            <Text style={styles.rowText}>About</Text>
            <Text style={styles.arrowIcon}>›</Text>
          </TouchableOpacity>
          <View style={styles.divider} />

          {/* 🔥 NEW REPORT ISSUE BUTTON */}
          <TouchableOpacity style={styles.row} onPress={() => navigation.navigate('ReportScreen')}>
            {/* Note: Maine alert/warning emoji use kiya hai taki tere icon size se match kare. 
                Agar tere paas 'report.png' hai assets mein, toh tu isey Image tag se replace kar lena */}
            <View style={{ width: 22, height: 22, justifyContent: 'center', alignItems: 'center', marginRight: 16 }}>
               <Text style={{ fontSize: 18 }}>⚠️</Text>
            </View>
            <Text style={[styles.rowText, { color: '#ff6b6b' }]}>Report an Issue</Text>
            <Text style={styles.arrowIcon}>›</Text>
          </TouchableOpacity>

        </View>
      </ScrollView>

      {/* 🔥 THE DRAWER COMPONENT */}
      {/* <NerveSparksDrawer 
        visible={isDrawerOpen} 
        onClose={() => setIsDrawerOpen(false)} 
        activeModelName={activeModel} 
      /> */}

    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContainer: { padding: 16, paddingTop: 20 },
  card: { backgroundColor: '#0f172a', borderRadius: 12, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 16 },
  menuIcon: { width: 22, height: 22, tintColor: '#ffffff', marginRight: 16 },
  rowText: { flex: 1, color: '#ffffff', fontSize: 18 },
  arrowIcon: { fontSize: 24, color: '#ffffff', opacity: 0.5 },
  divider: { height: 1, backgroundColor: '#333333', marginHorizontal: 16 }
});