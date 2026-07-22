import axiosInstance from './axiosInstance';
import { API_PATHS } from '../constants/apiPaths';

export const getDashboard = async (params = {}) => {
  const response = await axiosInstance.get(API_PATHS.DASHBOARD, { params });
  return response.data;
};
