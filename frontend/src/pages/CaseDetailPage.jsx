import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ANALYSIS_POLLING_INTERVAL } from '../api/analysisApi';
import AnalysisDecisionPanel from '../components/analysis/AnalysisDecisionPanel';
import AnalysisResultCard from '../components/analysis/AnalysisResultCard';
import { useAnalysisStore } from '../stores/analysisStore';
import { useCaseStore } from '../stores/caseStore';
import './case-workspace.css';

const EMPTY_ANALYSIS = { status: 'idle', jobId: null, result: null, reviewStatus: '검토 전' };

const maskResidentNumber = (value) =>
  value?.replace(/^(\d{6})-\d{7}$/, '$1-*******') || '******-*******';

const maskPhoneNumber = (value) =>
  value?.replace(/^(\d{3})-\d{3,4}-(\d{4})$/, '$1-****-$2') || '-';

const maskAccountNumber = (value) => {
  if (!value) return '***-**-******';
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
    reportId: item.external_report_id || item.case_number,
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
    state.cases.find((entry) => entry.case_id === Number(caseId)));
  const analysis = useAnalysisStore((state) => state.analyses[caseId] || EMPTY_ANALYSIS);
  const requestAnalysis = useAnalysisStore((state) => state.requestAnalysis);
  const refreshAnalysis = useAnalysisStore((state) => state.refreshAnalysis);
  const submitReview = useAnalysisStore((state) => state.submitReview);
  const screen = initialScreen;
  const report = useMemo(() => item ? createReportView(item) : null, [item]);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);

  useEffect(() => {
    if (!analysis.jobId || !['queued', 'processing'].includes(analysis.status)) return undefined;
    refreshAnalysis(caseId);
    const intervalId = window.setInterval(() => refreshAnalysis(caseId), ANALYSIS_POLLING_INTERVAL);
    return () => window.clearInterval(intervalId);
  }, [analysis.jobId, analysis.status, caseId, refreshAnalysis]);

  if (!item || !report) return null;
  const visiblePhotoIndex = report.photos.length > 0 ? activePhotoIndex % report.photos.length : 0;
  const caseListPath = '/cases';

  const startAnalysis = async () => {
    navigate(`/cases/${caseId}/analysis`);
    if (analysis.status === 'idle' || analysis.status === 'failed') await requestAnalysis(caseId);
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
            {analysis.status === 'completed' ? 'AI 분석 결과 보기' : 'AI 분석 시작'}
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

      {['idle', 'queued', 'processing', 'failed'].includes(analysis.status) && <article className={`workspace-analysis-state ${analysis.status}`}>
        <span className="analysis-state-badge">{analysis.status === 'failed' ? '분석 실패' : analysis.status === 'processing' ? '분석 진행 중' : '분석 대기'}</span>
        <div className="workspace-ai-visual" aria-hidden="true"><span>AI</span></div>
        <h3>{analysis.status === 'failed' ? '분석 요청을 완료하지 못했습니다.' : '피해 사진과 신고 내용을 분석하고 있습니다.'}</h3>
        <p>{analysis.stage || '피해 영역 탐지와 예상 피해등급 산출을 준비합니다.'}</p>
        {analysis.status === 'failed' && <button type="button" className="primary-action" onClick={startAnalysis}>다시 분석</button>}
      </article>}

      {analysis.status === 'completed' && analysis.result && <div className="workspace-analysis-results">
        <AnalysisResultCard analysis={analysis} />
        <AnalysisDecisionPanel
          recommendedGrade={analysis.result.recommendedGrade}
          reviewStatus={analysis.reviewStatus}
          onSubmit={(review) => submitReview(caseId, review)}
          onReviewApproved={() => navigate(`/cases/${caseId}/severity`)}
          onReviewHeld={() => navigate(caseListPath)}
        />
      </div>}
    </>}
  </section>;
};

export default CaseDetailPage;
