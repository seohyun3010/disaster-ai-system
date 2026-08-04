const UrgencySummary = ({ total }) => <article className="case-card urgency-summary-card">
  <div className="section-heading"><div><h2>복구 긴급도 결과</h2></div></div>
  <div className="urgency-total"><span>총점</span><strong>{total}<small> / 100점</small></strong></div>
  <dl className="stage-summary-list urgency-formula-list">
    <div>
      <dt>점수 산식</dt>
      <dd>피해 규모 + 시설 중요도 + 접근성 + 취약계층 영향 + 2차 피해 가능성</dd>
    </div>
  </dl>
</article>;

export default UrgencySummary;
