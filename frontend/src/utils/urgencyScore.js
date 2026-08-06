const URGENCY_SCORE_FIELDS = [
  'recovery_urgency_score',
  'recoveryUrgencyScore',
  'urgency_score',
  'urgencyScore',
  'priority_score',
  'priorityScore',
];

const isPresentScore = (value) => (
  value !== null
  && value !== undefined
  && value !== ''
  && Number.isFinite(Number(value))
);

export const resolveUrgencyScore = (...sources) => {
  for (const source of sources) {
    if (!source || typeof source !== 'object') continue;

    for (const field of URGENCY_SCORE_FIELDS) {
      if (isPresentScore(source[field])) return source[field];
    }
  }

  return null;
};

