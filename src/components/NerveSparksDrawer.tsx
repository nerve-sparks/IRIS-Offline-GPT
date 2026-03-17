import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TouchableWithoutFeedback, Linking, Image } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

interface DrawerProps {
  visible: boolean;
  onClose: () => void;
  activeModelName?: string;
}

export default function NerveSparksDrawer({ visible, onClose, activeModelName = "No active model" }: DrawerProps) {
  
  const openGitHub = () => Linking.openURL('https://github.com/nerve-sparks/iris_android');
  const openWebsite = () => Linking.openURL('https://nervesparks.com');

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlayContainer}>
        
        <LinearGradient colors={['#1e293b', '#0f172a']} style={styles.drawerContent}>
          
          <View style={styles.header}>
            <View style={styles.brandContainer}>
              <Image 
                source={require('../assets/icons/logo.png')} 
                style={styles.logoImage} 
              />
              <View>
                <Text style={styles.brandTitle}>Iris</Text>
                <Text style={styles.brandSubtitle}>NerveSparks</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modelSection}>
            <Text style={styles.modelLabel}>Active Model</Text>
            <Text style={styles.modelValue}>{activeModelName}</Text>
          </View>

          <View style={{ flex: 1 }} />

          {/* 🔥 MODIFIED: Star button now uses an Image icon instead of emoji */}
          <TouchableOpacity style={styles.actionBtn} onPress={openGitHub}>
            <Text style={styles.actionBtnText}>Star us</Text>
            <Image 
              source={require('../assets/icons/github.png')} // Make sure this file exists!
              style={styles.githubIcon} 
            />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtn} onPress={openWebsite}>
            <Text style={styles.actionBtnText}>NerveSparks.com</Text>
          </TouchableOpacity>

          <Text style={styles.footerText}>powered by llama.cpp</Text>
          
        </LinearGradient>

        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.outsideArea} />
        </TouchableWithoutFeedback>

      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlayContainer: { flex: 1, flexDirection: 'row' },
  outsideArea: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  drawerContent: { width: '85%', height: '100%', padding: 24, paddingVertical: 50, borderTopRightRadius: 20, borderBottomRightRadius: 20, elevation: 20, shadowColor: '#000', shadowOpacity: 0.5, shadowRadius: 10 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 40 },
  brandContainer: { flexDirection: 'row', alignItems: 'center' },
  logoImage: { width: 36, height: 36, borderRadius: 18, marginRight: 12 },
  brandTitle: { color: 'white', fontSize: 24, fontWeight: 'bold' },
  brandSubtitle: { color: '#94a3b8', fontSize: 14 },
  closeBtn: { padding: 8 },
  closeBtnText: { color: 'white', fontSize: 20 },
  modelSection: { marginTop: 10 },
  modelLabel: { color: '#94a3b8', fontSize: 14, marginBottom: 4 },
  modelValue: { color: 'white', fontSize: 18, fontWeight: '600' },
  
  // 🔥 MODIFIED: Added flexDirection row and center alignment
  actionBtn: { flexDirection: 'row', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', paddingVertical: 14, borderRadius: 10, alignItems: 'center', marginBottom: 12 },
  actionBtnText: { color: 'white', fontSize: 16, fontWeight: '500' },
  
  // 🔥 NEW: Style for the GitHub Icon
  githubIcon: { width: 22, height: 22, marginLeft: 8, resizeMode: 'contain' },
  
  footerText: { color: '#64748b', textAlign: 'center', fontSize: 12, marginTop: 10 }
});