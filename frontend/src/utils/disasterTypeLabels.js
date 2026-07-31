export const DISASTER_TYPE_LABELS = Object.freeze({
  HEAVY_RAIN: '집중호우',
  TYPHOON: '태풍',
  LANDSLIDE: '산사태',
  EARTHQUAKE: '지진',
  HEAVY_SNOW: '대설',
  FLOOD: '홍수',
  FOREST_FIRE: '산불',
  DROUGHT: '가뭄',
  OTHER: '기타',
});

export const formatDisasterType = (value, fallback = '-') => (
  DISASTER_TYPE_LABELS[value] || value || fallback
);
