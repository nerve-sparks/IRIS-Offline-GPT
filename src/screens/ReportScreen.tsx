import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  KeyboardAvoidingView, 
  Platform, 
  Keyboard, 
  TouchableWithoutFeedback,
  ToastAndroid,
  Alert,
  ActivityIndicator
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ReportScreen({ navigation }: any) {
  const [issueText, setIssueText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    // Basic validation to prevent empty reports
    if (issueText.trim().length === 0) {
      if (Platform.OS === 'android') ToastAndroid.show("Please write something first!", ToastAndroid.SHORT);
      else Alert.alert("Empty", "Please write something first!");
      return;
    }

    Keyboard.dismiss();
    setIsSubmitting(true);

    try {
      // 🔥 THE MAGIC FIREBASE URL (Direct REST API, No SDK needed)
      const FIREBASE_URL = 'src/assets/iris-ai.json';

      // Wrapping data with extra context for your TL
      const reportData = {
        issue: issueText,
        platform: Platform.OS, 
        timestamp: new Date().toISOString(), 
        appVersion: "1.0.0" 
      };

      const response = await fetch(FIREBASE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reportData)
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      // Success UI
      if (Platform.OS === 'android') ToastAndroid.show("Report submitted successfully!", ToastAndroid.SHORT);
      else Alert.alert("Success", "Report submitted successfully!");
      
      setIssueText(''); 
      navigation.goBack(); 

    } catch (error) {
      console.error("Firebase Error:", error);
      if (Platform.OS === 'android') ToastAndroid.show("Failed to submit report. Try again.", ToastAndroid.SHORT);
      else Alert.alert("Error", "Failed to submit report. Please check your connection.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <LinearGradient colors={['#111111', '#000000']} style={styles.container}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.innerContainer}>

              {/* --- HEADER --- */}
              <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                  <Text style={styles.backText}>← Back</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Report Issue</Text>
                <View style={{ width: 60 }} />
              </View>

              <Text style={styles.subText}>
                Found a bug or facing a UI issue? Describe it below in detail so we can fix it.
              </Text>

              {/* --- BIG TEXT BOX --- */}
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.textInput}
                  placeholder="Describe your issue here... (e.g., The app crashes when I try to download a model)"
                  placeholderTextColor="#666666"
                  multiline={true}
                  textAlignVertical="top" 
                  value={issueText}
                  onChangeText={setIssueText}
                  autoFocus={true} 
                />
              </View>

              {/* --- SUBMIT BUTTON --- */}
              <TouchableOpacity 
                style={[styles.submitBtn, issueText.trim() === '' && styles.submitBtnDisabled]} 
                onPress={handleSubmit}
                disabled={issueText.trim() === '' || isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <Text style={styles.submitBtnText}>Submit Report</Text>
                )}
              </TouchableOpacity>

            </View>
          </TouchableWithoutFeedback>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  safeArea: { flex: 1 },
  innerContainer: { 
    flex: 1, 
    paddingHorizontal: 20, 
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 10 : 20 
  },

  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  backBtn: { paddingVertical: 10, paddingRight: 20 },
  backText: { color: '#a0a0a0', fontSize: 16 },
  headerTitle: { color: '#ffffff', fontSize: 20, fontWeight: 'bold' },

  subText: { color: '#a0a0a0', fontSize: 14, lineHeight: 20, marginBottom: 20 },

  inputContainer: {
    flex: 1, 
    backgroundColor: '#151A23', 
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2A3441',
    marginBottom: 20,
    overflow: 'hidden',
  },
  textInput: { flex: 1, padding: 20, color: '#ffffff', fontSize: 16, lineHeight: 24 },

  submitBtn: {
    backgroundColor: '#2563EB', 
    borderRadius: 12,
    height: 55,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  submitBtnDisabled: { backgroundColor: '#1E293B' },
  submitBtnText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' }
});