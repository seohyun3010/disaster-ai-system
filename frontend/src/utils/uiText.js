export const removeMockMarker = (value) => {
  if (typeof value !== 'string') return value;
  return value
    .replace(/mock/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
};

export const removeUrgencyPriority = (value) => {
  if (typeof value !== 'string') return value;

  return value
    .replace(
      /복구 긴급도\s*(\d+(?:\.\d+)?)점\s*,?\s*우선순위\s*\d+순위로\s*산정했습니다\.?/g,
      '복구 긴급도 $1점을 산정했습니다.',
    )
    .replace(/,?\s*우선순위\s*\d+순위(?:로)?/g, '')
    .replace(/\s+,/g, ',')
    .replace(/,\s*\./g, '.')
    .replace(/\s{2,}/g, ' ')
    .trim();
};
