import axiosInstance from './axiosInstance';
import { API_PATHS } from '../constants/apiPaths';

export const requestAiAnalysis = async (data) => {
  const response = await axiosInstance.post(API_PATHS.AI.JOBS, data);
  return response.data;
};

export const getAiResult = async (caseId) => {
  const response = await axiosInstance.get(API_PATHS.AI.RESULT(caseId));
  return response.data;
};
