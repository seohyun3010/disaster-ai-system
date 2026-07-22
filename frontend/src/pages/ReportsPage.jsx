import { useState } from 'react';
import { useParams } from 'react-router-dom';
import CaseStageHeader from '../components/case/CaseStageHeader';
import StageNavigation from '../components/case/StageNavigation';
import ProcessTimeline from '../components/report/ProcessTimeline';
import ReportVersionList from '../components/report/ReportVersionList';
import { downloadMockReport, PROCESS_HISTORY, REPORT_VERSIONS } from '../mocks/workflow';
import { useCaseStore } from '../stores/caseStore';

const ReportsPage = () => {
  const { caseId } = useParams();
  const item = useCaseStore((state) => state.cases.find((entry) => entry.id === caseId));
  const [message, setMessage] = useState('');
  if (!item) return <div className="case-page"><section className="case-card missing-case"><h1>신고 정보를 찾을 수 없습니다</h1></section></div>;
  const download = (report) => {
    downloadMockReport(report, caseId);
    setMessage(`${report.version} Mock 보고서를 다운로드했습니다.`);
  };

  return <div className="case-page"><CaseStageHeader item={item} breadcrumb="복구 심사 / 보고서 및 이력" title="보고서 및 처리 이력" description="사건 보고서 버전과 전체 업무 처리 기록을 확인합니다." /><section className="reports-layout"><ReportVersionList reports={REPORT_VERSIONS} onDownload={download} message={message} /><ProcessTimeline history={PROCESS_HISTORY} /></section><StageNavigation previousPath={`/cases/${caseId}/final-approval`} previousLabel="최종 승인" /></div>;
};

export default ReportsPage;
