import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, Text, Image, SafeAreaView, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { signupUser } from '@/services/user';

const RegisterScreen = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigation = useNavigation();

  const handleRegister = async () => {
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    try {
      const data = { name, email, phone, password };
      const response = await signupUser(data);
      Alert.alert('Success', 'Registration successful');
      navigation.navigate('Login');
    } catch (error) {
      Alert.alert('Error', 'Registration failed');
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

      <Text style={styles.title}>Đăng Ký</Text>

      <View style={[styles.inputContainer, styles.marginHorizontal]}>
        <View style={styles.iconContainer}>
          <Ionicons name="person-outline" size={20} color="#666" />
        </View>
        <TextInput
          style={styles.input}
          placeholder="Tên"
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
        />
      </View>

      <View style={[styles.inputContainer, styles.marginHorizontal]}>
        <View style={styles.iconContainer}>
          <Ionicons name="mail-outline" size={20} color="#666" />
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
        <View style={styles.iconContainer}>
          <Ionicons name="call-outline" size={20} color="#666" />
        </View>
        <TextInput
          style={styles.input}
          placeholder="Số điện thoại"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
        />
      </View>

      <View style={[styles.inputContainer, styles.marginHorizontal]}>
        <View style={styles.iconContainer}>
          <Ionicons name="lock-closed-outline" size={20} color="#666" />
        </View>
        <TextInput
          style={styles.input}
          placeholder="Mật khẩu"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
        />
      </View>

      <View style={[styles.inputContainer, styles.marginHorizontal]}>
        <View style={styles.iconContainer}>
          <Ionicons name="lock-closed-outline" size={20} color="#666" />
        </View>
        <TextInput
          style={styles.input}
          placeholder="Xác nhận mật khẩu"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry={!showConfirmPassword}
        />
      </View>

      <TouchableOpacity style={[styles.registerButton, styles.marginHorizontal]} onPress={handleRegister}>
        <Text style={styles.registerButtonText}>Đăng ký</Text>
      </TouchableOpacity>

      <View style={styles.loginContainer}>
        <Text style={styles.loginText}>hoặc </Text>
        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text style={styles.loginLink}>Đăng nhập ngay!</Text>
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
    backgroundColor: '#FFFFFF',
  },
  iconContainer: {
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
  registerButton: {
    backgroundColor: '#1E88E5',
    height: 50,
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 10,
  },
  registerButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  loginText: {
    fontSize: 14,
    color: '#333',
  },
  loginLink: {
    fontSize: 14,
    color: '#1E88E5',
    fontWeight: 'bold',
  },
  marginHorizontal: {
    marginHorizontal: 20,
  },
});

export default RegisterScreen;