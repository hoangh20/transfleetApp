import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL;

// Create a custom axios instance
const axiosJWT = axios.create();

// Add a request interceptor to include the access token in the headers
axiosJWT.interceptors.request.use(
  async (config) => {
    const accessToken = await AsyncStorage.getItem('access_token');
    if (accessToken) {
      config.headers['Authorization'] = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const signupUser = async (data) => {
  const response = await axios.post(`${API_BASE_URL}/user/sign-up`, data);
  return response.data;
};

export const signinUser = async (data) => {
  const response = await axios.post(`${API_BASE_URL}/user/sign-in`, data);
  return response.data;
};

export const getDetailsUser = async (id, access_token) => {
  const response = await axiosJWT.get(
    `${API_BASE_URL}/user/get-detail-user/${id}`,
    {
      headers: {
        token: `Bearer ${access_token}`,
      },
    }
  );
  return response.data;
};

export const refreshToken = async (access_token) => {
  const response = await axios.post(
    `${API_BASE_URL}/user/refresh-token`,
    {},
    {
      withCredentials: true,
      headers: {
        token: `Bearer ${access_token}`,
      },
    }
  );
  return response.data;
};

export const signoutUser = async () => {
  const response = await axios.post(`${API_BASE_URL}/user/sign-out`);
  return response.data;
};

export const getDriverAndVehicleByUserId = async (userId) => {
  const response = await axiosJWT.get(
    `${API_BASE_URL}/user/get-driver-vehicle/${userId}`
  );
  return response.data;
};