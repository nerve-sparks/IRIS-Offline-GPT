// import React from 'react';
// import { NavigationContainer } from '@react-navigation/native';
// import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
// import { SafeAreaProvider } from 'react-native-safe-area-context';

// import ChatScreen from './src/ChatScreen';
// import ModelsScreen from './src/ModelsScreen';

// const Tab = createBottomTabNavigator();

// export default function App() {
//   return (
//     <SafeAreaProvider>
//       <NavigationContainer>
//         <Tab.Navigator
//           screenOptions={{
//             headerStyle: { backgroundColor: '#1e293b' },
//             headerTintColor: '#f8fafc',
//             tabBarStyle: { backgroundColor: '#1e293b', borderTopColor: '#334155' },
//             tabBarActiveTintColor: '#3b82f6', // Bright blue for active tab
//             tabBarInactiveTintColor: '#94a3b8', // Gray for inactive tab
//           }}
//         >
//           <Tab.Screen 
//             name="Chat" 
//             component={ChatScreen} 
//             options={{ title: 'Iris AI' }} 
//           />
//           <Tab.Screen 
//             name="Models" 
//             component={ModelsScreen} 
//             options={{ title: 'Models' }} 
//           />
//         </Tab.Navigator>
//       </NavigationContainer>
//     </SafeAreaProvider>
//   );
// }

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Correctly importing from your new screen folder!
import ChatScreen from './src/screens/ChatScreen'; 
import SettingsScreen from './src/screens/SettingsScreen';
import ModelsScreen from './src/screens/ModelsScreen';
import ParametersScreen from './src/screens/ParametersScreen';
import BenchmarkScreen from './src/screens/BenchmarkScreen';
import AboutScreen from './src/screens/AboutScreen';
import SearchResultScreen from './src/screens/SearchResultScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator 
        screenOptions={{ 
          headerStyle: { backgroundColor: '#050a14' }, 
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: 'bold' }
        }}
      >
        {/* Hiding header for main chat to use your custom gradient header */}
        <Stack.Screen name="Chat" component={ChatScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
        <Stack.Screen name="Models" component={ModelsScreen} />
        
        {/* Placeholders so the app doesn't crash when you click them! */}
        <Stack.Screen name="Parameters" component={ParametersScreen} />
        <Stack.Screen name="Benchmark" component={BenchmarkScreen} />
        <Stack.Screen name="About" component={AboutScreen} />
        <Stack.Screen name="SearchResult" component={SearchResultScreen} options={{ title: 'Search Models' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}