// App.tsx — Updated with Conversation Management Feature
import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { loadStore } from './src/services/conversationStore';
import { IncognitoProvider } from './src/services/incognitoContext';

// Existing screens
import ChatScreen from './src/screens/ChatScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import ModelsScreen from './src/screens/ModelsScreen';
import ParametersScreen from './src/screens/ParametersScreen';
import BenchmarkScreen from './src/screens/BenchmarkScreen';
import AboutScreen from './src/screens/AboutScreen';
import SearchResultScreen from './src/screens/SearchResultScreen';

// ── NEW: Conversation Management Screens ──────────────────────────────────────
import ConversationListScreen from './src/screens/ConversationListScreen';
import FoldersScreen from './src/screens/FoldersScreen';
import ConversationChatScreen from './src/screens/ConversationChatScreen';

const Stack = createNativeStackNavigator();

const headerStyle = {
  headerStyle: { backgroundColor: '#050a14' },
  headerTintColor: '#fff',
  headerTitleStyle: { fontWeight: 'bold' as const },
};

export default function App() {
  const [ready, setReady] = React.useState(false);

  useEffect(() => {
    loadStore().then(() => setReady(true));
  }, []);

  if (!ready) return null;

  return (
    <IncognitoProvider>
      <NavigationContainer>
        <Stack.Navigator screenOptions={headerStyle}>

        {/* ── Chat is HOME screen (like ChatGPT) ── */}
        <Stack.Screen
          name="Chat"
          component={ChatScreen}
          options={{ headerShown: false }}
        />

        {/* ── Conversation List (opened from chat via 📝 button) ── */}
        <Stack.Screen
          name="ConversationList"
          component={ConversationListScreen}
          options={{ headerShown: false }}
        />

        {/* ── Opening a conversation from list → goes to Chat ── */}
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

        {/* ── Existing Screens ── */}
        <Stack.Screen name="Settings" component={SettingsScreen} />
        <Stack.Screen name="Models" component={ModelsScreen} />
        <Stack.Screen name="Parameters" component={ParametersScreen} />
        <Stack.Screen name="Benchmark" component={BenchmarkScreen} />
        <Stack.Screen name="About" component={AboutScreen} />
        <Stack.Screen
          name="SearchResult"
          component={SearchResultScreen}
          options={{ title: 'Search Models' }}
        />
        </Stack.Navigator>
      </NavigationContainer>
    </IncognitoProvider>
  );
}
