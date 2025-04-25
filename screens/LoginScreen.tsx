import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, Text, Image, SafeAreaView, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { signinUser, getDetailsUser } from '@/services/user';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from 'jwt-decode';

const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const navigation = useNavigation();

  const handleLogin = async () => {
    try {
      const data = await signinUser({ email, password });
      const accessToken = data?.access_token;

      if (accessToken) {
        await AsyncStorage.setItem('access_token', accessToken);

        try {
          const decoded = jwtDecode(accessToken);
          await AsyncStorage.setItem('user', JSON.stringify(decoded));

          if (decoded?.id) {
            await handleGetDetailsUser(decoded?.id, accessToken);
          }
        } catch (error) {
          console.error('JWT Decode Error:', error);
        }

        navigation.navigate('Home');
      }
    } catch (error) {
      Alert.alert('Đăng nhập thất bại', 'Vui lòng kiểm tra lại thông tin đăng nhập');
    }
  };

  const handleGetDetailsUser = async (id, token) => {
    try {
      const userDetails = await getDetailsUser(id, token);
      await AsyncStorage.setItem('userDetails', JSON.stringify(userDetails));
    } catch (error) {
      console.error('Failed to fetch user details:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.logoContainer}>
        <Image 
          source={require('@/assets/images/transfleet-logo.png')} 
          style={styles.logo} 
          resizeMode="contain"
        />
        <Text style={styles.logoText}>TransFleet</Text>
      </View>

      <Text style={styles.title}>Đăng Nhập</Text>

      <View style={[styles.inputContainer, styles.marginHorizontal]}>
        <View style={styles.emailIconContainer}>
          <Ionicons name="mail-outline" size={20} color="#0047AB" />
        </View>
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>

      <View style={[styles.inputContainer, styles.marginHorizontal]}>
        <View style={styles.passwordIconContainer}>
          <Ionicons name="lock-closed-outline" size={20} color="#0047AB" />
        </View>
        <TextInput
          style={styles.input}
          placeholder="Mật khẩu"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
        />
        <TouchableOpacity
          style={styles.eyeIcon}
          onPress={() => setShowPassword(!showPassword)}
        >
          <Ionicons
            name={showPassword ? 'eye-off-outline' : 'eye-outline'}
            size={20}
            color="#0047AB"
          />
        </TouchableOpacity>
      </View>

      <View style={[styles.rememberContainer, styles.marginHorizontal]}>
        <TouchableOpacity 
          style={styles.checkboxContainer} 
          onPress={() => setRememberMe(!rememberMe)}
        >
          <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
            {rememberMe && <Ionicons name="checkmark" size={14} color="white" />}
          </View>
          <Text style={styles.rememberText}>Ghi nhớ đăng nhập</Text>
        </TouchableOpacity>
        <TouchableOpacity>
          <Text style={styles.forgotText}>Quên mật khẩu?</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={[styles.loginButton, styles.marginHorizontal]} onPress={handleLogin}>
        <Text style={styles.loginButtonText}>Đăng nhập</Text>
      </TouchableOpacity>

      <View style={styles.registerContainer}>
        <Text style={styles.registerText}>hoặc </Text>
        <TouchableOpacity onPress={() => navigation.navigate('Register')}>
          <Text style={styles.registerLink}>Đăng ký ngay!</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    padding: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 40,
  },
  logo: {
    width: 100,
    height: 50,
  },
  logoText: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#0047AB',
    marginTop: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0047AB',
    textAlign: 'center',
    marginBottom: 30,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 5,
    marginBottom: 15,
    height: 50,
    backgroundColor: '#F8F8F8',
  },
  emailIconContainer: {
    padding: 10,
    paddingHorizontal: 15,
  },
  passwordIconContainer: {
    padding: 10,
    paddingHorizontal: 15,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 16,
  },
  eyeIcon: {
    padding: 10,
    paddingHorizontal: 15,
  },
  rememberContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 25,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 18,
    height: 18,
    borderWidth: 1,
    borderColor: '#0047AB',
    marginRight: 8,
    borderRadius: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#0047AB',
  },
  rememberText: {
    fontSize: 14,
    color: '#333',
  },
  forgotText: {
    fontSize: 14,
    color: '#0047AB',
  },
  loginButton: {
    backgroundColor: '#0047AB',
    height: 50,
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  loginButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  registerText: {
    fontSize: 14,
    color: '#333',
  },
  registerLink: {
    fontSize: 14,
    color: '#0047AB',
    fontWeight: 'bold',
  },
  marginHorizontal: {
    marginHorizontal: 20,
  },
});

export default LoginScreen;