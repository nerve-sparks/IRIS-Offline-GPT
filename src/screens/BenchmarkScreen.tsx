import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Modal, ActivityIndicator, ToastAndroid } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import DeviceInfo from 'react-native-device-info';
import RNFS from 'react-native-fs';
import { initLlama } from 'llama.rn';

export default function BenchmarkScreen() {
  const [isRunning, setIsRunning] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [deviceInfoStr, setDeviceInfoStr] = useState('Loading hardware info...');
  
  const [results, setResults] = useState<string[]>([]);
  const [tokensPerSec, setTokensPerSec] = useState<number>(0.0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const getHardware = async () => {
      try {
        const model = await DeviceInfo.getModel();
        const os = await DeviceInfo.getSystemVersion();
        const hardware = await DeviceInfo.getHardware();
        // Mimicking your Kotlin buildDeviceInfo output
        setDeviceInfoStr(`Device: ${model}\nAndroid: ${os}\nProcessor: ${hardware}\nAvailable Threads: 8\nUser Threads: Default`);
      } catch (e) {
        setDeviceInfoStr("Failed to load device info.");
      }
    };
    getHardware();
  }, []);

  const runRealBenchmark = async () => {
    setShowConfirm(false);
    setIsRunning(true);
    setResults([]);
    setTokensPerSec(0.0);
    setErrorMsg(null);

    try {
      // 1. Find a downloaded model to test with
      const files = await RNFS.readDir(RNFS.DocumentDirectoryPath);
      const ggufFile = files.find(f => f.name.endsWith('.gguf'));

      if (!ggufFile) {
        ToastAndroid.show("Load A Model First", ToastAndroid.SHORT);
        setIsRunning(false);
        return;
      }

      const modelPath = `${RNFS.DocumentDirectoryPath}/${ggufFile.name}`;

      // 2. Initialize the Engine
      setResults(prev => [...prev, `Initializing engine with ${ggufFile.name}...`]);
      const llama = await initLlama({ model: modelPath, use_mlock: true, n_ctx: 512 });

      // 3. Run the Stress Test
      setResults(prev => [...prev, `Warming up CPU...`, `Running generation stress test...`]);
      
      const prompt = "<|begin_of_text|><|start_header_id|>user<|end_header_id|>\n\nWrite a long story.<|eot_id|><|start_header_id|>assistant<|end_header_id|>\n\n";
      
      const startTime = Date.now();
      let tokenCount = 0;

      await llama.completion(
        { prompt, n_predict: 50, temperature: 0.7 },
        (res) => {
          tokenCount++;
        }
      );

      const endTime = Date.now();
      const durationSec = (endTime - startTime) / 1000;
      const speed = tokenCount / durationSec;

      // 4. Cleanup & Calculate
      await llama.release(); // Frees up the RAM

      setTokensPerSec(speed);
      setResults(prev => [...prev, `Success! Generated ${tokenCount} tokens in ${durationSec.toFixed(2)} seconds.`]);

    } catch (error: any) {
      setErrorMsg(`Error: ${error.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <LinearGradient colors={['#050a14', '#051633']} style={styles.container}>
      <ScrollView contentContainerStyle={{ padding: 16, alignItems: 'center' }}>
        
        <Text style={styles.header}>Benchmark Information</Text>
        
        {/* Device Info Card */}
        <View style={styles.card}>
          {deviceInfoStr.split('\n').map((line, i) => (
            <Text key={i} style={styles.deviceText}>{line}</Text>
          ))}
        </View>

        {/* Start Button */}
        <TouchableOpacity 
          style={[styles.startBtn, isRunning && { backgroundColor: '#475569' }]} 
          onPress={() => setShowConfirm(true)} 
          disabled={isRunning}
        >
          <Text style={styles.btnText}>{isRunning ? "Benchmarking..." : "Start Benchmark"}</Text>
        </TouchableOpacity>

        {/* Loading State */}
        {isRunning && (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#2563EB" />
            <Text style={{ color: 'white', marginTop: 8 }}>Benchmarking in progress...</Text>
          </View>
        )}

        {/* Results Log mapped exactly to your Kotlin UI */}
        {results.length > 0 && (
          <View style={[styles.card, { marginTop: 16 }]}>
            <Text style={styles.resultsHeader}>Benchmark Results</Text>
            {results.map((res, i) => (
              <Text key={i} style={styles.logText}>• {res}</Text>
            ))}
          </View>
        )}

        {/* Final Speed Display */}
        <Text style={styles.tokenText}>
          {tokensPerSec > 0 
            ? `Tokens per second: ${tokensPerSec.toFixed(2)}` 
            : isRunning 
              ? "Calculating tokens per second..." 
              : ""}
        </Text>

        {/* Error Display */}
        {errorMsg && <Text style={styles.errorText}>{errorMsg}</Text>}

      </ScrollView>

      {/* Confirmation Modal */}
      <Modal visible={showConfirm} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.alertBox}>
            <Text style={styles.alertTitle}>Benchmarking Notice</Text>
            <Text style={styles.alertText}>This process will take 30 seconds to 1 minute. Do you want to continue?</Text>
            <View style={styles.alertActions}>
              <TouchableOpacity onPress={() => setShowConfirm(false)} style={{ padding: 8 }}>
                <Text style={styles.actionBtn}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={runRealBenchmark} style={{ padding: 8 }}>
                <Text style={styles.actionBtn}>Start</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { color: 'white', fontSize: 20, fontWeight: 'bold', marginBottom: 16 },
  card: { width: '100%', backgroundColor: '#0f172a', padding: 16, borderRadius: 8, marginBottom: 16, elevation: 4 },
  deviceText: { color: 'white', lineHeight: 24 },
  startBtn: { backgroundColor: '#2563EB', width: '100%', padding: 14, borderRadius: 8, alignItems: 'center', elevation: 4 },
  btnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  loadingBox: { alignItems: 'center', marginTop: 24 },
  resultsHeader: { color: 'white', fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
  logText: { color: '#d3d3d3', marginVertical: 4 },
  tokenText: { color: '#00ff00', marginTop: 24, fontSize: 18, fontWeight: 'bold' },
  errorText: { color: '#ef4444', marginTop: 16, fontSize: 16 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  alertBox: { backgroundColor: '#233340', padding: 20, borderRadius: 8, width: '85%' },
  alertTitle: { color: 'white', fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  alertText: { color: '#d3d3d3', marginBottom: 24, lineHeight: 22 },
  alertActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 16 },
  actionBtn: { color: '#2563EB', fontWeight: 'bold', fontSize: 16 }
});