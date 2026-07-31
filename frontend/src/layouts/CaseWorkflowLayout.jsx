import { useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useAnalysisStore } from '../stores/analysisStore';
import { useCaseStore } from '../stores/caseStore';
import { useWorkflowStore } from '../stores/workflowStore';
import { getSubsidy } from '../api/subsidyApi';
import './case-workflow-layout.css';

const STEPS = [
  { label: '신고서 확인', path: '' },
  { label: 'AI 분석', path: 'analysis' },
  { label: '복구 긴급도', path: 'severity' },
  { label: '지원금 심사', path: 'support' },
  { label: '최종 승인', path: 'final-approval' },
  { label: '보고서', path: 'reports' },
];

const getActiveIndex = (pathname) => {
  const index = STEPS.findIndex((step) => step.path && pathname.endsWith(`/${step.path}`));
  return index < 0 ? 0 : index;
};

const CaseWorkflowLayout = () => {
  const { caseId } = useParams();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const item = useCaseStore((state) =>
    state.cases.find((entry) => entry.case_id === Number(caseId)));
  const loading = useCaseStore((state) => state.loading);
  const error = useCaseStore((state) => state.error);
  const fetchCaseDetail = useCaseStore((state) => state.fetchCaseDetail);
  const analysis = useAnalysisStore((state) => state.analyses[caseId]);
  const workflow = useWorkflowStore((state) => state.workflows[caseId]);
  const listPath = '/cases';
  const activeIndex = getActiveIndex(pathname);
  const reviewCompleted = ['승인', '수정 승인'].includes(analysis?.reviewStatus)
    || (analysis?.reviewStatus === '보류' && analysis?.holdFieldVerified);
  const approvalCompleted = Boolean(workflow?.approvalStatus && workflow.approvalStatus !== '승인 대기');

  const [subsidyConfirmed, setSubsidyConfirmed] = useState(false);
  useEffect(() => {
    if (!caseId) return;
    let ignore = false;
    getSubsidy(caseId)
      .then((data) => { if (!ignore) setSubsidyConfirmed(data.status === 'CONFIRMED'); })
      .catch(() => { if (!ignore) setSubsidyConfirmed(false); });
    return () => { ignore = true; };
  }, [caseId]);

  const completed = [
    activeIndex > 0 || Boolean(analysis && analysis.status !== 'idle'),
    reviewCompleted,
    Boolean(workflow?.severityConfirmed),
    subsidyConfirmed,
    approvalCompleted,
    false,
  ];
  const available = [
    true,
    true,
    reviewCompleted,
    Boolean(workflow?.severityConfirmed),
    subsidyConfirmed,
    approvalCompleted,
  ];

  useEffect(() => {
    if (!item?.isDetail) fetchCaseDetail(caseId).catch(() => {});
  }, [caseId, fetchCaseDetail, item?.isDetail]);

  if (!item) {
    return <div className="case-workflow-missing">
      <h1>{loading ? '신고 정보를 불러오는 중입니다.' : error || '신고 정보를 찾을 수 없습니다.'}</h1>
      <button type="button" className="primary-action" onClick={() => navigate('/cases')}>신고 목록으로</button>
    </div>;
  }

  return <div className="case-workflow-page">
    <header className="case-workflow-head">
      <div>
        <button type="button" onClick={() => navigate(listPath)}>← 신고 목록</button>
        <h1>{item.case_number}</h1>
      </div>
      <dl>
        <div><dt>신고자</dt><dd>{item.reporter}</dd></div>
        <div><dt>피해 위치</dt><dd>{item.address}</dd></div>
      </dl>
    </header>

    <div className="case-workflow-grid">
      <aside className="case-workflow-gallery" aria-label="업무 진행 단계">
        <div className="workflow-gallery-title">
          <span>업무 진행</span>
          <strong>{activeIndex + 1} / {STEPS.length}</strong>
        </div>
        <ol>
          {STEPS.map((step, index) => {
            const state = index === activeIndex ? 'active' : completed[index] ? 'completed' : 'pending';
            const target = step.path ? `/cases/${caseId}/${step.path}` : `/cases/${caseId}`;
            return <li key={step.label} className={state}>
              <button
                type="button"
                onClick={() => navigate(target)}
                disabled={!available[index] || (activeIndex === 5 && index < 5)}
                aria-current={index === activeIndex ? 'step' : undefined}
              >
                <span className="workflow-step-number">{completed[index] ? '✓' : index + 1}</span>
                <span className="workflow-step-copy">
                  <strong>{step.label}</strong>
                  <small>{index === activeIndex ? '현재 단계' : completed[index] ? '완료' : available[index] ? '진행 가능' : '이전 단계 완료 후 진행'}</small>
                </span>
                <span className="workflow-step-arrow" aria-hidden="true">→</span>
              </button>
            </li>;
          })}
        </ol>
      </aside>

      <main className="case-workflow-stage">
        <Outlet context={{ item }} />
      </main>
    </div>
  </div>;
};

export default CaseWorkflowLayout;