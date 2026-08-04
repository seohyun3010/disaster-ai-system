import axiosInstance, { API_BASE_URL } from './axiosInstance';
import { API_PATHS } from '../constants/apiPaths';

const STATUS_LABELS = {
  RECEIVED: '접수 완료',
  AI_PENDING: 'AI 분석 대기',
  AI_COMPLETED: 'AI 분석 완료',
  COMPLETED: '처리 완료',
};

const DISASTER_LABELS = {
  HEAVY_RAIN: '집중호우',
  TYPHOON: '태풍',
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
  const images = (data.images || []).map((image, index) => ({
    ...image,
    name: image.image_url?.split('/').at(-1) || `피해 사진 ${index + 1}`,
    url: toAssetUrl(image.image_url),
    thumbnailUrl: toAssetUrl(image.thumbnail_url),
  }));

  return {
    ...data,
    id: String(data.case_id),
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
    status: STATUS_LABELS[data.status] || data.status || '상태 미정',
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
  const response = await axiosInstance.get(API_PATHS.CASES.LIST, { params });
  return {
    ...response.data,
    items: response.data.items.map(normalizeCase),
  };
};

export const getCaseDetail = async (caseId) => {
  const response = await axiosInstance.get(API_PATHS.CASES.DETAIL(caseId));
  return normalizeCase(response.data);
};
