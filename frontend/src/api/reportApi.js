import axiosInstance from './axiosInstance';
import { API_PATHS } from '../constants/apiPaths';

export const generateReport = async (caseId, data = {}) => {
  const response = await axiosInstance.post(
    API_PATHS.REPORT.GENERATE(caseId),
    data,
  );
  return response.data;
};

export const getReportByCase = async (caseId) => {
  const response = await axiosInstance.get(
    API_PATHS.REPORT.CASE_DETAIL(caseId),
  );
  return response.data;
};

export const getReport = async (reportId) => {
  const response = await axiosInstance.get(
    API_PATHS.REPORT.DETAIL(reportId),
  );
  return response.data;
};

export const getReports = async (params = {}) => {
  const response = await axiosInstance.get(API_PATHS.REPORT.LIST, { params });
  return response.data;
};

export const downloadReport = async (
  reportId,
  fallbackFilename = 'final_report.pdf',
) => {
  const response = await axiosInstance.get(
    API_PATHS.REPORT.DOWNLOAD(reportId),
    { responseType: 'blob' },
  );
  const disposition = response.headers['content-disposition'] || '';
  const encodedName = disposition.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
  const filename = encodedName
    ? decodeURIComponent(encodedName)
    : fallbackFilename;
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
