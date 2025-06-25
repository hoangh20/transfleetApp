import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Button,
  Image,
  TextInput,
  Alert,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { launchImageLibrary } from 'react-native-image-picker';

const RepairScreen = () => {
  const [repairList, setRepairList] = useState([
    {
      id: '1',
      type: 'Thay dầu',
      description: 'Cần thay dầu gấp trước chuyến đi xa',
      image: 'https://via.placeholder.com/150',
      status: 'Đang chờ',
    },
    {
      id: '2',
      type: 'Sửa phanh',
      description: 'Phanh kêu lạ khi bóp mạnh',
      image: 'https://via.placeholder.com/150',
      status: 'Đang xử lý',
    },
    {
      id: '3',
      type: 'Bảo dưỡng định kỳ',
      description: '',
      image: 'https://via.placeholder.com/150',
      status: 'Đã hoàn thành',
    },
  ]);

  const [repairType, setRepairType] = useState('');
  const [imageUri, setImageUri] = useState(null);
  const [description, setDescription] = useState('');

  const handleAddRepair = () => {
    if (!repairType || !imageUri) {
      Alert.alert('Thông báo', 'Vui lòng chọn loại sửa chữa và ảnh');
      return;
    }

    const newRepair = {
      id: Date.now().toString(),
      type: repairType,
      image: imageUri,
      description: description.trim(),
      status: 'Đang chờ',
    };

    setRepairList([newRepair, ...repairList]);
    setRepairType('');
    setImageUri(null);
    setDescription('');
  };

  const handleChooseImage = () => {
    launchImageLibrary({ mediaType: 'photo' }, (response) => {
      if (response.didCancel) return;
      if (response.errorCode) {
        Alert.alert('Lỗi', 'Không thể chọn ảnh');
        return;
      }
      if (response.assets && response.assets.length > 0) {
        setImageUri(response.assets[0].uri);
      }
    });
  };

  const renderRepairItem = ({ item }) => (
    <View style={styles.repairItem}>
      <Text style={styles.itemText}>🔧 Loại: {item.type}</Text>
      <Text style={styles.itemText}>📝 Mô tả: {item.description || '(Không có)'}</Text>
      <Text style={[styles.status, getStatusStyle(item.status)]}>📌 Trạng thái: {item.status}</Text>
      {item.image && (
        <Image source={{ uri: item.image }} style={styles.imagePreview} />
      )}
    </View>
  );

  const getStatusStyle = (status) => {
    switch (status) {
      case 'Đang xử lý':
        return { color: '#FFA500' };
      case 'Đã hoàn thành':
        return { color: 'green' };
      case 'Đang chờ':
      default:
        return { color: 'red' };
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Yêu cầu sửa chữa</Text>

      <View style={styles.form}>
        <Text style={styles.label}>Loại sửa chữa</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={repairType}
            onValueChange={(value) => setRepairType(value)}
          >
            <Picker.Item label="-- Chọn loại --" value="" />
            <Picker.Item label="Thay dầu" value="Thay dầu" />
            <Picker.Item label="Bảo dưỡng định kỳ" value="Bảo dưỡng định kỳ" />
            <Picker.Item label="Sửa phanh" value="Sửa phanh" />
            <Picker.Item label="Khác" value="Khác" />
          </Picker>
        </View>

        <Text style={styles.label}>Mô tả</Text>
        <TextInput
          style={styles.input}
          placeholder="Nhập mô tả..."
          value={description}
          onChangeText={setDescription}
          multiline
        />

        <Button title="Chọn ảnh" onPress={handleChooseImage} />
        {imageUri && <Image source={{ uri: imageUri }} style={styles.imagePreview} />}

        <View style={{ marginTop: 10 }}>
          <Button title="Thêm yêu cầu" onPress={handleAddRepair} />
        </View>
      </View>

      <Text style={styles.sectionTitle}>Danh sách yêu cầu đã gửi</Text>
      <FlatList
        data={repairList}
        keyExtractor={(item) => item.id}
        renderItem={renderRepairItem}
        ListEmptyComponent={
          <Text style={{ textAlign: 'center', marginTop: 10 }}>Chưa có yêu cầu nào</Text>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0047AB',
    marginBottom: 12,
    textAlign: 'center',
  },
  form: {
    backgroundColor: '#f2f2f2',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  label: {
    fontWeight: 'bold',
    marginTop: 8,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    marginTop: 4,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ccc',
    marginBottom: 8,
    minHeight: 50,
  },
  imagePreview: {
    width: '100%',
    height: 180,
    marginTop: 8,
    borderRadius: 6,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  repairItem: {
    backgroundColor: '#e6f0ff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
  itemText: {
    marginBottom: 4,
  },
  status: {
    fontWeight: 'bold',
    marginBottom: 6,
  },
});

export default RepairScreen;
