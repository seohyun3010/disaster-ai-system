import axiosInstance from './axiosInstance';
import { API_PATHS } from '../constants/apiPaths';

const extractGradeCode = (grade) => String(grade || '')
  .match(/DS[0-4]/i)?.[0]
  ?.toUpperCase();

export const submitDamageGradeReview = async (caseId, review, reviewerId) => {
  const confirmedDamageGrade = extractGradeCode(review.grade);

  if (!confirmedDamageGrade) {
    throw new Error('확정 피해등급을 확인할 수 없습니다.');
  }

  const response = await axiosInstance.post(
    API_PATHS.REVIEWS.CREATE(caseId),
    {
      reviewer_id: Number(reviewerId),
      hitl_result: true,
      confirmed_damage_grade: confirmedDamageGrade,
      comment: review.reason?.trim() || null,
    },
  );

  return response.data;
};
