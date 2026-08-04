import axiosInstance from './axiosInstance';

/**
 * 편람 조항 검색
 * 시설유형으로 적용 범위를 좁히고, 피해등급 기준으로 상위 N건을 인출합니다.
 */
export const searchPolicyDocuments = async (params = {}) => {
  const response = await axiosInstance.get('/api/rag/documents', {
    params: {
      caseId: params.caseId ?? undefined,
      damageGrade: params.damageGrade ?? undefined,
      facilityType: params.facilityType ?? 'house',
      limit: params.limit ?? 5,
    },
  });
  return response.data;
};

const notConnected = () => {
  throw new Error('RAG API is not connected yet.');
};

export const calculateSeverity = notConnected;
export const getSeverity = notConnected;
export const getPolicyVersions = notConnected;