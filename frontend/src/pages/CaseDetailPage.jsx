import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ANALYSIS_POLLING_INTERVAL, getCaseAnalysisResult } from '../api/analysisApi';
import { submitDamageGradeReview } from '../api/reviewApi';
import AnalysisDecisionPanel from '../components/analysis/AnalysisDecisionPanel';
import AnalysisResultCard from '../components/analysis/AnalysisResultCard';
import RagEvidenceCard from '../components/analysis/RagEvidenceCard';
import { useAnalysisStore } from '../stores/analysisStore';
import { useCaseStore } from '../stores/caseStore';
import { useWorkflowStore } from '../stores/workflowStore';
import { useAuthStore } from '../stores/authStore';
import { isZeroSupportGrade } from '../utils/reviewRules';
import { buildDisasterCaseListPath } from '../utils/disasterEvents';
import './case-workspace.css';

const EMPTY_ANALYSIS = { status: 'idle', jobId: null, result: null, reviewStatus: '검토 전' };

const maskResidentNumber = (value) =>
  (/^\d{6}-[1-4]\*{6}$/.test(value) ? value : value?.replace(/^(\d{6})-\d{7}$/, '$1-*******'))
  || '******-*******';

const maskPhoneNumber = (value) =>
  (/^\d{3}-\*{4}-\d{4}$/.test(value) ? value : value?.replace(/^(\d{3})-\d{3,4}-(\d{4})$/, '$1-****-$2'))
  || '-';

const maskAccountNumber = (value) => {
  if (!value) return '***-**-******';
  if (value.includes('*')) return value;
  let remainingDigits = value.replace(/\D/g, '').length - 4;
  return [...value].map((character) => {
    if (!/\d/.test(character) || remainingDigits <= 0) return character;
    remainingDigits -= 1;
    return '*';
  }).join('');
};

const createReportView = (item) => {
  const external = item.raw_payload || {};
  return {
    reportId: item.case_number || item.external_report_id,
    receivedAt: item.reportedAt,
    disasterType: item.type,
    facilityType: item.facility,
    applicant: {
      name: item.reporter_name || item.reporter,
      residentNumber: maskResidentNumber(
        item.resident_registration_number ||
        external.resident_registration_number ||
        external.resident_number,
      ),
      address: item.address,
      phone: maskPhoneNumber(
        item.contact_number || external.contact_number || external.phone,
      ),
      householdMembers: item.household_members || external.household_members || '-',
    },
    payoutAccount: {
      bankName: item.bank_name || external.bank_name || '확인 전',
      accountNumber: maskAccountNumber(
        item.account_number || external.account_number,
      ),
      accountHolder:
        item.account_holder ||
        external.account_holder ||
        item.reporter_name ||
        item.reporter,
    },
    damagePlace: item.address,
    damageOccurredAt: item.damage_occurred_at
      ? new Intl.DateTimeFormat('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }).format(new Date(item.damage_occurred_at))
      : item.reportedAt,
    damageDetails: item.damage_details?.length
      ? item.damage_details.map((detail) => ({
        category: detail.category || item.facility,
        value: [detail.quantity, detail.details].filter(Boolean).join(' · '),
      }))
      : [{ category: item.facility, value: item.description || '접수된 피해 내용을 확인해 주세요.' }],
    photos: item.photos || [],
  };
};

const CaseDetailPage = ({ initialScreen = 'report' }) => {
  const { caseId } = useParams();
  const navigate = useNavigate();
  const item = useCaseStore((state) =>
    state.cases.find((entry) => entry.id === caseId));
  const analysis = useAnalysisStore((state) => state.analyses[caseId] || EMPTY_ANALYSIS);
  const requestAnalysis = useAnalysisStore((state) => state.requestAnalysis);
  const refreshAnalysis = useAnalysisStore((state) => state.refreshAnalysis);
  const submitReview = useAnalysisStore((state) => state.submitReview);
  const confirmHeldReview = useAnalysisStore((state) => state.confirmHeldReview);
  const startReview = useAnalysisStore((state) => state.startReview);
  const unlockStage = useWorkflowStore((state) => state.unlockStage);
  const currentUser = useAuthStore((state) => state.user);
  const screen = initialScreen;
  const report = useMemo(() => item ? createReportView(item) : null, [item]);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);

  // 판독 결과는 서버(ai_results)를 단일 출처로 삼는다.
  // 브라우저 저장소 상태에 의존하면 DB에 결과가 있어도 화면이 비는
  // 문제가 발생하므로, 진입 시 항상 서버에서 조회한다.
  const [serverResultState, setServerResultState] = useState({ caseId: null, data: null });
  const serverResult = serverResultState.caseId === caseId ? serverResultState.data : null;
  const resultLoading = serverResultState.caseId !== caseId;

  useEffect(() => {
    let alive = true;
    getCaseAnalysisResult(caseId)
      .then((data) => { if (alive) setServerResultState({ caseId, data }); })
      .catch(() => { if (alive) setServerResultState({ caseId, data: null }); });
    return () => { alive = false; };
  }, [caseId, analysis.status]);

  // 분석 진행 중에는 서버 상태를 주기적으로 확인한다.
  useEffect(() => {
    if (!analysis.jobId || !['queued', 'processing'].includes(analysis.status)) return undefined;
    refreshAnalysis(caseId);
    const intervalId = window.setInterval(() => refreshAnalysis(caseId), ANALYSIS_POLLING_INTERVAL);
    return () => window.clearInterval(intervalId);
  }, [analysis.jobId, analysis.status, caseId, refreshAnalysis]);

  useEffect(() => {
    if (screen !== 'analysis' || !['보류', '수정 승인'].includes(analysis.reviewStatus)) return;
    startReview(caseId, analysis.reviewedGrade);
  }, [analysis.reviewStatus, analysis.reviewedAt, analysis.reviewedGrade, caseId, screen, startReview]);

  // 결과가 아직 없으면 폴링으로 확인한다 (백그라운드 판독 완료 대기).
  useEffect(() => {
    if (serverResult || !['queued', 'processing'].includes(analysis.status)) return undefined;
    const timer = window.setInterval(() => {
      getCaseAnalysisResult(caseId)
        .then((data) => { if (data) setServerResultState({ caseId, data }); })
        .catch(() => {});
    }, ANALYSIS_POLLING_INTERVAL);
    return () => window.clearInterval(timer);
  }, [serverResult, analysis.status, caseId]);

  if (!item || !report) return null;
  const visiblePhotoIndex = report.photos.length > 0 ? activePhotoIndex % report.photos.length : 0;
  const caseListPath = buildDisasterCaseListPath(item);
  const isRunning = ['queued', 'processing'].includes(analysis.status);

  const startAnalysis = async () => {
    unlockStage(caseId, 2);
    navigate(`/cases/${caseId}/analysis`);
    setServerResultState({ caseId, data: null });
    await requestAnalysis(caseId);
  };

  return <section className="case-workspace-panel">
    {screen === 'report' ? <>
      <header className="workspace-panel-head">
        <div>
          <p>접수번호 {report.reportId}</p>
          <h2>사유재산 피해신고서</h2>
        </div>
        <div>
          <span className="workspace-received-at">{report.receivedAt}</span>
          <button type="button" className="primary-action" onClick={startAnalysis}>
            {serverResult ? 'AI 분석 결과 보기' : 'AI 분석 시작'}
          </button>
        </div>
      </header>

      <div className="private-report-content">
        <div className="private-report-grid">
          <article>
            <h3>인적 사항</h3>
            <dl>
              <div><dt>성명</dt><dd>{report.applicant.name}</dd></div>
              <div><dt>주민등록번호</dt><dd>{report.applicant.residentNumber}</dd></div>
              <div><dt>주소</dt><dd>{report.applicant.address}</dd></div>
              <div><dt>연락처</dt><dd>{report.applicant.phone}</dd></div>
              <div><dt>세대원 수</dt><dd>{report.applicant.householdMembers}{report.applicant.householdMembers !== '-' ? '명' : ''}</dd></div>
            </dl>
          </article>
          <article>
            <h3>지원금 수령 계좌</h3>
            <dl>
              <div><dt>은행명</dt><dd>{report.payoutAccount.bankName}</dd></div>
              <div><dt>계좌번호</dt><dd>{report.payoutAccount.accountNumber}</dd></div>
              <div><dt>예금주</dt><dd>{report.payoutAccount.accountHolder}</dd></div>
            </dl>
          </article>
          <article>
            <h3>피해 장소</h3>
            <dl>
              <div><dt>피해 주소</dt><dd>{report.damagePlace}</dd></div>
              <div><dt>피해 발생 일시</dt><dd>{report.damageOccurredAt}</dd></div>
              <div><dt>시설 유형</dt><dd>{report.facilityType}</dd></div>
              <div><dt>재난 유형</dt><dd>{report.disasterType}</dd></div>
            </dl>
          </article>
          <article>
            <h3>피해 종류 및 수량</h3>
            <dl>
              {report.damageDetails.map((detail) => <div key={`${detail.category}-${detail.value}`}><dt>{detail.category}</dt><dd>{detail.value}</dd></div>)}
            </dl>
          </article>
        </div>

        <article className="private-report-photos">
          <div className="private-report-section-title">
            <h3>피해 사진</h3>
            <span>{report.photos.length}장</span>
          </div>
          {report.photos.length > 0
            ? <div className="private-photo-carousel">
              <figure>
                <img src={report.photos[visiblePhotoIndex].url} alt={`${visiblePhotoIndex + 1}번 피해 사진`} />
                <figcaption>사진 {visiblePhotoIndex + 1} · {report.photos[visiblePhotoIndex].name}</figcaption>
              </figure>
              <button type="button" className="private-photo-control previous" aria-label="이전 피해 사진" disabled={report.photos.length < 2} onClick={() => setActivePhotoIndex((current) => (current - 1 + report.photos.length) % report.photos.length)}>‹</button>
              <button type="button" className="private-photo-control next" aria-label="다음 피해 사진" disabled={report.photos.length < 2} onClick={() => setActivePhotoIndex((current) => (current + 1) % report.photos.length)}>›</button>
              <span className="private-photo-position">{visiblePhotoIndex + 1} / {report.photos.length}</span>
            </div>
            : <div className="private-photo-empty"><strong>첨부 사진 없음</strong><span>AI 분석에는 대체 이미지와 신고 내용이 사용됩니다.</span></div>}
        </article>
      </div>

      <p className="private-report-security">민감 정보는 마스킹하여 표시됩니다.</p>
    </> : <>
      <header className="workspace-panel-head">
        <div>
          <p>2단계 · AI 분석</p>
          <h2>AI 피해 분석 및 등급 검토</h2>
        </div>
        <button type="button" className="secondary-action" onClick={() => navigate(`/cases/${caseId}`)}>신고서 보기</button>
      </header>

      {!serverResult && <article className={`workspace-analysis-state ${analysis.status}`}>
        <span className="analysis-state-badge">
          {resultLoading ? '불러오는 중'
            : analysis.status === 'failed' ? '분석 실패'
              : isRunning ? '분석 진행 중'
                : '분석 대기'}
        </span>
        <div className="workspace-ai-visual" aria-hidden="true"><span>AI</span></div>
        <h3>
          {resultLoading ? '판독 결과를 확인하고 있습니다.'
            : analysis.status === 'failed' ? '분석 요청을 완료하지 못했습니다.'
              : isRunning ? '피해 사진을 판독하고 있습니다.'
                : 'AI 판독을 요청할 수 있습니다.'}
        </h3>
        <p>{analysis.stage || '배경 분리 · 등급 분류 · 판독 근거 생성 순으로 진행됩니다.'}</p>
        {!resultLoading && !isRunning && <button type="button" className="primary-action" onClick={startAnalysis}>
          {analysis.status === 'failed' ? '다시 분석' : 'AI 분석 요청'}
        </button>}
      </article>}

      {serverResult && <div className="workspace-analysis-results">
        <AnalysisResultCard result={serverResult} analysis={{ completedAt: serverResult.completedAt }} />
        <RagEvidenceCard caseId={caseId} damageGrade={serverResult.damageGrade} facilityType={report.facilityType} />
        <AnalysisDecisionPanel
          confidence={serverResult.confidence}
          recommendedGrade={serverResult.recommendedGrade}
          reviewedGrade={analysis.reviewedGrade}
          reviewStatus={analysis.reviewStatus}
          onSubmit={(review) => submitReview(caseId, review)}
          onReReviewSubmit={async (review) => {
            const reviewerId = currentUser?.id ?? currentUser?.user_id;
            if (!reviewerId) {
              throw new Error('로그인한 담당자 정보를 확인할 수 없습니다.');
            }
            await submitDamageGradeReview(caseId, review, reviewerId);
            confirmHeldReview(caseId, review);
          }}
          onReviewApproved={(grade) => {
            const skipsSeverity = isZeroSupportGrade(grade);
            unlockStage(caseId, skipsSeverity ? 4 : 3);
            navigate(`/cases/${caseId}/${skipsSeverity ? 'support' : 'severity'}`);
          }}
          onReviewHeld={() => navigate(caseListPath)}
        />
      </div>}
    </>}
  </section>;
};

export default CaseDetailPage;
