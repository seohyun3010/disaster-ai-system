export const MIN_APPROVAL_CONFIDENCE = 40;

export const getDamageGradeCode = (grade) => (
  String(grade || '').match(/DS[0-4]/i)?.[0]?.toUpperCase() || ''
);

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
  recommendedGrade,
  reviewedGrade,
}) => {
  if (isLowConfidence(confidence)) return 'LOW_CONFIDENCE';
  if (isDs2Grade(recommendedGrade) || isDs2Grade(reviewedGrade)) return 'DS2';
  return null;
};
