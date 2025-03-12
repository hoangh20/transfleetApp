import React, { useState } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, ScrollView, Image, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { signoutUser } from '@/services/user';

const SettingsScreen = () => {
  const navigation = useNavigation();
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [locationServices, setLocationServices] = useState(true);
  const [dataSync, setDataSync] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const handleSignOut = async () => {
    try {
      setIsLoading(true);
      console.log('Bắt đầu đăng xuất...');
      await signoutUser();
      console.log('Đăng xuất thành công');
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    } catch (error) {
      console.error('Đăng xuất thất bại:', error);
      Alert.alert(
        'Lỗi',
        'Không thể đăng xuất. Vui lòng thử lại sau.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const confirmSignOut = () => {
    console.log('Xác nhận đăng xuất');
    Alert.alert(
      'Xác nhận đăng xuất',
      'Bạn có chắc chắn muốn đăng xuất không?',
      [
        { text: 'Hủy', style: 'cancel' },
        { 
          text: 'Đăng xuất', 
          onPress: () => {
            console.log('Người dùng đã xác nhận đăng xuất');
            handleSignOut();
          }, 
          style: 'destructive' 
        }
      ]
    );
  };

  const SettingItem = ({ icon, title, description, toggle, value, onValueChange, showArrow, onPress }) => (
    <TouchableOpacity 
      style={styles.settingItem}
      disabled={toggle}
      onPress={onPress}
    >
      <View style={styles.settingIconContainer}>
        <Ionicons name={icon} size={24} color="#007AFF" />
      </View>
      <View style={styles.settingTextContainer}>
        <Text style={styles.settingTitle}>{title}</Text>
        {description && <Text style={styles.settingDescription}>{description}</Text>}
      </View>
      {toggle ? (
        <Switch
          value={value}
          onValueChange={onValueChange}
          trackColor={{ false: '#767577', true: '#81b0ff' }}
          thumbColor={value ? '#007AFF' : '#f4f3f4'}
        />
      ) : (
        showArrow && <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
      )}
    </TouchableOpacity>
  );

  const SettingSection = ({ title, children }) => (
    <View style={styles.settingSection}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionContent}>
        {children}
      </View>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.profileSection}>
          <Image
            source={{ uri: 'https://via.placeholder.com/100' }}
            style={styles.profileImage}
          />
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>Nguyen Van A</Text>
            <Text style={styles.profileEmail}>nguyenvana@example.com</Text>
            <TouchableOpacity>
              <Text style={styles.editProfileText}>Edit Profile</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <SettingSection title="General">
        <SettingItem
          icon="notifications-outline"
          title="Notifications"
          description="Enable push notifications"
          toggle
          value={notifications}
          onValueChange={setNotifications}
        />
        <SettingItem
          icon="moon-outline"
          title="Dark Mode"
          description="Switch between light and dark themes"
          toggle
          value={darkMode}
          onValueChange={setDarkMode}
        />
        <SettingItem
          icon="language-outline"
          title="Language"
          description="English"
          showArrow
          onPress={() => navigation.navigate('Language')}
        />
      </SettingSection>

      <SettingSection title="Privacy">
        <SettingItem
          icon="location-outline"
          title="Location Services"
          description="Allow app to access your location"
          toggle
          value={locationServices}
          onValueChange={setLocationServices}
        />
        <SettingItem
          icon="lock-closed-outline"
          title="Privacy Policy"
          showArrow
          onPress={() => navigation.navigate('PrivacyPolicy')}
        />
        <SettingItem
          icon="finger-print-outline"
          title="Biometric Authentication"
          showArrow
          onPress={() => navigation.navigate('BiometricSettings')}
        />
      </SettingSection>

      <SettingSection title="Data">
        <SettingItem
          icon="cloud-upload-outline"
          title="Auto Sync"
          description="Sync data automatically"
          toggle
          value={dataSync}
          onValueChange={setDataSync}
        />
        <SettingItem
          icon="trash-outline"
          title="Clear Cache"
          description="Delete temporary data"
          showArrow
          onPress={() => {
            Alert.alert(
              'Xác nhận',
              'Bạn có chắc chắn muốn xóa bộ nhớ đệm không?',
              [
                { text: 'Hủy', style: 'cancel' },
                { text: 'Xóa', style: 'destructive' }
              ]
            );
          }}
        />
      </SettingSection>

      <SettingSection title="About">
        <SettingItem
          icon="information-circle-outline"
          title="App Version"
          description="1.0.0"
        />
        <SettingItem
          icon="help-circle-outline"
          title="Help & Support"
          showArrow
          onPress={() => navigation.navigate('Support')}
        />
        <SettingItem
          icon="star-outline"
          title="Rate App"
          showArrow
          onPress={() => {
            // Implement app rating logic
          }}
        />
      </SettingSection>

      <TouchableOpacity 
        style={[styles.logoutButton, isLoading && styles.disabledButton]}
        onPress={confirmSignOut}
        disabled={isLoading}
        activeOpacity={0.7}
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#FF3B30" />
            <Text style={styles.logoutText}>Đang đăng xuất...</Text>
          </View>
        ) : (
          <Text style={styles.logoutText}>Đăng xuất</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    marginBottom: 20,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  profileInfo: {
    marginLeft: 20,
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  profileEmail: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 5,
  },
  editProfileText: {
    color: '#007AFF',
    fontSize: 14,
  },
  settingSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    color: '#8E8E93',
    marginLeft: 20,
    marginBottom: 5,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  sectionContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E5EA',
  },
  settingIconContainer: {
    width: 30,
    marginRight: 10,
    alignItems: 'center',
  },
  settingTextContainer: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
  },
  settingDescription: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 2,
  },
  logoutButton: {
    margin: 20,
    padding: 15,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.7,
  },
  logoutText: {
    color: '#FF3B30',
    fontSize: 16,
    fontWeight: '500',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  }
});

export default SettingsScreen;