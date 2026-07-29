import { Outlet, useLocation, useNavigate, useParams } from 'react-router-dom';
import { DISASTER_EVENTS, isCaseInDisasterEvent } from '../mocks/disasterEvents';
import { useAnalysisStore } from '../stores/analysisStore';
import { useCaseStore } from '../stores/caseStore';
import { useWorkflowStore } from '../stores/workflowStore';
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
  const item = useCaseStore((state) => state.cases.find((entry) => entry.id === caseId));
  const analysis = useAnalysisStore((state) => state.analyses[caseId]);
  const workflow = useWorkflowStore((state) => state.workflows[caseId]);
  const disasterEvent = DISASTER_EVENTS.find((event) => item && isCaseInDisasterEvent(item, event));
  const listPath = disasterEvent ? `/cases?event=${disasterEvent.id}` : '/cases';
  const activeIndex = getActiveIndex(pathname);
  const reviewCompleted = ['승인', '수정 승인'].includes(analysis?.reviewStatus);
  const approvalCompleted = Boolean(workflow?.approvalStatus && workflow.approvalStatus !== '승인 대기');
  const completed = [
    activeIndex > 0 || Boolean(analysis && analysis.status !== 'idle'),
    reviewCompleted,
    Boolean(workflow?.severityConfirmed),
    Boolean(workflow?.supportConfirmed),
    approvalCompleted,
    false,
  ];
  const available = [
    true,
    true,
    reviewCompleted,
    Boolean(workflow?.severityConfirmed),
    Boolean(workflow?.supportConfirmed),
    approvalCompleted,
  ];

  if (!item) {
    return <div className="case-workflow-missing">
      <h1>신고 정보를 찾을 수 없습니다.</h1>
      <button type="button" className="primary-action" onClick={() => navigate('/cases')}>신고 목록으로</button>
    </div>;
  }

  return <div className="case-workflow-page">
    <header className="case-workflow-head">
      <div>
        <button type="button" onClick={() => navigate(listPath)}>← 신고 목록</button>
        <h1>{item.id}</h1>
      </div>
      <dl>
        {disasterEvent && <div><dt>선택 재난</dt><dd>{disasterEvent.name}</dd></div>}
        <div><dt>신고자</dt><dd>{item.reporter}</dd></div>
        <div><dt>피해 위치</dt><dd>{item.location}</dd></div>
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
                <span className="workflow-step-arrow" aria-hidden="true">›</span>
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
