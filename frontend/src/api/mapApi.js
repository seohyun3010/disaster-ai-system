import axiosInstance from './axiosInstance';
import { API_PATHS } from '../constants/apiPaths';

export const getDisasterMap = async (params = {}) => {
  const response = await axiosInstance.get(API_PATHS.MAP.DISASTER, { params });
  return response.data;
};
