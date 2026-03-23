import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Modal, 
  TouchableWithoutFeedback, 
  Linking, 
  Image, 
  Platform, 
  Dimensions 
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

interface DrawerProps {
  visible: boolean;
  onClose: () => void;
  activeModelName?: string;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function NerveSparksDrawer({ visible, onClose, activeModelName = "No active model" }: DrawerProps) {
  
  const openGitHub = () => Linking.openURL('https://github.com/nerve-sparks/iris_android');
  const openWebsite = () => Linking.openURL('https://nervesparks.com');

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlayContainer}>
        
        {/* Drawer Panel */}
        <LinearGradient colors={['#1e293b', '#0f172a']} style={styles.drawerContent}>
          {/* 🔥 Safe Manual Padding (Desi Fix for Notch/Dynamic Island) */}
          <View style={styles.innerLayout}>
            
            {/* TOP SECTION */}
            <View>
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
                {/* 🔥 Text Wrap Fix: Long names won't cut off */}
                <Text style={styles.modelValue} numberOfLines={3}>
                  {activeModelName}
                </Text>
              </View>
            </View>

            {/* BOTTOM SECTION */}
            <View style={styles.footer}>
              <TouchableOpacity style={styles.actionBtn} onPress={openGitHub}>
                <Text style={styles.actionBtnText}>Star us</Text>
                {/* 🔥 GITHUB ICON IS RIGHT HERE! 🔥 */}
                <Image 
                  source={require('../assets/icons/github.png')} // Path correct hai
                  style={styles.githubIcon} 
                />
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionBtn} onPress={openWebsite}>
                <Text style={styles.actionBtnText}>NerveSparks.com</Text>
              </TouchableOpacity>

              <Text style={styles.footerText}>powered by llama.rn</Text>
            </View>

          </View>
        </LinearGradient>

        {/* CLICK OUTSIDE TO CLOSE */}
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
  drawerContent: { 
    width: SCREEN_WIDTH * 0.82, 
    height: '100%', 
    borderTopRightRadius: 24, 
    borderBottomRightRadius: 24, 
    elevation: 24, 
    shadowColor: '#000', 
    shadowOpacity: 0.5, 
    shadowRadius: 10 
  },
  innerLayout: { 
    flex: 1, 
    paddingHorizontal: 24, 
    // 🔥 PADDING FIX: Notch Max size 60px aur Bottom 40px manually chhod diya hai.
    paddingTop: Platform.OS === 'ios' ? 60 : 24, 
    paddingBottom: Platform.OS === 'ios' ? 40 : 24, 
    justifyContent: 'space-between' 
  },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'flex-start', 
    marginBottom: 40,
  },
  brandContainer: { flexDirection: 'row', alignItems: 'center' },
  logoImage: { width: 36, height: 36, borderRadius: 18, marginRight: 12 },
  brandTitle: { color: 'white', fontSize: 24, fontWeight: 'bold' },
  brandSubtitle: { color: '#94a3b8', fontSize: 14 },
  closeBtn: { padding: 8 },
  closeBtnText: { color: 'white', fontSize: 20 },
  modelSection: { marginTop: 10 },
  modelLabel: { color: '#94a3b8', fontSize: 14, marginBottom: 8 },
  modelValue: { 
    color: 'white', 
    fontSize: 16, 
    fontWeight: '600', 
    lineHeight: 22, 
    flexWrap: 'wrap' 
  },
  footer: {},
  actionBtn: { 
    flexDirection: 'row', 
    justifyContent: 'center', 
    borderWidth: 1, 
    borderColor: 'rgba(255,255,255,0.2)', 
    paddingVertical: 14, 
    borderRadius: 12, 
    alignItems: 'center', 
    marginBottom: 12 
  },
  actionBtnText: { color: 'white', fontSize: 16, fontWeight: '500' },
  githubIcon: { width: 22, height: 22, marginLeft: 8, resizeMode: 'contain'},
  footerText: { color: '#64748b', textAlign: 'center', fontSize: 12, marginTop: 8 }
});