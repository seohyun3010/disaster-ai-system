import { useState } from 'react';
import './ai-verdict.css';

/* 부위 표시 순서 및 라벨 */
const PARTS = [
  ['roof', '지붕'],
  ['wall', '외벽'],
  ['opening', '창호'],
  ['structure', '구조체'],
  ['inundation', '침수'],
];

const STATUS_LABEL = {
  DAMAGED: '손상',
  UNDAMAGED: '이상 없음',
  NOT_VISIBLE: '확인 불가',
};

const EvidenceGallery = ({ camUrls, sourceUrls, result }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const imageCount = Math.max(camUrls.length, sourceUrls.length);
  const lastIndex = imageCount - 1;
  const safeIndex = Math.min(currentIndex, lastIndex);
  const viewLabel = `View ${safeIndex + 1}`;
  const probability = result.viewProbs?.[safeIndex]?.[result.damageGradeIndex];

  return (
    <>
      <nav className="verdict-image-navigation" aria-label="판독 근거 이미지 탐색">
        <button
          type="button"
          onClick={() => setCurrentIndex((index) => Math.max(0, index - 1))}
          disabled={safeIndex === 0}
          aria-label="이전 이미지"
        >
          <span aria-hidden="true">‹</span> 이전
        </button>
        <strong aria-live="polite" aria-atomic="true">
          {safeIndex + 1} / {imageCount}
        </strong>
        <button
          type="button"
          onClick={() => setCurrentIndex((index) => Math.min(lastIndex, index + 1))}
          disabled={safeIndex === lastIndex}
          aria-label="다음 이미지"
        >
          다음 <span aria-hidden="true">›</span>
        </button>
      </nav>

      <div className="verdict-evidence-grid">
        <figure className="verdict-evidence-panel">
          <h4>원본 사진</h4>
          <div className="verdict-image-frame">
            {sourceUrls[safeIndex] ? (
              <img src={sourceUrls[safeIndex]} alt={`${viewLabel} 원본 사진`} />
            ) : (
              <p className="verdict-image-empty">원본 사진을 불러올 수 없습니다.</p>
            )}
          </div>
          <figcaption>{viewLabel}</figcaption>
        </figure>

        <figure className="verdict-evidence-panel">
          <h4>AI 분석 결과(Grad-CAM++)</h4>
          <div className="verdict-image-frame">
            {camUrls[safeIndex] ? (
              <img src={camUrls[safeIndex]} alt={`${viewLabel} AI 분석 결과 Grad-CAM++`} />
            ) : (
              <p className="verdict-image-empty">AI 분석 이미지를 불러올 수 없습니다.</p>
            )}
          </div>
          <figcaption>
            {viewLabel}
            {probability != null && (
              <span>
                {' '}
                · p({result.damageGrade})={(probability * 100).toFixed(0)}%
              </span>
            )}
          </figcaption>
        </figure>
      </div>
    </>
  );
};

const AnalysisResultCard = ({ result, analysis }) => {
  if (!result) return null;

  const observation = result.observation || {};
  const consistency = result.consistency || {};
  const gate = result.gate || {};
  const preprocess = result.preprocess || [];
  const camUrls = result.camUrls || [];
  const sourceUrls = result.sourceUrls || [];

  const confidence = Number(result.confidence);
  const threshold = gate.threshold != null ? gate.threshold * 100 : 40;
  const gatePassed = gate.passed !== undefined ? gate.passed : confidence >= threshold;
  const inspection = result.inspectionRequired;

  return (
    <article className="case-card ai-verdict-card">
      {/* 헤더 */}
      <div className="section-heading">
        <div>
          <h2>AI 예비판정 결과</h2>
          <p>담당자 확정 전 참고 자료입니다.</p>
        </div>
        <span className={`analysis-state-badge ${inspection ? 'processing' : 'completed'}`}>
          {inspection ? '현장조사 필요' : '자동 판정 가능'}
        </span>
      </div>

      {/* 핵심 지표 3칸 */}
      <div className="verdict-grid">
        <div className="verdict-cell">
          <span className="verdict-label">추천 피해등급</span>
          <strong className="verdict-value">{result.recommendedGrade}</strong>
          {result.secondGrade && (
            <small className="verdict-sub">
              2순위 {result.secondGrade}
              {result.secondConfidence != null &&
                ` (${(result.secondConfidence * 100).toFixed(1)}%)`}
            </small>
          )}
        </div>

        <div className="verdict-cell">
          <span className="verdict-label">판정 신뢰도</span>
          <strong className={`verdict-value ${gatePassed ? '' : 'is-warn'}`}>
            {confidence.toFixed(1)}%
          </strong>
          <small className={`verdict-sub ${gatePassed ? 'is-ok' : 'is-warn'}`}>
            {gatePassed ? '게이트 통과' : '게이트 미달'} · 기준 {threshold.toFixed(0)}%
          </small>
        </div>

        <div className="verdict-cell">
          <span className="verdict-label">판정 처리 구분</span>
          <strong className={`verdict-value ${inspection ? 'is-warn' : 'is-ok'}`}>
            {inspection ? '현장조사' : '자동 판정'}
          </strong>
          <small className="verdict-sub">
            {gate.sealed_grade ? '봉인 등급 해당' : '봉인 등급 아님'}
          </small>
        </div>
      </div>

      {/* 현장조사 사유 */}
      {inspection && Array.isArray(gate.reasons) && gate.reasons.length > 0 && (
        <ul className="verdict-reasons">
          {gate.reasons.map((reason) => (
            <li key={reason}>{reason}</li>
          ))}
        </ul>
      )}

      {/* 판독 근거 이미지 */}
      {camUrls.length > 0 && (
        <section className="verdict-section">
          <div className="verdict-section-head">
            <h3>판독 근거 영역</h3>
          </div>

          <EvidenceGallery
            key={result.resultId || [...sourceUrls, ...camUrls].join('|')}
            camUrls={camUrls}
            sourceUrls={sourceUrls}
            result={result}
          />
          <p className="verdict-note">
            붉은 영역이 AI 판정에 크게 기여한 부분입니다. (Grad-CAM++)
          </p>
        </section>
      )}

      {/* 부위별 관찰 */}
      <section className="verdict-section">
        <div className="verdict-section-head">
          <h3>부위별 손상 관찰</h3>
          <span className="verdict-hint">등급 정보 없이 독립 관찰</span>
        </div>

        <table className="verdict-table">
          <tbody>
            {PARTS.map(([key, label]) => {
              const entry = observation[key] || {};
              const status = entry.status || 'NOT_VISIBLE';
              return (
                <tr key={key} className={`status-${status.toLowerCase()}`}>
                  <th scope="row">{label}</th>
                  <td className="verdict-status">
                    <i aria-hidden="true" />
                    {STATUS_LABEL[status] || status}
                  </td>
                  <td className="verdict-detail">{entry.note || '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {observation.summary && <p className="verdict-summary">{observation.summary}</p>}

        {consistency.consistent === true && (
          <p className="verdict-consistency is-ok">
            판정 결과와 관찰 내용이 일치합니다
            {consistency.visible_parts != null &&
              ` (관찰 ${consistency.visible_parts}개 부위 중 손상 ${consistency.damaged_parts}개)`}
          </p>
        )}
        {consistency.consistent === false && (
          <p className="verdict-consistency is-warn">
            {consistency.reason} — 현장조사 대상으로 분류되었습니다
          </p>
        )}
      </section>

      {/* 판독 정보 */}
      <dl className="verdict-meta">
        <div>
          <dt>판독 모델</dt>
          <dd>{result.modelVersion || '—'}</dd>
        </div>
        <div>
          <dt>분석 뷰</dt>
          <dd>{result.viewCount != null ? `${result.viewCount}장` : '—'}</dd>
        </div>
        <div>
          <dt>소요 시간</dt>
          <dd>{result.analysisTime != null ? `${result.analysisTime}초` : '—'}</dd>
        </div>
        <div>
          <dt>판독 시각</dt>
          <dd>{analysis?.completedAt || result.completedAt || '—'}</dd>
        </div>
        {preprocess.length > 0 && (
          <div className="full">
            <dt>입력 정합</dt>
            <dd>
              {preprocess[0].background_removed ? '배경 제거 적용' : '배경 제거 불필요'}
              {' · '}
              학습 분포{' '}
              {preprocess[0].in_distribution ? '일치' : '이탈 — 판정 신뢰도 저하 가능'}
            </dd>
          </div>
        )}
      </dl>

      <p className="verdict-disclaimer">
        본 결과는 AI 예비판정이며, 최종 피해등급은 담당자 검토 후 확정됩니다.
      </p>
    </article>
  );
};

export default AnalysisResultCard;
