const AnalysisResultCard = ({ analysis }) => {
  const { result } = analysis;

  return <article className="case-card analysis-result-card">
    <div className="section-heading"><div><h2>AI 분석 결과</h2><p>모델 판정 결과를 검토한 뒤 처리해 주세요.</p></div><span className="analysis-state-badge completed">분석 완료</span></div>
    <div className="analysis-score-grid"><div><span>추천 피해등급</span><strong>{result.recommendedGrade}</strong></div><div><span>피해 비율</span><strong>{result.damageRatio}%</strong></div><div><span>신뢰도</span><strong>{result.confidence}%</strong></div></div>
    <dl className="analysis-result-list">
      <div><dt>AI 판정 근거</dt><dd>{result.rationale}</dd></div>
      <div><dt>모델 버전</dt><dd>{result.modelVersion}</dd></div>
      <div><dt>중복 검사 결과</dt><dd>{result.duplicateResult}</dd></div>
      <div><dt>분석 완료 시각</dt><dd>{analysis.completedAt}</dd></div>
      <div><dt>jobId</dt><dd>{analysis.jobId}</dd></div>
    </dl>
  </article>;
};

export default AnalysisResultCard;
