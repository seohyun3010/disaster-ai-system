import axiosInstance from './axiosInstance';
import { API_PATHS } from '../constants/apiPaths';

export const calculateSeverity = async (caseId) => {
  const response = await axiosInstance.post(
    API_PATHS.SEVERITY.CALCULATE(caseId),
  );
  return response.data;
};

export const getSeverity = async (caseId) => {
  const response = await axiosInstance.get(
    API_PATHS.SEVERITY.DETAIL(caseId),
  );
  return response.data;
};

export const saveManualSeverity = async (caseId, payload) => {
  const response = await axiosInstance.put(
    API_PATHS.SEVERITY.MANUAL(caseId),
    payload,
  );
  return response.data;
};
