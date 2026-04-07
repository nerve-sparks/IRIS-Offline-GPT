import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Svg, { Path } from 'react-native-svg';

export default function SettingsScreen({ navigation }: any) {
  const [activeModel, setActiveModel] = useState("No active model");

  useEffect(() => {
    const fetchModel = async () => {
      try {
        const savedModel = await AsyncStorage.getItem('ACTIVE_MODEL_NAME');
        if (savedModel) setActiveModel(savedModel);
      } catch (e) { console.log(e); }
    };
    fetchModel();
  }, []);

  // 🔥 iOS Safe Wrapper (Fixed width/height, no percentages)
  const IconWrapper = ({ children }: { children: React.ReactNode }) => (
    <View style={styles.iconContainer}>{children}</View>
  );

  // 🔥 NEW: Reusable SVG Arrow Component
  const RightArrowIcon = () => (
    <Svg width={12} height={23} viewBox="0 0 12 23" fill="none" style={styles.arrowIconSvg}>
      <Path 
        fill="#ffffff" 
        fillRule="evenodd" 
        clipRule="evenodd" 
        d="M8.274 11.95 4.478 15.56l-.949-.902L6.851 11.5 3.529 8.343l.95-.902 3.795 3.608c.126.12.197.282.197.451 0 .17-.071.331-.197.45Z" 
      />
    </Svg>
  );

  return (
    <LinearGradient colors={['#050a14', '#051633']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.card}>
          
          {/* MODELS */}
          <TouchableOpacity style={styles.row} onPress={() => navigation.navigate('Models')}>
            <IconWrapper>
              <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
                <Path fill="#ffffff" d="M18 9V3l-6-3-6 3v6l-6 3v7.5l6 3 6-3 6 3 6-3V12l-6-3Zm-5.865-7.32L16.5 3.84l-3.9 1.95-4.365-2.16 3.9-1.95ZM7.5 4.17 12 6.42v5.4L7.5 9.57v-5.4ZM6 20.82l-4.5-2.25v-5.4L6 15.42v5.4Zm.42-6L2.1 12.63 6 10.68l4.32 2.16-3.9 1.98Zm11.58 6-4.5-2.25v-5.4l4.5 2.25v5.4Zm.42-6-4.32-2.19 3.9-1.95 4.32 2.16-3.9 1.98Z" />
              </Svg>
            </IconWrapper>
            <Text style={styles.rowText}>Models</Text>
            <RightArrowIcon />
          </TouchableOpacity>
          <View style={styles.divider} />

          {/* PARAMETERS */}
          <TouchableOpacity style={styles.row} onPress={() => navigation.navigate('Parameters')}>
            <IconWrapper>
              <Svg width={22} height={22} viewBox="0 0 21 20" fill="none">
                <Path stroke="#ffffff" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 3h-3M12 1v4M12 3H1M5 10H1M9 8v4M20 10H9M19 17h-3M12 15v4M12 17H1" />
              </Svg>
            </IconWrapper>
            <Text style={styles.rowText}>Change Parameters</Text>
            <RightArrowIcon />
          </TouchableOpacity>
          <View style={styles.divider} />

          {/* BENCHMARK */}
          <TouchableOpacity style={styles.row} onPress={() => navigation.navigate('Benchmark')}>
            <IconWrapper>
              <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
                <Path fill="#ffffff" d="M6.5 5.652a8.364 8.364 0 0 1 4.9-2.032V5.4a.6.6 0 1 0 1.2 0V3.62a8.4 8.4 0 0 1 7.716 7.179H18a.6.6 0 1 0 0 1.2h2.4a8.605 8.605 0 0 1-2.653 6.204.6.6 0 0 0 .823.872A9.803 9.803 0 0 0 21.6 12a9.6 9.6 0 1 0-19.2 0c0 2.754 1.224 5.328 3.076 7.076a.6.6 0 1 0 .823-.873C4.674 16.668 3.6 14.403 3.6 12H6a.6.6 0 1 0 0-1.2H3.684a8.364 8.364 0 0 1 1.968-4.3l1.723 1.725a.6.6 0 1 0 .85-.85L6.499 5.652Zm9.639 1.316a.6.6 0 0 1 .895.766l-.132.235a405.22 405.22 0 0 1-1.457 2.551c-.39.68-.786 1.355-1.188 2.028-.15.253-.304.505-.46.754-.12.188-.238.367-.325.468a1.8 1.8 0 1 1-2.738-2.338c.086-.1.244-.246.412-.393.18-.16.411-.355.672-.575.523-.437 1.178-.972 1.818-1.488.761-.616 1.525-1.229 2.292-1.839l.21-.169Z" />
              </Svg>
            </IconWrapper>
            <Text style={styles.rowText}>BenchMark</Text>
            <RightArrowIcon />
          </TouchableOpacity>
          <View style={styles.divider} />

          {/* ABOUT */}
          <TouchableOpacity style={styles.row} onPress={() => navigation.navigate('About')}>
            <IconWrapper>
              <Svg width={22} height={22} viewBox="0 0 7 26" fill="none">
                <Path fill="#ffffff" d="M4.92664 0C4.52882 0 4.14728 0.158035 3.86598 0.43934C3.58468 0.720644 3.42664 1.10218 3.42664 1.5C3.42664 1.89782 3.58468 2.27936 3.86598 2.56066C4.14728 2.84196 4.52882 3 4.92664 3C5.32446 3 5.706 2.84196 5.9873 2.56066C6.2686 2.27936 6.42664 1.89782 6.42664 1.5C6.42664 1.10218 6.2686 0.720644 5.9873 0.43934C5.706 0.158035 5.32446 0 4.92664 0ZM4.56664 4.77C3.37664 4.87 0.12664 7.46 0.12664 7.46C-0.07336 7.61 -0.0133595 7.6 0.14664 7.88C0.30664 8.15 0.28664 8.17 0.47664 8.04C0.67664 7.91 1.00664 7.7 1.55664 7.36C3.67664 6 1.89664 9.14 0.986641 14.43C0.626641 17.05 2.98664 15.7 3.59664 15.3C4.19664 14.91 5.80664 13.8 5.96664 13.69C6.18664 13.54 6.02664 13.42 5.85664 13.17C5.73664 13 5.61664 13.12 5.61664 13.12C4.96664 13.55 3.77664 14.45 3.61664 13.88C3.42664 13.31 4.64664 9.4 5.31664 6.71C5.42664 6.07 5.72664 4.67 4.56664 4.77Z" />
              </Svg>
            </IconWrapper>
            <Text style={styles.rowText}>About</Text>
            <RightArrowIcon />
          </TouchableOpacity>
          <View style={styles.divider} />

          {/* REPORT */}
          <TouchableOpacity style={styles.row} onPress={() => navigation.navigate('ReportScreen')}>
            <IconWrapper>
              <Svg width={22} height={22} viewBox="0 0 14 23" fill="none">
                <Path stroke="#ffffff" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M1 11.4s.75-.8 3-.8 3.75 1.6 6 1.6 3-.8 3-.8V1.8s-.75.8-3 .8S6.25 1 4 1s-3 .8-3 .8v9.6Zm0 0V17" />
              </Svg>
            </IconWrapper>
            <Text style={styles.rowText}>Report</Text>
            <RightArrowIcon />
          </TouchableOpacity>

        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContainer: { padding: 16, paddingTop: 20 },
  card: { backgroundColor: '#0f172a', borderRadius: 12, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 16 },
  iconContainer: { width: 22, height: 22, marginRight: 16, justifyContent: 'center', alignItems: 'center' },
  rowText: { flex: 1, color: '#ffffff', fontSize: 18 },
  
  // 🔥 FIX: Updated style name for the SVG arrow to keep the 0.5 opacity look
  arrowIconSvg: { opacity: 0.5 }, 
  
  divider: { height: 1, backgroundColor: '#333333', marginHorizontal: 16 }
});