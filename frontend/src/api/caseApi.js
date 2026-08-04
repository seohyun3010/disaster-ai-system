import axiosInstance, { API_BASE_URL } from './axiosInstance';
import { API_PATHS } from '../constants/apiPaths';
import {
  CASES,
  getDisasterEventIdForCase,
  getMockCaseByRouteId,
  mergeBackendAndMockCases,
  validateMergedCases,
} from '../mocks/cases';

const STATUS_LABELS = {
  RECEIVED: '접수',
  AI_PENDING: 'AI 분석 중',
  AI_COMPLETED: '검토 대기',
  COMPLETED: '처리 완료',
  IN_REVIEW: '심사 진행',
  APPROVED: '최종 승인',
  REJECTED: '반려',
  HOLD: '보류',
};

const DISASTER_LABELS = {
  HEAVY_RAIN: '집중호우',
  TYPHOON: '산사태',
  LANDSLIDE: '산사태',
  EARTHQUAKE: '지진',
  HEAVY_SNOW: '대설',
  WILDFIRE: '산불',
};

const FACILITY_LABELS = {
  HOUSE: '주택',
  ROAD: '도로',
  RETAINING_WALL: '옹벽',
  STORE: '상가',
  FARMLAND: '농경지',
  LIVESTOCK_FACILITY: '축사',
  FACTORY: '공장',
  FOREST: '임야',
  WAREHOUSE: '창고',
  GREENHOUSE: '비닐하우스',
  EMBANKMENT: '축대',
};

const PRIORITY_LABELS = {
  URGENT: '긴급',
  HIGH: '높음',
  NORMAL: '보통',
  LOW: '낮음',
};

const toAssetUrl = (value) => {
  if (!value) return null;
  if (/^https?:\/\//i.test(value)) return value;
  return new URL(value, `${API_BASE_URL}/`).href;
};

const formatDateTime = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
};

export const normalizeCase = (data) => {
  const rawPayload = data.raw_payload || {};
  const displayStatus = STATUS_LABELS[data.status] || data.status || '상태 미정';
  const disasterEventId = getDisasterEventIdForCase(data);
  const images = (data.images || []).map((image, index) => ({
    ...image,
    name: image.image_url?.split('/').at(-1) || `피해 사진 ${index + 1}`,
    url: toAssetUrl(image.image_url),
    thumbnailUrl: toAssetUrl(image.thumbnail_url),
  }));

  return {
    ...data,
    id: String(data.case_id),
    frontendKey: `backend-${data.case_id}`,
    disaster_event_id: disasterEventId,
    frontendDisasterKey: disasterEventId,
    __source: 'backend',
    caseId: data.case_id,
    caseNumber: data.case_number,
    reporter:
      data.reporter_name ||
      rawPayload.reporter_name ||
      rawPayload.applicant_name ||
      rawPayload.reporter ||
      '신고자 미제공',
    type: DISASTER_LABELS[data.disaster_type] || data.disaster_type || '기타',
    facility: FACILITY_LABELS[data.facility_type] || data.facility_type || '기타',
    location: data.address || '-',
    reportedAt: formatDateTime(data.reported_at || data.received_at),
    status: displayStatus,
    displayStatus,
    urgency: PRIORITY_LABELS[data.priority] || data.priority || '보통',
    urgencyScore: rawPayload.urgency_score ?? null,
    duplicate: Boolean(data.duplicate_suspected),
    damage: rawPayload.damage_grade || '확인 전',
    externalReport: rawPayload,
    representativeImageUrl: toAssetUrl(data.representative_image_url),
    photos: images,
    isDetail: Array.isArray(data.images),
  };
};

export const createCase = async (data) => {
  const response = await axiosInstance.post(API_PATHS.CASES.LIST, data);
  return normalizeCase(response.data);
};

export const getCases = async (params = {}) => {
  try {
    const requestLimit = Math.min(100, Math.max(1, Number(params.limit) || 100));
    const initialOffset = Math.max(0, Number(params.offset) || 0);
    const backendParams = {
      ...params,
      limit: requestLimit,
      offset: initialOffset,
    };
    const response = await axiosInstance.get(API_PATHS.CASES.LIST, { params: backendParams });
    const firstPage = response.data.items || [];
    const backendTotal = Number(response.data.total) || firstPage.length;
    const rawBackendCases = [...firstPage];

    while (rawBackendCases.length < backendTotal) {
      const nextResponse = await axiosInstance.get(API_PATHS.CASES.LIST, {
        params: {
          ...backendParams,
          limit: requestLimit,
          offset: initialOffset + rawBackendCases.length,
        },
      });
      const nextItems = nextResponse.data.items || [];
      if (!nextItems.length) break;
      rawBackendCases.push(...nextItems);
    }

    const backendCases = rawBackendCases
      .map(normalizeCase)
      .sort((left, right) => (
        String(right.reported_at || right.received_at || '').localeCompare(
          String(left.reported_at || left.received_at || ''),
        )
      ));
    const merged = mergeBackendAndMockCases(backendCases);
    if (import.meta.env?.DEV) validateMergedCases(merged.items);

    return {
      ...response.data,
      items: merged.items,
      total: merged.items.length,
      backendTotal: backendCases.length,
      mockTotal: merged.mockCases.length,
      backendCountsByDisaster: merged.backendCounts,
    };
  } catch (error) {
    if (!import.meta.env?.DEV) throw error;
    return {
      items: [...CASES],
      total: CASES.length,
      backendTotal: 0,
      mockTotal: CASES.length,
      backendError: error,
    };
  }
};

export const getCaseDetail = async (caseId) => {
  const mockCase = getMockCaseByRouteId(caseId);
  if (mockCase) return mockCase;
  const response = await axiosInstance.get(API_PATHS.CASES.DETAIL(caseId));
  return normalizeCase(response.data);
};
