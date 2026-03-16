// import React, { useState } from 'react';
// import { View, Text, TouchableOpacity, Modal, StyleSheet, Alert } from 'react-native';

// interface ModelCardProps {
//   modelName: string;
//   isActive: boolean;    
//   isDefault: boolean;
//   isDownloaded: boolean;
//   fileSizeStr: string;
//   showDeleteButton: boolean;
//   onDownload: () => void;
//   onDelete: () => void;
//   onSetDefault: () => void;
// }

// export default function ModelCard({
//   modelName,
//   isActive,
//   isDefault,
//   isDownloaded,
//   fileSizeStr,
//   showDeleteButton,
//   onDownload,
//   onDelete,
//   onSetDefault,
// }: ModelCardProps) {
//   const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
//   const [showDeletedMessage, setShowDeletedMessage] = useState(false);

//   const handleDeleteConfirm = () => {
//     setShowDeleteConfirmation(false);
//     onDelete();
//     setShowDeletedMessage(true);
//     setTimeout(() => setShowDeletedMessage(false), 2000);
//   };

//   return (
//     <View style={styles.card}>
      
//       {/* Header Row: Active / Default Badges */}
//       <View style={styles.badgeRow}>
//         {isActive && <Text style={styles.activeText}>Active Model</Text>}
//         {isDefault && <Text style={styles.defaultText}>Default</Text>}
//       </View>

//       <Text style={styles.modelName}>{modelName}</Text>

//       {/* Action Row */}
//       <View style={styles.actionRow}>
//         {!isDownloaded ? (
//           <TouchableOpacity style={styles.downloadBtn} onPress={onDownload}>
//             <Text style={styles.btnText}>Download</Text>
//           </TouchableOpacity>
//         ) : (
//           <TouchableOpacity style={styles.loadBtn} onPress={() => console.log('Load Model')}>
//             <Text style={styles.btnText}>Load</Text>
//           </TouchableOpacity>
//         )}

//         {showDeleteButton && isDownloaded && (
//           <TouchableOpacity 
//             style={styles.deleteBtn} 
//             onPress={() => setShowDeleteConfirmation(true)}
//           >
//             <Text style={styles.btnText}>Delete</Text>
//           </TouchableOpacity>
//         )}
//       </View>

//       {showDeletedMessage && (
//         <Text style={styles.deletedMsg}>Model Deleted</Text>
//       )}

//       {/* Set Default Radio Button (Only shows if active, mimicking your Kotlin logic) */}
//       {isActive && (
//         <TouchableOpacity style={styles.radioRow} onPress={onSetDefault}>
//           <View style={[styles.radioCircle, isDefault && styles.radioSelected]}>
//             {isDefault && <View style={styles.radioInner} />}
//           </View>
//           <Text style={styles.radioText}>Set as Default Model</Text>
//         </TouchableOpacity>
//       )}

//       {/* File Size Footer */}
//       <Text style={styles.fileSizeText}>
//         {isDownloaded ? `Size: ${fileSizeStr}` : 'Not Downloaded'}
//       </Text>

//       {/* Custom Delete Confirmation Modal to match your Color(0xFF233340) */}
//       <Modal visible={showDeleteConfirmation} transparent animationType="fade">
//         <View style={styles.modalOverlay}>
//           <View style={styles.alertBox}>
//             <Text style={styles.alertTitle}>Confirm Deletion</Text>
//             <Text style={styles.alertText}>
//               Are you sure you want to delete this model? The app will restart after deletion.
//             </Text>
//             <View style={styles.alertActions}>
//               <TouchableOpacity 
//                 style={[styles.alertBtn, { backgroundColor: '#000000' }]} 
//                 onPress={() => setShowDeleteConfirmation(false)}
//               >
//                 <Text style={styles.btnText}>Cancel</Text>
//               </TouchableOpacity>
//               <TouchableOpacity 
//                 style={[styles.alertBtn, { backgroundColor: '#b91c1c' }]} 
//                 onPress={handleDeleteConfirm}
//               >
//                 <Text style={styles.btnText}>Delete</Text>
//               </TouchableOpacity>
//             </View>
//           </View>
//         </View>
//       </Modal>

//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   card: { backgroundColor: '#0f172a', padding: 16, borderRadius: 8, marginVertical: 6, elevation: 4, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
//   badgeRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
//   activeText: { color: '#00ff00', fontSize: 12 },
//   defaultText: { color: '#d3d3d3', fontSize: 12 },
//   modelName: { color: '#ffffff', fontSize: 18, fontWeight: '500', marginBottom: 12 },
//   actionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
//   downloadBtn: { backgroundColor: '#2563EB', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 6 },
//   loadBtn: { backgroundColor: '#10b981', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 6 },
//   deleteBtn: { backgroundColor: '#b91c1c', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 6 },
//   btnText: { color: '#ffffff', fontWeight: 'bold', fontSize: 14 },
//   deletedMsg: { color: '#ef4444', fontSize: 15, marginTop: 8 },
//   radioRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
//   radioCircle: { height: 20, width: 20, borderRadius: 10, borderWidth: 2, borderColor: '#808080', alignItems: 'center', justifyContent: 'center', marginRight: 8 },
//   radioSelected: { borderColor: '#00ff00' },
//   radioInner: { height: 10, width: 10, borderRadius: 5, backgroundColor: '#00ff00' },
//   radioText: { color: '#ffffff', fontSize: 12 },
//   fileSizeText: { color: '#808080', fontSize: 12, marginTop: 12 },
//   modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
//   alertBox: { backgroundColor: '#233340', padding: 20, borderRadius: 8, width: '85%' },
//   alertTitle: { color: '#ffffff', fontSize: 20, fontWeight: 'bold', marginBottom: 10 },
//   alertText: { color: '#d3d3d3', fontSize: 16, lineHeight: 22, marginBottom: 20 },
//   alertActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12 },
//   alertBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 6 }
// });
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, Alert, Switch } from 'react-native';

interface ModelCardProps {
  modelName: string;
  isActive: boolean;    
  isDefault: boolean;
  isDownloaded: boolean;
  isDownloading?: boolean;     // 🔥 NEW: Check if downloading
  downloadProgress?: number;   // 🔥 NEW: Show percentage
  fileSizeStr: string;
  showDeleteButton: boolean;
  onDownload: () => void;
  onCancelDownload?: () => void; // 🔥 NEW: Stop action
  onDelete: () => void;
  onSetDefault: () => void;
}

export default function ModelCard({
  modelName,
  isActive,
  isDefault,
  isDownloaded,
  isDownloading,
  downloadProgress,
  fileSizeStr,
  showDeleteButton,
  onDownload,
  onCancelDownload,
  onDelete,
  onSetDefault,
}: ModelCardProps) {
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [showDeletedMessage, setShowDeletedMessage] = useState(false);

  const handleDeleteConfirm = () => {
    setShowDeleteConfirmation(false);
    onDelete();
    setShowDeletedMessage(true);
    setTimeout(() => setShowDeletedMessage(false), 2000);
  };

  return (
    <View style={styles.card}>
      
      <View style={styles.badgeRow}>
        {isActive && <Text style={styles.activeText}>Active Model</Text>}
      </View>

      <Text style={styles.modelName} numberOfLines={1} ellipsizeMode="middle">{modelName}</Text>

      <View style={styles.actionRow}>
        {!isDownloaded ? (
          <TouchableOpacity 
            // 🔥 UPDATED: Turns Red if downloading
            style={[styles.downloadBtn, isDownloading && { backgroundColor: '#ef4444' }]} 
            onPress={isDownloading && onCancelDownload ? onCancelDownload : onDownload}
          >
            <Text style={styles.btnText}>
              {isDownloading ? `Stop (${downloadProgress || 0}%)` : 'Download'}
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.loadBtn} onPress={() => console.log('Load Model')}>
            <Text style={styles.btnText}>Load</Text>
          </TouchableOpacity>
        )}

        {showDeleteButton && isDownloaded && (
          <TouchableOpacity 
            style={styles.deleteBtn} 
            onPress={() => setShowDeleteConfirmation(true)}
          >
            <Text style={styles.btnText}>Delete</Text>
          </TouchableOpacity>
        )}
      </View>

      {showDeletedMessage && (
        <Text style={styles.deletedMsg}>Model Deleted</Text>
      )}

      {isDownloaded && (
        <View style={styles.toggleRow}>
          <Text style={[styles.toggleText, isDefault && styles.toggleTextActive]}>
            {isDefault ? '⭐ Default Model' : 'Set as Default'}
          </Text>
          <Switch
            trackColor={{ false: "#334155", true: "#10b981" }}
            thumbColor={isDefault ? "#ffffff" : "#94a3b8"}
            ios_backgroundColor="#3e3e3e"
            onValueChange={onSetDefault}
            value={isDefault}
            style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
          />
        </View>
      )}

      <Text style={styles.fileSizeText}>
        {isDownloaded ? `Size: ${fileSizeStr}` : 'Not Downloaded'}
      </Text>

      <Modal visible={showDeleteConfirmation} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.alertBox}>
            <Text style={styles.alertTitle}>Confirm Deletion</Text>
            <Text style={styles.alertText}>
              Are you sure you want to delete this model? The app will restart after deletion.
            </Text>
            <View style={styles.alertActions}>
              <TouchableOpacity 
                style={[styles.alertBtn, { backgroundColor: '#000000' }]} 
                onPress={() => setShowDeleteConfirmation(false)}
              >
                <Text style={styles.btnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.alertBtn, { backgroundColor: '#b91c1c' }]} 
                onPress={handleDeleteConfirm}
              >
                <Text style={styles.btnText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#0f172a', padding: 16, borderRadius: 8, marginVertical: 6, elevation: 4, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  badgeRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  activeText: { color: '#00ff00', fontSize: 12 },
  modelName: { color: '#ffffff', fontSize: 18, fontWeight: '500', marginBottom: 12 },
  actionRow: { flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'center', gap: 12 },
  downloadBtn: { backgroundColor: '#2563EB', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 6 },
  loadBtn: { backgroundColor: '#475569', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 6 },
  deleteBtn: { backgroundColor: '#b91c1c', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 6 },
  btnText: { color: '#ffffff', fontWeight: 'bold', fontSize: 14 },
  deletedMsg: { color: '#ef4444', fontSize: 15, marginTop: 8 },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, backgroundColor: 'rgba(255,255,255,0.03)', padding: 8, borderRadius: 8 },
  toggleText: { color: '#94a3b8', fontSize: 13 },
  toggleTextActive: { color: '#eab308', fontWeight: 'bold' },
  fileSizeText: { color: '#808080', fontSize: 12, marginTop: 12 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  alertBox: { backgroundColor: '#233340', padding: 20, borderRadius: 8, width: '85%' },
  alertTitle: { color: '#ffffff', fontSize: 20, fontWeight: 'bold', marginBottom: 10 },
  alertText: { color: '#d3d3d3', fontSize: 16, lineHeight: 22, marginBottom: 20 },
  alertActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12 },
  alertBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 6 }
});