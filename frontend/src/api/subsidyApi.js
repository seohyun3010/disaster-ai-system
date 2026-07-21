import axiosInstance from './axiosInstance';
import { API_PATHS } from '../constants/apiPaths';

export const calculateSubsidy = async (data) => {
  const response = await axiosInstance.post(API_PATHS.SUBSIDY.CALCULATE, data);
  return response.data;
};

export const getDuplicateSubsidy = async (caseId) => {
  const response = await axiosInstance.get(API_PATHS.SUBSIDY.DUPLICATE(caseId));
  return response.data;
};

export const confirmSubsidy = async (data) => {
  const response = await axiosInstance.post(API_PATHS.SUBSIDY.CONFIRM, data);
  return response.data;
};
