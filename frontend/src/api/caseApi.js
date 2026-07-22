import axiosInstance from './axiosInstance';
import { API_PATHS } from '../constants/apiPaths';

export const getCases = async (params = {}) => {
  const response = await axiosInstance.get(API_PATHS.CASES.LIST, { params });
  return response.data;
};

export const getCaseDetail = async (caseId) => {
  const response = await axiosInstance.get(API_PATHS.CASES.DETAIL(caseId));
  return response.data;
};

export const deleteCase = async (caseId) => {
  const response = await axiosInstance.delete(API_PATHS.CASES.DETAIL(caseId));
  return response.data;
};

export const getDuplicateCase = async (caseId) => {
  const response = await axiosInstance.get(API_PATHS.CASES.DUPLICATE(caseId));
  return response.data;
};
