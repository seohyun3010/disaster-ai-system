// Mock API 비활성화(2026-07-29)
// 실제 백엔드 연동 전 원본을 줄 주석으로 보존합니다.
// export const generateReport = async (data) => {
//   return { ...data, reportId: `MOCK-REPORT-${Date.now()}`, mock: true };
//   /* TODO(BE): const response = await axiosInstance.post(API_PATHS.REPORT.GENERATE, data); return response.data; */
// };
// 
// export const getReport = async (reportId) => {
//   return { reportId, status: 'draft', mock: true };
//   /* TODO(BE): const response = await axiosInstance.get(API_PATHS.REPORT.DETAIL(reportId)); return response.data; */
// };
// 
// export const downloadReport = async (reportId) => {
//   return { reportId, downloadable: false, mock: true };
//   /* TODO(BE):
//   const response = await axiosInstance.get(API_PATHS.REPORT.DOWNLOAD(reportId), {
//     responseType: 'blob',
//   });
//   return response.data;
//   */
// };
// 
// /*
// TODO(BE): 백엔드 연동 시 파일 상단에 추가합니다.
// import axiosInstance from './axiosInstance';
// import { API_PATHS } from '../constants/apiPaths';
// */

// 기존 비연동 함수는 삭제하지 않고 주석으로 보존합니다.
// const notConnected = () => { throw new Error('Report API is not connected yet.'); };
// export const generateReport = notConnected;
// export const getReport = notConnected;
// export const downloadReport = notConnected;

import axiosInstance from './axiosInstance';
import { API_PATHS } from '../constants/apiPaths';

export const generateReport = async (caseId, data = {}) => {
  const response = await axiosInstance.post(API_PATHS.REPORT.GENERATE(caseId), data);
  return response.data;
};

export const getReportByCase = async (caseId) => {
  const response = await axiosInstance.get(API_PATHS.REPORT.CASE_DETAIL(caseId));
  return response.data;
};

export const getReport = async (reportId) => {
  const response = await axiosInstance.get(API_PATHS.REPORT.DETAIL(reportId));
  return response.data;
};

export const getReports = async (params = {}) => {
  const response = await axiosInstance.get(API_PATHS.REPORT.LIST, { params });
  return response.data;
};

// 기존 기본 파일명: fallbackFilename = 'final_report.txt'
export const downloadReport = async (reportId, fallbackFilename = 'final_report.pdf') => {
  const response = await axiosInstance.get(API_PATHS.REPORT.DOWNLOAD(reportId), {
    responseType: 'blob',
  });
  const disposition = response.headers['content-disposition'] || '';
  const encodedName = disposition.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
  const filename = encodedName ? decodeURIComponent(encodedName) : fallbackFilename;
  const url = URL.createObjectURL(response.data);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
};

