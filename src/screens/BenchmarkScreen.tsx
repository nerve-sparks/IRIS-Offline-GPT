import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  StyleSheet, 
  Modal, 
  ActivityIndicator, 
  ToastAndroid, 
  Platform 
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import DeviceInfo from 'react-native-device-info';
import RNFS from 'react-native-fs';
import { initLlama } from 'llama.rn';
import AsyncStorage from '@react-native-async-storage/async-storage'; // 🔥 Fetch Current Model
import NerveSparksDrawer from '../components/NerveSparksDrawer';

export default function BenchmarkScreen() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [touchStartX, setTouchStartX] = useState(0);

  const handleTouchStart = (e: any) => setTouchStartX(e.nativeEvent.pageX);
  const handleTouchEnd = (e: any) => {
    if (e.nativeEvent.pageX - touchStartX > 50) setIsDrawerOpen(true);
  };

  const [isRunning, setIsRunning] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  
  // 🔥 Better State Management for the White Box Details
  const [hardwareInfo, setHardwareInfo] = useState({
    device: 'Loading...',
    os: 'Loading...',
    processor: 'Loading...',
    threads: '6',
    model: 'None',
    userThreads: '0.0'
  });
  
  const [results, setResults] = useState<string[]>([]);
  const [tokensPerSec, setTokensPerSec] = useState<number>(0.0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const getHardwareAndModel = async () => {
      try {
        const device = await DeviceInfo.getModel();
        const osName = await DeviceInfo.getSystemName();
        const osVersion = await DeviceInfo.getSystemVersion();
        const hardware = await DeviceInfo.getHardware().catch(() => 'Unknown'); // iOS fallback
        
        // 🔥 Fetching saved model and user threads from Memory
        const savedModel = await AsyncStorage.getItem('ACTIVE_MODEL_NAME');
        const savedParamsStr = await AsyncStorage.getItem('@iris_parameters');
        let uThreads = '0.0';
        
        if (savedParamsStr) {
          const parsedParams = JSON.parse(savedParamsStr);
          uThreads = parsedParams.thread ? parsedParams.thread.toString() : '0.0';
        }

        setHardwareInfo({
          device: device,
          os: `${osName} ${osVersion}`,
          processor: hardware === 'unknown' ? 'Unknown' : hardware,
          threads: '6', // Usually 6-8 on mobile
          model: savedModel || 'None',
          userThreads: uThreads
        });
      } catch (e) {
        console.log("Failed to load device info.");
      }
    };
    getHardwareAndModel();
  }, []);

  const runRealBenchmark = async () => {
    setShowConfirm(false);
    setIsRunning(true);
    setResults([]);
    setTokensPerSec(0.0);
    setErrorMsg(null);

    try {
      const files = await RNFS.readDir(RNFS.DocumentDirectoryPath);
      const ggufFile = files.find(f => f.name.endsWith('.gguf'));

      if (!ggufFile) {
        if (Platform.OS === 'android') ToastAndroid.show("Load A Model First", ToastAndroid.SHORT);
        setErrorMsg("Error: Please download/load a model first.");
        setIsRunning(false);
        return;
      }

      const modelPath = `${RNFS.DocumentDirectoryPath}/${ggufFile.name}`;

      setResults(prev => [...prev, `Initializing engine with ${ggufFile.name}...`]);
      // Use parsed thread count if available
      const parsedThreads = parseFloat(hardwareInfo.userThreads);
      const llamaArgs: any = { model: modelPath, use_mlock: true, n_ctx: 512 };
      if (parsedThreads > 0) llamaArgs.n_threads = parsedThreads;
      
      const llama = await initLlama(llamaArgs);

      setResults(prev => [...prev, `Warming up CPU...`, `Running generation stress test...`]);
      
      const prompt = "<|begin_of_text|><|start_header_id|>user<|end_header_id|>\n\nWrite a long story.<|eot_id|><|start_header_id|>assistant<|end_header_id|>\n\n";
      
      const startTime = Date.now();
      let tokenCount = 0;

      await llama.completion(
        { prompt, n_predict: 50, temperature: 0.7 },
        (res) => { tokenCount++; }
      );

      const endTime = Date.now();
      const durationSec = (endTime - startTime) / 1000;
      const speed = tokenCount / durationSec;

      await llama.release(); 

      setTokensPerSec(speed);
      setResults(prev => [...prev, `Success! Generated ${tokenCount} tokens in ${durationSec.toFixed(2)} seconds.`]);

    } catch (error: any) {
      setErrorMsg(`Error: ${error.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <LinearGradient colors={['#050a14', '#051633']} style={styles.container} onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      <SafeAreaView style={styles.safeArea} edges={['left', 'right']}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          <Text style={styles.header}>Benchmark Information</Text>
          
          {/* 🔥 EXACT WHITE BOX LAYOUT */}
          <View style={styles.whiteCard}>
            <Text style={styles.deviceText}>Device:{hardwareInfo.device}</Text>
            <Text style={styles.deviceText}>OS:{hardwareInfo.os}</Text>
            <Text style={styles.deviceText}>Processor:{hardwareInfo.processor}</Text>
            <Text style={styles.deviceText}>Available Threads:{hardwareInfo.threads}</Text>
            <Text style={styles.deviceText}>Current Model:{hardwareInfo.model}</Text>
            <Text style={styles.deviceText}>User Threads:{hardwareInfo.userThreads}</Text>
          </View>

          {/* 🔥 EXACT CENTERED BUTTON */}
          <TouchableOpacity 
            style={[styles.startBtn, isRunning && { backgroundColor: '#475569' }]} 
            onPress={() => setShowConfirm(true)} 
            disabled={isRunning}
          >
            <Text style={styles.btnText}>{isRunning ? "Benchmarking..." : "Start Benchmark"}</Text>
          </TouchableOpacity>

          {/* 🔥 GREEN TEXT WITH "N/A" DEFAULT */}
          <Text style={styles.tokenText}>
            Tokens per second: {tokensPerSec > 0 ? tokensPerSec.toFixed(2) : isRunning ? "..." : "N/A"}
          </Text>

          {/* Loading State */}
          {isRunning && (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color="#007AFF" />
              <Text style={{ color: 'white', marginTop: 12 }}>Running CPU Stress Test...</Text>
            </View>
          )}

          {/* Results Log */}
          {results.length > 0 && (
            <View style={styles.resultsCard}>
              <Text style={styles.resultsHeader}>Log Output</Text>
              {results.map((res, i) => (
                <Text key={i} style={styles.logText}>• {res}</Text>
              ))}
            </View>
          )}

          {errorMsg && <Text style={styles.errorText}>{errorMsg}</Text>}

        </ScrollView>

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

        <NerveSparksDrawer visible={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} activeModelName={hardwareInfo.model} />
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  scrollContent: { 
    paddingHorizontal: 20, 
    paddingTop: 20,
    alignItems: 'center', // Centers everything
    paddingBottom: 40
  },
  header: { color: 'white', fontSize: 20, marginBottom: 20 },
  
  // 🔥 THE WHITE BOX STYLE
  whiteCard: { 
    width: '100%', 
    backgroundColor: '#ffffff', // Exact White
    padding: 24, 
    borderRadius: 16, 
    marginBottom: 30, 
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 5 
  },
  deviceText: { 
    color: '#1e293b', // Dark slate text color for white background
    fontSize: 15,
    lineHeight: 26, 
    fontWeight: '500' 
  },
  
  // 🔥 CENTERED BUTTON
  startBtn: { 
    backgroundColor: '#007AFF', // iOS Apple Blue
    paddingVertical: 14, 
    paddingHorizontal: 40, // Keeps it tight, not full width
    borderRadius: 12, 
    alignItems: 'center', 
    shadowColor: '#007AFF', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 6 
  },
  btnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  
  // 🔥 GREEN N/A TEXT
  tokenText: { color: '#00ff00', marginTop: 20, fontSize: 16, fontWeight: 'bold' },
  
  loadingBox: { alignItems: 'center', marginTop: 30 },
  resultsCard: { width: '100%', backgroundColor: '#1e293b', padding: 16, borderRadius: 12, marginTop: 30, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  resultsHeader: { color: 'white', fontSize: 16, fontWeight: 'bold', marginBottom: 12 },
  logText: { color: '#94a3b8', marginVertical: 4, fontSize: 13 },
  errorText: { color: '#ef4444', marginTop: 20, fontSize: 15, fontWeight: '600' },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  alertBox: { backgroundColor: '#1e293b', padding: 24, borderRadius: 16, width: '85%', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  alertTitle: { color: 'white', fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  alertText: { color: '#94a3b8', marginBottom: 24, lineHeight: 22, fontSize: 15 },
  alertActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 20 },
  actionBtn: { color: '#3b82f6', fontWeight: 'bold', fontSize: 16 }
});