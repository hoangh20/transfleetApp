import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getCurrentOrdersByUserId } from '@/services/oder';
import { Ionicons } from '@expo/vector-icons';
import OrderCard from '@/components/OrderCard';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');
const CARD_PADDING = 16;

const filters = [
  { key: 1, label: 'Đang trong quá trình vận chuyển' },
  { key: 0, label: 'Tất cả' },
];

const HomeScreen = () => {
  const navigation = useNavigation();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState(1);

  useEffect(() => {
    fetchOrders();
  }, [filter]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const userJson = await AsyncStorage.getItem('user');
      const user = userJson ? JSON.parse(userJson) : {};
      if (!user.id) {
        Alert.alert('Lỗi', 'Vui lòng đăng nhập lại.');
        await AsyncStorage.removeItem('user');
        await AsyncStorage.removeItem('access_token');
        navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
        return;
      }
      const response = await getCurrentOrdersByUserId(user.id, filter);
      setOrders(response.data || []);
    } catch (error) {
      if (error?.response?.status === 401 || error?.response?.status === 404) {
        Alert.alert('Phiên đăng nhập hết hạn', 'Vui lòng đăng nhập lại.');
        await AsyncStorage.removeItem('user');
        await AsyncStorage.removeItem('access_token');
        navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
      } else {
        Alert.alert('Lỗi', 'Không thể tải dữ liệu. Vui lòng thử lại.');
      }
    } finally {
      setLoading(false);
    }
  };

  const renderFilter = ({ key, label }) => (
    <TouchableOpacity
      key={key}
      style={[
        styles.filterButton,
        filter === key && styles.filterButtonActive,
      ]}
      onPress={() => setFilter(key)}
      activeOpacity={0.7}
    >
      <Text
        style={[
          styles.filterText,
          filter === key && styles.filterTextActive,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0066CC" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>Danh sách đơn hàng</Text>
      <View style={styles.filterContainer}>
        {filters.map(renderFilter)}
      </View>
      <FlatList
        data={orders}
        keyExtractor={(item) => item.order._id}
        renderItem={({ item }) => (
          <OrderCard order={{ ...item, onStatusUpdated: fetchOrders }} />
        )}
        contentContainerStyle={{ paddingBottom: 30 }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F1F3F6',
    paddingHorizontal: 12,
    paddingTop: 20,
  },
  header: {
    fontSize: 24,
    fontWeight: '600',
    color: '#0066CC',
    marginBottom: 12,
  },
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginHorizontal: 6,
    borderRadius: 20,
    backgroundColor: '#E8EAED',
  },
  filterButtonActive: {
    backgroundColor: '#0066CC',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#555',
  },
  filterTextActive: {
    color: '#FFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F1F3F6',
  },
});

export default HomeScreen;
