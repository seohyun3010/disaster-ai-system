import axiosInstance from './axiosInstance';
import { API_PATHS } from '../constants/apiPaths';

const extractGradeCode = (grade) => String(grade || '')
  .match(/DS[0-4]/i)?.[0]
  ?.toUpperCase();

export const submitDamageGradeReview = async (caseId, review, reviewerId) => {
  const confirmedDamageGrade = extractGradeCode(review.grade);
  const isHold = review.status === '보류';

  if (!isHold && !confirmedDamageGrade) {
    throw new Error('확정 피해등급을 확인할 수 없습니다.');
  }

  const response = await axiosInstance.post(
    API_PATHS.REVIEWS.CREATE(caseId),
    {
      reviewer_id: Number(reviewerId),
      hitl_result: !isHold,
      confirmed_damage_grade: isHold ? null : confirmedDamageGrade,
      comment: review.reason?.trim() || null,
    },
  );

  return response.data;
};

export const getDamageGradeReviews = async (caseId) => {
  try {
    const response = await axiosInstance.get(API_PATHS.REVIEWS.LIST(caseId));
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    if (error.response?.status === 404) return [];
    throw error;
  }
};
