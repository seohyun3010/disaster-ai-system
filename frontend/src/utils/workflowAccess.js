const REVIEW_COMPLETED_STATUSES = ['승인', '수정 승인'];
const FINAL_APPROVED_STATUSES = ['최종 승인', '금액 수정 후 승인'];

const hasBasicReport = (item) => Boolean(
  item?.reporter && item?.type && item?.facility && item?.location,
);

const makeAccess = (allowed, reason, fallbackPath, fallbackLabel) => ({
  allowed,
  reason,
  fallbackPath,
  fallbackLabel,
});

export const getWorkflowStageAccess = ({ caseId, stage, item, analysis, workflow }) => {
  const basePath = `/cases/${caseId}`;
  const analysisPath = `${basePath}/analysis`;
  const reviewPath = `${basePath}/review`;
  const severityPath = `${basePath}/severity`;
  const supportPath = `${basePath}/support`;
  const finalApprovalPath = `${basePath}/final-approval`;
  const hasCompletedAnalysis = analysis?.status === 'completed' && Boolean(analysis?.result);
  const hasApprovedReview = REVIEW_COMPLETED_STATUSES.includes(analysis?.reviewStatus);
  const hasConfirmedSeverity = Boolean(workflow?.severityConfirmedAt);
  const hasConfirmedSupport = Boolean(workflow?.supportConfirmedAt);
  const hasFinalApproval = FINAL_APPROVED_STATUSES.includes(workflow?.approvalStatus);

  if (!item) return makeAccess(false, '신고 정보를 찾을 수 없습니다.', '/cases', '신고 목록으로');

  if (stage === 'analysis') {
    return makeAccess(
      hasBasicReport(item),
      '신고자, 재난 유형, 시설 유형, 피해 위치를 먼저 확인해야 합니다.',
      basePath,
      '신고 기본 정보로',
    );
  }

  if (stage === 'review') {
    return makeAccess(
      hasCompletedAnalysis,
      'AI 분석이 완료된 뒤 피해등급을 검토할 수 있습니다.',
      analysisPath,
      'AI 분석으로',
    );
  }

  if (stage === 'severity') {
    return makeAccess(
      hasApprovedReview,
      'AI 피해등급 검토에서 승인 또는 수정 후 승인을 먼저 완료해야 합니다.',
      reviewPath,
      '피해등급 검토로',
    );
  }

  if (stage === 'support') {
    return makeAccess(
      hasConfirmedSeverity,
      '심각도·복구 긴급도 점수를 저장한 뒤 지원금 심사를 진행할 수 있습니다.',
      severityPath,
      '심각도·복구 긴급도로',
    );
  }

  if (stage === 'finalApproval') {
    return makeAccess(
      hasConfirmedSupport,
      '지원금 산정 결과를 저장한 뒤 최종 승인할 수 있습니다.',
      supportPath,
      '지원금 심사로',
    );
  }

  if (stage === 'reports') {
    return makeAccess(
      hasFinalApproval,
      '최종 승인 또는 금액 수정 후 승인 처리된 사건만 보고서를 조회할 수 있습니다.',
      finalApprovalPath,
      '최종 승인으로',
    );
  }

  return makeAccess(true, '', basePath, '신고 상세로');
};
