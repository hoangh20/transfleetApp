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
import { getCurrentOrdersByUserId } from '@/services/order';
import { Ionicons } from '@expo/vector-icons';
import OrderCard from '@/components/OrderCard';
import CombinedOrderCard from '@/components/CombinedOrderCard';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');
const CARD_PADDING = 16;

const filters = [
  { key: 1, label: 'Đang trong quá trình vận chuyển' },
  { key: 0, label: 'Tất cả' },
];

const orderTypeFilters = [
  { key: 'all', label: 'Tất cả', icon: 'apps-outline' },
  { key: 'delivery', label: 'Giao hàng', icon: 'car-outline' },
  { key: 'packing', label: 'Đóng hàng', icon: 'cube-outline' },
  { key: 'combined', label: 'Kết hợp', icon: 'layers-outline' },
];

const HomeScreen = () => {
  const navigation = useNavigation();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState(1);
  const [orderTypeFilter, setOrderTypeFilter] = useState('all'); // Thêm state mới

  useEffect(() => {
    fetchOrders();
  }, [filter, orderTypeFilter]); // Thêm orderTypeFilter vào dependency

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

      const apiData = response.data || {};
      let allOrders = [];
      
      if (filter === 0) {
        // Áp dụng filter theo loại đơn hàng
        if (orderTypeFilter === 'all') {
          allOrders = [
            ...(apiData.delivery || []),
            ...(apiData.packing || []),
            ...(apiData.combined || [])
          ];
        } else if (orderTypeFilter === 'delivery') {
          allOrders = apiData.delivery || [];
        } else if (orderTypeFilter === 'packing') {
          allOrders = apiData.packing || [];
        } else if (orderTypeFilter === 'combined') {
          allOrders = apiData.combined || [];
        }
      } else if (filter === 1) {
        const deliveryInProgress = (apiData.delivery || []).filter(item => 
          item.order.status !== 6 // Đơn giao hàng chưa hoàn thành
        );
        const packingInProgress = (apiData.packing || []).filter(item => 
          item.order.status !== 7 // Đơn đóng hàng chưa hoàn thành
        );
        const combinedInProgress = (apiData.combined || []).filter(item => 
          item.status !== 9 // Đơn kết hợp chưa hoàn thành
        );
        
        allOrders = [...deliveryInProgress, ...packingInProgress, ...combinedInProgress];
      }
      
      setOrders(allOrders);
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
      onPress={() => {
        setFilter(key);
        if (key === 1) {
          setOrderTypeFilter('all'); // Reset order type filter khi chọn "Đang vận chuyển"
        }
      }}
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

  const renderOrderTypeFilter = ({ key, label, icon }) => (
    <TouchableOpacity
      key={key}
      style={[
        styles.orderTypeButton,
        orderTypeFilter === key && styles.orderTypeButtonActive,
      ]}
      onPress={() => setOrderTypeFilter(key)}
      activeOpacity={0.7}
    >
      <Ionicons 
        name={icon} 
        size={16} 
        color={orderTypeFilter === key ? '#FFF' : '#666'} 
      />
      <Text
        style={[
          styles.orderTypeText,
          orderTypeFilter === key && styles.orderTypeTextActive,
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
      
      {/* Main filter */}
      <View style={styles.filterContainer}>
        {filters.map(renderFilter)}
      </View>

      {/* Order type filter - chỉ hiển thị khi filter === 0 (Tất cả) */}
      {filter === 0 && (
        <View style={styles.orderTypeContainer}>
          {orderTypeFilters.map(renderOrderTypeFilter)}
        </View>
      )}

      <FlatList
        data={orders}
        keyExtractor={(item) => {
          if (item.type === 'combined') {
            return `combined-${item.connectionId}`;
          }
          return item.order._id;
        }}
        renderItem={({ item }) => {
          if (item.type === 'combined') {
            return <CombinedOrderCard order={item} onStatusUpdated={fetchOrders} />;
          }
          return <OrderCard order={{ ...item, onStatusUpdated: fetchOrders }} />;
        }}
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
  orderTypeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  orderTypeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: '#E8EAED',
    minWidth: 80,
    justifyContent: 'center',
  },
  orderTypeButtonActive: {
    backgroundColor: '#28A745',
  },
  orderTypeText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666',
    marginLeft: 4,
  },
  orderTypeTextActive: {
    color: '#FFF',
  },
});

export default HomeScreen;
