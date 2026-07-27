export const generateReport = async (data) => {
  return { ...data, reportId: `MOCK-REPORT-${Date.now()}`, mock: true };
  /* TODO(BE): const response = await axiosInstance.post(API_PATHS.REPORT.GENERATE, data); return response.data; */
};

export const getReport = async (reportId) => {
  return { reportId, status: 'draft', mock: true };
  /* TODO(BE): const response = await axiosInstance.get(API_PATHS.REPORT.DETAIL(reportId)); return response.data; */
};

export const downloadReport = async (reportId) => {
  return { reportId, downloadable: false, mock: true };
  /* TODO(BE):
  const response = await axiosInstance.get(API_PATHS.REPORT.DOWNLOAD(reportId), {
    responseType: 'blob',
  });
  return response.data;
  */
};

/*
TODO(BE): 백엔드 연동 시 파일 상단에 추가합니다.
import axiosInstance from './axiosInstance';
import { API_PATHS } from '../constants/apiPaths';
*/
