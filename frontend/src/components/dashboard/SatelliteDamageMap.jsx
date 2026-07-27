import './satellite-map.css';

const MAP_BOUNDS = {
  minLongitude: 126,
  maxLongitude: 129.6,
  minLatitude: 33,
  maxLatitude: 38.7,
};

const REGION_MARKERS = [
  { name: '서울', fullName: '서울특별시', aliases: ['서울', '서울특별시'], longitude: 126.9780, latitude: 37.5665 },
  { name: '부산', fullName: '부산광역시', aliases: ['부산', '부산광역시'], longitude: 129.0756, latitude: 35.1796 },
  { name: '대구', fullName: '대구광역시', aliases: ['대구', '대구광역시'], longitude: 128.6014, latitude: 35.8714 },
  { name: '인천', fullName: '인천광역시', aliases: ['인천', '인천광역시'], longitude: 126.7052, latitude: 37.4563 },
  { name: '광주', fullName: '광주광역시', aliases: ['광주', '광주광역시'], longitude: 126.8526, latitude: 35.1595 },
  { name: '대전', fullName: '대전광역시', aliases: ['대전', '대전광역시'], longitude: 127.3845, latitude: 36.3504 },
  { name: '울산', fullName: '울산광역시', aliases: ['울산', '울산광역시'], longitude: 129.3114, latitude: 35.5384 },
  { name: '세종', fullName: '세종특별자치시', aliases: ['세종', '세종특별자치시'], longitude: 127.2890, latitude: 36.4800 },
  { name: '경기', fullName: '경기도', aliases: ['경기', '경기도'], longitude: 127.0286, latitude: 37.2636 },
  { name: '강원', fullName: '강원특별자치도', aliases: ['강원', '강원도', '강원특별자치도'], longitude: 127.7298, latitude: 37.8813 },
  { name: '충북', fullName: '충청북도', aliases: ['충북', '충청북도'], longitude: 127.4890, latitude: 36.6424 },
  { name: '충남', fullName: '충청남도', aliases: ['충남', '충청남도'], longitude: 126.6608, latitude: 36.6011 },
  { name: '전북', fullName: '전북특별자치도', aliases: ['전북', '전라북도', '전북특별자치도'], longitude: 127.1480, latitude: 35.8242 },
  { name: '전남', fullName: '전라남도', aliases: ['전남', '전라남도'], longitude: 126.4817, latitude: 34.9904 },
  { name: '경북', fullName: '경상북도', aliases: ['경북', '경상북도'], longitude: 128.7294, latitude: 36.5684 },
  { name: '경남', fullName: '경상남도', aliases: ['경남', '경상남도'], longitude: 128.6811, latitude: 35.2281 },
  { name: '제주', fullName: '제주특별자치도', aliases: ['제주', '제주특별자치도'], longitude: 126.5312, latitude: 33.4996 },
];

const MARKER_COLORS = ['blue', 'green', 'purple', 'orange'];

const projectCoordinate = (longitude, latitude) => ({
  x: 65 + ((longitude - MAP_BOUNDS.minLongitude) / (MAP_BOUNDS.maxLongitude - MAP_BOUNDS.minLongitude)) * 230,
  y: 30 + ((MAP_BOUNDS.maxLatitude - latitude) / (MAP_BOUNDS.maxLatitude - MAP_BOUNDS.minLatitude)) * 445,
});

const SatelliteDamageMap = ({ cases }) => {
  const regions = REGION_MARKERS.map((region) => {
    const regionCases = cases.filter((item) => region.aliases.some((alias) => item.location.includes(alias)));
    return {
      ...region,
      ...projectCoordinate(region.longitude, region.latitude),
      count: regionCases.length,
      urgent: regionCases.filter((item) => item.urgency === '긴급').length,
    };
  });

  const activeRegions = regions
    .filter((region) => region.count > 0)
    .sort((a, b) => b.count - a.count);

  return <article className="case-card regional-map-card">
    <div className="dashboard-card-title map-card-title">
      <div>
        <h2>신고 지역 현황</h2>
        <p>최근 7일 · 17개 광역자치단체 기준</p>
      </div>
    </div>

    <div className="regional-map-content">
      <div className="active-region-list" aria-label="신고가 접수된 지역">
        {activeRegions.map((region, index) => <div className={`region-count ${MARKER_COLORS[index % MARKER_COLORS.length]}`} key={region.name}>
          <span>{region.name}</span>
          <b>{region.count}<small>건</small></b>
        </div>)}
      </div>

      <div className="korea-region-map">
        <svg viewBox="0 0 360 510" role="img" aria-labelledby="korea-map-title korea-map-description">
          <title id="korea-map-title">대한민국 17개 광역자치단체 신고 위치 지도</title>
          <desc id="korea-map-description">광역자치단체 대표 위치를 실제 위도와 경도 비율에 따라 배치한 지도입니다.</desc>
          <defs>
            <linearGradient id="mapLandGradient" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#fbfcfe" />
              <stop offset="100%" stopColor="#f1f5fa" />
            </linearGradient>
            <filter id="mapShadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="5" stdDeviation="6" floodColor="#7592bb" floodOpacity=".14" />
            </filter>
          </defs>

          <path
            className="korea-land"
            filter="url(#mapShadow)"
            d="M126 50 C151 31 190 33 218 50 C239 64 242 88 255 104 C268 121 263 144 275 162 C286 184 276 205 286 226 C297 250 287 274 291 295 C292 317 278 337 261 351 C244 365 219 359 201 374 C183 387 159 375 143 365 C127 355 110 364 95 353 L80 342 L78 326 L64 314 L77 299 L58 287 L74 270 L58 254 L75 238 L60 221 L79 205 L69 187 L86 170 L77 151 L91 134 L84 116 L101 100 L96 82 L112 70 Z"
          />
          <path className="korea-island" d="M66 447 C82 437 110 435 129 444 C139 451 132 463 116 469 C95 477 70 471 61 460 C58 455 60 451 66 447 Z" />
          <path className="korea-islet" d="M42 319 C49 314 56 316 58 322 C59 328 52 332 46 330 C40 328 38 323 42 319 Z" />
          <path className="korea-islet" d="M53 350 C58 346 64 348 65 353 C65 358 59 361 54 359 C50 357 49 353 53 350 Z" />
          <path className="korea-islet" d="M311 229 C316 224 322 226 323 231 C324 236 318 240 313 238 C309 236 308 232 311 229 Z" />

          <g className="province-lines" aria-hidden="true">
            <path d="M89 151 C126 141 159 150 188 168 C214 183 244 177 271 166" />
            <path d="M72 221 C109 211 137 216 167 232 C201 249 241 238 286 225" />
            <path d="M63 286 C100 278 139 283 165 299 C194 317 231 314 288 296" />
            <path d="M85 342 C118 327 154 331 182 346 C209 360 237 355 261 351" />
            <path d="M145 151 C143 181 150 208 167 232" />
            <path d="M214 179 C205 204 203 229 207 247 C213 275 235 294 251 307" />
            <path d="M128 284 C136 305 139 334 143 365" />
          </g>

          <g className="all-region-points">
            {regions.map((region) => <circle key={region.name} cx={region.x} cy={region.y} r="2.8">
              <title>{region.fullName} · 신고 {region.count}건</title>
            </circle>)}
          </g>

          <g className="active-map-markers">
            {activeRegions.map((region, index) => <g
              key={region.name}
              className={`map-count-marker ${MARKER_COLORS[index % MARKER_COLORS.length]}`}
              transform={`translate(${region.x} ${region.y})`}
            >
              <title>{region.fullName} 신고 {region.count}건{region.urgent ? `, 긴급 ${region.urgent}건` : ''}</title>
              <circle className="marker-halo" r="16" />
              <circle className="marker-body" r="12" />
              <text textAnchor="middle" dominantBaseline="central">{region.count}</text>
            </g>)}
          </g>
        </svg>
      </div>
    </div>
  </article>;
};

export default SatelliteDamageMap;
