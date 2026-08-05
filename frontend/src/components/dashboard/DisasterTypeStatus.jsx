import { formatDisasterType } from '../../utils/disasterTypeLabels';

const TYPE_META = {
  집중호우: { icon: '☔' },
  산사태: { icon: '▲' },
  산불: { icon: '●' },
  지진: { icon: '⌁' },
  대설: { icon: '❄' },
  기타: { icon: '＋' },
};

const DisasterTypeStatus = ({ cases }) => {
  const counts = cases.reduce((result, item) => {
    const type = formatDisasterType(item.type);
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
      </div>
    </div>

    <div className="disaster-type-list">
      {rows.map(([type, count]) => {
        const meta = TYPE_META[type] || TYPE_META.기타;
        const ratio = cases.length ? Math.round((count / cases.length) * 100) : 0;

        return <div className="disaster-type-row" key={type}>
          <span className="disaster-type-icon">{meta.icon}</span>
          <div>
            <strong>{type}</strong>
            <span><i style={{ width: `${ratio}%` }} /></span>
          </div>
          <b>{count}<small>건</small></b>
        </div>;
      })}
    </div>
  </article>;
};

export default DisasterTypeStatus;
