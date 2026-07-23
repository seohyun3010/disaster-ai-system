import { useAnalysisStore } from '../stores/analysisStore';
import { useCaseStore } from '../stores/caseStore';
import { useWorkflowStore } from '../stores/workflowStore';
import { getWorkflowStageAccess } from '../utils/workflowAccess';

export const useWorkflowStageAccess = (caseId, stage) => {
  const item = useCaseStore((state) => state.cases.find((entry) => entry.id === caseId));
  const analysis = useAnalysisStore((state) => state.analyses[caseId]);
  const workflow = useWorkflowStore((state) => state.workflows[caseId]);

  return getWorkflowStageAccess({ caseId, stage, item, analysis, workflow });
};
