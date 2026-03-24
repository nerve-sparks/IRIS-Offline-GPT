// import React, { useState, useEffect } from 'react';
// import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, ActivityIndicator, Keyboard, ToastAndroid } from 'react-native';
// import LinearGradient from 'react-native-linear-gradient';
// import ModelCard from '../components/ModelCard';
// import { downloadModel } from '../services/ModelService';

// const formatNumber = (num: number) => {
//   if (num >= 1000000) return (num / 1000000).toFixed(1) + 'm';
//   if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
//   return num.toString();
// };

// const timeAgo = (dateString: string) => {
//   const diff = Date.now() - new Date(dateString).getTime();
//   const days = Math.floor(diff / (1000 * 60 * 60 * 24));
//   if (days > 365) return `${Math.floor(days / 365)} year ago`;
//   if (days > 30) return `${Math.floor(days / 30)} months ago`;
//   if (days > 7) return `${Math.floor(days / 7)} week ago`;
//   return `${days} days ago`;
// };

// export default function SearchResultScreen() {
//   const [feed, setFeed] = useState<any[]>([]);
//   const [ggufFiles, setGgufFiles] = useState<any[]>([]);
//   const [query, setQuery] = useState('');
  
//   const [isLoading, setIsLoading] = useState(true);
//   const [isLoadingMore, setIsLoadingMore] = useState(false);
  
//   // 🔥 THE FIX: We use Hugging Face's secret cursor URL instead of page numbers!
//   const [nextPageUrl, setNextPageUrl] = useState<string | null>(null);
  
//   const [viewState, setViewState] = useState<'feed' | 'files'>('feed'); 
//   const [currentRepo, setCurrentRepo] = useState('');

//   const [downloading, setDownloading] = useState<Record<string, boolean>>({});
//   const [progresses, setProgresses] = useState<Record<string, number>>({});

//   useEffect(() => { 
//     fetchTrending('', false); 
//   }, []);

//   // Debounce search: if query is empty, reload feed
//   useEffect(() => {
//     const timeout = setTimeout(() => {
//       if (query.trim() === '') {
//         fetchTrending('', false);
//       }
//     }, 400);
//     return () => clearTimeout(timeout);
//   }, [query]);

//   const fetchTrending = async (searchQuery = '', isLoadMore = false) => {
//     if (!isLoadMore) {
//       setIsLoading(true);
//       setNextPageUrl(null); // Reset pagination on new search
//     } else {
//       setIsLoadingMore(true);
//     }

//     setViewState('feed');

//     try {
//       let url = '';
//       if (isLoadMore && nextPageUrl) {
//         url = nextPageUrl; // 🔥 Use the exact cursor URL given by the previous API call
//       } else {
//         if (searchQuery.trim() !== '') {
//           url = `https://huggingface.co/api/models?search=${encodeURIComponent(searchQuery)}&limit=50`;
//         } else {
//           url = `https://huggingface.co/api/models?sort=downloads&direction=-1&limit=50`;
//         }
//       }

//       const response = await fetch(url);
      
//       // 🔥 Parse the 'Link' header to find the secret next page cursor!
//       const linkHeader = response.headers.get('link');
//       let newNextUrl = null;
//       if (linkHeader) {
//         const match = linkHeader.match(/<([^>]+)>;\s*rel="next"/);
//         if (match) {
//           newNextUrl = match[1];
//         }
//       }
//       setNextPageUrl(newNextUrl);

//       const data = await response.json();

//       if (!isLoadMore) {
//         setFeed(data);
//       } else {
//         // Pure React state update, no side effects inside!
//         setFeed(prev => {
//           const existing = new Set(prev.map(m => m.id));
//           const filtered = data.filter((m: any) => !existing.has(m.id));
//           return [...prev, ...filtered];
//         });
//       }
//     } catch (e) {
//       console.error(e);
//     } finally {
//       setIsLoading(false);
//       setIsLoadingMore(false);
//     }
//   };

//   const handleLoadMore = () => {
//     // Only load more if we aren't already loading, AND Hugging Face actually gave us a next page URL
//     if (!isLoadingMore && nextPageUrl && viewState === 'feed') {
//       fetchTrending(query, true);
//     }
//   };

//   const fetchRepoFiles = async (repoId: string) => {
//     Keyboard.dismiss();
//     setIsLoading(true);
//     setCurrentRepo(repoId);
//     try {
//       const response = await fetch(`https://huggingface.co/api/models/${repoId}`);
//       const data = await response.json();
//       if (data.siblings) {
//         const files = data.siblings.filter((s: any) => s.rfilename.endsWith('gguf'));
//         setGgufFiles(files);
//         setViewState('files');
//       } else {
//         ToastAndroid.show("No GGUF files found in this repo", ToastAndroid.SHORT);
//       }
//     } catch (err: any) { ToastAndroid.show("Failed to fetch files", ToastAndroid.SHORT); } finally { setIsLoading(false); }
//   };

//   const startCustomDownload = async (filename: string) => {
//     setDownloading(prev => ({ ...prev, [filename]: true }));
//     const downloadUrl = `https://huggingface.co/${currentRepo}/resolve/main/${filename}?download=true`;
//     try {
//       await downloadModel(
//         { name: filename, source: downloadUrl, destination: filename }, 
//         (p) => setProgresses(prev => ({ ...prev, [filename]: Math.round(p * 100) }))
//       );
//       ToastAndroid.show(`${filename} downloaded! It is now in 'My Models'`, ToastAndroid.LONG);
//     } catch (err) { ToastAndroid.show(`Download failed`, ToastAndroid.SHORT); } finally { setDownloading(prev => ({ ...prev, [filename]: false })); }
//   };

//   return (
//     <LinearGradient colors={['#050a14', '#051633']} style={styles.container}>
      
//       {viewState === 'feed' ? (
//         <View style={styles.dragHandleContainer}>
//           <View style={styles.dragHandle} />
//         </View>
//       ) : (
//         <View style={styles.header}>
//           <TouchableOpacity onPress={() => setViewState('feed')} style={styles.backBtn}>
//             <Text style={styles.backArrow}>←</Text>
//           </TouchableOpacity>
//           <Text style={styles.headerTitle}>{currentRepo.split('/')[1]}</Text>
//         </View>
//       )}

//       {isLoading && !isLoadingMore ? (
//         <View style={styles.center}><ActivityIndicator size="large" color="#2563EB" /></View>
//       ) : viewState === 'feed' ? (
//         <FlatList
//           data={feed} 
//           keyExtractor={(item) => item.id}
//           contentContainerStyle={{ paddingBottom: 100, paddingTop: 10 }} 
          
//           // Endless scrolling handlers
//           onEndReached={handleLoadMore}
//           onEndReachedThreshold={0.5}
//           ListFooterComponent={isLoadingMore ? <ActivityIndicator size="small" color="#a393a9" style={{ margin: 20 }} /> : null}
          
//           renderItem={({ item }) => {
//             const author = item.author || item.id.split('/')[0];
//             const name = item.id.split('/')[1] || item.id;
//             return (
//               <TouchableOpacity style={styles.feedItem} onPress={() => fetchRepoFiles(item.id)}>
//                 <Text style={styles.authorText}>{author}</Text>
//                 <Text style={styles.nameText}>{name}</Text>
//                 <View style={styles.metaRow}>
//                   <Text style={styles.metaText}>🕒 {timeAgo(item.lastModified)}</Text>
//                   <Text style={styles.metaText}>⬇ {formatNumber(item.downloads)}</Text>
//                   <Text style={styles.metaText}>♡ {item.likes}</Text>
//                 </View>
//               </TouchableOpacity>
//             );
//           }}
//         />
//       ) : (
//         <FlatList
//           data={ggufFiles} keyExtractor={(item) => item.rfilename}
//           contentContainerStyle={{ padding: 16 }}
//           renderItem={({ item }) => {
//             const isDownloading = downloading[item.rfilename];
//             const progress = progresses[item.rfilename] || 0;
//             return (
//               <ModelCard
//                 modelName={item.rfilename} isActive={false} isDefault={false} isDownloaded={false} 
//                 fileSizeStr={isDownloading ? `Downloading... ${progress}%` : "Not Downloaded"} 
//                 showDeleteButton={false} onDownload={() => startCustomDownload(item.rfilename)}
//                 onDelete={() => {}} onSetDefault={() => {}}
//               />
//             );
//           }}
//         />
//       )}

//       {viewState === 'feed' && (
//         <View style={styles.floatingSearchContainer}>
//           <Text style={styles.searchIcon}>🔍</Text>
//           <TextInput
//             style={styles.floatingInput} placeholder="Search Hugging Face models" placeholderTextColor="#a393a9"
//             value={query} onChangeText={setQuery} onSubmitEditing={() => fetchTrending(query, false)} 
//             returnKeyType="search"
//           />
//         </View>
//       )}

//     </LinearGradient>
//   );
// }

// const styles = StyleSheet.create({
//   container: { flex: 1 },
//   dragHandleContainer: { width: '100%', alignItems: 'center', paddingTop: 16, paddingBottom: 8 },
//   dragHandle: { width: 32, height: 4, backgroundColor: '#ffffff', opacity: 0.5, borderRadius: 2 },
//   header: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
//   backBtn: { marginRight: 16, padding: 4 },
//   backArrow: { color: 'white', fontSize: 24, fontWeight: 'bold' },
//   headerTitle: { color: 'white', fontSize: 20, fontWeight: 'bold' },
//   center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
//   feedItem: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)' },
//   authorText: { color: '#a0a0a0', fontSize: 13, marginBottom: 2 },
//   nameText: { color: '#ffffff', fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
//   metaRow: { flexDirection: 'row', gap: 16 },
//   metaText: { color: '#a0a0a0', fontSize: 12 },
//   floatingSearchContainer: { position: 'absolute', bottom: 24, alignSelf: 'center', width: '90%', backgroundColor: '#644e70', borderRadius: 30, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, elevation: 8 },
//   searchIcon: { fontSize: 18, color: '#d0c4d6', marginRight: 8 },
//   floatingInput: { flex: 1, color: 'white', fontSize: 16, paddingVertical: 14 }
// });

//Last working code

// import React, { useState, useEffect } from 'react';
// import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, ActivityIndicator, Keyboard, ToastAndroid } from 'react-native';
// import LinearGradient from 'react-native-linear-gradient';
// import ModelCard from '../components/ModelCard';
// import { downloadModel } from '../services/ModelService';

// const formatNumber = (num: number) => {
//   if (num >= 1000000) return (num / 1000000).toFixed(1) + 'm';
//   if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
//   return num.toString();
// };

// const timeAgo = (dateString: string) => {
//   const diff = Date.now() - new Date(dateString).getTime();
//   const days = Math.floor(diff / (1000 * 60 * 60 * 24));
//   if (days > 365) return `${Math.floor(days / 365)} year ago`;
//   if (days > 30) return `${Math.floor(days / 30)} months ago`;
//   if (days > 7) return `${Math.floor(days / 7)} week ago`;
//   return `${days} days ago`;
// };

// export default function SearchResultScreen() {
//   const [feed, setFeed] = useState<any[]>([]);
//   const [repoFiles, setRepoFiles] = useState<any[]>([]);
//   const [query, setQuery] = useState('');
  
//   const [isLoading, setIsLoading] = useState(true);
//   const [isLoadingMore, setIsLoadingMore] = useState(false);
//   const [nextPageUrl, setNextPageUrl] = useState<string | null>(null);
  
//   const [viewState, setViewState] = useState<'feed' | 'files'>('feed'); 
//   const [currentRepo, setCurrentRepo] = useState('');
  
//   // 🔥 NEW STATE: Saves the full model details to show on the next screen
//   const [selectedModel, setSelectedModel] = useState<any>(null);

//   const [downloading, setDownloading] = useState<Record<string, boolean>>({});
//   const [progresses, setProgresses] = useState<Record<string, number>>({});

//   useEffect(() => { 
//     fetchTrending('', false); 
//   }, []);

//   useEffect(() => {
//     const timeout = setTimeout(() => {
//       if (query.trim() === '') {
//         fetchTrending('', false);
//       }
//     }, 400);
//     return () => clearTimeout(timeout);
//   }, [query]);

//   const fetchTrending = async (searchQuery = '', isLoadMore = false) => {
//     if (!isLoadMore) {
//       setIsLoading(true);
//       setNextPageUrl(null);
//     } else {
//       setIsLoadingMore(true);
//     }

//     setViewState('feed');

//     try {
//       let url = '';
//       if (isLoadMore && nextPageUrl) {
//         url = nextPageUrl;
//       } else {
//         if (searchQuery.trim() !== '') {
//           url = `https://huggingface.co/api/models?search=${encodeURIComponent(searchQuery)}&limit=50`;
//         } else {
//           url = `https://huggingface.co/api/models?sort=downloads&direction=-1&limit=50`;
//         }
//       }

//       const response = await fetch(url);
      
//       const linkHeader = response.headers.get('link');
//       let newNextUrl = null;
//       if (linkHeader) {
//         const match = linkHeader.match(/<([^>]+)>;\s*rel="next"/);
//         if (match) {
//           newNextUrl = match[1];
//         }
//       }
//       setNextPageUrl(newNextUrl);

//       const data = await response.json();

//       if (!isLoadMore) {
//         setFeed(data);
//       } else {
//         setFeed(prev => {
//           const existing = new Set(prev.map(m => m.id));
//           const filtered = data.filter((m: any) => !existing.has(m.id));
//           return [...prev, ...filtered];
//         });
//       }
//     } catch (e) {
//       console.error(e);
//     } finally {
//       setIsLoading(false);
//       setIsLoadingMore(false);
//     }
//   };

//   const handleLoadMore = () => {
//     if (!isLoadingMore && nextPageUrl && viewState === 'feed') {
//       fetchTrending(query, true);
//     }
//   };

//   // 🔥 UPDATED: Now it accepts the full item object so we can show its details!
//   const fetchRepoFiles = async (repoItem: any) => {
//     Keyboard.dismiss();
//     setIsLoading(true);
//     setCurrentRepo(repoItem.id);
//     setSelectedModel(repoItem); // Save the details!
    
//     try {
//       const response = await fetch(`https://huggingface.co/api/models/${repoItem.id}`);
//       const data = await response.json();
      
//       if (data.siblings && data.siblings.length > 0) {
//         setRepoFiles(data.siblings);
//         setViewState('files');
//       } else {
//         ToastAndroid.show("No files found in this repo", ToastAndroid.SHORT);
//       }
//     } catch (err: any) { 
//       ToastAndroid.show("Failed to fetch files", ToastAndroid.SHORT); 
//     } finally { 
//       setIsLoading(false); 
//     }
//   };

//   const startCustomDownload = async (filename: string) => {
//     setDownloading(prev => ({ ...prev, [filename]: true }));
//     const downloadUrl = `https://huggingface.co/${currentRepo}/resolve/main/${filename}?download=true`;
//     try {
//       await downloadModel(
//         { name: filename, source: downloadUrl, destination: filename }, 
//         (p) => setProgresses(prev => ({ ...prev, [filename]: Math.round(p * 100) }))
//       );
//       ToastAndroid.show(`${filename} downloaded! It is now in 'My Models'`, ToastAndroid.LONG);
//     } catch (err) { ToastAndroid.show(`Download failed`, ToastAndroid.SHORT); } finally { setDownloading(prev => ({ ...prev, [filename]: false })); }
//   };

//   return (
//     <LinearGradient colors={['#050a14', '#051633']} style={styles.container}>
      
//       {viewState === 'feed' ? (
//         <View style={styles.dragHandleContainer}>
//           <View style={styles.dragHandle} />
//         </View>
//       ) : (
//         <View style={styles.header}>
//           <TouchableOpacity onPress={() => setViewState('feed')} style={styles.backBtn}>
//             <Text style={styles.backArrow}>←</Text>
//           </TouchableOpacity>
//           <Text style={styles.headerTitle}>{currentRepo.split('/')[1]}</Text>
//         </View>
//       )}

//       {isLoading && !isLoadingMore ? (
//         <View style={styles.center}><ActivityIndicator size="large" color="#2563EB" /></View>
//       ) : viewState === 'feed' ? (
//         <FlatList
//           data={feed} 
//           keyExtractor={(item) => item.id}
//           contentContainerStyle={{ paddingBottom: 100, paddingTop: 10 }} 
//           onEndReached={handleLoadMore}
//           onEndReachedThreshold={0.5}
//           ListFooterComponent={isLoadingMore ? <ActivityIndicator size="small" color="#a393a9" style={{ margin: 20 }} /> : null}
//           renderItem={({ item }) => {
//             const author = item.author || item.id.split('/')[0];
//             const name = item.id.split('/')[1] || item.id;
//             return (
//               // 🔥 Passes the full item object to the function
//               <TouchableOpacity style={styles.feedItem} onPress={() => fetchRepoFiles(item)}>
//                 <Text style={styles.authorText}>{author}</Text>
//                 <Text style={styles.nameText}>{name}</Text>
//                 <View style={styles.metaRow}>
//                   <Text style={styles.metaText}>🕒 {timeAgo(item.lastModified)}</Text>
//                   <Text style={styles.metaText}>⬇ {formatNumber(item.downloads)}</Text>
//                   <Text style={styles.metaText}>♡ {item.likes}</Text>
//                 </View>
//               </TouchableOpacity>
//             );
//           }}
//         />
//       ) : (
//         <FlatList
//           data={repoFiles} 
//           keyExtractor={(item) => item.rfilename}
//           contentContainerStyle={{ padding: 16 }}
          
//           // 🔥 THE NEW BEAUTIFUL DETAILS HEADER CARD!
//           ListHeaderComponent={
//             selectedModel ? (
//               <View style={styles.detailCard}>
//                 <Text style={styles.detailAuthor}>{selectedModel.author || selectedModel.id.split('/')[0]}</Text>
//                 <Text style={styles.detailName}>{selectedModel.id.split('/')[1] || selectedModel.id}</Text>
                
//                 <View style={styles.detailMetaRow}>
//                   <View style={styles.metaBadge}>
//                     <Text style={styles.metaBadgeText}>🕒 Updated {timeAgo(selectedModel.lastModified)}</Text>
//                   </View>
//                   <View style={styles.metaBadge}>
//                     <Text style={styles.metaBadgeText}>⬇ {formatNumber(selectedModel.downloads)} Downloads</Text>
//                   </View>
//                   <View style={styles.metaBadge}>
//                     <Text style={styles.metaBadgeText}>♡ {selectedModel.likes} Likes</Text>
//                   </View>
//                 </View>
                
//                 <View style={styles.divider} />
//                 <Text style={styles.filesSubtitle}>Available Files to Download</Text>
//               </View>
//             ) : null
//           }

//           ListEmptyComponent={<Text style={{color: '#a0a0a0', textAlign: 'center', marginTop: 40}}>No files available for download.</Text>}
//           renderItem={({ item }) => {
//             const isDownloading = downloading[item.rfilename];
//             const progress = progresses[item.rfilename] || 0;
//             return (
//               <ModelCard
//                 modelName={item.rfilename} isActive={false} isDefault={false} isDownloaded={false} 
//                 fileSizeStr={isDownloading ? `Downloading... ${progress}%` : "Not Downloaded"} 
//                 showDeleteButton={false} onDownload={() => startCustomDownload(item.rfilename)}
//                 onDelete={() => {}} onSetDefault={() => {}}
//               />
//             );
//           }}
//         />
//       )}

//       {viewState === 'feed' && (
//         <View style={styles.floatingSearchContainer}>
//           <Text style={styles.searchIcon}>🔍</Text>
//           <TextInput
//             style={styles.floatingInput} placeholder="Search Hugging Face models" placeholderTextColor="#a393a9"
//             value={query} onChangeText={setQuery} onSubmitEditing={() => fetchTrending(query, false)} 
//             returnKeyType="search"
//           />
//         </View>
//       )}

//     </LinearGradient>
//   );
// }

// const styles = StyleSheet.create({
//   container: { flex: 1 },
//   dragHandleContainer: { width: '100%', alignItems: 'center', paddingTop: 16, paddingBottom: 8 },
//   dragHandle: { width: 32, height: 4, backgroundColor: '#ffffff', opacity: 0.5, borderRadius: 2 },
//   header: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
//   backBtn: { marginRight: 16, padding: 4 },
//   backArrow: { color: 'white', fontSize: 24, fontWeight: 'bold' },
//   headerTitle: { color: 'white', fontSize: 20, fontWeight: 'bold' },
//   center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
//   feedItem: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)' },
//   authorText: { color: '#a0a0a0', fontSize: 13, marginBottom: 2 },
//   nameText: { color: '#ffffff', fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
//   metaRow: { flexDirection: 'row', gap: 16 },
//   metaText: { color: '#a0a0a0', fontSize: 12 },
//   floatingSearchContainer: { position: 'absolute', bottom: 24, alignSelf: 'center', width: '90%', backgroundColor: '#644e70', borderRadius: 30, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, elevation: 8 },
//   searchIcon: { fontSize: 18, color: '#d0c4d6', marginRight: 8 },
//   floatingInput: { flex: 1, color: 'white', fontSize: 16, paddingVertical: 14 },

//   // 🔥 NEW STYLES FOR THE DETAILS CARD
//   detailCard: { backgroundColor: '#0f172a', padding: 16, borderRadius: 12, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
//   detailAuthor: { color: '#a0a0a0', fontSize: 14, marginBottom: 4 },
//   detailName: { color: '#ffffff', fontSize: 22, fontWeight: 'bold', marginBottom: 16 },
//   detailMetaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
//   metaBadge: { backgroundColor: '#1e293b', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
//   metaBadgeText: { color: '#cbd5e1', fontSize: 12 },
//   divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.1)', width: '100%', marginBottom: 16 },
//   filesSubtitle: { color: '#ffffff', fontSize: 18, fontWeight: '600', marginBottom: 8 },
// });


import React, { useState, useEffect } from 'react';
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
  Image // 🔥 IMPORTED IMAGE COMPONENT
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import RNFS from 'react-native-fs';
import { downloadModel } from '../services/ModelService';
import NerveSparksDrawer from '../components/NerveSparksDrawer';

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

export default function SearchResultScreen() {
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

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [touchStartX, setTouchStartX] = useState(0);

  useEffect(() => { fetchTrending('', false); }, []);

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

  const handleTouchStart = (e: any) => setTouchStartX(e.nativeEvent.pageX);
  const handleTouchEnd = (e: any) => {
    if (e.nativeEvent.pageX - touchStartX > 50) setIsDrawerOpen(true);
  };

  return (
    <LinearGradient colors={['#111111', '#000000']} style={styles.container} onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
          
          <View style={styles.dragHandleContainer}>
            <View style={styles.dragHandleLine} />
            <View style={styles.dragHandleLine} />
          </View>

          {isLoading && !isLoadingMore ? (
            <View style={styles.center}><ActivityIndicator size="large" color="#ffffff" /></View>
          ) : viewState === 'feed' ? (
            
            <View style={{ flex: 1 }}>
                <FlatList
                  data={feed} 
                  keyExtractor={(item) => item.id}
                  contentContainerStyle={styles.feedListContainer} 
                  onEndReached={handleLoadMore}
                  onEndReachedThreshold={0.5}
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
                              <Text style={styles.feedMetaText}>🕒 {dateDisplay.replace('Updated ', '')}</Text>
                              
                              {/* 🔥 FIX 1: REPLACED EMOJI WITH PNG IN FEED META ROW */}
                              <View style={{flexDirection: 'row', alignItems: 'center', gap: 4}}>
                                <Image source={require('../assets/icons/download.png')} style={{width: 12, height: 12, tintColor: '#a0a0a0', resizeMode: 'contain'}} />
                                <Text style={styles.feedMetaText}>{formatNumber(item.downloads)}</Text>
                              </View>
                              
                              <Text style={styles.feedMetaText}>♡ {item.likes}</Text>
                          </View>
                      </TouchableOpacity>
                      );
                  }}
                />
                
                <View style={styles.floatingSearchContainer}>
                    <Text style={styles.searchIcon}>🔍</Text>
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

            <FlatList
              data={repoFiles} 
              keyExtractor={(item) => item.rfilename}
              contentContainerStyle={styles.detailsListContainer}
              
              ListHeaderComponent={
                selectedModel ? (
                  <View style={styles.detailsHeader}>
                    <TouchableOpacity onPress={() => setViewState('feed')} style={{marginBottom: 10, alignSelf: 'flex-start'}}>
                        <Text style={{color: '#a0a0a0', fontSize: 16}}>← Back</Text>
                    </TouchableOpacity>

                    <Text style={styles.detailAuthor}>{selectedModel.author || selectedModel.id.split('/')[0]}</Text>
                    <Text style={styles.detailName}>{selectedModel.id.split('/')[1] || selectedModel.id}</Text>
                    
                    <View style={styles.detailMetaRow}>
                      <View style={styles.metaBadge}>
                        <Text style={styles.metaBadgeText}>🕒 {timeAgo(selectedModel.lastModified || selectedModel.createdAt)}</Text>
                      </View>
                      
                      {/* 🔥 FIX 2: REPLACED EMOJI WITH PNG IN DETAIL HEADER */}
                      <View style={[styles.metaBadge, {flexDirection: 'row', alignItems: 'center', gap: 6}]}>
                        <Image source={require('../assets/icons/download.png')} style={{width: 14, height: 14, tintColor: '#d0c4d6', resizeMode: 'contain'}} />
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
                const sizeDisplay = item.size ? formatBytes(item.size) : 'Unknown Size';

                return (
                  <View style={[styles.fileCard, isDownloaded && styles.fileCardDownloaded]}>
                      
                      <View style={{ flex: 1, paddingRight: 10 }}>
                          <Text style={[styles.fileName, isDownloaded && {color: '#ffffff'}]}>{item.rfilename}</Text>
                          <Text style={[styles.fileSize, isDownloaded && {color: 'rgba(255,255,255,0.8)'}]}>
                              {isDownloading ? `Downloading... ${progress}%` : sizeDisplay}
                          </Text>
                      </View>

                      {/* 🔥 FIX 3: REPLACED ALL CARD ICONS WITH PNGs */}
                      <View style={styles.iconRow}>
                          <TouchableOpacity style={styles.iconBtn}>
                              <Image 
                                source={require('../assets/icons/save.png')} 
                                style={[styles.iconImage, isDownloaded && { tintColor: '#ffffff' }]} 
                              />
                          </TouchableOpacity>

                          {isDownloaded ? (
                              <TouchableOpacity style={styles.iconBtn} onPress={() => handleDelete(item.rfilename)}>
                                  <Image 
                                    source={require('../assets/icons/delete.png')} 
                                    style={[styles.iconImage, { tintColor: '#ffffff' }]} 
                                  />
                              </TouchableOpacity>
                          ) : (
                              <TouchableOpacity style={styles.iconBtn} onPress={() => startCustomDownload(item.rfilename)} disabled={isDownloading}>
                                  <Image 
                                    source={require('../assets/icons/download.png')} 
                                    style={styles.iconImage} 
                                  />
                              </TouchableOpacity>
                          )}
                      </View>

                      {isDownloading && (
                          <View style={[styles.progressOverlay, {width: `${progress}%`}]} />
                      )}
                  </View>
                );
              }}
            />
          )}

          <NerveSparksDrawer visible={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} activeModelName="Search Models" />
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  safeArea: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  dragHandleContainer: { width: '100%', alignItems: 'center', paddingTop: 10, paddingBottom: 15, gap: 4 },
  dragHandleLine: { width: 30, height: 3, backgroundColor: '#ffffff', opacity: 0.6, borderRadius: 2 },

  feedListContainer: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 120 },
  feedItem: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)' },
  feedAuthor: { color: '#a0a0a0', fontSize: 13, marginBottom: 2 },
  feedName: { color: '#ffffff', fontSize: 18, fontWeight: 'bold', marginBottom: 6 },
  feedMetaRow: { flexDirection: 'row', gap: 14 },
  feedMetaText: { color: '#a0a0a0', fontSize: 12, fontWeight: '500' },

  floatingSearchContainer: { 
      position: 'absolute', 
      bottom: Platform.OS === 'ios' ? 30 : 20, 
      alignSelf: 'center', 
      width: '90%', 
      backgroundColor: '#352c3c', 
      borderRadius: 16, 
      flexDirection: 'row', 
      alignItems: 'center', 
      paddingHorizontal: 16,
      height: 55,
      elevation: 5,
  },
  searchIcon: { fontSize: 18, color: '#a0a0a0', marginRight: 10 },
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
  iconRow: { flexDirection: 'row', gap: 16, zIndex: 2 },
  iconBtn: { padding: 4 },
  iconText: { color: 'rgba(255,255,255,0.8)', fontSize: 16 },
  
  // 🔥 STYLES FOR PNG ICONS
  iconImage: { 
      width: 22, 
      height: 22, 
      tintColor: 'rgba(255,255,255,0.8)',
      resizeMode: 'contain' 
  },
  
  progressOverlay: {
      position: 'absolute', left: 0, top: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.2)',
      zIndex: 1
  }
});