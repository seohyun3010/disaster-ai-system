import { Fragment, useState } from 'react';
import './severity-criteria-table.css';

const CRITERIA_ROWS = [
  {
    key: 'ai-grade',
    label: 'AI 피해등급 점수',
    score: '50점',
    method: '피해등급별 차등 점수',
    detailTitle: 'AI 피해등급 세부 점수',
    type: 'cards',
    cards: [
      { label: '전파 · 유실', score: '50점' },
      { label: '반파', score: '25점' },
      { label: '무피해', score: '0점' },
    ],
    basis: '전파 · 유실의 재난지원금 및 장기구호 기간이 반파 기준의 2배',
    source: '[출처 ① · ②]',
  },
  {
    key: 'household',
    label: '가구원 수 점수',
    score: '20점',
    method: '가구원 수 × 4점, 최대 20점',
    detailTitle: '가구원 수 세부 점수',
    type: 'cards',
    cards: [
      { label: '1인', score: '4점' },
      { label: '2인', score: '8점' },
      { label: '3인', score: '12점' },
      { label: '4인', score: '16점' },
      { label: '5인 이상', score: '20점' },
    ],
    basis: "장기구호비의 '1인 1일당 지원기준지수' 지급 구조를 준용",
    formula: '가구원 수 × 4점 · 최대 20점',
    source: '[출처 ②]',
  },
  {
    key: 'facility-livelihood',
    label: '시설·이재민 긴급도 점수',
    score: '30점',
    method: '시설유형별 지원율 × 0.3',
    detailTitle: '시설·이재민 긴급도 세부 기준',
    type: 'table',
    basis: '「재난복구 비용 등에 대한 부담기준」의 시설유형별 원문 지원율을 적용',
    formula: '시설유형별 지원율 × 0.3',
    source: '[출처 ①]',
  },
];

const CriteriaDetail = ({ row, id }) => (
  <tr className="sct-detail-row">
    <td colSpan="4">
      <div className="sct-detail-panel" id={id}>
        <h3>{row.detailTitle}</h3>
        {row.type === 'cards' ? (
          <div className={`sct-box-grid sct-box-grid-${row.cards.length}`}>
            {row.cards.map((card) => (
              <div className="sct-box" key={card.label}>
                <span>{card.label}</span>
                <strong>{card.score}</strong>
              </div>
            ))}
          </div>
        ) : (
          <table className="sct-inner-table">
            <thead><tr><th>시설유형·피해등급</th><th>원문 지원율</th><th>긴급도 점수</th></tr></thead>
            <tbody>
              <tr><td>주택 침수·소파</td><td>지원 100%</td><td><strong>30점</strong></td></tr>
              <tr><td>주택 반파·전파</td><td>지원 30%</td><td><strong>9점</strong></td></tr>
              <tr><td>상가</td><td>지원 30%</td><td><strong>9점</strong></td></tr>
              <tr><td>농경지</td><td>지원 60%</td><td><strong>18점</strong></td></tr>
            </tbody>
          </table>
        )}
        {row.key === 'facility-livelihood' && (
          <p className="sct-evaluation"><strong>자동 산정</strong> 시설유형과 피해등급을 기준으로 별도 수기 입력 없이 점수를 계산합니다.</p>
        )}
        <div className="sct-basis-row">
          <p><strong>산정 근거</strong> {row.basis}</p>
          <span>{row.source}</span>
        </div>
        {row.formula && <p className="sct-formula">{row.formula}</p>}
      </div>
    </td>
  </tr>
);

const SeverityCriteriaTable = () => {
  const [openRows, setOpenRows] = useState([]);

  const toggleRow = (key) => {
    setOpenRows((current) => (
      current.includes(key) ? current.filter((item) => item !== key) : [...current, key]
    ));
  };

  return (
    <article className="case-card sct-card">
      <div className="sct-header">
        <div>
          <h2>주택 피해 복구 긴급도 산정 기준</h2>
          <p>관계 법령의 피해·구호 기준을 준용한 내부 우선순위 산정 기준입니다.</p>
        </div>
        <span className="sct-total-badge">총 100점</span>
      </div>
      <div className="sct-table-wrap">
        <table className="sct-table">
          <thead><tr><th>평가 항목</th><th>배점</th><th>산정 방식</th><th><span className="sr-only">세부 기준</span></th></tr></thead>
          <tbody>
            {CRITERIA_ROWS.map((row) => {
              const isOpen = openRows.includes(row.key);
              const panelId = `criteria-${row.key}`;
              return (
                <Fragment key={row.key}>
                  <tr className="sct-summary-row">
                    <td>{row.label}</td><td><strong>{row.score}</strong></td><td>{row.method}</td>
                    <td className="sct-toggle-cell">
                      <button type="button" className="sct-toggle-btn" aria-expanded={isOpen} aria-controls={panelId} onClick={() => toggleRow(row.key)}>
                        세부 기준 <span aria-hidden="true" className={isOpen ? 'sct-chevron sct-chevron-up' : 'sct-chevron'}>⌄</span>
                      </button>
                    </td>
                  </tr>
                  {isOpen && <CriteriaDetail row={row} id={panelId} />}
                </Fragment>
              );
            })}
            <tr className="sct-total-row"><td><span>합계</span></td><td><strong>100점</strong></td><td>3개 항목 점수 합산</td><td aria-hidden="true">-</td></tr>
          </tbody>
        </table>
      </div>
      <footer className="sct-footer">
        <h3>산정 근거 및 출처</h3>
        <p>① 「자연재난 구호 및 복구 비용 부담기준 등에 관한 규정」 [별표 1] 재난복구 비용 등에 대한 부담기준</p>
        <p>② 「자연재난에 대한 피해조사 및 복구계획수립 요령」 [별표] 나. 이재민 구호 - (2) 장기구호</p>
        <div className="sct-notes">
          <p>※ 본 배점은 관계 법령이 직접 규정한 점수가 아니라, 주택 피해등급별 지원 수준과 이재민 구호기준을 준용하여 설계한 내부 의사결정 지원 기준입니다.</p>
          <p>※ AI 분석 결과는 담당 공무원의 검토와 승인을 거쳐 최종 확정됩니다.</p>
        </div>
      </footer>
    </article>
  );
};

export default SeverityCriteriaTable;
