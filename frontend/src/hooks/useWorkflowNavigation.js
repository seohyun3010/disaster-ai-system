// import { useEffect } from 'react';
// import { useAnalysisStore } from '../stores/analysisStore';
// import { useWorkflowStore } from '../stores/workflowStore';

// const REVIEW_COMPLETED_STATUSES = ['승인', '수정 승인'];

// const clampStage = (stage) => Math.min(6, Math.max(1, Number(stage) || 1));

// const getDerivedUnlockedStage = (analysis, workflow) => {
//   let stage = 1;

//   if (analysis && analysis.status !== 'idle') stage = 2;

//   const reviewCompleted = REVIEW_COMPLETED_STATUSES.includes(analysis?.reviewStatus)
//     || (analysis?.reviewStatus === '보류' && analysis?.holdFieldVerified);
//   if (reviewCompleted) stage = 3;
//   if (workflow?.severityConfirmed || workflow?.severityConfirmedAt) stage = 4;
//   if (workflow?.supportConfirmed || workflow?.supportConfirmedAt) stage = 5;

//   const approvalCompleted = Boolean(
//     workflow?.approvalStatus && workflow.approvalStatus !== '승인 대기',
//   );
//   if (approvalCompleted) stage = 6;

//   return stage;
// };

// export const useWorkflowNavigation = (caseId) => {
//   const analysis = useAnalysisStore((state) => state.analyses[caseId]);
//   const workflow = useWorkflowStore((state) => state.workflows[caseId]);
//   const unlockStage = useWorkflowStore((state) => state.unlockStage);
//   const storedStage = clampStage(workflow?.maxUnlockedStage);
//   const derivedStage = getDerivedUnlockedStage(analysis, workflow);
//   const maxUnlockedStage = Math.max(storedStage, derivedStage);

//   useEffect(() => {
//     if (derivedStage > storedStage) unlockStage(caseId, derivedStage);
//   }, [caseId, derivedStage, storedStage, unlockStage]);

//   return {
//     maxUnlockedStage,
//     unlockStage: (stage) => unlockStage(caseId, clampStage(stage)),
//     canAccessStage: (stage) => clampStage(stage) <= maxUnlockedStage,
//   };
// };

import { useEffect } from 'react';
import { useAnalysisStore } from '../stores/analysisStore';
import { useWorkflowStore } from '../stores/workflowStore';

const REVIEW_COMPLETED_STATUSES = ['승인', '수정 승인'];

const clampStage = (stage) => (
  Math.min(6, Math.max(1, Number(stage) || 1))
);

const getDerivedUnlockedStage = (
  analysis,
  workflow,
  subsidyConfirmed,
) => {
  let stage = 1;

  // AI 분석이 시작되었거나 결과가 존재하면 2단계까지 접근 가능
  if (analysis && analysis.status !== 'idle') {
    stage = 2;
  }

  // AI 분석 결과 검토가 완료되면 3단계까지 접근 가능
  const reviewCompleted = (
    REVIEW_COMPLETED_STATUSES.includes(analysis?.reviewStatus)
    || (
      analysis?.reviewStatus === '보류'
      && analysis?.holdFieldVerified
    )
  );

  if (reviewCompleted) {
    stage = 3;
  }

  // 복구 긴급도 확정 완료 시 지원금 심사 접근 가능
  const severityCompleted = Boolean(
    workflow?.severityConfirmed
    || workflow?.severityConfirmedAt,
  );

  if (severityCompleted) {
    stage = 4;
  }

  // 서버 지원금 확정 상태 또는 로컬 업무 상태 중 하나라도 완료면
  // 최종 승인 단계까지 접근 가능
  const supportCompleted = Boolean(
    subsidyConfirmed === true
    || workflow?.supportConfirmed
    || workflow?.supportConfirmedAt,
  );

  if (supportCompleted) {
    stage = 5;
  }

  // 최종 승인 처리가 완료되면 보고서 단계까지 접근 가능
  const approvalCompleted = Boolean(
    workflow?.approvalStatus
    && workflow.approvalStatus !== '승인 대기',
  );

  if (approvalCompleted) {
    stage = 6;
  }

  return stage;
};

export const useWorkflowNavigation = (caseId, options = {}) => {
  const { subsidyConfirmed = null } = options;

  const analysis = useAnalysisStore(
    (state) => state.analyses[caseId],
  );

  const workflow = useWorkflowStore(
    (state) => state.workflows[caseId],
  );

  const unlockWorkflowStage = useWorkflowStore(
    (state) => state.unlockStage,
  );

  const storedStage = clampStage(workflow?.maxUnlockedStage);

  const derivedStage = getDerivedUnlockedStage(
    analysis,
    workflow,
    subsidyConfirmed,
  );

  const maxUnlockedStage = Math.max(
    storedStage,
    derivedStage,
  );

  const reviewedGrade = analysis?.reviewedGrade
    || workflow?.reviewedGrade
    || workflow?.confirmedGrade
    || workflow?.damageGrade
    || analysis?.result?.recommendedGrade;
  const reviewedGradeCode = String(reviewedGrade || '').match(/DS[0-4]/i)?.[0]?.toUpperCase();
  const skipsSeverityAndSupport = ['DS0', 'DS1', 'DS2'].includes(reviewedGradeCode);

  useEffect(() => {
    if (!caseId) return;

    if (derivedStage > storedStage) {
      unlockWorkflowStage(caseId, derivedStage);
    }
  }, [
    caseId,
    derivedStage,
    storedStage,
    unlockWorkflowStage,
  ]);

  return {
    maxUnlockedStage,

    unlockStage: (stage) => {
      if (!caseId) return;

      unlockWorkflowStage(
        caseId,
        clampStage(stage),
      );
    },

    canAccessStage: (stage) => (
      clampStage(stage) <= maxUnlockedStage
      && !(skipsSeverityAndSupport && [3, 4].includes(clampStage(stage)))
    ),
  };
};
