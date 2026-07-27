const TYPE_META = {
  집중호우: { color: '#2563eb', soft: '#eaf2ff', icon: '☔' },
  산사태: { color: '#f97316', soft: '#fff1e7', icon: '▲' },
  태풍: { color: '#7c3aed', soft: '#f2ebff', icon: '🌀' },
  지진: { color: '#ef4444', soft: '#feeceb', icon: '⌁' },
  폭설: { color: '#0ea5e9', soft: '#e8f7fd', icon: '❄' },
  화재: { color: '#dc2626', soft: '#fee9e7', icon: '●' },
  기타: { color: '#64748b', soft: '#eef2f6', icon: '＋' },
};

const DisasterTypeStatus = ({ cases }) => {
  const counts = cases.reduce((result, item) => {
    const type = item.type || '기타';
    result[type] = (result[type] || 0) + 1;
    return result;
  }, {});

  const rows = Object.entries(counts)
    .sort(([, countA], [, countB]) => countB - countA)
    .slice(0, 4);

  return <article className="case-card disaster-type-card">
    <div className="dashboard-card-title">
      <div>
        <h2>재난 유형별 현황</h2>
        <p>접수된 신고 데이터를 유형별로 집계합니다.</p>
      </div>
    </div>

    <div className="disaster-type-list">
      {rows.map(([type, count]) => {
        const meta = TYPE_META[type] || TYPE_META.기타;
        const ratio = cases.length ? Math.round((count / cases.length) * 100) : 0;

        return <div className="disaster-type-row" key={type}>
          <span className="disaster-type-icon" style={{ color: meta.color, background: meta.soft }}>{meta.icon}</span>
          <div>
            <strong>{type}</strong>
            <span><i style={{ width: `${ratio}%`, background: meta.color }} /></span>
          </div>
          <b style={{ color: meta.color }}>{count}<small>건</small></b>
        </div>;
      })}
    </div>
  </article>;
};

export default DisasterTypeStatus;
