import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { loadStore } from './src/services/conversationStore';
import { IncognitoProvider } from './src/services/incognitoContext';

import ChatScreen from './src/screens/ChatScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import ModelsScreen from './src/screens/ModelsScreen';
import ParametersScreen from './src/screens/ParametersScreen';
import BenchmarkScreen from './src/screens/BenchmarkScreen';
import AboutScreen from './src/screens/AboutScreen';
import SearchResultScreen from './src/screens/SearchResultScreen';
import ReportScreen from './src/screens/ReportScreen';
import ConversationListScreen from './src/screens/ConversationListScreen';
import FoldersScreen from './src/screens/FoldersScreen';
import ConversationChatScreen from './src/screens/ConversationChatScreen';

const Stack = createNativeStackNavigator();

const headerStyle = {
  headerStyle: { backgroundColor: '#050a14' },
  headerTintColor: '#fff',
  headerTitleStyle: { fontWeight: 'bold' as const },
};

const MyDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: '#000000',
  },
};

export default function App() {
  const [ready, setReady] = useState(false);
  const [bootError, setBootError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const bootstrap = async () => {
      try {
        await loadStore();
      } catch (error) {
        if (isMounted) {
          setBootError(
            error instanceof Error ? error.message : 'Failed to load saved conversations.'
          );
        }
      } finally {
        if (isMounted) {
          setReady(true);
        }
      }
    };

    void bootstrap();

    return () => {
      isMounted = false;
    };
  }, []);

  if (!ready) {
    return (
      <View style={styles.bootScreen}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.bootTitle}>Starting Iris</Text>
        <Text style={styles.bootSubtitle}>Loading saved chats and app state...</Text>
      </View>
    );
  }

  return (
    <SafeAreaProvider style={{ flex: 1, backgroundColor: '#000000' }}>
      <IncognitoProvider>
        <NavigationContainer theme={MyDarkTheme}>
          <View style={styles.appShell}>
            {!!bootError && (
              <View style={styles.bootErrorBanner}>
                <Text style={styles.bootErrorText}>{bootError}</Text>
              </View>
            )}
            <Stack.Navigator screenOptions={headerStyle}>
              <Stack.Screen
                name="Chat"
                component={ChatScreen}
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="ConversationList"
                component={ConversationListScreen}
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="ConversationChat"
                component={ConversationChatScreen}
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="FoldersScreen"
                component={FoldersScreen}
                options={{ title: 'Folders' }}
              />
              <Stack.Screen name="Settings" component={SettingsScreen} />
              <Stack.Screen name="Models" component={ModelsScreen} />
              <Stack.Screen name="Parameters" component={ParametersScreen} />
              <Stack.Screen name="Benchmark" component={BenchmarkScreen} />
              <Stack.Screen name="About" component={AboutScreen} />
              <Stack.Screen
                name="ReportScreen"
                component={ReportScreen}
                options={{ title: 'Report Issue' }}
              />
              <Stack.Screen
                name="SearchResult"
                component={SearchResultScreen}
                options={{ title: 'Search Models' }}
              />
            </Stack.Navigator>
          </View>
        </NavigationContainer>
      </IncognitoProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  appShell: {
    flex: 1,
    backgroundColor: '#050a14',
  },
  bootScreen: {
    flex: 1,
    backgroundColor: '#050a14',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  bootTitle: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '700',
    marginTop: 18,
  },
  bootSubtitle: {
    color: '#94a3b8',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
  bootErrorBanner: {
    backgroundColor: 'rgba(127,29,29,0.95)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(248,113,113,0.4)',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  bootErrorText: {
    color: '#fecaca',
    fontSize: 12,
    textAlign: 'center',
  },
});