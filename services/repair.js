import axios from 'axios';
import { axiosJWT, API_BASE_URL } from './user';

export const createRepair = async (repairData) => {
  try {
    const response = await axiosJWT.post(`${API_BASE_URL}/repairs`, repairData);
    return response.data;
  } catch (error) {
    console.error('Error creating repair:', error);
    throw error;
  }
};

export const updateRepair = async (id, repairData) => {
  try {
    const response = await axiosJWT.put(`${API_BASE_URL}/repairs/${id}`, repairData);
    return response.data;
  } catch (error) {
    console.error('Error updating repair:', error);
    throw error;
  }
};

export const deleteRepair = async (id) => {
  try {
    const response = await axiosJWT.delete(`${API_BASE_URL}/repairs/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting repair:', error);
    throw error;
  }
};

export const getRepairsByUserId = async (userId) => {
  try {
    const response = await axiosJWT.get(`${API_BASE_URL}/repairs/user/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching repairs by user:', error);
    throw error;
  }
};
