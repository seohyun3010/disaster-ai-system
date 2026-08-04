import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useWorkflowNavigation } from '../../hooks/useWorkflowNavigation';

const STEPS = [
  { label: '신고서 확인', segment: null },
  { label: 'AI 분석', segment: 'analysis' },
  { label: '복구 긴급도', segment: 'severity' },
  { label: '지원금 심사', segment: 'support' },
  { label: '최종 승인', segment: 'final-approval' },
  { label: '보고서', segment: 'reports' },
];

const getActiveStep = (pathname) => {
  if (pathname.endsWith('/reports')) return 5;
  if (pathname.endsWith('/final-approval')) return 4;
  if (pathname.endsWith('/support')) return 3;
  if (pathname.endsWith('/severity')) return 2;
  if (pathname.endsWith('/analysis')) return 1;
  return 0;
};

const CaseProgressStepper = ({ historyView = false }) => {
  const { pathname } = useLocation();
  const { caseId } = useParams();
  const navigate = useNavigate();
  const activeStep = getActiveStep(pathname);
  const { maxUnlockedStage, skipsSeverity, canAccessStage } = useWorkflowNavigation(caseId);

  return <nav className="case-progress" aria-label="신고 처리 단계">
    <strong className="case-progress-title">업무 진행</strong>
    <ol>
      {STEPS.map((step, index) => {
        const stageNumber = index + 1;
        const unlocked = canAccessStage(stageNumber);
        const skipped = skipsSeverity && stageNumber === 3;
        const wasPassed = stageNumber < maxUnlockedStage && !skipped;
        const state = index === activeStep ? 'active' : wasPassed ? 'completed' : 'pending';
        const target = step.segment ? `/cases/${caseId}/${step.segment}` : `/cases/${caseId}`;
        return <li key={step.label} className={state} aria-current={state === 'active' ? 'step' : undefined}>
          <button
            type="button"
            disabled={!unlocked}
            title={unlocked ? undefined : '이전 단계를 완료하면 이동할 수 있습니다.'}
            onClick={() => navigate(`${target}${historyView ? '?view=history' : ''}`)}
          >
            <span className="case-progress-marker" aria-hidden="true">{state === 'completed' ? '✓' : skipped ? '—' : index + 1}</span>
            <span className="case-progress-label">{step.label}{skipped ? ' · 미산출' : ''}</span>
          </button>
        </li>;
      })}
    </ol>
  </nav>;
};

export default CaseProgressStepper;
