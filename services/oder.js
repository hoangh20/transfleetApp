import axios from 'axios';
import { axiosJWT, API_BASE_URL } from './user';

export const getCurrentOrdersByUserId = async (userId, filter) => {
  const response = await axiosJWT.get(
    `${API_BASE_URL}/app/driver-orders/${userId}?filter=${filter}`
  );
  return response.data;
};

export const getCustomerById = async (id) => {
  const response = await axios.get(
    `${API_BASE_URL}/customers/${id}`,
  );
  return response.data;
};

export const fetchProvinceName = async (provinceCode) => {
  const response = await axios.get(`${API_BASE_URL}/provinces-vn/provinces/${provinceCode}`);
  return response.data.name || 'N/A';
};

export const fetchDistrictName = async (districtCode) => {
  const response = await axios.get(`${API_BASE_URL}/provinces-vn/districts/${districtCode}`);
  return response.data.name || 'N/A';
};

export const fetchWardName = async (wardCode) => {
  const respone = await axios.get(`${API_BASE_URL}/provinces-vn/wards/${wardCode}`);
  return respone.data.name || 'N/A';
};

export const updateDeliveryOrderStatus = async (orderId, userId, imgUrl, note) => {
  const response = await axiosJWT.put(
    `${API_BASE_URL}/orders/update-status-delivery/${orderId}`,
    { userId, imgUrl, note }
  );
  return response.data;
};

export const updatePackingOrderStatus = async (orderId, userId, imgUrl, note) => {
  const response = await axiosJWT.put(
    `${API_BASE_URL}/orders/update-status-packing/${orderId}`,
    { userId, imgUrl, note }
  );
  return response.data;
};