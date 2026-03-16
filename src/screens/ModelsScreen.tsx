// import React, { useState, useEffect } from 'react';
// import { View, Text, TouchableOpacity, ScrollView, StyleSheet, TouchableWithoutFeedback, ToastAndroid } from 'react-native';
// import LinearGradient from 'react-native-linear-gradient';
// import RNFS from 'react-native-fs';
// import { useIsFocused } from '@react-navigation/native';
// import { pick, isCancel } from '@react-native-documents/picker';
// import { ALL_MODELS } from '../services/ModelService'; 
// import ModelCard from '../components/ModelCard';

// export default function ModelsScreen({ navigation }: any) {
//   const [fileStates, setFileStates] = useState<Record<string, { exists: boolean, size: string }>>({});
//   const [customModels, setCustomModels] = useState<string[]>([]);
//   const [activeModel, setActiveModel] = useState<string>(''); 
//   const [defaultModel, setDefaultModel] = useState<string>(''); 
  
//   const [isFabExpanded, setIsFabExpanded] = useState(false);
//   const isFocused = useIsFocused();

//   const formatBytes = (bytes: number) => {
//     if (bytes === 0) return '0 Bytes';
//     const k = 1024;
//     const sizes = ['Bytes', 'KB', 'MB', 'GB'];
//     const i = Math.floor(Math.log(bytes) / Math.log(k));
//     return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
//   };

//   const checkFiles = async () => {
//     try {
//       const files = await RNFS.readDir(RNFS.DocumentDirectoryPath);
//       const ggufFiles = files.filter(f => f.name.endsWith('.gguf'));
      
//       const states: Record<string, { exists: boolean, size: string }> = {};
//       const custom: string[] = [];

//       for (const model of ALL_MODELS) {
//         const path = `${RNFS.DocumentDirectoryPath}/${model.destination}`;
//         const exists = await RNFS.exists(path);
//         if (exists) {
//           const stat = await RNFS.stat(path);
//           states[model.name] = { exists: true, size: formatBytes(Number(stat.size)) };
//         } else {
//           states[model.name] = { exists: false, size: '0 Bytes' };
//         }
//       }

//       for (const file of ggufFiles) {
//         if (!ALL_MODELS.find(m => m.name === file.name)) {
//           states[file.name] = { exists: true, size: formatBytes(Number(file.size)) };
//           custom.push(file.name);
//         }
//       }
      
//       setFileStates(states);
//       setCustomModels(custom);
//     } catch(e) { console.log(e); }
//   };

//   useEffect(() => { if (isFocused) checkFiles(); }, [isFocused]);

//   // 🔥 ADD LOCAL MODEL LOGIC ONLY
//   const pickLocalModel = async () => {
//     setIsFabExpanded(false);
//     try {
//       const result = await pick({ mode: 'import' });
//       const res = result[0];

//       if (!res || !res.name || !res.name.endsWith('.gguf')) {
//         ToastAndroid.show("Please select a valid .gguf model file", ToastAndroid.SHORT);
//         return;
//       }

//       const destPath = `${RNFS.DocumentDirectoryPath}/${res.name}`;
//       const exists = await RNFS.exists(destPath);
      
//       if (exists) {
//         ToastAndroid.show("Model already exists in your library!", ToastAndroid.SHORT);
//         return;
//       }

//       ToastAndroid.show("Importing model... Please wait.", ToastAndroid.LONG);
      
//       await RNFS.copyFile(res.uri, destPath);
      
//       ToastAndroid.show("Model imported successfully!", ToastAndroid.SHORT);
//       checkFiles(); 

//     } catch (err: any) {
//       if (!isCancel(err)) {
//         ToastAndroid.show("Failed to import model", ToastAndroid.SHORT);
//         console.error(err);
//       }
//     }
//   };

//   const suggestedModels = ALL_MODELS.slice(0, 3);
//   const myModels = ALL_MODELS.slice(3);

//   return (
//     <View style={styles.container}>
//       <LinearGradient colors={['#050a14', '#051633']} style={styles.container}>
//         <ScrollView contentContainerStyle={styles.scrollContainer}>
          
//           <Text style={styles.sectionHeader}>Suggested Models</Text>
//           {suggestedModels.map((model, index) => (
//             <ModelCard
//               key={index} modelName={model.name} isActive={activeModel === model.name} isDefault={defaultModel === model.name}
//               isDownloaded={fileStates[model.name]?.exists || false} fileSizeStr={fileStates[model.name]?.size || '0 Bytes'}
//               showDeleteButton={true} onDownload={() => {}} onSetDefault={() => setDefaultModel(model.name)}
//               onDelete={async () => {
//                 await RNFS.unlink(`${RNFS.DocumentDirectoryPath}/${model.destination}`);
//                 checkFiles(); 
//               }}
//             />
//           ))}
          
//           <View style={[styles.divider, { marginVertical: 20 }]} />

//           <Text style={styles.sectionHeader}>My Models</Text>
//           {myModels.length === 0 && customModels.length === 0 ? (
//             <Text style={styles.emptyText}>No models to show</Text>
//           ) : (
//             <>
//               {myModels.map((model, index) => (
//                 <ModelCard
//                   key={`my-${index}`} modelName={model.name} isActive={activeModel === model.name} isDefault={defaultModel === model.name}
//                   isDownloaded={fileStates[model.name]?.exists || false} fileSizeStr={fileStates[model.name]?.size || '0 Bytes'}
//                   showDeleteButton={true} onDownload={() => {}} onSetDefault={() => setDefaultModel(model.name)}
//                   onDelete={async () => { await RNFS.unlink(`${RNFS.DocumentDirectoryPath}/${model.destination}`); checkFiles(); }}
//                 />
//               ))}
//               {customModels.map((filename, index) => (
//                 <ModelCard
//                   key={`custom-${index}`} modelName={filename} isActive={activeModel === filename} isDefault={defaultModel === filename}
//                   isDownloaded={true} fileSizeStr={fileStates[filename]?.size || '0 Bytes'}
//                   showDeleteButton={true} onDownload={() => {}} onSetDefault={() => setDefaultModel(filename)}
//                   onDelete={async () => { await RNFS.unlink(`${RNFS.DocumentDirectoryPath}/${filename}`); checkFiles(); }}
//                 />
//               ))}
//             </>
//           )}
//         </ScrollView>
//       </LinearGradient>

//       {isFabExpanded && (
//         <TouchableWithoutFeedback onPress={() => setIsFabExpanded(false)}>
//           <View style={styles.overlay} />
//         </TouchableWithoutFeedback>
//       )}

//       <View style={styles.fabContainer}>
//         {isFabExpanded && (
//           <View style={styles.fabMenu}>
            
//             <View style={styles.fabRow}>
//               <Text style={styles.fabLabel}>Add from Hugging Face</Text>
//               <TouchableOpacity 
//                 style={styles.subFab} 
//                 onPress={() => { setIsFabExpanded(false); navigation.navigate('SearchResult'); }}
//               >
//                 <Text style={styles.subFabIcon}>🤗</Text>
//               </TouchableOpacity>
//             </View>
            
//             <View style={styles.fabRow}>
//               <Text style={styles.fabLabel}>Add Local Model</Text>
//               <TouchableOpacity 
//                 style={styles.subFab} 
//                 onPress={pickLocalModel}
//               >
//                 <Text style={styles.subFabIcon}>📁</Text>
//               </TouchableOpacity>
//             </View>
//           </View>
//         )}

//         <TouchableOpacity 
//           style={[styles.mainFab, isFabExpanded && styles.mainFabOpen]} 
//           onPress={() => setIsFabExpanded(!isFabExpanded)}
//         >
//           <Text style={[styles.mainFabIcon, isFabExpanded && styles.mainFabIconOpen]}>
//             {isFabExpanded ? '×' : '+'}
//           </Text>
//         </TouchableOpacity>
//       </View>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: { flex: 1 },
//   scrollContainer: { paddingHorizontal: 15, paddingTop: 20, paddingBottom: 100 },
//   divider: { height: 1, backgroundColor: '#333333', width: '100%' },
//   sectionHeader: { color: 'rgba(255, 255, 255, 0.5)', fontSize: 18, paddingVertical: 10 },
//   emptyText: { color: '#ffffff', marginTop: 8, marginLeft: 2 },
  
//   overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)' },
//   fabContainer: { position: 'absolute', bottom: 24, right: 24, alignItems: 'flex-end' },
//   fabMenu: { marginBottom: 16, alignItems: 'flex-end' },
//   fabRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
//   fabLabel: { color: 'white', fontSize: 16, fontWeight: '500', marginRight: 16 },
//   subFab: { backgroundColor: '#8a7791', width: 48, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center', elevation: 4 },
//   subFabIcon: { fontSize: 20 },
//   mainFab: { backgroundColor: '#8a7791', width: 56, height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center', elevation: 6 },
//   mainFabOpen: { backgroundColor: '#a393a9' },
//   mainFabIcon: { color: 'white', fontSize: 32, fontWeight: '300', marginTop: -4 },
//   mainFabIconOpen: { fontSize: 36, marginTop: -6 }
// });


import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, TouchableWithoutFeedback, ToastAndroid } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import RNFS from 'react-native-fs';
import { useIsFocused } from '@react-navigation/native';
import { pick, isCancel } from '@react-native-documents/picker';
import { ALL_MODELS, downloadModel } from '../services/ModelService'; // 🔥 Added downloadModel here
import ModelCard from '../components/ModelCard';

export default function ModelsScreen({ navigation }: any) {
  const [fileStates, setFileStates] = useState<Record<string, { exists: boolean, size: string }>>({});
  const [customModels, setCustomModels] = useState<string[]>([]);
  const [activeModel, setActiveModel] = useState<string>(''); 
  const [defaultModel, setDefaultModel] = useState<string>(''); 
  
  // 🔥 NEW STATES TO TRACK DOWNLOADING AND PROGRESS
  const [downloading, setDownloading] = useState<Record<string, boolean>>({});
  const [progresses, setProgresses] = useState<Record<string, number>>({});

  const [isFabExpanded, setIsFabExpanded] = useState(false);
  const isFocused = useIsFocused();

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
        const exists = await RNFS.exists(path);
        if (exists) {
          const stat = await RNFS.stat(path);
          states[model.name] = { exists: true, size: formatBytes(Number(stat.size)) };
        } else {
          states[model.name] = { exists: false, size: '0 Bytes' };
        }
      }

      for (const file of ggufFiles) {
        if (!ALL_MODELS.find(m => m.name === file.name)) {
          states[file.name] = { exists: true, size: formatBytes(Number(file.size)) };
          custom.push(file.name);
        }
      }
      
      setFileStates(states);
      setCustomModels(custom);
    } catch(e) { console.log(e); }
  };

  useEffect(() => { if (isFocused) checkFiles(); }, [isFocused]);

  // 🔥 NEW FUNCTION: START DOWNLOAD
  const handleDownload = async (model: any) => {
    setDownloading(prev => ({ ...prev, [model.name]: true }));
    try {
      await downloadModel(model, (p: number) => setProgresses(prev => ({ ...prev, [model.name]: Math.round(p * 100) })));
      checkFiles(); // Refresh list when done
    } catch (error) {
      console.log("Download stopped or failed");
    } finally { 
      setDownloading(prev => ({ ...prev, [model.name]: false })); 
    }
  };

  // 🔥 NEW FUNCTION: STOP DOWNLOAD
  const cancelDownload = (modelName: string) => {
    setDownloading(prev => ({ ...prev, [modelName]: false }));
    setProgresses(prev => ({ ...prev, [modelName]: 0 }));
    ToastAndroid.show("Download cancelled", ToastAndroid.SHORT);
  };

  const pickLocalModel = async () => {
    setIsFabExpanded(false);
    try {
      const result = await pick({ mode: 'import' });
      const res = result[0];

      if (!res || !res.name || !res.name.endsWith('.gguf')) {
        ToastAndroid.show("Please select a valid .gguf model file", ToastAndroid.SHORT);
        return;
      }

      const destPath = `${RNFS.DocumentDirectoryPath}/${res.name}`;
      const exists = await RNFS.exists(destPath);
      
      if (exists) {
        ToastAndroid.show("Model already exists in your library!", ToastAndroid.SHORT);
        return;
      }

      ToastAndroid.show("Importing model... Please wait.", ToastAndroid.LONG);
      
      await RNFS.copyFile(res.uri, destPath);
      
      ToastAndroid.show("Model imported successfully!", ToastAndroid.SHORT);
      checkFiles(); 

    } catch (err: any) {
      if (!isCancel(err)) {
        ToastAndroid.show("Failed to import model", ToastAndroid.SHORT);
        console.error(err);
      }
    }
  };

  const suggestedModels = ALL_MODELS.slice(0, 3);
  const myModels = ALL_MODELS.slice(3);

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#050a14', '#051633']} style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          
          <Text style={styles.sectionHeader}>Suggested Models</Text>
          {suggestedModels.map((model, index) => (
            <ModelCard
              key={index} modelName={model.name} isActive={activeModel === model.name} isDefault={defaultModel === model.name}
              isDownloaded={fileStates[model.name]?.exists || false} 
              isDownloading={downloading[model.name]} // 🔥 WIRED UP
              downloadProgress={progresses[model.name]} // 🔥 WIRED UP
              fileSizeStr={fileStates[model.name]?.size || '0 Bytes'}
              showDeleteButton={true} 
              onDownload={() => handleDownload(model)} // 🔥 WIRED UP
              onCancelDownload={() => cancelDownload(model.name)} // 🔥 WIRED UP
              onSetDefault={() => setDefaultModel(model.name)}
              onDelete={async () => {
                await RNFS.unlink(`${RNFS.DocumentDirectoryPath}/${model.destination}`);
                checkFiles(); 
              }}
            />
          ))}
          
          <View style={[styles.divider, { marginVertical: 20 }]} />

          <Text style={styles.sectionHeader}>My Models</Text>
          {myModels.length === 0 && customModels.length === 0 ? (
            <Text style={styles.emptyText}>No models to show</Text>
          ) : (
            <>
              {myModels.map((model, index) => (
                <ModelCard
                  key={`my-${index}`} modelName={model.name} isActive={activeModel === model.name} isDefault={defaultModel === model.name}
                  isDownloaded={fileStates[model.name]?.exists || false} 
                  isDownloading={downloading[model.name]} // 🔥 WIRED UP
                  downloadProgress={progresses[model.name]} // 🔥 WIRED UP
                  fileSizeStr={fileStates[model.name]?.size || '0 Bytes'}
                  showDeleteButton={true} 
                  onDownload={() => handleDownload(model)} // 🔥 WIRED UP
                  onCancelDownload={() => cancelDownload(model.name)} // 🔥 WIRED UP
                  onSetDefault={() => setDefaultModel(model.name)}
                  onDelete={async () => { await RNFS.unlink(`${RNFS.DocumentDirectoryPath}/${model.destination}`); checkFiles(); }}
                />
              ))}
              {customModels.map((filename, index) => (
                <ModelCard
                  key={`custom-${index}`} modelName={filename} isActive={activeModel === filename} isDefault={defaultModel === filename}
                  isDownloaded={true} fileSizeStr={fileStates[filename]?.size || '0 Bytes'}
                  showDeleteButton={true} onDownload={() => {}} onSetDefault={() => setDefaultModel(filename)}
                  onDelete={async () => { await RNFS.unlink(`${RNFS.DocumentDirectoryPath}/${filename}`); checkFiles(); }}
                />
              ))}
            </>
          )}
        </ScrollView>
      </LinearGradient>

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
              <TouchableOpacity 
                style={styles.subFab} 
                onPress={() => { setIsFabExpanded(false); navigation.navigate('SearchResult'); }}
              >
                <Text style={styles.subFabIcon}>🤗</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.fabRow}>
              <Text style={styles.fabLabel}>Add Local Model</Text>
              <TouchableOpacity 
                style={styles.subFab} 
                onPress={pickLocalModel}
              >
                <Text style={styles.subFabIcon}>📁</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <TouchableOpacity 
          style={[styles.mainFab, isFabExpanded && styles.mainFabOpen]} 
          onPress={() => setIsFabExpanded(!isFabExpanded)}
        >
          <Text style={[styles.mainFabIcon, isFabExpanded && styles.mainFabIconOpen]}>
            {isFabExpanded ? '×' : '+'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContainer: { paddingHorizontal: 15, paddingTop: 20, paddingBottom: 100 },
  divider: { height: 1, backgroundColor: '#333333', width: '100%' },
  sectionHeader: { color: 'rgba(255, 255, 255, 0.5)', fontSize: 18, paddingVertical: 10 },
  emptyText: { color: '#ffffff', marginTop: 8, marginLeft: 2 },
  
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)' },
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