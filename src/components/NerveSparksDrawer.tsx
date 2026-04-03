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
import Svg, { Path } from 'react-native-svg'; // 🔥 ADDED SVG IMPORTS

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
                  {/* 🔥 Left this as Image since Logo SVG was missing in prompt */}
                  <Image 
                    source={require('../assets/icons/logo.png')} 
                    style={styles.logoImage} 
                  />
                  <View>
                    <Text style={styles.brandTitle}>Iris</Text>
                    <Text style={styles.brandSubtitle}>Nervesparks</Text>
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
                {/* 🔥 GITHUB SVG REPLACED HERE! 🔥 */}
                <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" style={{ marginLeft: 8 }}>
                  <Path
                    fill="#fff"
                    d="M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2Z"
                  />
                </Svg>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionBtn} onPress={openWebsite}>
                <Text style={styles.actionBtnText}>Nervesparks</Text>
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
  footerText: { color: '#64748b', textAlign: 'center', fontSize: 12, marginTop: 8 }
});