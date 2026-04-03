// import React, { useState, useEffect, useRef } from 'react';
// import { 
//   View, 
//   Text, 
//   TextInput, 
//   TouchableOpacity, 
//   FlatList, 
//   StyleSheet, 
//   ActivityIndicator, 
//   Keyboard, 
//   ToastAndroid, 
//   Platform,
//   Image,
//   KeyboardAvoidingView,
//   PanResponder 
// } from 'react-native';
// import LinearGradient from 'react-native-linear-gradient';
// import { SafeAreaView } from 'react-native-safe-area-context';
// import RNFS from 'react-native-fs';
// import { downloadModel } from '../services/ModelService';

// // --- FORMATTERS ---
// const formatNumber = (num: number) => {
//   if (!num) return '0';
//   if (num >= 1000000) return (num / 1000000).toFixed(0) + 'm';
//   if (num >= 1000) return (num / 1000).toFixed(0) + 'k';
//   return num.toString();
// };

// const timeAgo = (dateString: any) => {
//   if (!dateString) return 'Unknown';
//   const timestamp = new Date(dateString).getTime();
//   if (isNaN(timestamp)) return 'Unknown';
  
//   const diff = Date.now() - timestamp;
//   const days = Math.floor(diff / (1000 * 60 * 60 * 24));
//   if (days > 365) return `Updated ${Math.floor(days / 365)} year${Math.floor(days/365) > 1 ? 's' : ''} ago`;
//   if (days > 30) return `Updated ${Math.floor(days / 30)} month${Math.floor(days/30) > 1 ? 's' : ''} ago`;
//   if (days > 7) return `Updated ${Math.floor(days / 7)} week${Math.floor(days/7) > 1 ? 's' : ''} ago`;
//   if (days > 0) return `Updated ${days} day${days > 1 ? 's' : ''} ago`;
//   return 'Updated Today';
// };

// const formatBytes = (bytes: number) => {
//     if (!+bytes) return '0 Bytes';
//     const k = 1024;
//     const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
//     const i = Math.floor(Math.log(bytes) / Math.log(k));
//     return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
// };

// export default function SearchResultScreen({ navigation }: any) {
//   const [feed, setFeed] = useState<any[]>([]);
//   const [repoFiles, setRepoFiles] = useState<any[]>([]);
//   const [query, setQuery] = useState('');
  
//   const [isLoading, setIsLoading] = useState(true);
//   const [isLoadingMore, setIsLoadingMore] = useState(false);
//   const [nextPageUrl, setNextPageUrl] = useState<string | null>(null);
  
//   const [viewState, setViewState] = useState<'feed' | 'files'>('feed'); 
//   const [currentRepo, setCurrentRepo] = useState('');
//   const [selectedModel, setSelectedModel] = useState<any>(null);

//   const [downloading, setDownloading] = useState<Record<string, boolean>>({});
//   const [progresses, setProgresses] = useState<Record<string, number>>({});
//   const [downloadedFiles, setDownloadedFiles] = useState<string[]>([]); 

//   // 🔥 PAN RESPONDER: Attached only to the drag handle area to avoid scrolling conflicts
//   const panResponder = useRef(
//     PanResponder.create({
//       onStartShouldSetPanResponder: () => true,
//       onPanResponderRelease: (evt, gestureState) => {
//         if (gestureState.dy > 30) {
//           Keyboard.dismiss();
//           navigation.goBack(); 
//         }
//       },
//     })
//   ).current;

//   useEffect(() => { fetchTrending('', false); }, []);

//   useEffect(() => {
//     const timeout = setTimeout(() => {
//       if (query.trim() === '') fetchTrending('', false);
//     }, 400);
//     return () => clearTimeout(timeout);
//   }, [query]);

//   const fetchTrending = async (searchQuery = '', isLoadMore = false) => {
//     if (!isLoadMore) {
//       setIsLoading(true);
//       setNextPageUrl(null);
//     } else setIsLoadingMore(true);

//     setViewState('feed');
//     try {
//       let url = isLoadMore && nextPageUrl 
//         ? nextPageUrl 
//         : (searchQuery.trim() !== '' 
//             ? `https://huggingface.co/api/models?search=${encodeURIComponent(searchQuery)}&filter=gguf&limit=50` 
//             : `https://huggingface.co/api/models?filter=gguf&sort=downloads&direction=-1&limit=50`);
            
//       const response = await fetch(url);
//       const linkHeader = response.headers.get('link');
//       setNextPageUrl(linkHeader ? (linkHeader.match(/<([^>]+)>;\s*rel="next"/) || [])[1] : null);
      
//       const data = await response.json();
      
//       if (!isLoadMore) setFeed(data);
//       else setFeed(prev => {
//         const existing = new Set(prev.map(m => m.id));
//         return [...prev, ...data.filter((m: any) => !existing.has(m.id))];
//       });
//     } catch (e) { console.error(e); } 
//     finally { setIsLoading(false); setIsLoadingMore(false); }
//   };

//   const handleLoadMore = () => {
//     if (!isLoadingMore && nextPageUrl && viewState === 'feed') fetchTrending(query, true);
//   };

//   const fetchRepoFiles = async (repoItem: any) => {
//     Keyboard.dismiss();
//     setIsLoading(true);
//     setCurrentRepo(repoItem.id);
//     setSelectedModel(repoItem);
//     try {
//       const treeResponse = await fetch(`https://huggingface.co/api/models/${repoItem.id}/tree/main?recursive=true`);
//       const treeData = await treeResponse.json();
      
//       if (Array.isArray(treeData)) {
//         const ggufFiles = treeData
//             .filter((f: any) => f.type === 'file' && f.path.toLowerCase().endsWith('.gguf'))
//             .map((f: any) => ({
//                 rfilename: f.path,
//                 size: f.size 
//             }));
            
//         setRepoFiles(ggufFiles);
//         setViewState('files');
        
//         const localFiles = await RNFS.readDir(RNFS.DocumentDirectoryPath);
//         const downloadedNames = localFiles.map(f => f.name);
//         setDownloadedFiles(ggufFiles.filter((f: any) => downloadedNames.includes(f.rfilename)).map((f: any) => f.rfilename));
//       } else {
//         if(Platform.OS === 'android') ToastAndroid.show("No GGUF files found", ToastAndroid.SHORT);
//       }
//     } catch (err: any) { 
//       if(Platform.OS === 'android') ToastAndroid.show("Failed to fetch files", ToastAndroid.SHORT); 
//     } finally { setIsLoading(false); }
//   };

//   const startCustomDownload = async (filename: string) => {
//     setDownloading(prev => ({ ...prev, [filename]: true }));
//     const downloadUrl = `https://huggingface.co/${currentRepo}/resolve/main/${filename}?download=true`;
//     try {
//       await downloadModel(
//         { name: filename, source: downloadUrl, destination: filename }, 
//         (p) => setProgresses(prev => ({ ...prev, [filename]: Math.round(p * 100) }))
//       );
//       setDownloadedFiles(prev => [...prev, filename]); 
//       if(Platform.OS === 'android') ToastAndroid.show(`Downloaded!`, ToastAndroid.SHORT);
//     } catch (err) { 
//         if(Platform.OS === 'android') ToastAndroid.show(`Download failed`, ToastAndroid.SHORT); 
//     } finally { 
//         setDownloading(prev => ({ ...prev, [filename]: false })); 
//     }
//   };

//   const handleDelete = async (filename: string) => {
//       try {
//           await RNFS.unlink(`${RNFS.DocumentDirectoryPath}/${filename}`);
//           setDownloadedFiles(prev => prev.filter(f => f !== filename));
//           if(Platform.OS === 'android') ToastAndroid.show("Deleted", ToastAndroid.SHORT);
//       } catch (err) { console.log(err); }
//   };

//   return (
//     <LinearGradient colors={['#111111', '#000000']} style={styles.container}>
      
//       {/* 🔥 ARCHITECTURE FIX: KeyboardAvoidingView is the absolute outermost shell */}
//       <KeyboardAvoidingView 
//         style={{ flex: 1 }} 
//         behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
//         keyboardVerticalOffset={20}
//       >
//         <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right' , 'bottom']}>
          
//           <View style={styles.dragHandleContainer} {...panResponder.panHandlers}>
//             <View style={styles.dragHandleLine} />
//             <View style={styles.dragHandleLine} />
//           </View>

//           {isLoading && !isLoadingMore ? (
//             <View style={styles.center}><ActivityIndicator size="large" color="#ffffff" /></View>
//           ) : viewState === 'feed' ? (
            
//             // 🔥 ARCHITECTURE FIX: Linear Flex Flow (No absolute positioning)
//             <View style={{ flex: 1, justifyContent: 'space-between' }}>
                
//                 <FlatList
//                   style={{ flex: 1 }}
//                   data={feed} 
//                   keyExtractor={(item) => item.id}
//                   contentContainerStyle={{
//                     ...styles.feedListContainer,
//                     flexGrow: 1
//                   }}
//                   keyboardShouldPersistTaps="handled"
//                   onEndReached={handleLoadMore}
//                   onEndReachedThreshold={0.5}
//                   keyboardDismissMode="on-drag"
//                   ListFooterComponent={isLoadingMore ? <ActivityIndicator size="small" color="#ffffff" style={{ margin: 20 }} /> : null}
//                   renderItem={({ item }) => {
//                       const author = item.author || item.id.split('/')[0];
//                       const name = item.id.split('/')[1] || item.id;
//                       const dateDisplay = timeAgo(item.lastModified || item.createdAt);

//                       return (
//                       <TouchableOpacity style={styles.feedItem} onPress={() => fetchRepoFiles(item)}>
//                           <Text style={styles.feedAuthor}>{author}</Text>
//                           <Text style={styles.feedName}>{name}</Text>
//                           <View style={styles.feedMetaRow}>
//                               <Text style={styles.feedMetaText}>🕒 {dateDisplay.replace('Updated ', '')}</Text>
                              
//                               <View style={{flexDirection: 'row', alignItems: 'center', gap: 4}}>
//                                 <Image source={require('../assets/icons/download.png')} style={{width: 12, height: 12, tintColor: '#a0a0a0', resizeMode: 'contain'}} />
//                                 <Text style={styles.feedMetaText}>{formatNumber(item.downloads)}</Text>
//                               </View>
                              
//                               <Text style={styles.feedMetaText}>♡ {item.likes}</Text>
//                           </View>
//                       </TouchableOpacity>
//                       );
//                   }}
//                 />
                
//                 {/* 🔥 ARCHITECTURE FIX: Anchored at the bottom of the flex container */}
//                 <View style={styles.anchoredSearchContainer}>
//                     <Text style={styles.searchIcon}>🔍</Text>
//                     <TextInput
//                         style={styles.floatingInput} 
//                         placeholder="Search Hugging Face models" 
//                         placeholderTextColor="#a0a0a0"
//                         value={query} 
//                         onChangeText={setQuery} 
//                         onSubmitEditing={() => fetchTrending(query, false)} 
//                         returnKeyType="search"
//                     />
//                 </View>
//             </View>

//           ) : (

//             <View style={{ flex: 1 }}>
//               <FlatList
//                 style={{ flex: 1 }}
//                 data={repoFiles} 
//                 keyExtractor={(item) => item.rfilename}
//                 contentContainerStyle={styles.detailsListContainer}
//                 keyboardDismissMode="on-drag"
//                 ListHeaderComponent={
//                   selectedModel ? (
//                     <View style={styles.detailsHeader}>
//                       <TouchableOpacity onPress={() => setViewState('feed')} style={{marginBottom: 10, alignSelf: 'flex-start'}}>
//                           <Text style={{color: '#a0a0a0', fontSize: 16}}>← Back</Text>
//                       </TouchableOpacity>

//                       <Text style={styles.detailAuthor}>{selectedModel.author || selectedModel.id.split('/')[0]}</Text>
//                       <Text style={styles.detailName}>{selectedModel.id.split('/')[1] || selectedModel.id}</Text>
                      
//                       <View style={styles.detailMetaRow}>
//                         <View style={styles.metaBadge}>
//                           <Text style={styles.metaBadgeText}>🕒 {timeAgo(selectedModel.lastModified || selectedModel.createdAt)}</Text>
//                         </View>
                        
//                         <View style={[styles.metaBadge, {flexDirection: 'row', alignItems: 'center', gap: 6}]}>
//                           <Image source={require('../assets/icons/download.png')} style={{width: 14, height: 14, tintColor: '#d0c4d6', resizeMode: 'contain'}} />
//                           <Text style={styles.metaBadgeText}>{formatNumber(selectedModel.downloads)}</Text>
//                         </View>
                        
//                         <View style={styles.metaBadge}>
//                           <Text style={styles.metaBadgeText}>♡ {selectedModel.likes}</Text>
//                         </View>
//                       </View>
                      
//                       <Text style={styles.filesSubtitle}>Available GGUF Files</Text>
//                     </View>
//                   ) : null
//                 }
//                 ListEmptyComponent={<Text style={{color: '#666', marginTop: 20}}>No GGUF files found in this repo.</Text>}
                
//                 renderItem={({ item }) => {
//                   const isDownloading = downloading[item.rfilename];
//                   const progress = progresses[item.rfilename] || 0;
//                   const isDownloaded = downloadedFiles.includes(item.rfilename);
//                   const sizeDisplay = item.size ? formatBytes(item.size) : 'Unknown Size';

//                   return (
//                     <View style={[styles.fileCard, isDownloaded && styles.fileCardDownloaded]}>
                        
//                         <View style={{ flex: 1, paddingRight: 10 }}>
//                             <Text style={[styles.fileName, isDownloaded && {color: '#ffffff'}]}>{item.rfilename}</Text>
//                             <Text style={[styles.fileSize, isDownloaded && {color: 'rgba(255,255,255,0.8)'}]}>
//                                 {isDownloading ? `Downloading... ${progress}%` : sizeDisplay}
//                             </Text>
//                         </View>

//                         <View style={styles.iconRow}>
//                             <TouchableOpacity style={styles.iconBtn}>
//                                 <Image 
//                                   source={require('../assets/icons/save.png')} 
//                                   style={[styles.iconImage, isDownloaded && { tintColor: '#ffffff' }]} 
//                                 />
//                             </TouchableOpacity>

//                             {isDownloaded ? (
//                                 <TouchableOpacity style={styles.iconBtn} onPress={() => handleDelete(item.rfilename)}>
//                                     <Image 
//                                       source={require('../assets/icons/delete.png')} 
//                                       style={[styles.iconImage, { tintColor: '#ffffff' }]} 
//                                     />
//                                 </TouchableOpacity>
//                             ) : (
//                                 <TouchableOpacity style={styles.iconBtn} onPress={() => startCustomDownload(item.rfilename)} disabled={isDownloading}>
//                                     <Image 
//                                       source={require('../assets/icons/download.png')} 
//                                       style={styles.iconImage} 
//                                     />
//                                 </TouchableOpacity>
//                             )}
//                         </View>

//                         {isDownloading ? (
//                             <View style={[styles.progressOverlay, {width: `${progress}%`}]} />
//                         ) : null}
//                     </View>
//                   );
//                 }}
//               />
//             </View>
//           )}
//         </SafeAreaView>
//       </KeyboardAvoidingView>
//     </LinearGradient>
//   );
// }

// const styles = StyleSheet.create({
//   container: { flex: 1, backgroundColor: '#000000' },
//   safeArea: { flex: 1 },
//   center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
//   dragHandleContainer: { width: '100%', height: 40, justifyContent: 'center', alignItems: 'center', gap: 4, backgroundColor: 'transparent' },
//   dragHandleLine: { width: 40, height: 4, backgroundColor: '#ffffff', opacity: 0.6, borderRadius: 2 },

//   // 🔥 Padding Bottom reduced because search bar is no longer absolute
//   feedListContainer: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 20 },
//   feedItem: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)' },
//   feedAuthor: { color: '#a0a0a0', fontSize: 13, marginBottom: 2 },
//   feedName: { color: '#ffffff', fontSize: 18, fontWeight: 'bold', marginBottom: 6 },
//   feedMetaRow: { flexDirection: 'row', gap: 14 },
//   feedMetaText: { color: '#a0a0a0', fontSize: 12, fontWeight: '500' },

//   // 🔥 NEW STYLE: No absolute positioning, sits naturally in flex flow
//   anchoredSearchContainer: { 
//       width: '90%', 
//       alignSelf: 'center', 
//       backgroundColor: '#352c3c', 
//       borderRadius: 16, 
//       flexDirection: 'row', 
//       alignItems: 'center', 
//       paddingHorizontal: 16,
//       height: 55,
//       position:'absolute',
//       // marginTop: 10,
//       bottom: Platform.OS === 'ios' ? 50 : 30, 
//   },
//   searchIcon: { fontSize: 18, color: '#a0a0a0', marginRight: 10 },
//   floatingInput: { flex: 1, color: 'white', fontSize: 16, height: '100%' },

//   detailsListContainer: { paddingHorizontal: 20, paddingBottom: 40 },
//   detailsHeader: { marginBottom: 24, paddingTop: 10 },
//   detailAuthor: { color: '#ffffff', fontSize: 16, fontWeight: '500', marginBottom: 2 },
//   detailName: { color: '#ffffff', fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
//   detailMetaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
//   metaBadge: { backgroundColor: '#352c3c', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
//   metaBadgeText: { color: '#d0c4d6', fontSize: 13, fontWeight: '500' },
//   filesSubtitle: { color: '#ffffff', fontSize: 18, fontWeight: 'bold' },

//   fileCard: {
//       flexDirection: 'row',
//       alignItems: 'center',
//       justifyContent: 'space-between',
//       backgroundColor: '#574b60',
//       borderRadius: 12,
//       padding: 16,
//       marginBottom: 12,
//       overflow: 'hidden',
//   },
//   fileCardDownloaded: {
//       backgroundColor: '#eab308', 
//   },
//   fileName: { color: '#ffffff', fontSize: 15, fontWeight: '600', marginBottom: 4 },
//   fileSize: { color: 'rgba(255,255,255,0.7)', fontSize: 13 },
//   iconRow: { flexDirection: 'row', gap: 16, zIndex: 2 },
//   iconBtn: { padding: 4 },
//   iconText: { color: 'rgba(255,255,255,0.8)', fontSize: 16 },
  
//   iconImage: { 
//       width: 22, 
//       height: 22, 
//       tintColor: 'rgba(255,255,255,0.8)',
//       resizeMode: 'contain' 
//   },
  
//   progressOverlay: {
//       position: 'absolute', left: 0, top: 0, bottom: 0,
//       backgroundColor: 'rgba(0,0,0,0.2)',
//       zIndex: 1
//   }
// });




import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  FlatList, 
  StyleSheet, 
  ActivityIndicator, 
  Keyboard, 
  ToastAndroid, 
  Platform,
  Image,
  KeyboardAvoidingView,
  PanResponder 
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import RNFS from 'react-native-fs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Svg, { Path } from 'react-native-svg';
import { downloadModel } from '../services/ModelService';

// --- FORMATTERS ---
const formatNumber = (num: number) => {
  if (!num) return '0';
  if (num >= 1000000) return (num / 1000000).toFixed(0) + 'm';
  if (num >= 1000) return (num / 1000).toFixed(0) + 'k';
  return num.toString();
};

const timeAgo = (dateString: any) => {
  if (!dateString) return 'Unknown';
  const timestamp = new Date(dateString).getTime();
  if (isNaN(timestamp)) return 'Unknown';
  
  const diff = Date.now() - timestamp;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days > 365) return `Updated ${Math.floor(days / 365)} year${Math.floor(days/365) > 1 ? 's' : ''} ago`;
  if (days > 30) return `Updated ${Math.floor(days / 30)} month${Math.floor(days/30) > 1 ? 's' : ''} ago`;
  if (days > 7) return `Updated ${Math.floor(days / 7)} week${Math.floor(days/7) > 1 ? 's' : ''} ago`;
  if (days > 0) return `Updated ${days} day${days > 1 ? 's' : ''} ago`;
  return 'Updated Today';
};

const formatBytes = (bytes: number) => {
    if (!+bytes) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

export default function SearchResultScreen({ navigation }: any) {
  const [feed, setFeed] = useState<any[]>([]);
  const [repoFiles, setRepoFiles] = useState<any[]>([]);
  const [query, setQuery] = useState('');
  
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [nextPageUrl, setNextPageUrl] = useState<string | null>(null);
  
  const [viewState, setViewState] = useState<'feed' | 'files'>('feed'); 
  const [currentRepo, setCurrentRepo] = useState('');
  const [selectedModel, setSelectedModel] = useState<any>(null);

  const [downloading, setDownloading] = useState<Record<string, boolean>>({});
  const [progresses, setProgresses] = useState<Record<string, number>>({});
  const [downloadedFiles, setDownloadedFiles] = useState<string[]>([]); 

  const [savedBookmarks, setSavedBookmarks] = useState<string[]>([]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderRelease: (evt, gestureState) => {
        if (gestureState.dy > 30) {
          Keyboard.dismiss();
          navigation.goBack(); 
        }
      },
    })
  ).current;

  useEffect(() => { 
    fetchTrending('', false); 
    const loadSaved = async () => {
      try {
        const saved = await AsyncStorage.getItem('SAVED_FILES');
        if (saved) setSavedBookmarks(JSON.parse(saved));
      } catch (e) { console.log(e); }
    };
    loadSaved();
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (query.trim() === '') fetchTrending('', false);
    }, 400);
    return () => clearTimeout(timeout);
  }, [query]);

  const fetchTrending = async (searchQuery = '', isLoadMore = false) => {
    if (!isLoadMore) {
      setIsLoading(true);
      setNextPageUrl(null);
    } else setIsLoadingMore(true);

    setViewState('feed');
    try {
      let url = isLoadMore && nextPageUrl 
        ? nextPageUrl 
        : (searchQuery.trim() !== '' 
            ? `https://huggingface.co/api/models?search=${encodeURIComponent(searchQuery)}&filter=gguf&limit=50` 
            : `https://huggingface.co/api/models?filter=gguf&sort=downloads&direction=-1&limit=50`);
            
      const response = await fetch(url);
      const linkHeader = response.headers.get('link');
      setNextPageUrl(linkHeader ? (linkHeader.match(/<([^>]+)>;\s*rel="next"/) || [])[1] : null);
      
      const data = await response.json();
      
      if (!isLoadMore) setFeed(data);
      else setFeed(prev => {
        const existing = new Set(prev.map(m => m.id));
        return [...prev, ...data.filter((m: any) => !existing.has(m.id))];
      });
    } catch (e) { console.error(e); } 
    finally { setIsLoading(false); setIsLoadingMore(false); }
  };

  const handleLoadMore = () => {
    if (!isLoadingMore && nextPageUrl && viewState === 'feed') fetchTrending(query, true);
  };

  const fetchRepoFiles = async (repoItem: any) => {
    Keyboard.dismiss();
    setIsLoading(true);
    setCurrentRepo(repoItem.id);
    setSelectedModel(repoItem);
    try {
      const treeResponse = await fetch(`https://huggingface.co/api/models/${repoItem.id}/tree/main?recursive=true`);
      const treeData = await treeResponse.json();
      
      if (Array.isArray(treeData)) {
        const ggufFiles = treeData
            .filter((f: any) => f.type === 'file' && f.path.toLowerCase().endsWith('.gguf'))
            .map((f: any) => ({
                rfilename: f.path,
                size: f.size 
            }));
            
        setRepoFiles(ggufFiles);
        setViewState('files');
        
        const localFiles = await RNFS.readDir(RNFS.DocumentDirectoryPath);
        const downloadedNames = localFiles.map(f => f.name);
        setDownloadedFiles(ggufFiles.filter((f: any) => downloadedNames.includes(f.rfilename)).map((f: any) => f.rfilename));
      } else {
        if(Platform.OS === 'android') ToastAndroid.show("No GGUF files found", ToastAndroid.SHORT);
      }
    } catch (err: any) { 
      if(Platform.OS === 'android') ToastAndroid.show("Failed to fetch files", ToastAndroid.SHORT); 
    } finally { setIsLoading(false); }
  };

  const startCustomDownload = async (filename: string) => {
    setDownloading(prev => ({ ...prev, [filename]: true }));
    const downloadUrl = `https://huggingface.co/${currentRepo}/resolve/main/${filename}?download=true`;
    try {
      await downloadModel(
        { name: filename, source: downloadUrl, destination: filename }, 
        (p) => setProgresses(prev => ({ ...prev, [filename]: Math.round(p * 100) }))
      );
      setDownloadedFiles(prev => [...prev, filename]); 
      if(Platform.OS === 'android') ToastAndroid.show(`Downloaded!`, ToastAndroid.SHORT);
    } catch (err) { 
        if(Platform.OS === 'android') ToastAndroid.show(`Download failed`, ToastAndroid.SHORT); 
    } finally { 
        setDownloading(prev => ({ ...prev, [filename]: false })); 
    }
  };

  const handleDelete = async (filename: string) => {
      try {
          await RNFS.unlink(`${RNFS.DocumentDirectoryPath}/${filename}`);
          setDownloadedFiles(prev => prev.filter(f => f !== filename));
          if(Platform.OS === 'android') ToastAndroid.show("Deleted", ToastAndroid.SHORT);
      } catch (err) { console.log(err); }
  };

  const handleToggleSave = async (filename: string) => {
    let updatedSaved = [];
    if (savedBookmarks.includes(filename)) {
      updatedSaved = savedBookmarks.filter(f => f !== filename);
      if(Platform.OS === 'android') ToastAndroid.show("Unsaved", ToastAndroid.SHORT);
    } else {
      updatedSaved = [...savedBookmarks, filename];
      if(Platform.OS === 'android') ToastAndroid.show("Saved to Bookmarks", ToastAndroid.SHORT);
    }
    setSavedBookmarks(updatedSaved);
    try {
      await AsyncStorage.setItem('SAVED_FILES', JSON.stringify(updatedSaved));
    } catch (e) { console.log(e); }
  };

  return (
    <LinearGradient colors={['#111111', '#000000']} style={styles.container}>
      
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={20}
      >
        <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right' , 'bottom']}>
          
          <View style={styles.dragHandleContainer} {...panResponder.panHandlers}>
            <View style={styles.dragHandleLine} />
            <View style={styles.dragHandleLine} />
          </View>

          {isLoading && !isLoadingMore ? (
            <View style={styles.center}><ActivityIndicator size="large" color="#ffffff" /></View>
          ) : viewState === 'feed' ? (
            
            <View style={{ flex: 1, justifyContent: 'space-between' }}>
                
                <FlatList
                  style={{ flex: 1 }}
                  data={feed} 
                  keyExtractor={(item) => item.id}
                  contentContainerStyle={{
                    ...styles.feedListContainer,
                    flexGrow: 1
                  }}
                  keyboardShouldPersistTaps="handled"
                  onEndReached={handleLoadMore}
                  onEndReachedThreshold={0.5}
                  keyboardDismissMode="on-drag"
                  ListFooterComponent={isLoadingMore ? <ActivityIndicator size="small" color="#ffffff" style={{ margin: 20 }} /> : null}
                  renderItem={({ item }) => {
                      const author = item.author || item.id.split('/')[0];
                      const name = item.id.split('/')[1] || item.id;
                      const dateDisplay = timeAgo(item.lastModified || item.createdAt);

                      return (
                      <TouchableOpacity style={styles.feedItem} onPress={() => fetchRepoFiles(item)}>
                          <Text style={styles.feedAuthor}>{author}</Text>
                          <Text style={styles.feedName}>{name}</Text>
                          <View style={styles.feedMetaRow}>
                              
                              {/* 🔥 CLOCK SVG */}
                              <View style={{flexDirection: 'row', alignItems: 'center', gap: 4}}>
                                <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
                                  <Path fill="#a0a0a0" d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm4.2 14.2L11 13V7h1.5v5.2l4.5 2.7-.8 1.3Z" />
                                </Svg>
                                <Text style={styles.feedMetaText}>{dateDisplay.replace('Updated ', '')}</Text>
                              </View>
                              
                              {/* 🔥 DOWNLOAD SVG */}
                              <View style={{flexDirection: 'row', alignItems: 'center', gap: 4}}>
                                <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
                                  <Path fill="#a0a0a0" d="M13 5v6h1.17L12 13.17 9.83 11H11V5h2Zm2-2H9v6H5l7 7 7-7h-4V3Zm4 15H5v2h14v-2Z" />
                                </Svg>
                                <Text style={styles.feedMetaText}>{formatNumber(item.downloads)}</Text>
                              </View>
                              
                              <Text style={styles.feedMetaText}>♡ {item.likes}</Text>
                          </View>
                      </TouchableOpacity>
                      );
                  }}
                />
                
                <View style={styles.anchoredSearchContainer}>
                    {/* 🔥 SEARCH SVG */}
                    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" style={{ marginRight: 10 }}>
                      <Path fill="#a0a0a0" d="M9.5 16c-1.817 0-3.354-.63-4.612-1.888C3.63 12.853 3.001 11.316 3 9.5c0-1.816.629-3.353 1.888-4.612C6.148 3.629 7.685 3 9.5 3s3.353.63 4.613 1.888C15.373 6.147 16.002 7.684 16 9.5a6.096 6.096 0 0 1-1.3 3.8l5.6 5.6a.948.948 0 0 1 .275.7.948.948 0 0 1-.275.7.948.948 0 0 1-.7.275.948.948 0 0 1-.7-.275l-5.6-5.6A6.096 6.096 0 0 1 9.5 16Zm0-2c1.25 0 2.313-.437 3.188-1.312S14.001 10.751 14 9.5c0-1.25-.438-2.313-1.312-3.187C11.814 5.439 10.751 5.001 9.5 5c-1.251-.001-2.314.436-3.187 1.313C5.44 7.19 5.002 8.252 5 9.5c-.002 1.248.436 2.31 1.313 3.188.877.877 1.94 1.315 3.187 1.312Z" />
                    </Svg>
                    <TextInput
                        style={styles.floatingInput} 
                        placeholder="Search Hugging Face models" 
                        placeholderTextColor="#a0a0a0"
                        value={query} 
                        onChangeText={setQuery} 
                        onSubmitEditing={() => fetchTrending(query, false)} 
                        returnKeyType="search"
                    />
                </View>
            </View>

          ) : (

            <View style={{ flex: 1 }}>
              <FlatList
                style={{ flex: 1 }}
                data={repoFiles} 
                keyExtractor={(item) => item.rfilename}
                contentContainerStyle={styles.detailsListContainer}
                keyboardDismissMode="on-drag"
                ListHeaderComponent={
                  selectedModel ? (
                    <View style={styles.detailsHeader}>
                      <TouchableOpacity onPress={() => setViewState('feed')} style={{marginBottom: 10, alignSelf: 'flex-start'}}>
                          <Text style={{color: '#a0a0a0', fontSize: 16}}>← Back</Text>
                      </TouchableOpacity>

                      <Text style={styles.detailAuthor}>{selectedModel.author || selectedModel.id.split('/')[0]}</Text>
                      <Text style={styles.detailName}>{selectedModel.id.split('/')[1] || selectedModel.id}</Text>
                      
                      <View style={styles.detailMetaRow}>
                        
                        {/* 🔥 CLOCK SVG */}
                        <View style={[styles.metaBadge, {flexDirection: 'row', alignItems: 'center', gap: 6}]}>
                          <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
                            <Path fill="#d0c4d6" d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm4.2 14.2L11 13V7h1.5v5.2l4.5 2.7-.8 1.3Z" />
                          </Svg>
                          <Text style={styles.metaBadgeText}>{timeAgo(selectedModel.lastModified || selectedModel.createdAt)}</Text>
                        </View>
                        
                        {/* 🔥 DOWNLOAD SVG */}
                        <View style={[styles.metaBadge, {flexDirection: 'row', alignItems: 'center', gap: 6}]}>
                          <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
                            <Path fill="#d0c4d6" d="M13 5v6h1.17L12 13.17 9.83 11H11V5h2Zm2-2H9v6H5l7 7 7-7h-4V3Zm4 15H5v2h14v-2Z" />
                          </Svg>
                          <Text style={styles.metaBadgeText}>{formatNumber(selectedModel.downloads)}</Text>
                        </View>
                        
                        <View style={styles.metaBadge}>
                          <Text style={styles.metaBadgeText}>♡ {selectedModel.likes}</Text>
                        </View>
                      </View>
                      
                      <Text style={styles.filesSubtitle}>Available GGUF Files</Text>
                    </View>
                  ) : null
                }
                ListEmptyComponent={<Text style={{color: '#666', marginTop: 20}}>No GGUF files found in this repo.</Text>}
                
                renderItem={({ item }) => {
                  const isDownloading = downloading[item.rfilename];
                  const progress = progresses[item.rfilename] || 0;
                  const isDownloaded = downloadedFiles.includes(item.rfilename);
                  const isSaved = savedBookmarks.includes(item.rfilename); 
                  const sizeDisplay = item.size ? formatBytes(item.size) : 'Unknown Size';

                  const svgColor = isDownloaded ? '#ffffff' : 'rgba(255,255,255,0.8)';

                  return (
                    <View style={[styles.fileCard, isDownloaded && styles.fileCardDownloaded]}>
                        
                        <View style={{ flex: 1, paddingRight: 10 }}>
                            <Text style={[styles.fileName, isDownloaded && {color: '#ffffff'}]}>{item.rfilename}</Text>
                            <Text style={[styles.fileSize, isDownloaded && {color: 'rgba(255,255,255,0.8)'}]}>
                                {isDownloading ? `Downloading... ${progress}%` : sizeDisplay}
                            </Text>
                        </View>

                        <View style={styles.iconRow}>
                            
                            {/* 🔥 SAVE TOGGLE SVGS */}
                            <TouchableOpacity style={styles.iconBtn} onPress={() => handleToggleSave(item.rfilename)}>
                                {isSaved ? (
                                    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
                                        <Path fill={svgColor} stroke={svgColor} strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16l-5.918-3.805a2 2 0 0 0-2.164 0L5 21Z" />
                                    </Svg>
                                ) : (
                                    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
                                        <Path stroke={svgColor} strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16l-5.918-3.805a2 2 0 0 0-2.164 0L5 21Z" />
                                    </Svg>
                                )}
                            </TouchableOpacity>

                            {isDownloaded ? (
                                /* 🔥 DELETE SVG */
                                <TouchableOpacity style={styles.iconBtn} onPress={() => handleDelete(item.rfilename)}>
                                  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
                                      <Path fill="#ffffff" d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12ZM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4Z" />
                                  </Svg>
                                </TouchableOpacity>
                            ) : (
                                /* 🔥 DOWNLOAD SVG */
                                <TouchableOpacity style={styles.iconBtn} onPress={() => startCustomDownload(item.rfilename)} disabled={isDownloading}>
                                  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
                                    <Path fill={svgColor} d="M13 5v6h1.17L12 13.17 9.83 11H11V5h2Zm2-2H9v6H5l7 7 7-7h-4V3Zm4 15H5v2h14v-2Z" />
                                  </Svg>
                                </TouchableOpacity>
                            )}
                        </View>

                        {isDownloading ? (
                            <View style={[styles.progressOverlay, {width: `${progress}%`}]} />
                        ) : null}
                    </View>
                  );
                }}
              />
            </View>
          )}
        </SafeAreaView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  safeArea: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  dragHandleContainer: { width: '100%', height: 40, justifyContent: 'center', alignItems: 'center', gap: 4, backgroundColor: 'transparent' },
  dragHandleLine: { width: 40, height: 4, backgroundColor: '#ffffff', opacity: 0.6, borderRadius: 2 },

  feedListContainer: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 20 },
  feedItem: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)' },
  feedAuthor: { color: '#a0a0a0', fontSize: 13, marginBottom: 2 },
  feedName: { color: '#ffffff', fontSize: 18, fontWeight: 'bold', marginBottom: 6 },
  feedMetaRow: { flexDirection: 'row', gap: 14, alignItems: 'center' },
  feedMetaText: { color: '#a0a0a0', fontSize: 12, fontWeight: '500' },

  anchoredSearchContainer: { 
      width: '90%', 
      alignSelf: 'center', 
      backgroundColor: '#352c3c', 
      borderRadius: 16, 
      flexDirection: 'row', 
      alignItems: 'center', 
      paddingHorizontal: 16,
      height: 55,
      position:'absolute',
      bottom: Platform.OS === 'ios' ? 50 : 30, 
  },
  floatingInput: { flex: 1, color: 'white', fontSize: 16, height: '100%' },

  detailsListContainer: { paddingHorizontal: 20, paddingBottom: 40 },
  detailsHeader: { marginBottom: 24, paddingTop: 10 },
  detailAuthor: { color: '#ffffff', fontSize: 16, fontWeight: '500', marginBottom: 2 },
  detailName: { color: '#ffffff', fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
  detailMetaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  metaBadge: { backgroundColor: '#352c3c', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  metaBadgeText: { color: '#d0c4d6', fontSize: 13, fontWeight: '500' },
  filesSubtitle: { color: '#ffffff', fontSize: 18, fontWeight: 'bold' },

  fileCard: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: '#574b60',
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      overflow: 'hidden',
  },
  fileCardDownloaded: {
      backgroundColor: '#eab308', 
  },
  fileName: { color: '#ffffff', fontSize: 15, fontWeight: '600', marginBottom: 4 },
  fileSize: { color: 'rgba(255,255,255,0.7)', fontSize: 13 },
  iconRow: { flexDirection: 'row', gap: 16, zIndex: 2, alignItems: 'center' },
  iconBtn: { padding: 4 },
  
  progressOverlay: {
      position: 'absolute', left: 0, top: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.2)',
      zIndex: 1
  }
});