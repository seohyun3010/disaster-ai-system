export const calculateSubsidy = async (data) => {
  return { ...data, mock: true };
  /* TODO(BE): const response = await axiosInstance.post(API_PATHS.SUBSIDY.CALCULATE, data); return response.data; */
};

export const getDuplicateSubsidy = async (caseId) => {
  return { caseId, duplicate: false, mock: true };
  /* TODO(BE): const response = await axiosInstance.get(API_PATHS.SUBSIDY.DUPLICATE(caseId)); return response.data; */
};

export const confirmSubsidy = async (data) => {
  return { ...data, confirmed: true, mock: true };
  /* TODO(BE): const response = await axiosInstance.post(API_PATHS.SUBSIDY.CONFIRM, data); return response.data; */
};

export const getSubsidyHistory = async () => {
  return [];
  /* TODO(BE): const response = await axiosInstance.get(API_PATHS.SUBSIDY.HISTORY(caseId), { params }); return response.data; */
};

/*
TODO(BE): 백엔드 연동 시 파일 상단에 추가합니다.
import axiosInstance from './axiosInstance';
import { API_PATHS } from '../constants/apiPaths';
*/
