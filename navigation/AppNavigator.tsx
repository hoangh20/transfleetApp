import React, { useEffect, useState } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LoginScreen from '@/screens/LoginScreen';
import RegisterScreen from '@/screens/RegisterScreen';
import BottomTabNavigator from '@/navigation/BottomTabNavigator';
import { ActivityIndicator, View, StyleSheet } from 'react-native';

const Stack = createStackNavigator();

const AppNavigator = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(null);

  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const token = await AsyncStorage.getItem('access_token');
        setIsLoggedIn(!!token);
      } catch (error) {
        console.error('Failed to check login status:', error);
        setIsLoggedIn(false);
      }
    };

    checkLoginStatus();
  }, []);

  if (isLoggedIn === null) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0047AB" />
      </View>
    );
  }

  return (
    <Stack.Navigator initialRouteName={isLoggedIn ? 'Home' : 'Login'}>
      <Stack.Screen options={{ headerShown: false }} name="Login" component={LoginScreen} />
      <Stack.Screen options={{ headerShown: false }} name="Home" component={BottomTabNavigator} />
      <Stack.Screen options={{ headerShown: false }} name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});

export default AppNavigator;