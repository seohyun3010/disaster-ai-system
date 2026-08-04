import { useEffect, useState } from 'react';
import {
  Outlet,
  useLocation,
  useNavigate,
  useParams,
} from 'react-router-dom';

import { getSubsidy } from '../api/subsidyApi';
import { useWorkflowNavigation } from '../hooks/useWorkflowNavigation';
import { useAnalysisStore } from '../stores/analysisStore';
import { useCaseStore } from '../stores/caseStore';
import { useWorkflowStore } from '../stores/workflowStore';

import './case-workflow-layout.css';

const STEPS = [
  {
    label: '신고서 확인',
    path: '',
  },
  {
    label: 'AI 분석',
    path: 'analysis',
  },
  {
    label: '복구 긴급도',
    path: 'severity',
  },
  {
    label: '지원금 심사',
    path: 'support',
  },
  {
    label: '최종 승인',
    path: 'final-approval',
  },
  {
    label: '보고서',
    path: 'reports',
  },
];

const getActiveIndex = (pathname) => {
  const index = STEPS.findIndex(
    (step) => (
      step.path
      && pathname.endsWith(`/${step.path}`)
    ),
  );

  return index < 0 ? 0 : index;
};

const getStepPath = (caseId, step) => (
  step.path
    ? `/cases/${caseId}/${step.path}`
    : `/cases/${caseId}`
);

const CaseWorkflowLayout = () => {
  const { caseId } = useParams();
  const { pathname, search } = useLocation();
  const navigate = useNavigate();
  const historyView = new URLSearchParams(search).get('view') === 'history';

  const item = useCaseStore(
    (state) => state.cases.find(
      (entry) => entry.id === caseId,
    ),
  );

  const loading = useCaseStore(
    (state) => state.loading,
  );

  const error = useCaseStore(
    (state) => state.error,
  );

  const fetchCaseDetail = useCaseStore(
    (state) => state.fetchCaseDetail,
  );

  const analysis = useAnalysisStore(
    (state) => state.analyses[caseId],
  );

  const workflow = useWorkflowStore(
    (state) => state.workflows[caseId],
  );

  /*
   * null  : 지원금 상태 조회 중
   * false : 조회 완료, 아직 확정되지 않음
   * true  : 지원금 확정 완료
   */
  const [subsidyStatus, setSubsidyStatus] = useState({
    caseId: null,
    confirmed: null,
  });

  const subsidyConfirmed = subsidyStatus.caseId === caseId
    ? subsidyStatus.confirmed
    : null;

  const activeIndex = getActiveIndex(pathname);
  const requestedStage = activeIndex + 1;

  const reviewCompleted = Boolean(
    ['승인', '수정 승인'].includes(
      analysis?.reviewStatus,
    )
    || (
      analysis?.reviewStatus === '보류'
      && analysis?.holdFieldVerified
    ),
  );

  const severityCompleted = Boolean(
    workflow?.severityConfirmed
    || workflow?.severityConfirmedAt,
  );

  const supportCompleted = Boolean(
    subsidyConfirmed === true
    || workflow?.supportConfirmed
    || workflow?.supportConfirmedAt,
  );

  const approvalCompleted = Boolean(
    workflow?.approvalStatus
    && workflow.approvalStatus !== '승인 대기',
  );

  const subsidyLoading = subsidyConfirmed === null;

  const {
    maxUnlockedStage,
    skipsSeverity,
    canAccessStage,
  } = useWorkflowNavigation(caseId, {
    subsidyConfirmed,
  });

  const requestedStageLocked = historyView
    ? false
    : !canAccessStage(requestedStage);

  const completed = [
    activeIndex > 0
      || Boolean(
        analysis
        && analysis.status !== 'idle',
      ),

    reviewCompleted,

    severityCompleted,

    supportCompleted,

    approvalCompleted,

    false,
  ];

  /*
   * 신고 상세 정보 조회
   */
  useEffect(() => {
    if (!caseId || item?.isDetail) {
      return;
    }

    fetchCaseDetail(caseId).catch((fetchError) => {
      console.error(
        '신고 상세 정보 조회 실패:',
        fetchError,
      );
    });
  }, [
    caseId,
    fetchCaseDetail,
    item?.isDetail,
  ]);

  /*
   * 지원금 심사 상태 조회
   */
  useEffect(() => {
    if (!caseId) {
      return undefined;
    }

    let ignore = false;

    const fetchSubsidyStatus = async () => {
      try {
        const data = await getSubsidy(caseId);

        if (ignore) {
          return;
        }

        setSubsidyStatus({
          caseId,
          confirmed: data?.status === 'CONFIRMED',
        });
      } catch (subsidyError) {
        if (ignore) {
          return;
        }

        /*
         * 404는 해당 신고의 지원금 심사 정보가 아직
         * 생성되지 않은 정상적인 초기 상태로 처리합니다.
         */
        if (subsidyError.response?.status === 404) {
          setSubsidyStatus({
            caseId,
            confirmed: false,
          });
          return;
        }

        console.error(
          '지원금 심사 상태 조회 실패:',
          subsidyError,
        );

        setSubsidyStatus({
          caseId,
          confirmed: false,
        });
      }
    };

    fetchSubsidyStatus();

    return () => {
      ignore = true;
    };
  }, [caseId]);

  /*
   * 잠긴 단계의 URL로 직접 접근한 경우
   * 현재 접근 가능한 마지막 단계로 이동시킵니다.
   *
   * 지원금 상태 확인 전에는 잘못된 리다이렉트가
   * 발생할 수 있으므로 조회 완료 후 검사합니다.
   */
  useEffect(() => {
    if (
      !caseId
      || subsidyLoading
      || !requestedStageLocked
    ) {
      return;
    }

    const lastUnlockedStep = (
      STEPS[maxUnlockedStage - 1]
      || STEPS[0]
    );

    const target = getStepPath(
      caseId,
      lastUnlockedStep,
    );

    navigate(target, {
      replace: true,
    });
  }, [
    caseId,
    maxUnlockedStage,
    navigate,
    requestedStageLocked,
    subsidyLoading,
  ]);

  /*
   * 신고 정보가 아직 스토어에 없는 경우
   */
  if (!item) {
    return (
      <div className="case-workflow-missing">
        <h1>
          {loading
            ? '신고 정보를 불러오는 중입니다.'
            : error || '신고 정보를 찾을 수 없습니다.'}
        </h1>

        <button
          type="button"
          className="primary-action"
          onClick={() => navigate('/cases')}
        >
          신고 목록으로
        </button>
      </div>
    );
  }

  return (
    <div className={`case-workflow-page${historyView ? ' history-mode' : ''}`}>
      <header className="case-workflow-head">
        <div>
          <button
            type="button"
            onClick={() => navigate(historyView ? '/approval-history' : '/cases')}
          >
            ← {historyView ? '이력 관리' : '신고 목록'}
          </button>

          <h1>{item.case_number}</h1>
        </div>

        <dl>
          <div>
            <dt>신고자</dt>
            <dd>{item.reporter}</dd>
          </div>

          <div>
            <dt>피해 위치</dt>
            <dd>{item.address}</dd>
          </div>
        </dl>
      </header>

      <div className="case-workflow-grid">
        <aside
          className="case-workflow-gallery"
          aria-label="업무 진행 단계"
        >
          <div className="workflow-gallery-title">
            <span>업무 진행</span>

            <div className="workflow-gallery-meta">
              {historyView && <em>읽기 전용</em>}
              <strong>{activeIndex + 1} / {STEPS.length}</strong>
            </div>
          </div>

          <ol>
            {STEPS.map((step, index) => {
              const stageNumber = index + 1;
              const unlocked = historyView || canAccessStage(stageNumber);
              const skipped = skipsSeverity && stageNumber === 3;

              const wasPassed = (
                stageNumber < maxUnlockedStage
                && !skipped
              );

              let stepState = 'pending';

              if (index === activeIndex) {
                stepState = 'active';
              } else if (
                completed[index]
                || wasPassed
              ) {
                stepState = 'completed';
              }

              const target = getStepPath(
                caseId,
                step,
              );
              const historyTarget = `${target}${historyView ? '?view=history' : ''}`;

              let description = (
                '이전 단계 완료 후 진행'
              );

              if (index === activeIndex) {
                description = historyView ? '현재 단계 · 읽기 전용' : '현재 단계';
              } else if (skipped) {
                description = '미산출 · 건너뜀';
              } else if (
                historyView
              ) {
                description = '이력 조회';
              } else if (
                completed[index]
                || wasPassed
              ) {
                description = '완료';
              } else if (unlocked) {
                description = '이동 가능';
              }

              return (
                <li
                  key={step.label}
                  className={stepState}
                >
                  <button
                    type="button"
                    onClick={() => navigate(historyTarget)}
                    disabled={!unlocked}
                    aria-current={
                      index === activeIndex
                        ? 'step'
                        : undefined
                    }
                    title={
                      unlocked
                        ? undefined
                        : skipped
                          ? 'DS0·DS1 피해등급은 복구 긴급도를 산출하지 않습니다.'
                          : '이전 단계를 완료하면 이동할 수 있습니다.'
                    }
                  >
                    <span className="workflow-step-number">
                      {skipped
                        ? '—'
                        : completed[index] || wasPassed
                        ? '✓'
                        : stageNumber}
                    </span>

                    <span className="workflow-step-copy">
                      <strong>{step.label}</strong>
                      <small>{description}</small>
                    </span>

                  </button>
                </li>
              );
            })}
          </ol>
        </aside>

        <main className="case-workflow-stage">
          {historyView && <div className="history-readonly-notice" role="status"><strong>이력 조회 모드</strong><span>각 업무 단계의 기록을 확인할 수 있으며 수정·저장·승인 처리는 할 수 없습니다.</span></div>}
          <fieldset className="history-readonly-stage" disabled={historyView}>
            {!historyView && subsidyLoading && requestedStage >= 5 ? (
              <div className="case-workflow-loading">
                지원금 심사 상태를 확인하고 있습니다.
              </div>
            ) : (
              !requestedStageLocked && (
                <Outlet context={{ item, historyView }} />
              )
            )}
          </fieldset>
        </main>
      </div>
    </div>
  );
};

export default CaseWorkflowLayout;
