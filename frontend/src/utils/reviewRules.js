export const MIN_APPROVAL_CONFIDENCE = 40;

export const getDamageGradeCode = (grade) => (
  String(grade || '').match(/DS[0-4]/i)?.[0]?.toUpperCase() || ''
);

export const DAMAGE_GRADE_LABELS = Object.freeze({
  DS0: '피해 없음',
  DS1: '경미',
  DS2: '반파 경계',
  DS3: '반파',
  DS4: '전파',
});

export const formatDamageGradeLabel = (grade) => {
  const gradeCode = getDamageGradeCode(grade);
  return DAMAGE_GRADE_LABELS[gradeCode] || String(grade || '');
};

export const formatDamageGrade = (grade) => {
  const gradeCode = getDamageGradeCode(grade);
  const label = DAMAGE_GRADE_LABELS[gradeCode];
  return gradeCode && label ? `${gradeCode} · ${label}` : '-';
};

export const isLowConfidence = (confidence) => {
  if (confidence === null || confidence === undefined || confidence === '') return false;
  const numericConfidence = Number(confidence);
  return Number.isFinite(numericConfidence)
    && numericConfidence < MIN_APPROVAL_CONFIDENCE;
};

export const isDs2Grade = (grade) => getDamageGradeCode(grade) === 'DS2';

export const isZeroSupportGrade = (grade) => (
  ['DS0', 'DS1'].includes(getDamageGradeCode(grade))
);

export const getMandatoryHoldReason = ({
  confidence,
}) => {
  if (isLowConfidence(confidence)) return 'LOW_CONFIDENCE';
  return null;
};
