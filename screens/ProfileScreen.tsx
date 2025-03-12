import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ActivityIndicator, 
  ScrollView, 
  Image, 
  TouchableOpacity,
  SafeAreaView,
  StatusBar
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getDetailsUser } from '@/services/user';
import { getDriverAndVehicleByUserId } from '@/services/user';
import { AntDesign, MaterialIcons, FontAwesome5, Ionicons } from '@expo/vector-icons';

const ProfileScreen = () => {
  const [user, setUser] = useState(null);
  const [driverVehicleInfo, setDriverVehicleInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('personal');

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const accessToken = await AsyncStorage.getItem('access_token');
        const storedUser = await AsyncStorage.getItem('user');
        const parsedUser = storedUser ? JSON.parse(storedUser) : null;
        const userId = parsedUser?.id;

        if (accessToken && userId) {
          // Fetch user details
          const userDetails = await getDetailsUser(userId, accessToken);
          setUser(userDetails.data);
          await AsyncStorage.setItem('userDetails', JSON.stringify(userDetails.data));
          
          // Fetch driver and vehicle details
          try {
            const driverVehicleDetails = await getDriverAndVehicleByUserId(userId);
            setDriverVehicleInfo(driverVehicleDetails.data);
            await AsyncStorage.setItem('driverVehicleDetails', JSON.stringify(driverVehicleDetails.data));
          } catch (dvError) {
            console.error('Failed to fetch driver/vehicle details:', dvError.message);
          }
        } else {
          console.warn('Missing accessToken or userId');
        }
      } catch (error) {
        console.error('Failed to fetch user details:', error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const renderPersonalInfo = () => {
    return (
      <View style={styles.infoContainer}>
        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>Account Information</Text>
          <View style={styles.infoRow}>
            <AntDesign name="user" size={20} color="#0047AB" />
            <Text style={styles.infoLabel}>Name:</Text>
            <Text style={styles.infoValue}>{user.name || 'N/A'}</Text>
          </View>
          <View style={styles.infoRow}>
            <AntDesign name="mail" size={20} color="#0047AB" />
            <Text style={styles.infoLabel}>Email:</Text>
            <Text style={styles.infoValue}>{user.email || 'N/A'}</Text>
          </View>
          <View style={styles.infoRow}>
            <AntDesign name="phone" size={20} color="#0047AB" />
            <Text style={styles.infoLabel}>Phone:</Text>
            <Text style={styles.infoValue}>{user.phone || 'N/A'}</Text>
          </View>
          <View style={styles.infoRow}>
            <AntDesign name="idcard" size={20} color="#0047AB" />
            <Text style={styles.infoLabel}>Role:</Text>
            <Text style={styles.infoValue}>{user.role || 'N/A'}</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderDriverInfo = () => {
    const driver = driverVehicleInfo?.driver;
    
    if (!driver) {
      return (
        <View style={styles.noDataContainer}>
          <Text style={styles.noDataText}>No driver information available</Text>
        </View>
      );
    }

    return (
      <View style={styles.infoContainer}>
        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>Driver Information</Text>
          
          <View style={styles.infoRow}>
            <AntDesign name="user" size={20} color="#0047AB" />
            <Text style={styles.infoLabel}>Name:</Text>
            <Text style={styles.infoValue}>{driver.name}</Text>
          </View>
          <View style={styles.infoRow}>
            <AntDesign name="phone" size={20} color="#0047AB" />
            <Text style={styles.infoLabel}>Phone:</Text>
            <Text style={styles.infoValue}>{driver.phone}</Text>
          </View>
          <View style={styles.infoRow}>
            <AntDesign name="calendar" size={20} color="#0047AB" />
            <Text style={styles.infoLabel}>Birth Date:</Text>
            <Text style={styles.infoValue}>{formatDate(driver.birthDate)}</Text>
          </View>
          <View style={styles.infoRow}>
            <AntDesign name="home" size={20} color="#0047AB" />
            <Text style={styles.infoLabel}>Hometown:</Text>
            <Text style={styles.infoValue}>{driver.hometown}</Text>
          </View>
          <View style={styles.infoRow}>
            <FontAwesome5 name="id-card-alt" size={20} color="#0047AB" />
            <Text style={styles.infoLabel}>Citizen ID:</Text>
            <Text style={styles.infoValue}>{driver.citizenID}</Text>
          </View>
          <View style={styles.infoRow}>
            <FontAwesome5 name="id-card" size={20} color="#0047AB" />
            <Text style={styles.infoLabel}>License Type:</Text>
            <Text style={styles.infoValue}>{driver.licenseType}</Text>
          </View>
          <View style={styles.infoRow}>
            <MaterialIcons name="work" size={20} color="#0047AB" />
            <Text style={styles.infoLabel}>Experience:</Text>
            <Text style={styles.infoValue}>{driver.yearsOfExperience} years</Text>
          </View>
          <View style={styles.infoRow}>
            <AntDesign name="bank" size={20} color="#0047AB" />
            <Text style={styles.infoLabel}>Bank Account:</Text>
            <Text style={styles.infoValue}>{driver.bankAccount}</Text>
          </View>
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{driver.successfulTrips}</Text>
              <Text style={styles.statLabel}>Successful</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{driver.failedTrips}</Text>
              <Text style={styles.statLabel}>Failed</Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  const renderVehicleInfo = () => {
    const vehicle = driverVehicleInfo?.vehicle;
    
    if (!vehicle) {
      return (
        <View style={styles.noDataContainer}>
          <Text style={styles.noDataText}>No vehicle information available</Text>
        </View>
      );
    }

    return (
      <View style={styles.infoContainer}>
        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>Vehicle Information</Text>
          
          {vehicle.imageUrl && (
            <View style={styles.vehicleImageContainer}>
              <Image source={{ uri: vehicle.imageUrl }} style={styles.vehicleImage} />
            </View>
          )}
          
          <View style={styles.infoRow}>
            <FontAwesome5 name="truck" size={20} color="#0047AB" />
            <Text style={styles.infoLabel}>Head Plate:</Text>
            <Text style={styles.infoValue}>{vehicle.headPlate}</Text>
          </View>
          <View style={styles.infoRow}>
            <AntDesign name="calendar" size={20} color="#0047AB" />
            <Text style={styles.infoLabel}>Registration Expiry:</Text>
            <Text style={styles.infoValue}>{formatDate(vehicle.headRegExpiry)}</Text>
          </View>
          <View style={styles.infoRow}>
            <FontAwesome5 name="trailer" size={20} color="#0047AB" />
            <Text style={styles.infoLabel}>Mooc Plate:</Text>
            <Text style={styles.infoValue}>{vehicle.moocPlate}</Text>
          </View>
          <View style={styles.infoRow}>
            <AntDesign name="calendar" size={20} color="#0047AB" />
            <Text style={styles.infoLabel}>Mooc Expiry:</Text>
            <Text style={styles.infoValue}>{formatDate(vehicle.moocRegExpiry)}</Text>
          </View>
          <View style={styles.infoRow}>
            <MaterialIcons name="category" size={20} color="#0047AB" />
            <Text style={styles.infoLabel}>Mooc Type:</Text>
            <Text style={styles.infoValue}>{vehicle.moocType === 0 ? "20''" : "40''"}</Text>
          </View>
          <View style={styles.infoRow}>
            <FontAwesome5 name="weight" size={20} color="#0047AB" />
            <Text style={styles.infoLabel}>Weight:</Text>
            <Text style={styles.infoValue}>{vehicle.weight} tấn</Text>
          </View>
          <View style={styles.infoRow}>
            <MaterialIcons name="history" size={20} color="#0047AB" />
            <Text style={styles.infoLabel}>Purchase Year:</Text>
            <Text style={styles.infoValue}>{vehicle.purchase_year}</Text>
          </View>
          <View style={styles.infoRow}>
            <AntDesign name="dashboard" size={20} color="#0047AB" />
            <Text style={styles.infoLabel}>Condition:</Text>
            <Text style={styles.infoValue}>{vehicle.depreciationRate}%</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="location" size={20} color="#0047AB" />
            <Text style={styles.infoLabel}>Location:</Text>
            <Text style={styles.infoValue}>{vehicle.address}</Text>
          </View>
          
          <View style={styles.statusContainer}>
            <Text style={styles.statusLabel}>Status:</Text>
            <View style={[styles.statusBadge, 
              { backgroundColor: vehicle.status === 0 ? '#4CAF50' : 
                                 vehicle.status === 1 ? '#FFC107' : '#F44336' }]}>
              <Text style={styles.statusText}>
                {vehicle.status === 0 ? 'Available' : 
                 vehicle.status === 1 ? 'En Route' : 'Maintenance'}
              </Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0047AB" />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.container}>
        <Text>Failed to load user details.</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>
      
      <View style={styles.profileHeader}>
        <View style={styles.avatarContainer}>
          <Image 
            source={{ 
              uri: driverVehicleInfo?.driver?.avatar || 
                  'https://ui-avatars.com/api/?name=' + encodeURIComponent(user.name) + '&background=0047AB&color=fff'
            }} 
            style={styles.avatar} 
          />
        </View>
        <Text style={styles.userName}>{user.name}</Text>
        <Text style={styles.userRole}>{user.role}</Text>
      </View>
      
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'personal' && styles.activeTab]} 
          onPress={() => setActiveTab('personal')}
        >
          <Text style={[styles.tabText, activeTab === 'personal' && styles.activeTabText]}>Personal</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'driver' && styles.activeTab]} 
          onPress={() => setActiveTab('driver')}
        >
          <Text style={[styles.tabText, activeTab === 'driver' && styles.activeTabText]}>Driver</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'vehicle' && styles.activeTab]} 
          onPress={() => setActiveTab('vehicle')}
        >
          <Text style={[styles.tabText, activeTab === 'vehicle' && styles.activeTabText]}>Vehicle</Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {activeTab === 'personal' && renderPersonalInfo()}
        {activeTab === 'driver' && renderDriverInfo()}
        {activeTab === 'vehicle' && renderVehicleInfo()}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    elevation: 2,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0047AB',
  },
  profileHeader: {
    backgroundColor: '#fff',
    paddingVertical: 20,
    alignItems: 'center',
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  avatarContainer: {
    marginBottom: 10,
    alignItems: 'center',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#0047AB',
  },
  driverAvatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 10,
  },
  userName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  userRole: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 16,
    color: '#666',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#0047AB',
  },
  activeTabText: {
    color: '#0047AB',
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  infoContainer: {
    padding: 15,
  },
  infoSection: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoLabel: {
    fontSize: 16,
    color: '#666',
    width: 110,
    marginLeft: 10,
  },
  infoValue: {
    fontSize: 16,
    color: '#333',
    flex: 1,
    fontWeight: '500',
  },
  vehicleImageContainer: {
    alignItems: 'center',
    marginBottom: 15,
  },
  vehicleImage: {
    width: '100%',
    height: 180,
    borderRadius: 8,
    marginBottom: 10,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 15,
  },
  statusLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginRight: 10,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 30,
  },
  statusText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  statsContainer: {
    flexDirection: 'row',
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0047AB',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  noDataContainer: {
    backgroundColor: '#fff',
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    marginHorizontal: 15,
    marginTop: 20,
  },
  noDataText: {
    fontSize: 16,
    color: '#666',
  },
});

export default ProfileScreen;