export const searchPolicyDocuments = async () => {
  return [];
  /* TODO(BE): const response = await axiosInstance.get(API_PATHS.RAG.DOCUMENTS, { params }); return response.data; */
};

export const calculateSeverity = async (data) => {
  return { ...data, mock: true };
  /* TODO(BE): const response = await axiosInstance.post(API_PATHS.RAG.CALCULATE, data); return response.data; */
};

export const getSeverity = async (caseId) => {
  return { caseId, scores: null, mock: true };
  /* TODO(BE): const response = await axiosInstance.get(API_PATHS.RAG.SEVERITY(caseId)); return response.data; */
};

export const getPolicyVersions = async () => {
  return [];
  /* TODO(BE): const response = await axiosInstance.get(API_PATHS.RAG.POLICY_VERSIONS, { params }); return response.data; */
};

/*
TODO(BE): 백엔드 연동 시 파일 상단에 추가합니다.
import axiosInstance from './axiosInstance';
import { API_PATHS } from '../constants/apiPaths';
*/
