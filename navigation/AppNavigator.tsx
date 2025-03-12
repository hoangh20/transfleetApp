import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { NavigationContainer } from '@react-navigation/native';
import LoginScreen from '@/screens/LoginScreen';
import HomeScreen from '@/screens/HomeScreen';
import RegisterScreen from '@/screens/RegisterScreen';
import BottomTabNavigator from '@/navigation/BottomTabNavigator';

const Stack = createStackNavigator();

const AppNavigator = () => {
  return (
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen options={{ headerShown: false }} name="Login" component={LoginScreen} />
        <Stack.Screen options={{ headerShown: false }} name="Home" component={BottomTabNavigator} />
        <Stack.Screen options={{ headerShown: false }} name="Register" component={RegisterScreen} />
      </Stack.Navigator>
  );
};

export default AppNavigator; 