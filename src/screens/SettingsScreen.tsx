import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Image } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

export default function SettingsScreen({ navigation }: any) {
  return (
    <LinearGradient colors={['#050a14', '#051633']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.card}>
          
          <TouchableOpacity style={styles.row} onPress={() => navigation.navigate('Models')}>
            {/* 🔥 Models Icon */}
            <Image source={require('../assets/icons/models.png')} style={styles.menuIcon} />
            <Text style={styles.rowText}>Models</Text>
            <Text style={styles.arrowIcon}>›</Text>
          </TouchableOpacity>
          <View style={styles.divider} />

          <TouchableOpacity style={styles.row} onPress={() => navigation.navigate('Parameters')}>
            {/* 🔥 Parameters Icon */}
            <Image source={require('../assets/icons/parameters.png')} style={styles.menuIcon} />
            <Text style={styles.rowText}>Change Parameters</Text>
            <Text style={styles.arrowIcon}>›</Text>
          </TouchableOpacity>
          <View style={styles.divider} />

          <TouchableOpacity style={styles.row} onPress={() => navigation.navigate('Benchmark')}>
            {/* 🔥 Benchmark Icon */}
            <Image source={require('../assets/icons/benchmark.png')} style={styles.menuIcon} />
            <Text style={styles.rowText}>BenchMark</Text>
            <Text style={styles.arrowIcon}>›</Text>
          </TouchableOpacity>
          <View style={styles.divider} />

          <TouchableOpacity style={styles.row} onPress={() => navigation.navigate('About')}>
            {/* 🔥 About Icon */}
            <Image source={require('../assets/icons/about.png')} style={styles.menuIcon} />
            <Text style={styles.rowText}>About</Text>
            <Text style={styles.arrowIcon}>›</Text>
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
  
  // 🔥 New Icon Style
  menuIcon: { width: 22, height: 22, tintColor: '#ffffff', marginRight: 16 },
  
  rowText: { flex: 1, color: '#ffffff', fontSize: 18 },
  arrowIcon: { fontSize: 24, color: '#ffffff', opacity: 0.5 },
  divider: { height: 1, backgroundColor: '#333333', marginHorizontal: 16 }
});