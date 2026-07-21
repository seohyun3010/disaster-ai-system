import axiosInstance from './axiosInstance';
import { API_PATHS } from '../constants/apiPaths';

export const approveReview = async (data) => {
  const response = await axiosInstance.post(API_PATHS.REVIEW.APPROVE, data);
  return response.data;
};

export const rejectReview = async (data) => {
  const response = await axiosInstance.post(API_PATHS.REVIEW.REJECT, data);
  return response.data;
};
