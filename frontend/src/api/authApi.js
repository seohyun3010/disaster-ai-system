import axiosInstance from './axiosInstance';
import { API_PATHS } from '../constants/apiPaths';

export const login = async (credentials) => {
  const response = await axiosInstance.post(API_PATHS.AUTH.LOGIN, credentials);
  return response.data;
};

export const logout = async () => {
  const response = await axiosInstance.post(API_PATHS.AUTH.LOGOUT);
  return response.data;
};

export const getMe = async () => {
  const response = await axiosInstance.get(API_PATHS.AUTH.ME);
  return response.data;
};
