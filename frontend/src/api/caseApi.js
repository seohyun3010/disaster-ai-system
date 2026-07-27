import { CASES } from '../mocks/cases';

// 현재 신고 CRUD는 caseStore가 담당합니다. 아래 함수들은 Query 연동 대비 Mock입니다.
export const createCase = async (data) => {
  return { ...data, mock: true };
  /* TODO(BE): const response = await axiosInstance.post(API_PATHS.CASES.LIST, data); return response.data; */
};

export const getCases = async () => {
  return [...CASES];
  /* TODO(BE): const response = await axiosInstance.get(API_PATHS.CASES.LIST, { params }); return response.data; */
};

export const getCaseDetail = async (caseId) => {
  return CASES.find((item) => item.id === caseId) ?? null;
  /* TODO(BE): const response = await axiosInstance.get(API_PATHS.CASES.DETAIL(caseId)); return response.data; */
};

export const updateCase = async (caseId, data) => {
  return { ...data, id: caseId, mock: true };
  /* TODO(BE): const response = await axiosInstance.patch(API_PATHS.CASES.DETAIL(caseId), data); return response.data; */
};

export const deleteCase = async (caseId) => {
  return { caseId, deleted: true, mock: true };
  /* TODO(BE): const response = await axiosInstance.delete(API_PATHS.CASES.DETAIL(caseId)); return response.data; */
};

export const getDuplicateCase = async (caseId) => {
  return { caseId, duplicate: false, mock: true };
  /* TODO(BE): const response = await axiosInstance.get(API_PATHS.CASES.DUPLICATE(caseId)); return response.data; */
};

/*
TODO(BE): 백엔드 연동 시 파일 상단에 추가합니다.
import axiosInstance from './axiosInstance';
import { API_PATHS } from '../constants/apiPaths';
*/
