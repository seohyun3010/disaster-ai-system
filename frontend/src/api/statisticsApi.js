import axiosInstance from './axiosInstance';
import { API_PATHS } from '../constants/apiPaths';

export const getDamageStatistics = async (params = {}) => {
  const response = await axiosInstance.get(API_PATHS.STATISTICS.DAMAGE, {
    params,
  });
  return response.data;
};
