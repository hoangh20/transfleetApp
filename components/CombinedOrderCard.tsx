import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  ScrollView,
  Image,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage'; 
import * as ImagePicker from 'expo-image-picker'; 
import { updateCombinedOrderStatus } from '@/services/order'; 
import { fetchProvinceName, fetchDistrictName, fetchWardName } from '@/services/order';

const CombinedOrderCard = ({ order, onStatusUpdated }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [images, setImages] = useState([]);
  const [note, setNote] = useState('');
  const [customerNames, setCustomerNames] = useState({
    delivery: '',
    packing: ''
  });
  const [addresses, setAddresses] = useState({
    delivery: '',
    packing: ''
  });
  const [loadingAddress, setLoadingAddress] = useState(true);

  const { deliveryOrder, packingOrder, status, emptyDistance } = order;

  useEffect(() => {
    setCustomerNames({
      delivery: deliveryOrder.customer?.shortName || 'N/A',
      packing: packingOrder.customer?.shortName || 'N/A'
    });

    const fetchAddresses = async () => {
      try {
        const deliveryEndPoint = deliveryOrder.location?.endPoint;
        let deliveryAddress = '';
        
        if (deliveryEndPoint) {
          const deliveryProvince = await fetchProvinceName(deliveryEndPoint.provinceCode);
          const deliveryDistrict = await fetchDistrictName(deliveryEndPoint.districtCode);
          const deliveryWard = deliveryEndPoint.wardCode
            ? await fetchWardName(deliveryEndPoint.wardCode)
            : '';
          if (deliveryEndPoint.locationText) {
            deliveryAddress = deliveryEndPoint.locationText;
            if (deliveryWard || deliveryDistrict || deliveryProvince) {
              deliveryAddress += ', ';
            }
          }
          deliveryAddress += `${deliveryWard ? `${deliveryWard}, ` : ''}${deliveryDistrict}, ${deliveryProvince}`;
        }

        const packingStartPoint = packingOrder.location?.startPoint;
        let packingAddress = '';
        
        if (packingStartPoint) {
          const packingProvince = await fetchProvinceName(packingStartPoint.provinceCode);
          const packingDistrict = await fetchDistrictName(packingStartPoint.districtCode);
          const packingWard = packingStartPoint.wardCode
            ? await fetchWardName(packingStartPoint.wardCode)
            : '';
          
          if (packingStartPoint.locationText) {
            packingAddress = packingStartPoint.locationText;
            if (packingWard || packingDistrict || packingProvince) {
              packingAddress += ', ';
            }
          }
          packingAddress += `${packingWard ? `${packingWard}, ` : ''}${packingDistrict}, ${packingProvince}`;
        }

        setAddresses({
          delivery: deliveryAddress || 'N/A',
          packing: packingAddress || 'N/A'
        });

      } catch (error) {
        console.error('Failed to fetch addresses:', error);
        setAddresses({
          delivery: deliveryOrder.location?.endPoint?.locationText || 'N/A',
          packing: packingOrder.location?.startPoint?.locationText || 'N/A'
        });
      } finally {
        setLoadingAddress(false);
      }
    };

    fetchAddresses();
  }, [deliveryOrder, packingOrder]);

  const getStatusText = (status) => {
    const statusMap = {
      0: 'Mới',
      1: 'Đã giao xe',
      2: 'Giao hàng',
      3: 'Đã giao hàng',
      4: 'Đang lên kho',
      5: 'Đã đến kho',
      6: 'Đang đóng hàng',
      7: 'Đã đóng hàng',
      8: 'Đang về cảng',
      9: 'Hoàn thành'
    };
    return statusMap[status] || 'Không xác định';
  };

  const getStatusColor = (status) => {
    const colorMap = {
      0: '#9E9E9E', // Mới - Gray
      1: '#FF9800', // Đã giao xe - Orange
      2: '#2196F3', // Giao hàng - Blue
      3: '#4CAF50', // Đã giao hàng - Green
      4: '#FF5722', // Đang lên kho - Deep Orange
      5: '#673AB7', // Đã đến kho - Deep Purple
      6: '#3F51B5', // Đang đóng hàng - Indigo
      7: '#009688', // Đã đóng hàng - Teal
      8: '#795548', // Đang về cảng - Brown
      9: '#4CAF50'  // Hoàn thành - Green
    };
    return colorMap[status] || '#757575';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN');
  };

  const formatTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleTimeString('vi-VN', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

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

      await updateCombinedOrderStatus(order.connectionId, userId, uploadedImgUrl, note);

      Alert.alert('Thành công', 'Cập nhật trạng thái thành công!');
      setModalVisible(false);
      setImages([]);
      setNote('');

      if (onStatusUpdated) {
        onStatusUpdated();
      }
    } catch (error) {
      console.error('Failed to update status:', error);
      Alert.alert('Lỗi', 'Không thể cập nhật trạng thái. Vui lòng thử lại.');
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="layers-outline" size={20} color="#0066CC" />
          <Text style={styles.orderType}>Đơn hàng ghép</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(status) }]}>
          <Text style={styles.statusText}>{getStatusText(status)}</Text>
        </View>
      </View>

      {/* Delivery Order Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🚚 Đơn giao hàng</Text>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Khách hàng:</Text>
          <Text style={styles.value}>{customerNames.delivery}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Container:</Text>
          <Text style={styles.value}>{deliveryOrder.containerNumber}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Điểm giao:</Text>
          <Text style={[styles.value, { fontSize: 12 }]} numberOfLines={2}>
            {loadingAddress ? 'Đang tải...' : addresses.delivery}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Ngày giao:</Text>
          <Text style={styles.value}>{formatDate(deliveryOrder.deliveryDate)}</Text>
        </View>
      </View>

      {/* Packing Order Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📦 Đơn đóng hàng</Text>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Khách hàng:</Text>
          <Text style={styles.value}>{customerNames.packing}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Hàng hóa:</Text>
          <Text style={styles.value}>{packingOrder.item}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Điểm đóng:</Text>
          <Text style={[styles.value, { fontSize: 12 }]} numberOfLines={2}>
            {loadingAddress ? 'Đang tải...' : addresses.packing}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Ngày đóng:</Text>
          <Text style={styles.value}>{formatDate(packingOrder.packingDate)}</Text>
        </View>
      </View>


      {/* Hiển thị nút cập nhật chỉ khi chưa hoàn thành */}
      {status !== 9 && (
        <TouchableOpacity 
          style={styles.updateButton} 
          onPress={() => setModalVisible(true)}
        >
          <Text style={styles.updateButtonText}>
            Cập nhật trạng thái
          </Text>
        </TouchableOpacity>
      )}

      {/* Modal for status update */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              Cập nhật 
            </Text>
            
            <TextInput
              style={styles.input}
              placeholder="Ghi chú (tùy chọn)"
              value={note}
              onChangeText={setNote}
              multiline
            />

            {/* Image selection buttons */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <TouchableOpacity style={[styles.addButton, { flex: 1, marginRight: 5 }]} onPress={pickImage}>
                <Ionicons name="image-outline" size={16} color="#fff" />
                <Text style={styles.addButtonText}>Chọn ảnh</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.addButton, { flex: 1, marginLeft: 5 }]} onPress={takePhoto}>
                <Ionicons name="camera-outline" size={16} color="#fff" />
                <Text style={styles.addButtonText}>Chụp ảnh</Text>
              </TouchableOpacity>
            </View>

            {/* Display selected images */}
            <ScrollView horizontal style={styles.imagePreviewContainer}>
              {images.map((uri, index) => (
                <View key={index} style={styles.imagePreview}>
                  <Image source={{ uri }} style={styles.image} />
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => removeImage(uri)}
                  >
                    <Ionicons name="close-circle" size={20} color="#ff4444" />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]} 
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Hủy</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.confirmButton]} 
                onPress={handleUpdateStatus}
              >
                <Text style={styles.confirmButtonText}>
                  Cập nhật 
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'column', // Giữ column vì CombinedOrderCard có nhiều sections
    backgroundColor: '#FFF',
    marginBottom: 14,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    overflow: 'hidden',
    marginHorizontal: 16,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#0066CC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  orderType: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0066CC',
    marginLeft: 8,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  section: {
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  label: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  value: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    flex: 2,
    textAlign: 'right',
  },
  updateButton: {
    backgroundColor: '#0066CC',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  updateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
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
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderRadius: 8,
    marginTop: 10,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 8,
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: 'bold',
  },
  confirmButton: {
    backgroundColor: '#0066CC',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default CombinedOrderCard;