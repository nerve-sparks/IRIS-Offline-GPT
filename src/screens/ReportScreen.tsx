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
  Alert,
  ActivityIndicator,
  ScrollView
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';

// 🔥 FIREBASE IMPORTS
import { database } from '../services/FirebaseConfig';
import { ref, push } from 'firebase/database';

export default function ReportScreen() {
  const navigation = useNavigation();
  const [reportText, setReportText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!reportText.trim()) {
      Alert.alert('Hold on!', 'Please describe the issue before sending.');
      return;
    }

    Keyboard.dismiss();
    setIsSubmitting(true);

    try {
      await push(ref(database, 'reports'), {
        issue: reportText,
        platform: Platform.OS,
        timestamp: new Date().toISOString(),
      });

      Alert.alert('Success', 'Report submitted successfully!');
      setReportText('');
      navigation.goBack();
    } catch (error) {
      console.log("Firebase Error:", error);
      Alert.alert('Error', 'Failed to send report. Please check your connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <LinearGradient
      colors={['#050a14', '#051633']}
      style={styles.container}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollGrow}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          
          <Text style={styles.subText}>
            Found a bug or facing a UI issue? Let us know so we can fix it for you.
          </Text>

          {/* --- TEXT INPUT AREA --- */}
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.textInput}
              placeholder="Describe your issue in detail here..."
              placeholderTextColor="rgba(255,255,255,0.4)"
              value={reportText}
              onChangeText={setReportText}
              multiline={true}
              textAlignVertical="top" 
              editable={!isSubmitting}
            />
          </View>

          {/* --- SUBMIT BUTTON --- */}
          <TouchableOpacity
            style={[
              styles.submitButton,
              (!reportText.trim() || isSubmitting) && styles.submitButtonDisabled
            ]}
            onPress={handleSubmit}
            disabled={isSubmitting || !reportText.trim()}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <Text style={styles.submitButtonText}>Send Report</Text>
            )}
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1 
  },
  scrollGrow: {
    flexGrow: 1,
    padding: 16,
    // 🔥 FIX: Increased bottom padding significantly to keep button above keyboard
    paddingBottom: Platform.OS === 'ios' ? 80 : 60, 
  },
  subText: {
    color: 'rgba(255,255,255,0.7)', 
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 20,
    marginTop: 10,
  },
  inputContainer: {
    flex: 1, 
    minHeight: 220, // Solid height for typing
    backgroundColor: 'rgba(255,255,255,0.05)', 
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    marginBottom: 24, // Extra space below the input box
  },
  textInput: {
    flex: 1,
    color: 'white',
    fontSize: 16,
    padding: 16,
    lineHeight: 24,
  },
  submitButton: {
    backgroundColor: '#2563EB', 
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: 'rgba(37, 99, 235, 0.4)', 
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});