import { EvidencePanel, TermHelp } from '../persona/ReviewGuidance';

const UrgencySummary = ({ total, urgency }) => <article className="case-card urgency-summary-card">
  <div className="section-heading"><div><h2>복구 긴급도 결과</h2><p>항목별 점수를 합산해 자동 산정한 결과입니다.</p></div></div>
  <div className="urgency-total"><span>총점</span><strong>{total}<small> / 100점</small></strong></div>
  <dl className="stage-summary-list"><div><dt><TermHelp label="긴급도 등급">피해 심각도 총점을 기준으로 복구 착수 우선순위를 구분한 값입니다.</TermHelp></dt><dd><span className={`urgency-badge ${urgency.grade}`}>{urgency.grade}</span></dd></div><div><dt>추천 복구 순위</dt><dd>{urgency.rank}</dd></div><div><dt>점수 산식</dt><dd>피해 규모 + 시설 중요도 + 접근성 + 취약계층 영향 + 2차 피해 가능성</dd></div><div><dt>등급 기준</dt><dd>긴급 80점 이상 · 높음 60~79점 · 보통 40~59점 · 낮음 40점 미만</dd></div></dl>
  <EvidencePanel title="근거 문서·관련 조항 확인"><p><b>재난 및 안전관리 기본법 제4조</b> — 국가와 지방자치단체의 재난 예방 및 피해 경감 책무</p><p><b>자연재난 구호 및 복구 비용 부담기준 등에 관한 규정</b> — 복구계획 수립 및 지원 범위 산정 참고</p><p>현재 화면의 배점·구간은 UI 검증용 Mock 기준입니다. 실제 심사 시 최신 내부 지침을 확인해 주세요.</p></EvidencePanel>
</article>;

export default UrgencySummary;
