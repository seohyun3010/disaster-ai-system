const UrgencySummary = ({ total, urgency }) => <article className="case-card urgency-summary-card">
  <div className="section-heading"><div><h2>복구 긴급도 결과</h2><p>항목별 점수를 합산해 자동 산정한 결과입니다.</p></div></div>
  <div className="urgency-total"><span>총점</span><strong>{total}<small> / 100점</small></strong></div>
  <dl className="stage-summary-list"><div><dt>긴급도 등급</dt><dd><span className={`urgency-badge ${urgency.grade}`}>{urgency.grade}</span></dd></div><div><dt>추천 복구 순위</dt><dd>{urgency.rank}</dd></div><div><dt>산정 기준</dt><dd>총점 80점 이상 긴급 · 60점 이상 높음</dd></div></dl>
  <details className="evidence-details"><summary>근거 문서·조항 보기</summary><p>재난 및 안전관리 기본법과 자연재난 구호 및 복구 비용 부담기준 등에 관한 규정의 Mock 기준입니다.</p></details>
</article>;

export default UrgencySummary;
