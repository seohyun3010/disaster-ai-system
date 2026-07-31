// // Mock API 비활성화(2026-07-29)
// // 실제 백엔드 연동 전 원본을 줄 주석으로 보존합니다.
// // export const calculateSubsidy = async (data) => {
// //   return { ...data, mock: true };
// //   /* TODO(BE): const response = await axiosInstance.post(API_PATHS.SUBSIDY.CALCULATE, data); return response.data; */
// // };
// // 
// // export const getDuplicateSubsidy = async (caseId) => {
// //   return { caseId, duplicate: false, mock: true };
// //   /* TODO(BE): const response = await axiosInstance.get(API_PATHS.SUBSIDY.DUPLICATE(caseId)); return response.data; */
// // };
// // 
// // export const confirmSubsidy = async (data) => {
// //   return { ...data, confirmed: true, mock: true };
// //   /* TODO(BE): const response = await axiosInstance.post(API_PATHS.SUBSIDY.CONFIRM, data); return response.data; */
// // };
// // 
// // export const getSubsidyHistory = async () => {
// //   return [];
// //   /* TODO(BE): const response = await axiosInstance.get(API_PATHS.SUBSIDY.HISTORY(caseId), { params }); return response.data; */
// // };
// // 
// // /*
// // TODO(BE): 백엔드 연동 시 파일 상단에 추가합니다.
// // import axiosInstance from './axiosInstance';
// // import { API_PATHS } from '../constants/apiPaths';
// // */

// const notConnected = () => { throw new Error('Subsidy API is not connected yet.'); };
// export const calculateSubsidy = notConnected;
// export const getDuplicateSubsidy = notConnected;
// export const confirmSubsidy = notConnected;
// export const getSubsidyHistory = notConnected;

import axiosInstance from './axiosInstance';
import { API_PATHS } from '../constants/apiPaths';

export const calculateSubsidy = async (caseId) => {
  const response = await axiosInstance.post(API_PATHS.SUBSIDY.CALCULATE(caseId));
  return response.data;
};

export const getSubsidy = async (caseId) => {
  const response = await axiosInstance.get(API_PATHS.SUBSIDY.DETAIL(caseId));
  return response.data;
};

export const confirmSubsidy = async (caseId, payload) => {
  // payload: { estimated_amount, confirmed_amount, status }
  const response = await axiosInstance.put(API_PATHS.SUBSIDY.CONFIRM(caseId), payload);
  return response.data;
};

// ⚠️ 백엔드 미구현 — 담당자 확인 후 연결
export const getDuplicateSubsidy = async () => {
  throw new Error('Subsidy duplicate-check API is not implemented on backend yet.');
};

// ⚠️ 백엔드 미구현 — 담당자 확인 후 연결
export const getSubsidyHistory = async () => {
  throw new Error('Subsidy history API is not implemented on backend yet.');
};