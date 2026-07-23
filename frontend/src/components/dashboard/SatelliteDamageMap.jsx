import './satellite-map.css';

const REGION_MARKERS = [
  { name: '경기', aliases: ['경기', '경기도'], left: 48, top: 22 },
  { name: '충북', aliases: ['충북', '충청북도'], left: 54, top: 36 },
  { name: '충남', aliases: ['충남', '충청남도'], left: 45, top: 41 },
  { name: '전북', aliases: ['전북', '전라북도'], left: 49, top: 50 },
  { name: '전남', aliases: ['전남', '전라남도'], left: 46, top: 61 },
  { name: '경북', aliases: ['경북', '경상북도'], left: 61, top: 43 },
  { name: '경남', aliases: ['경남', '경상남도'], left: 58, top: 58 },
  { name: '제주', aliases: ['제주', '제주특별자치도'], left: 40, top: 89 },
];

const SatelliteDamageMap = ({ cases }) => {
  const markers = REGION_MARKERS.map((region) => {
    const regionCases = cases.filter((item) => region.aliases.some((alias) => item.location.includes(alias)));
    return {
      ...region,
      count: regionCases.length,
      urgent: regionCases.filter((item) => item.urgency === '긴급').length,
      duplicate: regionCases.filter((item) => item.duplicate).length,
    };
  }).filter((region) => region.count > 0);

  return <article className="case-card satellite-map-card">
    <div className="section-heading">
      <div><h2>대한민국 위성지도 피해 현황</h2><p>현재 신고 위치와 긴급도를 지도 위에서 확인합니다.</p></div>
      <div className="map-legend"><span><i className="normal" />신고</span><span><i className="urgent" />긴급</span></div>
    </div>
    <div className="satellite-map" role="img" aria-label="대한민국 위성지도 기반 지역별 피해 신고 현황">
      <img src="/korea-satellite-map.png" alt="" aria-hidden="true" />
      <div className="satellite-shade" />
      {markers.map((marker) => <div
        key={marker.name}
        className={`satellite-marker ${marker.urgent ? 'urgent' : ''}`}
        style={{ left: `${marker.left}%`, top: `${marker.top}%` }}
        title={`${marker.name} 신고 ${marker.count}건${marker.urgent ? ` · 긴급 ${marker.urgent}건` : ''}`}
      >
        <i />
        <span><b>{marker.name}</b><strong>{marker.count}건</strong>{marker.urgent > 0 && <em>긴급 {marker.urgent}</em>}</span>
      </div>)}
      <small className="mock-map-label">Mock 위성지도 · 신고 데이터 기준</small>
    </div>
  </article>;
};

export default SatelliteDamageMap;

