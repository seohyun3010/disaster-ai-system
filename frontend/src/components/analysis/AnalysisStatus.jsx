const STATUS_CONTENT = {
  idle: ['분석 전', 'AI 분석 요청 전입니다.'],
  queued: ['분석 대기', 'AI 분석 요청이 접수되었습니다.'],
  processing: ['분석 진행 중', 'AI가 피해 영역과 등급을 분석하고 있습니다.'],
  completed: ['분석 완료', '분석 결과가 준비되었습니다.'],
  failed: ['분석 실패', '분석 요청을 완료하지 못했습니다.'],
};

const AnalysisStatus = ({ analysis, onRequest, onReview }) => {
  const [title, description] = STATUS_CONTENT[analysis.status];
  const isRunning = ['queued', 'processing'].includes(analysis.status);

  return <section className={`case-card analysis-status-card ${analysis.status}`}>
    <div className="analysis-status-head">
      <span className={`analysis-state-badge ${analysis.status}`}>{title}</span>
      {isRunning && <span className="analysis-loader" aria-label="분석 진행 중" />}
    </div>
    <h2>{description}</h2>
    {analysis.stage && <p className="analysis-stage">현재 단계: <strong>{analysis.stage}</strong></p>}
    {analysis.jobId && <dl className="analysis-job-info"><div><dt>jobId</dt><dd>{analysis.jobId}</dd></div><div><dt>요청 시각</dt><dd>{analysis.requestedAt}</dd></div></dl>}
    {analysis.error && <p className="analysis-error" role="alert">{analysis.error}</p>}
    <div className="analysis-status-actions">
      {analysis.status === 'idle' && <button className="primary-action" type="button" onClick={onRequest}>AI 분석 요청</button>}
      {analysis.status === 'failed' && <button className="primary-action" type="button" onClick={onRequest}>다시 요청</button>}
      {analysis.status === 'completed' && <button className="primary-action" type="button" onClick={onReview}>분석 결과 검토</button>}
      {isRunning && <button className="primary-action" type="button" disabled>분석 진행 중</button>}
    </div>
  </section>;
};

export default AnalysisStatus;
