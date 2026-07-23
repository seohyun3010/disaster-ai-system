import { TermHelp } from '../persona/ReviewGuidance';

const AnalysisResultCard = ({ analysis }) => {
  const { result } = analysis;

  return <article className="case-card analysis-result-card">
    <div className="section-heading"><div><h2>AI 분석 결과</h2><p>모델 판정 결과를 검토한 뒤 처리해 주세요.</p></div><span className="analysis-state-badge completed">분석 완료</span></div>
    <div className="analysis-score-grid"><div><span>추천 피해등급</span><strong>{result.recommendedGrade}</strong></div><div><span><TermHelp label="피해 비율">분석 이미지에서 AI가 피해 영역으로 탐지한 면적의 비율입니다.</TermHelp></span><strong>{result.damageRatio}%</strong></div><div><span><TermHelp label="신뢰도">모델 예측의 확실성 지표이며 행정 승인 확률을 뜻하지 않습니다.</TermHelp></span><strong>{result.confidence}%</strong></div></div>
    <p className="confidence-guide">신뢰도는 참고 지표입니다. 원본 사진, 오버레이, 현장 조사 내용과 판정 근거를 함께 확인한 뒤 최종 판단해 주세요.</p>
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
