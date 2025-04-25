import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  TextInput,
  Button,
  Alert,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getCustomerById,
  fetchProvinceName,
  fetchDistrictName,
  fetchWardName,
  updateDeliveryOrderStatus,
  updatePackingOrderStatus,
} from '@/services/oder';
const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY;
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET;
const OrderCard = ({ order }) => {
  const [customerName, setCustomerName] = useState('');
  const [loadingCustomer, setLoadingCustomer] = useState(true);
  const [startAddress, setStartAddress] = useState('');
  const [endAddress, setEndAddress] = useState('');
  const [loadingAddress, setLoadingAddress] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [note, setNote] = useState('');
  const [imgUrl, setImgUrl] = useState('');
  const [images, setImages] = useState([]); 


  useEffect(() => {
    const fetchCustomerName = async () => {
      try {
        const customer = await getCustomerById(order.order.customer);
        setCustomerName(customer.shortName || 'N/A');
      } catch (error) {
        console.error('Failed to fetch customer name:', error);
        setCustomerName('N/A');
      } finally {
        setLoadingCustomer(false);
      }
    };

    const fetchAddress = async () => {
      try {
        const { startPoint, endPoint } = order.order.location;
        const startProvince = await fetchProvinceName(startPoint.provinceCode);
        const startDistrict = await fetchDistrictName(startPoint.districtCode);
        const startWard = startPoint.wardCode
          ? await fetchWardName(startPoint.wardCode)
          : '';
        const startFullAddress = `${startWard ? `${startWard}, ` : ''}${startDistrict}, ${startProvince}`;
        setStartAddress(startFullAddress);
        const endProvince = await fetchProvinceName(endPoint.provinceCode);
        const endDistrict = await fetchDistrictName(endPoint.districtCode);
        const endWard = endPoint.wardCode
          ? await fetchWardName(endPoint.wardCode)
          : '';
        const endFullAddress = `${endWard ? `${endWard}, ` : ''}${endDistrict}, ${endProvince}`;
        setEndAddress(endFullAddress);
      } catch (error) {
        console.error('Failed to fetch address:', error);
        setStartAddress('N/A');
        setEndAddress('N/A');
      } finally {
        setLoadingAddress(false);
      }
    };

    fetchCustomerName();
    fetchAddress();
  }, [order.order.customer, order.order.location]);

  const isDeliveryOrder = order.type === 'DeliveryOrder';
  const statusText = getStatusText(order.order.status, isDeliveryOrder);
  const statusColor = getStatusColor(order.order.status, isDeliveryOrder);

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Cần quyền truy cập', 'Vui lòng cấp quyền truy cập thư viện ảnh!');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
        selectionLimit: 5 
      });

      if (!result.canceled && result.assets) {
        const newImages = result.assets
          .map(asset => asset.uri)
          .filter(uri => !images.includes(uri)); 
        setImages(prev => [...prev, ...newImages]);
      }
    } catch (error) {
      console.error('Lỗi chọn ảnh:', error);
      Alert.alert('Lỗi', 'Không thể chọn ảnh');
    }
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Cần quyền truy cập', 'Vui lòng cấp quyền sử dụng camera!');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        quality: 0.8,
        allowsEditing: true
      });

      if (!result.canceled && result.assets) {
        const newImage = result.assets[0].uri;
        setImages(prev => [...prev, newImage]);
      }
    } catch (error) {
      console.error('Lỗi chụp ảnh:', error);
      Alert.alert('Lỗi', 'Không thể chụp ảnh');
    }
  };
  const removeImage = (uri) => {
    setImages(prev => prev.filter(imageUri => imageUri !== uri));
  };
  const uploadImagesToCloudinary = async () => {
    if (images.length === 0) return ''; 
    
    try {
      const uploadPromises = images.map(async (uri) => {
        const formData = new FormData();
        formData.append('upload_preset', 'updateStatus');
        formData.append('cloud_name', 'transfleet');
        if (Platform.OS === 'web') {
          const response = await fetch(uri);
          const blob = await response.blob();
          const filename = uri.split('/').pop() || `image_${Date.now()}.jpg`;
          const file = new File([blob], filename, { type: blob.type });
          formData.append('file', file);
        } else {
          const filename = uri.split('/').pop() || `image_${Date.now()}.jpg`;
          const match = /\.(\w+)$/.exec(filename);
          const type = match ? `image/${match[1]}` : 'image/jpeg';
          
          formData.append('file', {
            uri,
            type,
            name: filename,
          });
        }
        const response = await fetch(
          'https://api.cloudinary.com/v1_1/transfleet/image/upload',
          {
            method: 'POST',
            body: formData,
          }
        );
        if (!response.ok) {
          const errorData = await response.json();
          console.error('Cloudinary API error details:', errorData);
          throw new Error(errorData.error?.message || 'Upload failed');
        }  
        const data = await response.json();
        return data.secure_url;
      });
      
      const results = await Promise.all(uploadPromises);
      return results.join('|');
    } catch (error) {
      console.error('Lỗi upload ảnh:', error);
      throw new Error('Không thể upload ảnh: ' + error.message);
    }
  };
  const handleUpdateStatus = async () => {
    try {
      const user = await AsyncStorage.getItem('user');
      const parsedUser = user ? JSON.parse(user) : null;
      const userId = parsedUser?.id; 
      if (!userId) {
        throw new Error('User ID not found');
      }

      const uploadedImgUrl = await uploadImagesToCloudinary(); 

      if (isDeliveryOrder) {
        await updateDeliveryOrderStatus(order.order._id, userId, uploadedImgUrl, note);
      } else {
        await updatePackingOrderStatus(order.order._id, userId, uploadedImgUrl, note);
      }

      Alert.alert('Thành công', 'Cập nhật trạng thái thành công!');
      setModalVisible(false);

      if (typeof order.onStatusUpdated === 'function') {
        order.onStatusUpdated();
      }
    } catch (error) {
      console.error('Failed to update status:', error);
      Alert.alert('Lỗi', 'Không thể cập nhật trạng thái. Vui lòng thử lại.');
    }
  };

  const estimatedTime = order.order.estimatedTime
    ? new Date(order.order.estimatedTime).toLocaleString('vi-VN')
    : 'N/A';

  return (
    <View style={styles.card}>
      <View style={[styles.statusBar, { backgroundColor: statusColor }]} />
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle}>
          #{isDeliveryOrder ? 'Giao hàng' : 'Đóng hàng'} -{' '}
          {isDeliveryOrder
            ? new Date(order.order.deliveryDate).toLocaleDateString('vi-VN')
            : new Date(order.order.packingDate).toLocaleDateString('vi-VN')}
        </Text>
        <View style={styles.row}>
          <Ionicons name="person-outline" size={16} />
          {loadingCustomer ? (
            <ActivityIndicator size="small" color="#0066CC" />
          ) : (
            <Text style={styles.label}>{customerName}</Text>
          )}
        </View>
        <View style={styles.row}>
          <Ionicons name="location-outline" size={16} />
          {loadingAddress ? (
            <ActivityIndicator size="small" color="#0066CC" />
          ) : (
            <Text style={styles.label}>{startAddress}</Text>
          )}
        </View>
        <View style={styles.row}>
          <Ionicons name="flag-outline" size={16} />
          {loadingAddress ? (
            <ActivityIndicator size="small" color="#0066CC" />
          ) : (
            <Text style={styles.label}>{endAddress}</Text>
          )}
        </View>
        <View style={styles.row}>
          <Ionicons name="cube-outline" size={16} />
          <Text style={styles.label}>
            {order.order.containerNumber || 'N/A'}
          </Text>
        </View>
        <View style={styles.row}>
          <Ionicons name="time-outline" size={16} />
          <Text style={styles.label}>{statusText}</Text>
        </View>
        <View style={styles.row}>
          <Ionicons name="calendar-outline" size={16} />
          <Text style={styles.label}>
            {isDeliveryOrder
              ? 'Thời gian giao hàng dự kiến:'
              : 'Thời gian đóng hàng dự kiến:'}{' '}
            {estimatedTime}
          </Text>
        </View>
        {order.order.note && (
          <View style={styles.row}>
            <Ionicons name="document-text-outline" size={16} />
            <Text style={styles.label}>{order.order.note}</Text>
          </View>
        )}
        {order.order.status !== 6 && (
          <TouchableOpacity
            style={styles.updateButton}
            onPress={() => setModalVisible(true)}
          >
            <Text style={styles.updateButtonText}>Cập nhật trạng thái</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Modal for updating status */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Cập nhật trạng thái</Text>
            <TextInput
              style={styles.input}
              placeholder="Ghi chú"
              value={note}
              onChangeText={setNote}
            />
            {/* Add buttons for picking and taking photos */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <TouchableOpacity style={[styles.addButton, { flex: 1, marginRight: 5 }]} onPress={pickImage}>
                <Text style={styles.addButtonText}>Chọn ảnh</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.addButton, { flex: 1, marginLeft: 5 }]} onPress={takePhoto}>
                <Text style={styles.addButtonText}>Chụp ảnh</Text>
              </TouchableOpacity>
            </View>
            {/* Display selected images */}
            <View style={styles.imagePreviewContainer}>
              {images.map((uri, index) => (
                <View key={index} style={styles.imagePreview}>
                  <Image source={{ uri }} style={styles.image} />
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => removeImage(uri)}
                  >
                    <Text style={styles.removeButtonText}>X</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
            <View style={styles.modalButtons}>
              <Button title="Hủy" onPress={() => setModalVisible(false)} />
              <Button title="Cập nhật" onPress={handleUpdateStatus} />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const getStatusText = (status, isDeliveryOrder) => {
  const deliveryStatusMap = {
    0: 'Mới',
    1: 'Đã giao xe',
    2: 'Đang giao hàng',
    3: 'Đã giao hàng',
    4: 'Đang hạ vỏ',
    5: 'Đã hạ vỏ',
    6: 'Hoàn thành',
  };

  const packingStatusMap = {
    0: 'Mới',
    1: 'Đã giao xe',
    2: 'Đang lên kho',
    3: 'Chờ đóng hàng',
    4: 'Đã đóng hàng',
    5: 'Đang về cảng',
    6: 'Đã về cảng',
    7: 'Hoàn thành',
  };

  return isDeliveryOrder
    ? deliveryStatusMap[status] || '---'
    : packingStatusMap[status] || '---';
};

const getStatusColor = (status, isDeliveryOrder) => {
  const deliveryColors = {
    0: '#CCCCCC',
    1: '#FFA500',
    2: '#007BFF',
    3: '#28A745',
    4: '#17A2B8',
    5: '#6C757D',
    6: '#343A40',
  };

  const packingColors = {
    0: '#CCCCCC',
    1: '#FFA500',
    2: '#007BFF',
    3: '#FFC107',
    4: '#28A745',
    5: '#17A2B8',
    6: '#6C757D',
    7: '#343A40',
  };

  return isDeliveryOrder
    ? deliveryColors[status] || '#CCCCCC'
    : packingColors[status] || '#CCCCCC';
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    marginBottom: 14,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    overflow: 'hidden',
  },
  statusBar: {
    width: 6,
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
  },
  cardContent: {
    flex: 1,
    padding: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  label: {
    fontSize: 14,
    color: '#333',
    marginLeft: 6,
  },
  updateButton: {
    marginTop: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#007BFF',
    borderRadius: 8,
    alignItems: 'center',
  },
  updateButtonText: {
    color: '#FFF',
    fontWeight: '600',
  },
  addButton: {
    marginTop: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#007BFF',
    borderRadius: 8,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#FFF',
    fontWeight: '600',
  },
  imagePreviewContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
  },
  imagePreview: {
    position: 'relative',
    marginRight: 10,
    marginBottom: 10,
  },
  image: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  removeButton: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 15,
    padding: 5,
  },
  removeButtonText: {
    color: '#FFF',
    fontSize: 12,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '80%',
    backgroundColor: '#FFF',
    borderRadius: 10,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#CCC',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderRadius: 8,
    marginTop: 10,
  },
});

export default OrderCard;