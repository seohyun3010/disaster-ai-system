const UrgencySummary = ({ total }) => <article className="case-card urgency-summary-card">
  <div className="section-heading"><div><h2>복구 긴급도 결과</h2></div></div>
  <div className="urgency-total"><span>총점</span><strong>{total ?? '-'}<small> / 100점</small></strong></div>
  <dl className="urgency-score-criteria" aria-label="항목별 배점 기준">
    <div><dt>AI 피해등급 점수</dt><dd>50점 기준</dd></div>
    <div><dt>가구원 수 점수</dt><dd>20점 기준</dd></div>
    <div><dt>시설·이재민 긴급도 점수</dt><dd>30점 기준</dd></div>
  </dl>
  <dl className="stage-summary-list urgency-formula-list">
    <div>
      <dt>점수 산식</dt>
      <dd>AI 피해등급 점수 + 가구원 수 점수 + 시설·이재민 긴급도 점수</dd>
    </div>
  </dl>
</article>;

export default UrgencySummary;
