import { useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import CaseStageHeader from '../components/case/CaseStageHeader';
import FinalReportPreview from '../components/report/FinalReportPreview';
import ProcessTimeline from '../components/report/ProcessTimeline';
import { ReviewGuidance } from '../components/persona/ReviewGuidance';
import { calculateSeverityTotal, DEFAULT_WORKFLOW, downloadMockReport, PROCESS_HISTORY, REPORT_VERSIONS } from '../mocks/workflow';
import { useAnalysisStore } from '../stores/analysisStore';
import { useCaseStore } from '../stores/caseStore';
import { useWorkflowStore } from '../stores/workflowStore';

const ReportsPage = () => {
  const { caseId } = useParams();
  const { search } = useLocation();
  const historyView = new URLSearchParams(search).get('view') === 'history';
  const item = useCaseStore((state) => state.cases.find((entry) => entry.id === caseId));
  const analysis = useAnalysisStore((state) => state.analyses[caseId]);
  const workflow = useWorkflowStore((state) => state.workflows[caseId] || DEFAULT_WORKFLOW);
  const [message, setMessage] = useState('');
  if (!item) return <div className="case-page"><section className="case-card missing-case"><h1>신고 정보를 찾을 수 없습니다</h1></section></div>;
  const report = REPORT_VERSIONS[0];
  const damageGrade = analysis?.reviewedGrade || analysis?.result?.recommendedGrade || item.damage;
  const urgencyScore = calculateSeverityTotal(workflow.severityScores || DEFAULT_WORKFLOW.severityScores);
  const supportAmount = workflow.approvalAmount ?? workflow.supportAmount;
  const approvalStatus = workflow.approvalStatus === '승인 대기' ? '최종 승인' : workflow.approvalStatus;
  const finalReport = { ...report, createdAt: workflow.approvedAt || report.createdAt };
  const download = () => {
    downloadMockReport(finalReport, caseId, {
      reporter: item.reporter,
      disasterType: item.type,
      facility: item.facility,
      location: item.location,
      damageGrade,
      urgencyScore,
      supportAmount,
      approvalStatus,
      description: item.description,
    });
    setMessage('최종 보고서를 다운로드했습니다.');
  };

  return <div className="case-page"><CaseStageHeader item={item} breadcrumb="복구 심사 / 보고서 및 이력" title="보고서 및 처리 이력" progressHistoryView={historyView} /><ReviewGuidance current="최종 보고서 확인" next="필요 시 보고서 다운로드 및 감사 자료 보관" caution="담당자 변경 시 최종 승인 내용을 먼저 확인해 주세요." /><section className="reports-layout"><FinalReportPreview item={item} report={finalReport} damageGrade={damageGrade} urgencyScore={urgencyScore} supportAmount={supportAmount} approvalStatus={approvalStatus} onDownload={download} message={message} /><ProcessTimeline history={PROCESS_HISTORY} /></section></div>;
};

export default ReportsPage;
