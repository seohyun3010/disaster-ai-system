import axiosInstance from './axiosInstance';
import { API_PATHS } from '../constants/apiPaths';

export const generateReport = async (data) => {
  const response = await axiosInstance.post(API_PATHS.REPORT.GENERATE, data);
  return response.data;
};

export const getReport = async (reportId) => {
  const response = await axiosInstance.get(API_PATHS.REPORT.DETAIL(reportId));
  return response.data;
};

export const downloadReport = async (reportId) => {
  const response = await axiosInstance.get(API_PATHS.REPORT.DOWNLOAD(reportId), {
    responseType: 'blob',
  });
  return response.data;
};
