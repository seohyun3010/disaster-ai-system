import axiosInstance from './axiosInstance';
import { API_PATHS } from '../constants/apiPaths';

export const calculateSeverity = async (data) => {
  const response = await axiosInstance.post(API_PATHS.SEVERITY.CALCULATE, data);
  return response.data;
};

export const getSeverity = async (caseId) => {
  const response = await axiosInstance.get(API_PATHS.SEVERITY.DETAIL(caseId));
  return response.data;
};
