// import React, { useState, useEffect } from 'react';
// import { View, Text, TouchableOpacity, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
// import { ALL_MODELS, downloadModel, checkFileExists, IrisModel } from './ModelService';

// export default function ModelsScreen() {
//   // Store the download progress for each model by its name
//   const [progresses, setProgresses] = useState<{ [key: string]: number }>({});
//   const [downloading, setDownloading] = useState<{ [key: string]: boolean }>({});
//   const [downloadedFiles, setDownloadedFiles] = useState<{ [key: string]: boolean }>({});

//   useEffect(() => {
//     // Check which models are already saved on the phone when the screen loads
//     const checkExisting = async () => {
//       const existing: { [key: string]: boolean } = {};
//       for (const model of ALL_MODELS) {
//         existing[model.name] = await checkFileExists(model.destination);
//       }
//       setDownloadedFiles(existing);
//     };
//     checkExisting();
//   }, []);

//   const handleDownload = async (model: IrisModel) => {
//     setDownloading(prev => ({ ...prev, [model.name]: true }));
    
//     try {
//       await downloadModel(model, (percentage, totalMB) => {
//         setProgresses(prev => ({ ...prev, [model.name]: Math.round(percentage * 100) }));
//       });
      
//       // Mark as finished
//       setDownloadedFiles(prev => ({ ...prev, [model.name]: true }));
//     } catch (error) {
//       console.error("Download failed:", error);
//     } finally {
//       setDownloading(prev => ({ ...prev, [model.name]: false }));
//     }
//   };

//   const renderModelItem = ({ item }: { item: IrisModel }) => {
//     const isDownloaded = downloadedFiles[item.name];
//     const isDownloading = downloading[item.name];
//     const currentProgress = progresses[item.name] || 0;

//     return (
//       <View style={styles.card}>
//         <Text style={styles.modelName}>{item.name}</Text>
        
//         <TouchableOpacity 
//           style={[
//             styles.button, 
//             isDownloaded ? styles.buttonSuccess : (isDownloading ? styles.buttonDownloading : styles.buttonPrimary)
//           ]}
//           onPress={() => !isDownloaded && !isDownloading && handleDownload(item)}
//           disabled={isDownloaded || isDownloading}
//         >
//           {isDownloading ? (
//             <Text style={styles.buttonText}>Downloading... {currentProgress}%</Text>
//           ) : isDownloaded ? (
//             <Text style={styles.buttonText}>Downloaded / Ready</Text>
//           ) : (
//             <Text style={styles.buttonText}>Download</Text>
//           )}
//         </TouchableOpacity>
//       </View>
//     );
//   };

//   return (
//     <View style={styles.container}>
//       <Text style={styles.header}>Available Models</Text>
//       <FlatList
//         data={ALL_MODELS}
//         keyExtractor={item => item.name}
//         renderItem={renderModelItem}
//       />
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: { flex: 1, backgroundColor: '#0f172a', padding: 16 },
//   header: { color: '#f8fafc', fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
//   card: { backgroundColor: '#1e293b', padding: 16, borderRadius: 12, marginBottom: 16, borderLeftWidth: 4, borderLeftColor: '#38bdf8' },
//   modelName: { color: '#e2e8f0', fontSize: 16, marginBottom: 12, fontWeight: '500' },
//   button: { paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
//   buttonPrimary: { backgroundColor: '#2563EB' }, // Matches the Kotlin Navy Blue
//   buttonDownloading: { backgroundColor: '#475569' },
//   buttonSuccess: { backgroundColor: '#059669' },
//   buttonText: { color: '#ffffff', fontWeight: 'bold' }
// });