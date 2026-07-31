/*
 * 기존 mock/localStorage 기반 보고서 화면 구현은 연동 이력 확인을 위해
 * 삭제하지 않고 이 주석 블록 안에 보존합니다.
 *
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
*/

import { useEffect, useMemo, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import CaseStageHeader from '../components/case/CaseStageHeader';
import FinalReportPreview from '../components/report/FinalReportPreview';
import ProcessTimeline from '../components/report/ProcessTimeline';
import { ReviewGuidance } from '../components/persona/ReviewGuidance';
import { downloadReport, generateReport, getReportByCase } from '../api/reportApi';

const formatDateTime = (value) => {
  if (!value) return '-';
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(value));
};

const ReportsPage = () => {
  const { caseId } = useParams();
  const { search } = useLocation();
  const historyView = new URLSearchParams(search).get('view') === 'history';
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        let data;
        try {
          data = await getReportByCase(caseId);
        } catch (requestError) {
          if (requestError.response?.status !== 404) throw requestError;
          data = await generateReport(caseId);
        }
        if (active) setReport(data);
      } catch (requestError) {
        if (active) setError(requestError.message || '보고서를 불러오지 못했습니다.');
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => { active = false; };
  }, [caseId]);

  const viewReport = useMemo(() => report ? {
    ...report,
    approved_at: formatDateTime(report.approved_at),
    created_at: formatDateTime(report.created_at),
    timeline: report.timeline.map((event) => ({
      ...event,
      occurred_at: formatDateTime(event.occurred_at),
    })),
    case: {
      ...report.case,
      reported_at: formatDateTime(report.case.reported_at),
    },
  } : null, [report]);

  if (loading) return <div className="case-page"><section className="case-card missing-case"><h1>보고서를 불러오는 중입니다.</h1></section></div>;
  if (error || !viewReport) return <div className="case-page"><section className="case-card missing-case"><h1>{error || '보고서를 찾을 수 없습니다.'}</h1></section></div>;

  const headerItem = {
    id: viewReport.case.case_number,
    location: viewReport.case.address,
    type: viewReport.case.disaster_type,
  };
  const supportAmount = viewReport.subsidy.confirmed_amount
    ?? viewReport.subsidy.estimated_amount
    ?? 0;

  const download = async () => {
    setMessage('');
    try {
      await downloadReport(
        viewReport.report_id,
        // 기존 TXT 파일명: `${viewReport.case.case_number}_final_report.txt`
        `${viewReport.case.case_number}_final_report.pdf`,
      );
      setMessage('최종 보고서를 다운로드했습니다.');
    } catch (requestError) {
      setMessage(requestError.message || '보고서를 다운로드하지 못했습니다.');
    }
  };

  return <div className="case-page">
    <CaseStageHeader item={headerItem} breadcrumb="복구 심사 / 보고서 및 이력" title="보고서 및 처리 이력" progressHistoryView={historyView} />
    <ReviewGuidance current="최종 보고서 확인" next="필요 시 보고서 다운로드 및 감사 자료 보관" caution="담당자 변경 시 최종 승인 내용을 먼저 확인해 주세요." />
    <section className="reports-layout">
      <FinalReportPreview
        item={viewReport.case}
        report={viewReport}
        damageGrade={viewReport.analysis.damage_grade || '-'}
        urgencyScore={viewReport.severity.urgency_score}
        supportAmount={supportAmount}
        approvalStatus={viewReport.approval_result}
        onDownload={download}
        message={message}
      />
      <ProcessTimeline history={viewReport.timeline} />
    </section>
  </div>;
};

export default ReportsPage;
