import React from 'react';
// 🔥 NAYA IMPORT: DarkTheme ko import kiya
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import ChatScreen from './src/screens/ChatScreen'; 
import SettingsScreen from './src/screens/SettingsScreen';
import ModelsScreen from './src/screens/ModelsScreen';
import ParametersScreen from './src/screens/ParametersScreen';
import BenchmarkScreen from './src/screens/BenchmarkScreen';
import AboutScreen from './src/screens/AboutScreen';
import SearchResultScreen from './src/screens/SearchResultScreen';
import ReportScreen from './src/screens/ReportScreen'; 

const Stack = createNativeStackNavigator();

// 🔥 THE ULTIMATE FIX: React Navigation ka custom Black Theme
const MyDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: '#000000', // Ye line kisi bhi default white color ko black se override kar degi!
  },
};

export default function App() {
  return (
    <SafeAreaProvider style={{ flex: 1, backgroundColor: '#000000' }}>
      {/* 🔥 FIX: Yahan theme={MyDarkTheme} lagaya */}
      <NavigationContainer theme={MyDarkTheme}>
        <Stack.Navigator 
          screenOptions={{ 
            headerStyle: { backgroundColor: '#050a14' }, 
            headerTintColor: '#fff',
            headerTitleStyle: { fontWeight: 'bold' }
          }}
        >
          <Stack.Screen name="Chat" component={ChatScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Settings" component={SettingsScreen} />
          <Stack.Screen name="Models" component={ModelsScreen} />
          <Stack.Screen name="Parameters" component={ParametersScreen} />
          <Stack.Screen name="Benchmark" component={BenchmarkScreen} />
          <Stack.Screen name="About" component={AboutScreen} />
          <Stack.Screen name="ReportScreen" component={ReportScreen} options={{ title: 'Report Issue' }} />
          <Stack.Screen name="SearchResult" component={SearchResultScreen} options={{ title: 'Search Models' }} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}