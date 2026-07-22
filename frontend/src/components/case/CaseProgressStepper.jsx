import { useLocation, useNavigate, useParams } from 'react-router-dom';

const STEPS = [
  { label: '신고 정보', segment: null },
  { label: 'AI 분석', segment: 'analysis' },
  { label: '심각도·복구 긴급도', segment: 'severity' },
  { label: '지원금 심사', segment: 'support' },
  { label: '최종 승인', segment: 'final-approval' },
  { label: '보고서', segment: 'reports' },
];

const getActiveStep = (pathname) => {
  if (pathname.endsWith('/reports')) return 5;
  if (pathname.endsWith('/final-approval')) return 4;
  if (pathname.endsWith('/support')) return 3;
  if (pathname.endsWith('/severity')) return 2;
  if (/\/(analysis|review|ai-result)$/.test(pathname)) return 1;
  return 0;
};

const CaseProgressStepper = () => {
  const { pathname } = useLocation();
  const { caseId } = useParams();
  const navigate = useNavigate();
  const activeStep = getActiveStep(pathname);

  return <nav className="case-progress" aria-label="신고 처리 단계">
    <strong className="case-progress-title">업무 진행</strong>
    <ol>
      {STEPS.map((step, index) => {
        const state = index < activeStep ? 'completed' : index === activeStep ? 'active' : 'pending';
        return <li key={step.label} className={state} aria-current={state === 'active' ? 'step' : undefined}>
          <button type="button" disabled={state === 'pending'} onClick={() => navigate(step.segment ? `/cases/${caseId}/${step.segment}` : `/cases/${caseId}`)}>
            <span className="case-progress-marker" aria-hidden="true">{state === 'completed' ? '✓' : index + 1}</span>
            <span className="case-progress-label">{step.label}</span>
          </button>
        </li>;
      })}
    </ol>
  </nav>;
};

export default CaseProgressStepper;
