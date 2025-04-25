import 'expo-router/entry';
import React from 'react';
import AppNavigator from '@/navigation/AppNavigator';
import { SafeAreaView } from 'react-native-safe-area-context';
export default function App() {
  return 
  <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
    <AppNavigator />;
  </SafeAreaView>;
}