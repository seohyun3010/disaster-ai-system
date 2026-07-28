import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useCaseStore } from '../stores/caseStore';
import { useAnalysisStore } from '../stores/analysisStore';
import { ANALYSIS_POLLING_INTERVAL } from '../api/analysisApi';
import AnalysisDecisionPanel from '../components/analysis/AnalysisDecisionPanel';
import AnalysisResultCard from '../components/analysis/AnalysisResultCard';
import CaseProgressStepper from '../components/case/CaseProgressStepper';
import '../components/case/case-detail-redesign.css';

const EMPTY_ANALYSIS = { status: 'idle', jobId: null, result: null };

const CaseDetailPage = () => {
  const { caseId } = useParams();
  const navigate = useNavigate();
  const cases = useCaseStore((state) => state.cases);
  const item = cases.find((entry) => entry.id === caseId) || cases[0];
  const analysis = useAnalysisStore((state) => state.analyses[item?.id] || EMPTY_ANALYSIS);
  const requestAnalysis = useAnalysisStore((state) => state.requestAnalysis);
  const refreshAnalysis = useAnalysisStore((state) => state.refreshAnalysis);
  const submitReview = useAnalysisStore((state) => state.submitReview);
  const photos = item?.photos || (item?.photoUrl ? [{ name: item.photoName || '현장 사진', url: item.photoUrl }] : []);
  const [selectedPhoto, setSelectedPhoto] = useState(0);
  const [isRequesting, setIsRequesting] = useState(false);
  const [showAnalysisResult, setShowAnalysisResult] = useState(false);
  const activePhoto = photos[selectedPhoto] || photos[0];

  useEffect(() => {
    if (!item?.id || !analysis.jobId || !['queued', 'processing'].includes(analysis.status)) return undefined;
    refreshAnalysis(item.id);
    const intervalId = window.setInterval(() => refreshAnalysis(item.id), ANALYSIS_POLLING_INTERVAL);
    return () => window.clearInterval(intervalId);
  }, [analysis.jobId, analysis.status, item?.id, refreshAnalysis]);

  if (!item) return <p className="empty-case">신고 정보를 찾을 수 없습니다.</p>;

  const handleAnalysis = async () => {
    if (analysis.status === 'completed' && analysis.result) {
      setShowAnalysisResult(true);
      return;
    }

    if (['queued', 'processing'].includes(analysis.status)) return;

    setIsRequesting(true);
    await requestAnalysis(item.id);
    setIsRequesting(false);
  };

  const analysisButtonLabel = analysis.status === 'completed'
    ? 'AI 분석 결과 보기'
    : ['queued', 'processing'].includes(analysis.status)
      ? 'AI 분석 진행 상태 보기'
      : 'AI 분석 시작';

  return <div className="case-page case-detail-page case-detail-redesign">
    <header className="case-page-head detail-head">
      <div>
        <p>신고 관리 / 신고 목록 / {item.id}</p>
        <h1>재해 신고 상세</h1>
      </div>
      <div className="detail-head-actions">
        <div className="detail-status">
          <span className={`status-badge ${item.status.replaceAll(' ', '-')}`}>{item.status}</span>
          <span className={`urgency-badge ${item.urgency}`}>{item.urgency}</span>
        </div>
        <button type="button" className="secondary-action" onClick={() => navigate('/cases')}>← 신고 목록</button>
      </div>
    </header>

    <CaseProgressStepper />

    <section className="detail-content-grid">
      <div className="detail-left-column">
        <article className="case-card detail-photo-card">
          <div className="section-heading">
            <div>
              <h2>원본 피해 사진</h2>
            </div>
            {photos.length > 0 && <span className="photo-count">{selectedPhoto + 1} / {photos.length}</span>}
          </div>

          {activePhoto
            ? <div className="uploaded-photo"><img src={activePhoto.url} alt={`${item.id} ${activePhoto.name}`} /><span>{activePhoto.name}</span></div>
            : <div className="damage-image"><div className="damage-sky" /><div className="damage-house"><i /><i /><i /></div><div className="damage-water" /><span>첨부 사진 없음</span></div>}

          {photos.length > 1 && <div className="photo-thumbs">
            {photos.map((photo, index) => <button
              type="button"
              className={index === selectedPhoto ? 'selected' : ''}
              onClick={() => setSelectedPhoto(index)}
              key={`${photo.name}-${index}`}
            >
              사진 {index + 1}
            </button>)}
          </div>}
        </article>

        <article className="case-card detail-info-card">
          <div className="section-heading">
            <div><h2>신고 기본 정보</h2></div>
          </div>
          <dl className="detail-info-tiles">
            <div><dt>사건번호</dt><dd>{item.id}</dd></div>
            <div><dt>신고자</dt><dd>{item.reporter}</dd></div>
            <div><dt>시설 유형</dt><dd>{item.facility}</dd></div>
            <div><dt>재난 유형</dt><dd>{item.type}</dd></div>
            <div><dt>피해 위치</dt><dd>{item.location}</dd></div>
            <div><dt>피해 등급</dt><dd>{item.damage}</dd></div>
            <div><dt>신고 일시</dt><dd>{item.reportedAt}</dd></div>
          </dl>
          <div className="report-description"><h3>신고 내용</h3><p>{item.description || '등록된 신고 내용이 없습니다.'}</p></div>
        </article>
      </div>

      <aside className="detail-right-column">
        {showAnalysisResult && analysis.status === 'completed' && analysis.result
          ? <div className="detail-inline-analysis">
            <AnalysisResultCard analysis={analysis} />
            <AnalysisDecisionPanel
              recommendedGrade={analysis.result.recommendedGrade}
              reviewStatus={analysis.reviewStatus}
              onSubmit={(review) => submitReview(item.id, review)}
              onReviewApproved={() => navigate(`/cases/${item.id}/severity`)}
            />
          </div>
          : <article className="case-card detail-ai-card">
          <div className="detail-ai-top">
            <div>
              <p className="request-kicker">AI DAMAGE ANALYSIS</p>
              <h2>AI 피해 분석</h2>
            </div>
            <span className={`analysis-state-badge ${analysis.status}`}>
              {analysis.status === 'completed' ? '분석 완료' : analysis.status === 'processing' ? '분석 중' : analysis.status === 'queued' ? '분석 대기' : '분석 전'}
            </span>
          </div>

          <button
            type="button"
            className="primary-action detail-ai-button"
            onClick={handleAnalysis}
            disabled={isRequesting || ['queued', 'processing'].includes(analysis.status)}
          >
            <span aria-hidden="true">✦</span>
            {isRequesting
              ? '분석 요청 중...'
              : ['queued', 'processing'].includes(analysis.status)
                ? 'AI 분석 진행 중'
                : analysisButtonLabel}
          </button>

          <div className="detail-ai-visual" aria-hidden="true">
            <div className="ai-orbit orbit-one" />
            <div className="ai-orbit orbit-two" />
            <div className="ai-core">AI</div>
          </div>

          <div className="detail-ai-ready">
            <h3>분석 준비 상태</h3>
            <ul>
              <li><span>원본 사진</span><b>{photos.length ? `${photos.length}장 확인` : '대체 이미지 사용'}</b></li>
              <li><span>신고 기본 정보</span><b>확인 완료</b></li>
              <li><span>분석 결과</span><b>{analysis.status === 'completed' ? '검토 가능' : '분석 요청 필요'}</b></li>
            </ul>
          </div>

          <div className="detail-ai-result-guide">
            <strong>분석 완료 후 제공 기능</strong>
            <span>AI 분석 결과 · 피해 영역 비교 · 피해등급 검토</span>
          </div>
        </article>}
      </aside>
    </section>
  </div>;
};

export default CaseDetailPage;
