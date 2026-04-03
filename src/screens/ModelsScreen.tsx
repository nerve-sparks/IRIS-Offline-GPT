import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, TouchableWithoutFeedback, ToastAndroid, TextInput, Modal, Animated, Image , Platform ,Alert } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import RNFS from 'react-native-fs';
import { useIsFocused } from '@react-navigation/native';
import { pick, isCancel } from '@react-native-documents/picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ALL_MODELS, downloadModel } from '../services/ModelService'; 
import ModelCard from '../components/ModelCard';
// import NerveSparksDrawer from '../components/NerveSparksDrawer';

export default function ModelsScreen({ navigation }: any) {
  const [fileStates, setFileStates] = useState<Record<string, { exists: boolean, size: string }>>({});
  const [customModels, setCustomModels] = useState<string[]>([]);
  const [activeModel, setActiveModel] = useState<string>(''); 
  const [defaultModel, setDefaultModel] = useState<string>(''); 
  
  const [downloading, setDownloading] = useState<Record<string, boolean>>({});
  const [progresses, setProgresses] = useState<Record<string, number>>({});
  const [searchQuery, setSearchQuery] = useState('');
  
  const [loadingModel, setLoadingModel] = useState<string | null>(null);
  const loadingAnim = useRef(new Animated.Value(0)).current;

  const [isFabExpanded, setIsFabExpanded] = useState(false);
  const isFocused = useIsFocused();
  // const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  // const [touchStartX, setTouchStartX] = useState(0);

  // const handleTouchStart = (e: any) => setTouchStartX(e.nativeEvent.pageX);
  // const handleTouchEnd = (e: any) => { if (e.nativeEvent.pageX - touchStartX > 50) setIsDrawerOpen(true); };

  useEffect(() => {
    if (loadingModel) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(loadingAnim, { toValue: 1, duration: 1200, useNativeDriver: false }),
          Animated.timing(loadingAnim, { toValue: 0, duration: 1200, useNativeDriver: false })
        ])
      ).start();
    } else {
      loadingAnim.stopAnimation();
      loadingAnim.setValue(0);
    }
  }, [loadingModel]);

  const barWidth = loadingAnim.interpolate({ inputRange: [0, 1], outputRange: ['10%', '100%'] });

  // 🔥 UNIVERSAL TOAST FIX FOR iOS & ANDROID
  const showMessage = (msg: string) => {
    if (Platform.OS === 'android') {
      ToastAndroid.show(msg, ToastAndroid.SHORT);
    } else {
      Alert.alert("Iris", msg); // iOS me pop-up aayega kyunki native toast nahi hota
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const checkFiles = async () => {
    try {
      const files = await RNFS.readDir(RNFS.DocumentDirectoryPath);
      const ggufFiles = files.filter(f => f.name.endsWith('.gguf'));
      const states: Record<string, { exists: boolean, size: string }> = {};
      const custom: string[] = [];

      for (const model of ALL_MODELS) {
        const path = `${RNFS.DocumentDirectoryPath}/${model.destination}`;
        if (await RNFS.exists(path)) {
          states[model.name] = { exists: true, size: formatBytes(Number((await RNFS.stat(path)).size)) };
        } else {
          states[model.name] = { exists: false, size: '0 Bytes' };
        }
      }

      for (const file of ggufFiles) {
        // 🔥 FIX: MATCH BY DESTINATION INSTEAD OF NAME
        if (!ALL_MODELS.find(m => m.destination === file.name)) {
          states[file.name] = { exists: true, size: formatBytes(Number(file.size)) };
          custom.push(file.name);
        }
      }
      
      setFileStates(states);
      setCustomModels(custom);
      
      const savedModel = await AsyncStorage.getItem('ACTIVE_MODEL_NAME');
      if (savedModel) setActiveModel(savedModel);

      const savedDefault = await AsyncStorage.getItem('DEFAULT_MODEL_NAME');
      if (savedDefault) setDefaultModel(savedDefault);

    } catch(e) { console.log(e); }
  };

  useEffect(() => { if (isFocused) checkFiles(); }, [isFocused]);

  const handleDownload = async (model: any) => {
    setDownloading(prev => ({ ...prev, [model.name]: true }));
    try {
      await downloadModel(model, (p: number) => setProgresses(prev => ({ ...prev, [model.name]: Math.round(p * 100) })));
      checkFiles(); 
    } catch (error) { console.log("Download stopped"); } 
    finally { setDownloading(prev => ({ ...prev, [model.name]: false })); }
  };

  const cancelDownload = async (model: any) => {
    setDownloading(prev => ({ ...prev, [model.name]: false }));
    setProgresses(prev => ({ ...prev, [model.name]: 0 }));
    showMessage("Download cancelled" );
    
    try {
      const destPath = `${RNFS.DocumentDirectoryPath}/${model.destination}`;
      if (await RNFS.exists(destPath)) {
        await RNFS.unlink(destPath);
      }
    } catch (e) { console.log(e); }
    checkFiles();
  };

  const handleLoadModel = (modelName: string) => {
    setLoadingModel(modelName);
    setTimeout(async () => {
      setActiveModel(modelName);
      setLoadingModel(null);
      await AsyncStorage.setItem('ACTIVE_MODEL_NAME', modelName); 
      showMessage(`${modelName} Loaded!`);
    }, 2500);
  };

  // 🔥 FIX: FUNCTION TO PERMANENTLY SAVE DEFAULT MODEL
  const handleSetDefault = async (modelName: string) => {
    setDefaultModel(modelName);
    await AsyncStorage.setItem('DEFAULT_MODEL_NAME', modelName);
    showMessage(`${modelName} set as Default!`);
  };

  const pickLocalModel = async () => {
    setIsFabExpanded(false);
    try {
      const result = await pick({ mode: 'import' });
      const res = result[0];
      if (!res || !res.name || !res.name.endsWith('.gguf')) return showMessage("Invalid .gguf file");
      const destPath = `${RNFS.DocumentDirectoryPath}/${res.name}`;
      if (await RNFS.exists(destPath)) return showMessage("Model exists!");
      showMessage("Importing...");
      await RNFS.copyFile(res.uri, destPath);
      checkFiles(); 
    } catch (err: any) { console.log(err); }
  };

  const filteredSuggested = ALL_MODELS.slice(0, 3).filter(m => m.name.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredMyModels = ALL_MODELS.slice(3).filter(m => m.name.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredCustom = customModels.filter(m => m.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <View style={styles.container} >
      <LinearGradient colors={['#050a14', '#051633']} style={styles.container}>
        
        <View style={styles.searchContainer}>
          <Image source={require('../assets/icons/search.png')} style={styles.searchIconImage} />
          <TextInput style={styles.searchInput} placeholder="Search Hugging-Face Models" placeholderTextColor="#94a3b8" value={searchQuery} onChangeText={setSearchQuery} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <Text style={styles.sectionHeader}>Suggested Models</Text>
          {filteredSuggested.map((model, index) => (
            <ModelCard
              key={index} modelName={model.name} isActive={activeModel === model.name} isDefault={defaultModel === model.name}
              isDownloaded={fileStates[model.name]?.exists || false} isDownloading={downloading[model.name]} 
              downloadProgress={progresses[model.name]} fileSizeStr={fileStates[model.name]?.size || '0 Bytes'}
              showDeleteButton={true} onDownload={() => handleDownload(model)} 
              onCancelDownload={() => cancelDownload(model)} 
              onSetDefault={() => handleSetDefault(model.name)} // 🔥 UPDATED HERE
              onLoad={() => handleLoadModel(model.name)}
              onDelete={async () => { await RNFS.unlink(`${RNFS.DocumentDirectoryPath}/${model.destination}`); checkFiles(); }}
            />
          ))}
          
          <View style={[styles.divider, { marginVertical: 20 }]} />

          <Text style={styles.sectionHeader}>My Models</Text>
          {filteredMyModels.length === 0 && filteredCustom.length === 0 ? (
            <Text style={styles.emptyText}>No models found</Text>
          ) : (
            <>
              {filteredMyModels.map((model, index) => (
                <ModelCard
                  key={`my-${index}`} modelName={model.name} isActive={activeModel === model.name} isDefault={defaultModel === model.name}
                  isDownloaded={fileStates[model.name]?.exists || false} isDownloading={downloading[model.name]} 
                  downloadProgress={progresses[model.name]} fileSizeStr={fileStates[model.name]?.size || '0 Bytes'}
                  showDeleteButton={true} onDownload={() => handleDownload(model)} 
                  onCancelDownload={() => cancelDownload(model)} 
                  onSetDefault={() => handleSetDefault(model.name)} // 🔥 UPDATED HERE
                  onLoad={() => handleLoadModel(model.name)}
                  onDelete={async () => { await RNFS.unlink(`${RNFS.DocumentDirectoryPath}/${model.destination}`); checkFiles(); }}
                />
              ))}
              {filteredCustom.map((filename, index) => (
                <ModelCard
                  key={`custom-${index}`} modelName={filename} isActive={activeModel === filename} isDefault={defaultModel === filename}
                  isDownloaded={true} fileSizeStr={fileStates[filename]?.size || '0 Bytes'}
                  showDeleteButton={true} onDownload={() => {}} 
                  onSetDefault={() => handleSetDefault(filename)} // 🔥 UPDATED HERE
                  onLoad={() => handleLoadModel(filename)}
                  onDelete={async () => { await RNFS.unlink(`${RNFS.DocumentDirectoryPath}/${filename}`); checkFiles(); }}
                />
              ))}
            </>
          )}
        </ScrollView>
      </LinearGradient>

      {/* FAB LOGIC */}
      {isFabExpanded && (
        <TouchableWithoutFeedback onPress={() => setIsFabExpanded(false)}>
          <View style={styles.overlay} />
        </TouchableWithoutFeedback>
      )}

      <View style={styles.fabContainer}>
        {isFabExpanded && (
          <View style={styles.fabMenu}>
            <View style={styles.fabRow}>
              <Text style={styles.fabLabel}>Add from Hugging Face</Text>
              <TouchableOpacity style={styles.subFab} onPress={() => { setIsFabExpanded(false); navigation.navigate('SearchResult'); }}>
                <Text style={styles.subFabIcon}>🤗</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.fabRow}>
              <Text style={styles.fabLabel}>Add Local Model</Text>
              <TouchableOpacity style={styles.subFab} onPress={pickLocalModel}>
                <Text style={styles.subFabIcon}>📁</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        <TouchableOpacity style={[styles.mainFab, isFabExpanded && styles.mainFabOpen]} onPress={() => setIsFabExpanded(!isFabExpanded)}>
          <Text style={[styles.mainFabIcon, isFabExpanded && styles.mainFabIconOpen]}>{isFabExpanded ? '×' : '+'}</Text>
        </TouchableOpacity>
      </View>
{/* 
      <NerveSparksDrawer visible={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} activeModelName={activeModel || "No active model"} /> */}

      <Modal visible={!!loadingModel} transparent animationType="fade">
        <View style={styles.loadingScreenOverlay}>
          <Text style={styles.loadingTitle}>Loading Model</Text>
          <Text style={styles.loadingSubtitle}>Please wait...</Text>
          <Text style={styles.loadingModelName}>{loadingModel}</Text>
          <View style={styles.loadingTrack}>
            <Animated.View style={[styles.loadingFill, { width: barWidth }]} />
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e293b', margin: 16, marginTop: 24, borderRadius: 24, paddingHorizontal: 16 },
  searchIconImage: { width: 20, height: 20, tintColor: '#94a3b8', marginRight: 8 },
  searchInput: { flex: 1, color: '#ffffff', fontSize: 15, paddingVertical: 12 },
  scrollContainer: { paddingHorizontal: 15, paddingBottom: 100 },
  divider: { height: 1, backgroundColor: '#333333', width: '100%' },
  sectionHeader: { color: 'rgba(255, 255, 255, 0.5)', fontSize: 18, paddingVertical: 10 },
  emptyText: { color: '#ffffff', marginTop: 8, marginLeft: 2 },
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)' },
  loadingScreenOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  loadingTitle: { color: '#ffffff', fontSize: 20, fontWeight: 'bold', marginBottom: 4 },
  loadingSubtitle: { color: '#e2e8f0', fontSize: 16, marginBottom: 24 },
  loadingModelName: { color: '#ffffff', fontSize: 16, fontWeight: 'bold', textAlign: 'center', marginBottom: 12 },
  loadingTrack: { width: '80%', height: 4, backgroundColor: '#334155', borderRadius: 2, overflow: 'hidden' },
  loadingFill: { height: '100%', backgroundColor: '#3b82f6', borderRadius: 2 },
  fabContainer: { position: 'absolute', bottom: 24, right: 24, alignItems: 'flex-end' },
  fabMenu: { marginBottom: 16, alignItems: 'flex-end' },
  fabRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  fabLabel: { color: 'white', fontSize: 16, fontWeight: '500', marginRight: 16 },
  subFab: { backgroundColor: '#8a7791', width: 48, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center', elevation: 4 },
  subFabIcon: { fontSize: 20 },
  mainFab: { backgroundColor: '#8a7791', width: 56, height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center', elevation: 6 },
  mainFabOpen: { backgroundColor: '#a393a9' },
  mainFabIcon: { color: 'white', fontSize: 32, fontWeight: '300', marginTop: -4 },
  mainFabIconOpen: { fontSize: 36, marginTop: -6 }
});