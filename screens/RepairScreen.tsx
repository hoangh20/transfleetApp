import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  Alert,
  ScrollView,
  ActivityIndicator,
  Platform,
  Modal,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { createRepair, getRepairsByUserId, deleteRepair } from '@/services/repair';

const RepairScreen = () => {
  const [repairList, setRepairList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState('');
  
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  const [repairType, setRepairType] = useState('');
  const [description, setDescription] = useState('');
  const [cost, setCost] = useState('');
  const [images, setImages] = useState([]);

  useEffect(() => {
    fetchRepairs();
  }, []);

  const fetchRepairs = async () => {
    try {
      setLoading(true);
      const user = await AsyncStorage.getItem('user');
      const parsedUser = user ? JSON.parse(user) : null;
      const userId = parsedUser?.id;
      
      if (!userId) {
        Alert.alert('Lỗi', 'Không tìm thấy thông tin người dùng');
        return;
      }

      const response = await getRepairsByUserId(userId);
      setRepairList(response.data || []);
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể tải danh sách yêu cầu sửa chữa');
    } finally {
      setLoading(false);
    }
  };


  const resetForm = () => {
    setRepairType('');
    setDescription('');
    setCost('');
    setImages([]);
  };

  const closeModal = () => {
    setModalVisible(false);
    resetForm();
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
    if (images.length === 0) return []; 
    
    try {
      const uploadPromises = images.map(async (uri) => {
        const formData = new FormData();
        formData.append('upload_preset', 'updateStatus');
        formData.append('cloud_name', 'transfleet');
        
        if (Platform.OS === 'web') {
          const response = await fetch(uri);
          const blob = await response.blob();
          const filename = uri.split('/').pop() || `repair_${Date.now()}.jpg`;
          const file = new File([blob], filename, { type: blob.type });
          formData.append('file', file);
        } else {
          const filename = uri.split('/').pop() || `repair_${Date.now()}.jpg`;
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
      return results;
    } catch (error) {
      console.error('Lỗi upload ảnh:', error);
      throw new Error('Không thể upload ảnh: ' + error.message);
    }
  };

  const handleAddRepair = async () => {
    if (!repairType || !description) {
      Alert.alert('Thông báo', 'Vui lòng điền đầy đủ thông tin');
      return;
    }

    try {
      setSubmitting(true);
      
      const user = await AsyncStorage.getItem('user');
      const parsedUser = user ? JSON.parse(user) : null;
      const userId = parsedUser?.id;
      
      if (!userId) {
        Alert.alert('Lỗi', 'Không tìm thấy thông tin người dùng');
        return;
      }

      const driverVehicleDetails = await AsyncStorage.getItem('driverVehicleDetails');
      const vehicleInfo = driverVehicleDetails ? JSON.parse(driverVehicleDetails) : null;
      const vehicleId = vehicleInfo?.vehicle?._id;

      if (!vehicleId) {
        Alert.alert('Lỗi', 'Không tìm thấy thông tin xe');
        return;
      }

      const uploadedImages = await uploadImagesToCloudinary();

      const repairData = {
        userId,
        VehicleId: vehicleId,
        description,

        repairType: parseInt(repairType),
        images: uploadedImages
      };

      await createRepair(repairData);
      
      Alert.alert('Thành công', 'Yêu cầu sửa chữa đã được gửi!');
      
      closeModal();

      fetchRepairs();
      
    } catch (error) {
      console.error('Failed to create repair:', error);
      Alert.alert('Lỗi', 'Không thể gửi yêu cầu sửa chữa');
    } finally {
      setSubmitting(false);
    }
  };

  // Thêm hàm xóa repair với log để debug
  const handleDeleteRepair = (repairId) => {
    console.log('Delete repair called with ID:', repairId); // Debug log
    setItemToDelete(repairId);
    setDeleteModalVisible(true);
  };

  // Hàm xác nhận xóa
  const confirmDelete = async () => {
    if (!itemToDelete) return;
    
    try {
      console.log('Deleting repair with ID:', itemToDelete); // Debug log
      await deleteRepair(itemToDelete);
      
      setDeleteModalVisible(false);
      setItemToDelete(null);
      
      Alert.alert('Thành công', 'Đã xóa yêu cầu sửa chữa');
      await fetchRepairs(); // Refresh list
    } catch (error) {
      console.error('Failed to delete repair:', error);
      Alert.alert('Lỗi', 'Không thể xóa yêu cầu sửa chữa: ' + error.message);
      setDeleteModalVisible(false);
      setItemToDelete(null);
    }
  };

  // Hàm hủy xóa
  const cancelDelete = () => {
    setDeleteModalVisible(false);
    setItemToDelete(null);
  };

  const getRepairTypeText = (type) => {
    const typeMap = {
      0: 'Bảo dưỡng',
      1: 'Sửa chữa', 
      2: 'Thay thế',
      3: 'Nâng cấp'
    };
    return typeMap[type] || 'Không xác định';
  };

  const getStatusText = (status) => {
    const statusMap = {
      0: 'Chờ xác nhận',
      1: 'Đã có báo giá',
      2: 'Chấp nhận',
      3: 'Hoàn thành',
      4: 'Hủy'
    };
    return statusMap[status] || 'Không xác định';
  };

  const getStatusColor = (status) => {
    const colorMap = {
      0: '#FFA500', // Chờ xác nhận - Orange
      1: '#007BFF', // Đã có báo giá - Blue
      2: '#28A745', // Chấp nhận - Green
      3: '#6C757D', // Hoàn thành - Gray
      4: '#DC3545'  // Hủy - Red
    };
    return colorMap[status] || '#6C757D';
  };

  // Hàm mở modal xem ảnh
  const openImageViewer = (imageUrl) => {
    setSelectedImage(imageUrl);
    setImageViewerVisible(true);
  };

  // Hàm đóng modal xem ảnh
  const closeImageViewer = () => {
    setImageViewerVisible(false);
    setSelectedImage('');
  };

  const renderRepairItem = ({ item }) => (
    <View style={styles.repairItem}>
      <View style={styles.repairHeader}>
        <Text style={styles.repairType}>🔧 {getRepairTypeText(item.repairType)}</Text>
        <View style={styles.repairHeaderRight}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
          </View>
          {/* Hiển thị nút xóa khi status = 0 với debugging */}
          {item.status === 0 && (
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => {
                console.log('Delete button pressed for item:', item._id, 'status:', item.status);
                handleDeleteRepair(item._id);
              }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} // Tăng vùng nhấn
            >
              <Ionicons name="trash-outline" size={18} color="#DC3545" />
            </TouchableOpacity>
          )}
        </View>
      </View>
      
      <Text style={styles.itemText}>📝 Mô tả: {item.description}</Text>
      {/* Hiển thị cost với logic null check */}
      <Text style={styles.itemText}>
        💰 Chi phí: {item.cost === null || item.cost === undefined ? 'Chưa có' : `${item.cost?.toLocaleString('vi-VN')} VND`}
      </Text>
      {item.quotedCost && (
        <Text style={styles.itemText}>💵 Báo giá: {item.quotedCost?.toLocaleString('vi-VN')} VND</Text>
      )}
      <Text style={styles.itemText}>📅 Ngày tạo: {new Date(item.Date).toLocaleDateString('vi-VN')}</Text>
      
      {item.images && item.images.length > 0 && (
        <ScrollView horizontal style={styles.imageContainer}>
          {item.images.map((imageUrl, index) => (
            <TouchableOpacity key={index} onPress={() => openImageViewer(imageUrl)}>
              <Image source={{ uri: imageUrl }} style={styles.repairImage} />
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0047AB" />
        <Text>Đang tải...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header với nút tạo yêu cầu */}
      <View style={styles.header}>
        <Text style={styles.title}>Yêu cầu sửa chữa</Text>
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => setModalVisible(true)}
        >
          <Ionicons name="add-circle-outline" size={20} color="#FFF" />
          <Text style={styles.createButtonText}>Tạo yêu cầu</Text>
        </TouchableOpacity>
      </View>

      {/* Danh sách yêu cầu */}
      <FlatList
        data={repairList}
        keyExtractor={(item) => item._id}
        renderItem={renderRepairItem}
        contentContainerStyle={{ paddingBottom: 20 }}
        ListEmptyComponent={
          <Text style={styles.emptyText}>Chưa có yêu cầu nào</Text>
        }
      />

      {/* Modal tạo yêu cầu mới */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={closeModal}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Tạo yêu cầu sửa chữa</Text>
                <TouchableOpacity onPress={closeModal}>
                  <Ionicons name="close-circle" size={28} color="#999" />
                </TouchableOpacity>
              </View>

              <View style={styles.form}>
                <Text style={styles.label}>Loại sửa chữa</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={repairType}
                    onValueChange={(value) => setRepairType(value)}
                  >
                    <Picker.Item label="-- Chọn loại --" value="" />
                    <Picker.Item label="Bảo dưỡng" value="0" />
                    <Picker.Item label="Sửa chữa" value="1" />
                    <Picker.Item label="Thay thế" value="2" />
                    <Picker.Item label="Nâng cấp" value="3" />
                  </Picker>
                </View>

                <Text style={styles.label}>Mô tả</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Nhập mô tả chi tiết..."
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  numberOfLines={3}
                />

                <Text style={styles.label}>Hình ảnh</Text>
                <View style={styles.imageButtonContainer}>
                  <TouchableOpacity style={[styles.imageButton, { marginRight: 8 }]} onPress={pickImage}>
                    <Ionicons name="image-outline" size={16} color="#FFF" />
                    <Text style={styles.imageButtonText}>Chọn ảnh</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.imageButton} onPress={takePhoto}>
                    <Ionicons name="camera-outline" size={16} color="#FFF" />
                    <Text style={styles.imageButtonText}>Chụp ảnh</Text>
                  </TouchableOpacity>
                </View>

                {images.length > 0 && (
                  <ScrollView horizontal style={styles.imagePreviewContainer}>
                    {images.map((uri, index) => (
                      <View key={index} style={styles.imagePreview}>
                        <TouchableOpacity onPress={() => openImageViewer(uri)}>
                          <Image source={{ uri }} style={styles.previewImage} />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.removeButton}
                          onPress={() => removeImage(uri)}
                        >
                          <Ionicons name="close-circle" size={20} color="#FF4444" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </ScrollView>
                )}

                <View style={styles.modalButtons}>
                  <TouchableOpacity 
                    style={[styles.modalButton, styles.cancelModalButton]} 
                    onPress={closeModal}
                  >
                    <Text style={styles.cancelButtonText}>Hủy</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.modalButton, styles.submitButton, submitting && styles.disabledButton]} 
                    onPress={handleAddRepair}
                    disabled={submitting}
                  >
                    {submitting ? (
                      <ActivityIndicator size="small" color="#FFF" />
                    ) : (
                      <Text style={styles.submitButtonText}>Gửi yêu cầu</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal xác nhận xóa */}
      <Modal
        visible={deleteModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={cancelDelete}
      >
        <View style={styles.deleteModalContainer}>
          <View style={styles.deleteModalContent}>
            <Text style={styles.deleteModalTitle}>Xác nhận xóa</Text>
            <Text style={styles.deleteModalText}>
              Bạn có chắc chắn muốn xóa yêu cầu sửa chữa này?
            </Text>
            
            <View style={styles.deleteModalButtons}>
              <TouchableOpacity 
                style={[styles.deleteModalButton, styles.cancelButton]} 
                onPress={cancelDelete}
              >
                <Text style={styles.cancelButtonText}>Hủy</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.deleteModalButton, styles.confirmDeleteButton]} 
                onPress={confirmDelete}
              >
                <Text style={styles.confirmDeleteButtonText}>Xóa</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal xem ảnh phóng to */}
      <Modal
        visible={imageViewerVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={closeImageViewer}
      >
        <View style={styles.imageViewerContainer}>
          <TouchableOpacity 
            style={styles.imageViewerOverlay} 
            onPress={closeImageViewer}
            activeOpacity={1}
          >
            <View style={styles.imageViewerContent}>
              <TouchableOpacity 
                style={styles.closeImageButton}
                onPress={closeImageViewer}
              >
                <Ionicons name="close-circle" size={32} color="#FFF" />
              </TouchableOpacity>
              <Image 
                source={{ uri: selectedImage }} 
                style={styles.fullScreenImage}
                resizeMode="contain"
              />
            </View>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0047AB',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#28A745',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  createButtonText: {
    color: '#FFF',
    fontWeight: '600',
    marginLeft: 4,
    fontSize: 14,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  form: {
    flex: 1,
  },
  label: {
    fontWeight: 'bold',
    marginTop: 8,
    marginBottom: 4,
    color: '#333',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  input: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ccc',
    marginBottom: 12,
    fontSize: 16,
  },
  imageButtonContainer: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  imageButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007BFF',
    paddingVertical: 10,
    borderRadius: 6,
  },
  imageButtonText: {
    color: '#FFF',
    fontWeight: '600',
    marginLeft: 4,
  },
  imagePreviewContainer: {
    marginBottom: 12,
  },
  imagePreview: {
    position: 'relative',
    marginRight: 10,
  },
  previewImage: {
    width: 80,
    height: 80,
    borderRadius: 6,
  },
  removeButton: {
    position: 'absolute',
    top: -5,
    right: -5,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  cancelModalButton: {
    backgroundColor: '#f0f0f0',
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: 'bold',
    fontSize: 16,
  },
  submitButton: {
    backgroundColor: '#28A745',
  },
  disabledButton: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  // Repair list styles
  repairItem: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    marginHorizontal: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#0047AB',
  },
  repairHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  repairType: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  itemText: {
    marginBottom: 4,
    fontSize: 14,
    color: '#555',
  },
  imageContainer: {
    marginTop: 8,
  },
  repairImage: {
    width: 60,
    height: 60,
    borderRadius: 6,
    marginRight: 8,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
    color: '#666',
  },
  repairHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deleteButton: {
    marginLeft: 8,
    padding: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(220, 53, 69, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 32,
    minHeight: 32,
  },
  // Image viewer styles
  imageViewerContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
  },
  imageViewerOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageViewerContent: {
    flex: 1,
    width: '100%',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeImageButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    padding: 4,
  },
  fullScreenImage: {
    width: '90%',
    height: '80%',
  },
  // Delete modal styles
  deleteModalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  deleteModalContent: {
    width: '80%',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  deleteModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  deleteModalText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  deleteModalButtons: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
  },
  deleteModalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: '600',
    fontSize: 16,
  },
  confirmDeleteButton: {
    backgroundColor: '#DC3545',
  },
  confirmDeleteButtonText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 16,
  },
});

export default RepairScreen;
