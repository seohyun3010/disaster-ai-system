import { useEffect } from 'react';
import { useAnalysisStore } from '../stores/analysisStore';
import { useWorkflowStore } from '../stores/workflowStore';

const REVIEW_COMPLETED_STATUSES = ['승인', '수정 승인'];

const clampStage = (stage) => Math.min(6, Math.max(1, Number(stage) || 1));

const getDerivedUnlockedStage = (analysis, workflow) => {
  let stage = 1;

  if (analysis && analysis.status !== 'idle') stage = 2;

  const reviewCompleted = REVIEW_COMPLETED_STATUSES.includes(analysis?.reviewStatus)
    || (analysis?.reviewStatus === '보류' && analysis?.holdFieldVerified);
  if (reviewCompleted) stage = 3;
  if (workflow?.severityConfirmed || workflow?.severityConfirmedAt) stage = 4;
  if (workflow?.supportConfirmed || workflow?.supportConfirmedAt) stage = 5;

  const approvalCompleted = Boolean(
    workflow?.approvalStatus && workflow.approvalStatus !== '승인 대기',
  );
  if (approvalCompleted) stage = 6;

  return stage;
};

export const useWorkflowNavigation = (caseId) => {
  const analysis = useAnalysisStore((state) => state.analyses[caseId]);
  const workflow = useWorkflowStore((state) => state.workflows[caseId]);
  const unlockStage = useWorkflowStore((state) => state.unlockStage);
  const storedStage = clampStage(workflow?.maxUnlockedStage);
  const derivedStage = getDerivedUnlockedStage(analysis, workflow);
  const maxUnlockedStage = Math.max(storedStage, derivedStage);

  useEffect(() => {
    if (derivedStage > storedStage) unlockStage(caseId, derivedStage);
  }, [caseId, derivedStage, storedStage, unlockStage]);

  return {
    maxUnlockedStage,
    unlockStage: (stage) => unlockStage(caseId, clampStage(stage)),
    canAccessStage: (stage) => clampStage(stage) <= maxUnlockedStage,
  };
};
