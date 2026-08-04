// import { useEffect, useMemo, useState } from "react";
// import {
//   Map as KakaoMap,
//   MapMarker,
//   CustomOverlayMap,
//   useKakaoLoader,
// } from "react-kakao-maps-sdk";

// const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

// const STATUS_LABELS = {
//   RECEIVED: "접수됨",
//   IN_REVIEW: "심사중",
//   APPROVED: "승인",
//   REJECTED: "반려",
// };

// const PRIORITY_LABELS = {
//   NORMAL: "일반",
//   URGENT: "긴급",
// };

// const DISASTER_TYPE_LABELS = {
//   HEAVY_RAIN: "호우",
//   TYPHOON: "태풍",
//   FLOOD: "침수",
// };

// // 시/도 중심 좌표 (근사값)
// const REGION_CENTERS = [
//   { name: "서울", lat: 37.5665, lng: 126.978, prefixes: ["서울특별시", "서울"] },
//   { name: "부산", lat: 35.1796, lng: 129.0756, prefixes: ["부산광역시", "부산"] },
//   { name: "대구", lat: 35.8714, lng: 128.6014, prefixes: ["대구광역시", "대구"] },
//   { name: "인천", lat: 37.4563, lng: 126.7052, prefixes: ["인천광역시", "인천"] },
//   { name: "광주", lat: 35.1595, lng: 126.8526, prefixes: ["광주광역시", "광주"] },
//   { name: "대전", lat: 36.3504, lng: 127.3845, prefixes: ["대전광역시", "대전"] },
//   { name: "울산", lat: 35.5384, lng: 129.3114, prefixes: ["울산광역시", "울산"] },
//   { name: "세종", lat: 36.4801, lng: 127.289, prefixes: ["세종특별자치시", "세종"] },
//   { name: "경기", lat: 37.4138, lng: 127.5183, prefixes: ["경기도", "경기"] },
//   { name: "강원", lat: 37.8228, lng: 128.1555, prefixes: ["강원특별자치도", "강원도", "강원"] },
//   { name: "충북", lat: 36.8, lng: 127.7, prefixes: ["충청북도", "충북"] },
//   { name: "충남", lat: 36.5184, lng: 126.8, prefixes: ["충청남도", "충남"] },
//   { name: "전북", lat: 35.7175, lng: 127.153, prefixes: ["전북특별자치도", "전라북도", "전북"] },
//   { name: "전남", lat: 34.8161, lng: 126.4629, prefixes: ["전라남도", "전남"] },
//   { name: "경북", lat: 36.4919, lng: 128.8889, prefixes: ["경상북도", "경북"] },
//   { name: "경남", lat: 35.4606, lng: 128.2132, prefixes: ["경상남도", "경남"] },
//   { name: "제주", lat: 33.4996, lng: 126.5312, prefixes: ["제주특별자치도", "제주도", "제주"] },
// ];

// const REGION_VIEW_LEVEL_THRESHOLD = 9; // 이 레벨(축소)보다 크면 지역 배지, 작으면(확대) 개별 핀

// function resolveRegion(sido = "") {
//   return REGION_CENTERS.find(({ prefixes }) =>
//     prefixes.some((prefix) => sido.startsWith(prefix))
//   );
// }

// function CaseMap() {
//   useKakaoLoader({
//     appkey: import.meta.env.VITE_KAKAO_MAP_KEY,
//   });

//   const [cases, setCases] = useState([]);
//   const [selectedCase, setSelectedCase] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [level, setLevel] = useState(13);
//   const [center, setCenter] = useState({ lat: 36.2683, lng: 127.6358 });

//   useEffect(() => {
//     async function fetchCases() {
//       try {
//         const res = await fetch(`${API_BASE_URL}/cases`);
//         if (!res.ok) {
//           throw new Error(`요청 실패 (${res.status})`);
//         }
//         const data = await res.json();
//         setCases(data.items ?? []);
//       } catch (err) {
//         setError(err.message);
//       } finally {
//         setLoading(false);
//       }
//     }
//     fetchCases();
//   }, []);

//   const validCases = useMemo(
//     () => cases.filter((c) => c.latitude && c.longitude),
//     [cases]
//   );

//   const regionData = useMemo(() => {
//     const data = new Map();
//     validCases.forEach((c) => {
//       const region = resolveRegion(c.sido || "");
//       if (!region) return;
//       const entry = data.get(region.name) || { count: 0, latSum: 0, lngSum: 0 };
//       entry.count += 1;
//       entry.latSum += Number(c.latitude);
//       entry.lngSum += Number(c.longitude);
//       data.set(region.name, entry);
//     });
//     return data;
//   }, [validCases]);

//   if (loading) {
//     return <div style={{ padding: "1rem" }}>지도를 불러오는 중...</div>;
//   }

//   if (error) {
//     return (
//       <div style={{ padding: "1rem", color: "#c0392b" }}>
//         지도를 불러오지 못했습니다: {error}
//       </div>
//     );
//   }

//   const showRegionView = level >= REGION_VIEW_LEVEL_THRESHOLD;

//   return (
//     <KakaoMap
//       center={center}
//       level={level}
//       style={{ width: "100%", height: "600px" }}
//       onZoomChanged={(map) => setLevel(map.getLevel())}
//       onCenterChanged={(map) => {
//         const c = map.getCenter();
//         setCenter({ lat: c.getLat(), lng: c.getLng() });
//       }}
//     >
//       {showRegionView
//         ? // 지역 요약 배지 뷰
//           REGION_CENTERS.map((region) => {
//             const entry = regionData.get(region.name);
//             const count = entry?.count || 0;
//             const badgePosition = entry
//               ? { lat: entry.latSum / entry.count, lng: entry.lngSum / entry.count }
//               : { lat: region.lat, lng: region.lng };
//             return (
//               <CustomOverlayMap
//                 key={region.name}
//                 position={badgePosition}
//               >
//                 <div
//                   onClick={() => {
//                     setCenter(badgePosition);
//                     setLevel(REGION_VIEW_LEVEL_THRESHOLD - 3);
//                   }}
//                   style={{
//                     display: "flex",
//                     alignItems: "center",
//                     gap: "6px",
//                     padding: "4px 10px",
//                     borderRadius: "999px",
//                     background: count > 0 ? "#2563eb" : "#fff",
//                     color: count > 0 ? "#fff" : "#999",
//                     border: "1px solid",
//                     borderColor: count > 0 ? "#2563eb" : "#ddd",
//                     fontSize: "12px",
//                     fontWeight: 600,
//                     whiteSpace: "nowrap",
//                     cursor: "pointer",
//                     boxShadow: "0 1px 4px rgba(0,0,0,0.15)",
//                   }}
//                 >
//                   <span>{region.name}</span>
//                   <span
//                     style={{
//                       background: count > 0 ? "rgba(255,255,255,0.25)" : "#eee",
//                       borderRadius: "999px",
//                       padding: "0 6px",
//                     }}
//                   >
//                     {count}
//                   </span>
//                 </div>
//               </CustomOverlayMap>
//             );
//           })
//         : // 개별 케이스 핀 뷰
//           validCases.map((c) => (
//             <MapMarker
//               key={c.case_id}
//               position={{ lat: Number(c.latitude), lng: Number(c.longitude) }}
//               onClick={() => setSelectedCase(c)}
//             />
//           ))}

//       {!showRegionView && selectedCase && (
//         <CustomOverlayMap
//           position={{
//             lat: Number(selectedCase.latitude),
//             lng: Number(selectedCase.longitude),
//           }}
//           yAnchor={1.3}
//         >
//           <div
//             style={{
//               background: "#fff",
//               border: "1px solid #ddd",
//               borderRadius: "8px",
//               padding: "12px 14px",
//               minWidth: "220px",
//               boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
//               fontSize: "13px",
//               position: "relative",
//             }}
//           >
//             <button
//               onClick={() => setSelectedCase(null)}
//               style={{
//                 position: "absolute",
//                 top: "4px",
//                 right: "6px",
//                 border: "none",
//                 background: "none",
//                 cursor: "pointer",
//                 fontSize: "14px",
//                 color: "#888",
//               }}
//               aria-label="닫기"
//             >
//               ✕
//             </button>
//             <div style={{ fontWeight: 600, marginBottom: "4px" }}>
//               {selectedCase.case_number}
//             </div>
//             <div style={{ marginBottom: "6px", color: "#333" }}>
//               {selectedCase.title}
//             </div>
//             <div style={{ color: "#555", marginBottom: "4px" }}>
//               {selectedCase.address}
//             </div>
//             <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
//               <span>
//                 상태: {STATUS_LABELS[selectedCase.status] ?? selectedCase.status}
//               </span>
//               <span>
//                 우선순위: {PRIORITY_LABELS[selectedCase.priority] ?? selectedCase.priority}
//               </span>
//             </div>
//             <div style={{ marginTop: "4px", color: "#555" }}>
//               재해유형: {DISASTER_TYPE_LABELS[selectedCase.disaster_type] ?? selectedCase.disaster_type}
//             </div>
//           </div>
//         </CustomOverlayMap>
//       )}
//     </KakaoMap>
//   );
// }

// export default CaseMap;

import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import {
  Map as KakaoMap,
  MapMarker,
  CustomOverlayMap,
  useKakaoLoader,
} from 'react-kakao-maps-sdk';
import { getCases } from '../../api/caseApi';
import { TOTAL_MOCK_REPORTS } from '../../mocks/cases';
import { normalizeRegionName } from '../../utils/regionNames';

const STATUS_LABELS = {
  RECEIVED: '접수됨',
  IN_REVIEW: '심사중',
  APPROVED: '승인',
  REJECTED: '반려',
};

const PRIORITY_LABELS = {
  NORMAL: '일반',
  URGENT: '긴급',
};

const DISASTER_TYPE_LABELS = {
  HEAVY_RAIN: '집중호우',
  LANDSLIDE: '산사태',
  WILDFIRE: '산불',
  HEAVY_SNOW: '대설',
  EARTHQUAKE: '지진',
  FLOOD: '침수',
};

// 시/도 중심 좌표 (근사값)
const REGION_CENTERS = [
  { name: '서울', lat: 37.5665, lng: 126.978, prefixes: ['서울특별시', '서울'] },
  { name: '부산', lat: 35.1796, lng: 129.0756, prefixes: ['부산광역시', '부산'] },
  { name: '대구', lat: 35.8714, lng: 128.6014, prefixes: ['대구광역시', '대구'] },
  { name: '인천', lat: 37.4563, lng: 126.7052, prefixes: ['인천광역시', '인천'] },
  { name: '광주', lat: 35.1595, lng: 126.8526, prefixes: ['광주광역시', '광주'] },
  { name: '대전', lat: 36.3504, lng: 127.3845, prefixes: ['대전광역시', '대전'] },
  { name: '울산', lat: 35.5384, lng: 129.3114, prefixes: ['울산광역시', '울산'] },
  { name: '세종', lat: 36.4801, lng: 127.289, prefixes: ['세종특별자치시', '세종'] },
  { name: '경기', lat: 37.4138, lng: 127.5183, prefixes: ['경기도', '경기'] },
  { name: '강원', lat: 37.8228, lng: 128.1555, prefixes: ['강원특별자치도', '강원도', '강원'] },
  { name: '충북', lat: 36.8, lng: 127.7, prefixes: ['충청북도', '충북'] },
  { name: '충남', lat: 36.5184, lng: 126.8, prefixes: ['충청남도', '충남'] },
  { name: '전북', lat: 35.7175, lng: 127.153, prefixes: ['전북특별자치도', '전라북도', '전북'] },
  { name: '전남', lat: 34.8161, lng: 126.4629, prefixes: ['전라남도', '전남'] },
  { name: '경북', lat: 36.4919, lng: 128.8889, prefixes: ['경상북도', '경북'] },
  { name: '경남', lat: 35.4606, lng: 128.2132, prefixes: ['경상남도', '경남'] },
  { name: '제주', lat: 33.4996, lng: 126.5312, prefixes: ['제주특별자치도', '제주도', '제주'] },
];

const REGION_VIEW_LEVEL_THRESHOLD = 9; // 이 레벨(축소) 이상이면 지역 배지, 작으면 개별 핀
const DEFAULT_LEVEL = 13;
const DEFAULT_CENTER = { lat: 36.2683, lng: 127.6358 };

function resolveRegion(sido = '') {
  const normalized = normalizeRegionName(sido);
  return REGION_CENTERS.find(({ prefixes }) => prefixes[0] === normalized);
}

// 범례(50건 이상=red, 20~49=navy, 5~19=gray, 5건 미만=light)와 맞춘 색상 판정
function getTone(count) {
  if (count >= 50) return 'red';
  if (count >= 20) return 'navy';
  if (count >= 5) return 'gray';
  return 'light';
}

const CaseMap = forwardRef((_, ref) => {
  useKakaoLoader({
    appkey: import.meta.env.VITE_KAKAO_MAP_KEY,
  });

  const [cases, setCases] = useState([]);
  const [selectedCase, setSelectedCase] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [level, setLevel] = useState(DEFAULT_LEVEL);
  const [center, setCenter] = useState(DEFAULT_CENTER);

  // ===== 신규 추가 (1차: setBounds 도입) =====
  // setBounds 호출을 위해 카카오맵 네이티브 인스턴스를 저장
  const mapRef = useRef(null);
  // ===== 신규 추가 끝 =====

  // ===== 신규 추가 (3차: 지역 드릴다운 상태) =====
  // 2차(레벨 강제 보정)는 setBounds가 계산한 적정 레벨을 무시하고 임의로
  // 더 확대시켜서 좌표가 다시 화면 밖으로 밀려나는 문제가 있어 제거함.
  // 대신 "이 지역을 선택해서 들어왔다"는 상태를 따로 두고, 이 상태가 있으면
  // 줌 레벨과 상관없이 핀 뷰를 강제로 보여주는 방식으로 대체.
  const [drilldownRegion, setDrilldownRegion] = useState(null);
  // ===== 신규 추가 끝 =====

  useEffect(() => {
    let ignore = false;
    getCases({ limit: TOTAL_MOCK_REPORTS, offset: 0 })
      .then((result) => { if (!ignore) setCases(result.items); })
      .catch((err) => { if (!ignore) setError(err.message); })
      .finally(() => { if (!ignore) setLoading(false); });
    return () => { ignore = true; };
  }, []);

  useImperativeHandle(ref, () => ({
    zoomIn: () => setLevel((prev) => Math.max(1, prev - 1)),
    zoomOut: () => setLevel((prev) => Math.min(14, prev + 1)),
    reset: () => { setLevel(DEFAULT_LEVEL); setCenter(DEFAULT_CENTER); },
  }));

  const validCases = useMemo(
    () => cases.filter((c) => c.latitude && c.longitude),
    [cases],
  );

  const regionData = useMemo(() => {
    const data = new Map();
    validCases.forEach((c) => {
      const region = resolveRegion(c.sido || c.address || '');
      if (!region) return;
      const entry = data.get(region.name) || { count: 0, latSum: 0, lngSum: 0 };
      entry.count += 1;
      entry.latSum += Number(c.latitude);
      entry.lngSum += Number(c.longitude);
      data.set(region.name, entry);
    });
    return data;
  }, [validCases]);

  if (loading) {
    return <div style={{ padding: '1rem' }}>지도를 불러오는 중...</div>;
  }

  if (error) {
    return (
      <div style={{ padding: '1rem', color: '#c0392b' }}>
        지도를 불러오지 못했습니다: {error}
      </div>
    );
  }

  // ===== 신규 추가 (3차): drilldownRegion이 설정되어 있으면 레벨과 무관하게 핀 뷰 강제 =====
  const showRegionView = level >= REGION_VIEW_LEVEL_THRESHOLD && !drilldownRegion;
  // ===== 신규 추가 끝 (3차) =====

  return (
    <KakaoMap
      center={center}
      level={level}
      style={{ width: '100%', height: '100%' }}
      // ===== 신규 추가 (1차: setBounds 도입) =====
      // 지도가 생성되면 네이티브 인스턴스를 mapRef에 저장
      onCreate={(map) => { mapRef.current = map; }}
      // ===== 신규 추가 끝 =====
      onZoomChanged={(map) => {
        const newLevel = map.getLevel();
        setLevel(newLevel);
        // ===== 신규 추가 (3차: 지역 드릴다운 상태) =====
        // 사용자가 다시 축소해서 지역뷰 기준(threshold) 이상으로 돌아가면
        // 드릴다운 상태를 해제해 배지 뷰로 복귀
        if (newLevel >= REGION_VIEW_LEVEL_THRESHOLD) {
          setDrilldownRegion(null);
        }
        // ===== 신규 추가 끝 =====
      }}
      onCenterChanged={(map) => {
        const c = map.getCenter();
        setCenter({ lat: c.getLat(), lng: c.getLng() });
      }}
    >
      {showRegionView
        ? REGION_CENTERS.map((region) => {
          const entry = regionData.get(region.name);
          const count = entry?.count || 0;
          const position = entry
            ? { lat: entry.latSum / entry.count, lng: entry.lngSum / entry.count }
            : { lat: region.lat, lng: region.lng };
          return (
            <CustomOverlayMap key={region.name} position={position}>
              <span
                className={`light-map-marker ${getTone(count)}`}
                onClick={() => {
                  // 기존 코드(고정 레벨 확대 - 거리 먼 케이스가 화면 밖으로 벗어나는 버그 있음): 주석 보존
                  // setCenter(position); setLevel(REGION_VIEW_LEVEL_THRESHOLD - 3);

                  // ===== 신규 추가 (1차: setBounds 도입) =====
                  // 해당 지역 케이스 좌표를 모두 포함하도록 setBounds로 자동 맞춤 확대
                  const regionCases = validCases.filter(
                    (c) => resolveRegion(c.sido || c.address || '')?.name === region.name
                  );
                  if (regionCases.length > 0 && mapRef.current && window.kakao) {
                    const bounds = new window.kakao.maps.LatLngBounds();
                    regionCases.forEach((c) => {
                      bounds.extend(
                        new window.kakao.maps.LatLng(Number(c.latitude), Number(c.longitude))
                      );
                    });
                    mapRef.current.setBounds(bounds);
                    // ===== 신규 추가 끝 (1차) =====

                    // ===== 신규 추가 (2차, 이후 제거됨): 레벨 강제 보정 =====
                    // if (mapRef.current.getLevel() >= REGION_VIEW_LEVEL_THRESHOLD) {
                    //   mapRef.current.setLevel(REGION_VIEW_LEVEL_THRESHOLD - 1);
                    // }
                    // -> 문제: setBounds가 계산한 적정 레벨(예: 10)보다 더 확대(예: 8)시켜버려서
                    //    좌표가 다시 화면 밖으로 밀려나는 버그 재발. 그래서 제거하고 3차로 대체.

                    // ===== 신규 추가 (3차: 지역 드릴다운 상태로 대체) =====
                    // 레벨을 건드리지 않고, "이 지역을 선택했다"는 상태만 켜서
                    // 레벨과 무관하게 핀 뷰가 보이도록 함 (setBounds가 잡아준 화면 그대로 사용)
                    setDrilldownRegion(region.name);
                    // ===== 신규 추가 끝 (3차) =====
                  } else {
                    setCenter(position);
                    setLevel(REGION_VIEW_LEVEL_THRESHOLD - 3);
                  }
                }}
                role="button"
                tabIndex={0}
              >
                <b>{count}</b><small>{region.name}</small>
              </span>
            </CustomOverlayMap>
          );
        })
        : validCases.map((c) => (
          <MapMarker
            key={c.frontendKey || c.id || c.case_id}
            position={{ lat: Number(c.latitude), lng: Number(c.longitude) }}
            onClick={() => setSelectedCase(c)}
          />
        ))}

      {!showRegionView && selectedCase && (
        <CustomOverlayMap
          position={{ lat: Number(selectedCase.latitude), lng: Number(selectedCase.longitude) }}
          yAnchor={1.3}
        >
          <div
            style={{
              background: '#fff',
              border: '1px solid #ddd',
              borderRadius: '8px',
              padding: '12px 14px',
              minWidth: '220px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              fontSize: '13px',
              position: 'relative',
            }}
          >
            <button
              onClick={() => setSelectedCase(null)}
              style={{
                position: 'absolute',
                top: '4px',
                right: '6px',
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                fontSize: '14px',
                color: '#888',
              }}
              aria-label="닫기"
            >
              ×
            </button>
            <div style={{ fontWeight: 600, marginBottom: '4px' }}>
              {selectedCase.case_number}
            </div>
            <div style={{ marginBottom: '6px', color: '#333' }}>
              {selectedCase.title}
            </div>
            <div style={{ color: '#555', marginBottom: '4px' }}>
              {selectedCase.address}
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <span>상태: {STATUS_LABELS[selectedCase.status] ?? selectedCase.status}</span>
              <span>우선순위: {PRIORITY_LABELS[selectedCase.priority] ?? selectedCase.priority}</span>
            </div>
            <div style={{ marginTop: '4px', color: '#555' }}>
              재해유형: {DISASTER_TYPE_LABELS[selectedCase.disaster_type] ?? selectedCase.disaster_type}
            </div>
          </div>
        </CustomOverlayMap>
      )}
    </KakaoMap>
  );
});

CaseMap.displayName = 'CaseMap';

export default CaseMap;
