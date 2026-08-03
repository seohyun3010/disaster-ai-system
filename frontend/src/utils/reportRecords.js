import { formatOfficerFull, getCurrentUser } from '../mocks/currentUser';
import { MOCK_APPROVAL_HISTORY } from '../mocks/history';
import { calculateSeverityTotal, DEFAULT_WORKFLOW } from '../mocks/workflow';

export const FINAL_REPORT_STATUSES = ['최종 승인', '금액 수정 후 승인'];

export const buildFinalReportRecords = ({
  cases,
  analyses = {},
  workflows = {},
}) => {
  const approvalByCase = Object.fromEntries(
    MOCK_APPROVAL_HISTORY.map((entry) => [entry.caseId, entry]),
  );

  return cases
    .flatMap((item, index) => {
      const workflow = workflows[item.id];
      const approval = approvalByCase[item.id];
      const savedApprovalStatus = workflow?.approvalStatus
        && workflow.approvalStatus !== DEFAULT_WORKFLOW.approvalStatus
        ? workflow.approvalStatus
        : null;
      const approvalStatus = savedApprovalStatus || approval?.status || '승인 대기';

      if (!FINAL_REPORT_STATUSES.includes(approvalStatus)) return [];

      const analysis = analyses[item.id];
      return [{
        id: `RPT-${String(index + 1).padStart(3, '0')}`,
        caseId: item.id,
        disasterEventId: item.disasterEventId,
        reporter: item.reporter,
        disasterType: item.type,
        facility: item.facility,
        location: item.location,
        description: item.description,
        title: `${item.facility || item.type || '재해'} 피해조사 결과보고서`,
        damageGrade: analysis?.reviewedGrade
          || workflow?.reviewedGrade
          || workflow?.confirmedGrade
          || workflow?.damageGrade
          || analysis?.result?.recommendedGrade
          || item.damage,
        urgencyScore: calculateSeverityTotal(
          workflow?.severityScores || DEFAULT_WORKFLOW.severityScores,
        ),
        supportAmount: workflow?.approvalAmount
          ?? approval?.amount
          ?? workflow?.supportAmount
          ?? 0,
        approvalStatus,
        status: '최종',
        createdAt: workflow?.approvedAt || approval?.processedAt || item.reportedAt,
        creator: workflow?.approvedBy
          ? formatOfficerFull(workflow.approvedBy)
          : formatOfficerFull(getCurrentUser()),
      }];
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
};
