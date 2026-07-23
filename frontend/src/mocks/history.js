import { getCurrentUser } from './currentUser';

const officer = getCurrentUser();

export const MOCK_REVIEW_HISTORY = [
  { caseId: 'NDMS-2026-0716-0048', status: '수정 승인', grade: '반파', reason: '현장 조사 사진과 피해 면적을 재확인하여 반파로 승인했습니다.', processedAt: '2026.07.16 11:15', officer },
  { caseId: 'NDMS-2026-0716-0042', status: '보류', grade: '침수', reason: '농경지 피해 면적 확인을 위한 추가 현장 자료가 필요합니다.', processedAt: '2026.07.16 10:42', officer },
  { caseId: 'NDMS-2026-0715-0039', status: '승인', grade: '침수', reason: 'AI 추천 결과와 현장 조사 결과가 일치합니다.', processedAt: '2026.07.15 17:30', officer },
  { caseId: 'NDMS-2026-0715-0031', status: '반려', grade: '부분 파손', reason: '분석 이미지의 피해 영역이 실제 시설 경계와 일치하지 않아 재분석을 요청했습니다.', processedAt: '2026.07.15 14:05', officer },
];

export const MOCK_APPROVAL_HISTORY = [
  { caseId: 'NDMS-2026-0716-0048', status: '최종 승인', amount: 5760000, reason: '피해등급, 긴급도 및 중복 수혜 검토를 완료했습니다.', processedAt: '2026.07.22 14:00', officer },
  { caseId: 'NDMS-2026-0716-0042', status: '보류', amount: 4200000, reason: '중복 수혜 가능성에 대한 추가 확인이 필요합니다.', processedAt: '2026.07.21 16:20', officer },
  { caseId: 'NDMS-2026-0715-0039', status: '금액 수정 후 승인', amount: 5100000, reason: '현장 조사 결과를 반영하여 지원 금액을 조정했습니다.', processedAt: '2026.07.20 11:35', officer },
  { caseId: 'NDMS-2026-0715-0031', status: '반려', amount: 0, reason: '필수 피해 증빙 자료가 누락되어 보완 후 재심사가 필요합니다.', processedAt: '2026.07.19 15:10', officer },
];

