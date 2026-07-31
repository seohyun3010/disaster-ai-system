import axiosInstance from './axiosInstance';
import { API_PATHS } from '../constants/apiPaths';

export const calculateSubsidy = async (caseId) => {
  const response = await axiosInstance.post(
    API_PATHS.SUBSIDY.CALCULATE(caseId),
  );
  return response.data;
};

export const getSubsidy = async (caseId) => {
  const response = await axiosInstance.get(API_PATHS.SUBSIDY.DETAIL(caseId));
  return response.data;
};

export const confirmSubsidy = async (caseId, payload) => {
  const response = await axiosInstance.put(
    API_PATHS.SUBSIDY.CONFIRM(caseId),
    payload,
  );
  return response.data;
};

export const getDuplicateSubsidy = async () => {
  throw new Error(
    'Subsidy duplicate-check API is not implemented on backend yet.',
  );
};

export const getSubsidyHistory = async () => {
  throw new Error('Subsidy history API is not implemented on backend yet.');
};
