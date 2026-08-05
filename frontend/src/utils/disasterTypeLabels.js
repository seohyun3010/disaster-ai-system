export const DISASTER_TYPE_LABELS = Object.freeze({
  HEAVY_RAIN: '집중호우',
  TYPHOON: '태풍',
  LANDSLIDE: '산사태',
  WILDFIRE: '산불',
  EARTHQUAKE: '지진',
  HEAVY_SNOW: '대설',
  FLOOD: '홍수',
  FOREST_FIRE: '산불',
  DROUGHT: '가뭄',
  STRONG_WIND: '강풍',
  WIND: '강풍',
  LIGHTNING: '낙뢰',
  OTHER: '기타',
});

export const FACILITY_TYPE_LABELS = Object.freeze({
  HOUSE: '주택',
  STORE: '상가',
  ROAD: '도로',
  FARMLAND: '농경지',
  LIVESTOCK_FACILITY: '축사',
  VINYL_HOUSE: '비닐하우스',
  GREENHOUSE: '비닐하우스',
  FARM_FACILITY: '농림시설',
  PUBLIC_FACILITY: '공공시설',
  FACTORY: '공장',
  VESSEL: '어선',
  AQUACULTURE_FACILITY: '수산 증·양식시설',
  RETAINING_WALL: '옹벽',
  FOREST: '임야',
  WAREHOUSE: '창고',
  EMBANKMENT: '축대',
  OTHER: '기타',
});

const DISASTER_TYPE_KOREAN_ALIASES = Object.freeze({
  집중호우: '집중호우',
  호우: '집중호우',
  태풍: '태풍',
  강풍: '강풍',
  낙뢰: '낙뢰',
  산사태: '산사태',
  산불: '산불',
  '대형 산불': '산불',
  대설: '대설',
  폭설: '대설',
  지진: '지진',
  홍수: '홍수',
  가뭄: '가뭄',
  기타: '기타',
});

const FACILITY_TYPE_KOREAN_ALIASES = Object.freeze({
  주택: '주택',
  상가: '상가',
  도로: '도로',
  농경지: '농경지',
  축사: '축사',
  비닐하우스: '비닐하우스',
  농림시설: '농림시설',
  공공시설: '공공시설',
  공장: '공장',
  어선: '어선',
  수산시설: '수산 증·양식시설',
  '수산 증·양식시설': '수산 증·양식시설',
  옹벽: '옹벽',
  임야: '임야',
  창고: '창고',
  축대: '축대',
  기타: '기타',
});

const formatTypeLabel = (value, codeLabels, koreanAliases, fallback) => {
  const rawValue = String(value || '').trim();
  if (!rawValue) return fallback;
  const code = rawValue.toUpperCase().replace(/[\s-]+/g, '_');
  return codeLabels[code] || koreanAliases[rawValue] || fallback;
};

export const formatDisasterType = (value, fallback = '-') => (
  formatTypeLabel(value, DISASTER_TYPE_LABELS, DISASTER_TYPE_KOREAN_ALIASES, fallback)
);

export const formatFacilityType = (value, fallback = '-') => (
  formatTypeLabel(value, FACILITY_TYPE_LABELS, FACILITY_TYPE_KOREAN_ALIASES, fallback)
);

const TYPE_CODE_LABELS = Object.freeze({
  ...DISASTER_TYPE_LABELS,
  ...FACILITY_TYPE_LABELS,
});

const TYPE_CODE_PATTERN = new RegExp(
  `\\b(${Object.keys(TYPE_CODE_LABELS).sort((a, b) => b.length - a.length).join('|')})\\b`,
  'g',
);

export const formatTypeCodesInText = (value) => {
  if (typeof value !== 'string') return value;
  return value.replace(TYPE_CODE_PATTERN, (code) => TYPE_CODE_LABELS[code] || '-');
};
