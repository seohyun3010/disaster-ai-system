import { normalizeRegionName } from '../utils/regionNames.js';

const MALE_NAMES = [
  '김영수', '이성호', '박철수', '최병철', '정진수', '윤종수', '강성진',
  '조광수', '한동수', '오세영', '임영환', '송기철', '권영호', '서종석',
  '신동철', '유재호', '백종만', '홍성민', '남기훈', '문창수',
];

const FEMALE_NAMES = [
  '김영숙', '이영희', '박정희', '최순자', '정영숙', '윤정희', '강미자',
  '조명숙', '한명숙', '오경자', '임춘자', '송영자', '권영숙', '서정자',
  '신영희', '유순자', '백정숙', '홍미숙', '남정희', '문영자',
];

const BASE_REPORTER_NAMES = MALE_NAMES.flatMap((name, index) => [name, FEMALE_NAMES[index]]);
const ADDITIONAL_REPORTER_NAMES = [
  '황희찬', '엄성현', '안건호', '백지헌', '유지민', '홍지수', '변백현',
  '도경수', '김준면', '김태형', '전정국', '이은지', '진경은', '정원이',
  '김석진', '미나미', '윤정한', '김선호', '고윤정', '이광수', '유재석',
  '김우빈', '윤경호', '박지훈', '소지섭', '김태평', '손예진', '박원빈',
  '김성찬', '안유진', '장원영', '손흥민', '김고은', '공지철', '이동욱',
  '김슬기', '배주현', '박수영', '김예림', '손승완', '이수지', '김원훈',
  '서강준', '이주연', '최산', '최태훈', '조진세', '엄지윤', '박보검',
  '이재용', '이건희', '박윤영', '정재현', '이태용', '이나경', '윤두준',
  '권지용', '이정하', '김제니', '박채영', '김지수', '옹성우', '오세훈',
  '성시경', '황민현', '노윤서', '정채연', '천우희',
];
const REPORTER_NAMES = [
  ...BASE_REPORTER_NAMES,
  ...ADDITIONAL_REPORTER_NAMES,
];
const BANKS = ['국민은행', '신한은행', '우리은행', '하나은행', '농협은행', '기업은행', '광주은행', '부산은행'];
const STREETS = ['중앙로', '새마을로', '산업로', '평화로', '충효로', '무궁화로', '희망길', '솔밭길', '강변로', '시장길'];
const PHOTO_ROOT = '/mock/flood-2026';
export const MOCK_CASE_ID_PREFIX = 'mock-';

const REGION_META = {
  서울특별시: { cities: ['종로구', '동작구', '강서구', '송파구'], lat: 37.5665, lng: 126.978 },
  인천광역시: { cities: ['남동구', '부평구', '서구', '연수구'], lat: 37.4563, lng: 126.7052 },
  광주광역시: { cities: ['광산구', '북구', '서구', '남구'], lat: 35.1595, lng: 126.8526 },
  대전광역시: { cities: ['유성구', '서구', '중구', '대덕구'], lat: 36.3504, lng: 127.3845 },
  세종특별자치시: { cities: ['조치원읍', '연서면', '금남면', '보람동'], lat: 36.4801, lng: 127.289 },
  경기도: { cities: ['수원시 영통구', '용인시 처인구', '가평군 청평면', '양평군 양평읍'], lat: 37.4138, lng: 127.5183 },
  충청북도: { cities: ['청주시 상당구', '제천시 봉양읍', '충주시 주덕읍', '보은군 마로면'], lat: 36.8, lng: 127.7 },
  충청남도: { cities: ['논산시 연산면', '공주시 신관동', '예산군 예산읍', '천안시 동남구'], lat: 36.5184, lng: 126.8 },
  전북특별자치도: { cities: ['전주시 완산구', '익산시 함열읍', '남원시 금동', '고창군 고창읍'], lat: 35.7175, lng: 127.153 },
  전라남도: { cities: ['나주시 금천면', '순천시 해룡면', '담양군 담양읍', '해남군 해남읍'], lat: 34.8161, lng: 126.4629 },
  강원특별자치도: { cities: ['강릉시 주문진읍', '삼척시 원덕읍', '인제군 인제읍', '평창군 진부면'], lat: 37.8228, lng: 128.1555 },
  경상북도: { cities: ['포항시 북구', '영덕군 영덕읍', '안동시 풍산읍', '경주시 황성동'], lat: 36.4919, lng: 128.8889 },
  경상남도: { cities: ['밀양시 산내면', '합천군 합천읍', '거창군 거창읍', '창녕군 창녕읍'], lat: 35.4606, lng: 128.2132 },
  울산광역시: { cities: ['남구', '울주군 언양읍', '중구', '북구'], lat: 35.5384, lng: 129.3114 },
  부산광역시: { cities: ['금정구', '동래구', '기장군 기장읍', '북구'], lat: 35.1796, lng: 129.0756 },
  대구광역시: { cities: ['달서구', '수성구', '군위군 군위읍', '북구'], lat: 35.8714, lng: 128.6014 },
  제주특별자치도: { cities: ['제주시', '서귀포시'], lat: 33.4996, lng: 126.5312 },
};

export const MOCK_DISASTER_CONFIG = Object.freeze([
  {
    key: 'HEAVY_RAIN', label: '집중호우', count: 412, from: '2026-07-15', to: '2026-07-18',
    facilities: ['주택', '상가', '농경지', '도로'],
    regions: ['서울특별시', '인천광역시', '경기도', '충청북도', '충청남도', '전북특별자치도', '전라남도', '광주광역시'],
    descriptions: {
      주택: ['침수로 벽체 및 바닥 훼손', '가재도구 침수'],
      상가: ['점포 내부 침수 및 집기 훼손', '침수로 상품과 바닥 마감재 훼손'],
      농경지: ['농경지 침수로 작물 피해', '배수 불량으로 농작물 침수'],
      도로: ['집중호우로 도로 일부 유실', '배수로 범람으로 도로 침수'],
    },
    photos: ['house-01.png', 'store-01.png', 'farmland-01.png', 'road-02.png', 'house-02.png'],
  },
  {
    key: 'LANDSLIDE', label: '산사태', count: 286, from: '2026-04-03', to: '2026-04-05',
    facilities: ['주택', '농경지', '도로', '임야', '옹벽', '축대'],
    regions: ['강원특별자치도', '경기도', '충청북도', '충청남도', '경상북도', '경상남도', '전라남도', '인천광역시', '광주광역시', '대구광역시', '부산광역시', '제주특별자치도'],
    descriptions: {
      주택: ['토사 유입으로 주택 외벽 파손'], 농경지: ['농경지 매몰'], 도로: ['도로 유실'],
      임야: ['사면 붕괴'], 옹벽: ['옹벽 붕괴'], 축대: ['축대 붕괴'],
    },
    photos: ['road-03.png', 'house-02.png', 'farmland-01.png', 'road-04.png'],
  },
  {
    key: 'WILDFIRE', label: '산불', count: 214, from: '2026-04-06', to: '2026-04-08',
    facilities: ['주택', '임야', '농경지', '창고'],
    regions: ['강원특별자치도', '경상북도', '경상남도'],
    descriptions: {
      주택: ['건물 일부 소실'], 임야: ['산림과 수목 일부 소실'], 농경지: ['농작물 및 농기계 소실'], 창고: ['창고 전소'],
    },
    photos: ['house-01.png', 'store-03.png', 'farmland-01.png'],
  },
  {
    key: 'HEAVY_SNOW', label: '대설', count: 183, from: '2026-02-07', to: '2026-02-09',
    facilities: ['주택', '비닐하우스', '축사', '도로'],
    regions: ['강원특별자치도', '경기도', '충청북도', '전북특별자치도', '인천광역시', '세종특별자치시', '대전광역시', '광주광역시'],
    descriptions: {
      주택: ['적설로 주택 지붕 일부 파손'], 비닐하우스: ['적설로 비닐하우스 붕괴'],
      축사: ['축사 지붕 파손'], 도로: ['폭설로 도로 시설물 파손'],
    },
    photos: ['house-02.png', 'farmland-01.png', 'road-04.png'],
  },
  {
    key: 'EARTHQUAKE', label: '지진', count: 153, from: '2026-06-12', to: '2026-06-13',
    facilities: ['주택', '상가', '공장', '도로'],
    regions: ['경상북도', '울산광역시', '부산광역시', '대구광역시', '세종특별자치시', '대전광역시', '충청북도'],
    descriptions: {
      주택: ['외벽 균열'], 상가: ['내부 마감재 탈락'], 공장: ['공장 외벽 및 바닥 균열'], 도로: ['도로 포장면 균열'],
    },
    photos: ['house-01.png', 'store-02.png', 'road-03.png'],
  },
]);

export const TOTAL_MOCK_REPORTS = MOCK_DISASTER_CONFIG.reduce((sum, disaster) => sum + disaster.count, 0);

export const REGION_TARGETS_BY_TYPE = Object.freeze({
  HEAVY_RAIN: {
    서울특별시: 116,
    인천광역시: 8,
    경기도: 60,
    충청북도: 70,
    충청남도: 55,
    전북특별자치도: 50,
    전라남도: 45,
    광주광역시: 8,
  },
  LANDSLIDE: {
    강원특별자치도: 43,
    경기도: 36,
    충청북도: 34,
    충청남도: 35,
    경상북도: 34,
    경상남도: 42,
    전라남도: 45,
    인천광역시: 5,
    광주광역시: 9,
    대구광역시: 1,
    부산광역시: 1,
    제주특별자치도: 1,
  },
  WILDFIRE: {
    강원특별자치도: 80,
    경상북도: 75,
    경상남도: 59,
  },
  HEAVY_SNOW: {
    강원특별자치도: 40,
    경기도: 33,
    충청북도: 35,
    전북특별자치도: 35,
    인천광역시: 15,
    세종특별자치시: 8,
    대전광역시: 12,
    광주광역시: 5,
  },
  EARTHQUAKE: {
    경상북도: 25,
    울산광역시: 44,
    부산광역시: 41,
    대구광역시: 22,
    세종특별자치시: 8,
    대전광역시: 12,
    충청북도: 1,
  },
});

export const REGION_TARGETS = Object.freeze(
  Object.values(REGION_TARGETS_BY_TYPE).reduce((totals, targets) => {
    Object.entries(targets).forEach(([region, count]) => {
      totals[region] = (totals[region] || 0) + count;
    });
    return totals;
  }, {}),
);

const buildWeightedRegionSequence = (targets) => {
  const entries = Object.entries(targets);
  const total = entries.reduce((sum, [, count]) => sum + count, 0);
  const assigned = Object.fromEntries(entries.map(([region]) => [region, 0]));

  return Array.from({ length: total }, (_, index) => {
    const [selectedRegion] = entries.reduce((best, entry) => {
      const [region, target] = entry;
      const deficit = (target * (index + 1)) / total - assigned[region];
      return deficit > best[1] ? [region, deficit] : best;
    }, [entries[0][0], Number.NEGATIVE_INFINITY]);
    assigned[selectedRegion] += 1;
    return selectedRegion;
  });
};

const REGION_SEQUENCE_BY_TYPE = Object.fromEntries(
  Object.entries(REGION_TARGETS_BY_TYPE).map(([type, targets]) => (
    [type, buildWeightedRegionSequence(targets)]
  )),
);

export const DEFAULT_DISASTER_QUERY_RANGE = Object.freeze({
  from: '2025-07-18',
  to: '2026-07-30',
});

export const MOCK_DISASTER_EVENTS = Object.freeze([
  {
    id: '2026-HEAVY_RAIN', year: 2026, disasterType: 'HEAVY_RAIN', label: '집중호우',
    from: '2026-07-15', to: '2026-07-18', deadlineFrom: '2026-07-29', deadlineTo: '2026-08-11',
    status: '진행중', targetCount: 292, __source: 'backend',
  },
  {
    id: '2026-EARTHQUAKE', year: 2026, disasterType: 'EARTHQUAKE', label: '지진',
    from: '2026-06-12', to: '2026-06-13', deadlineFrom: '2026-06-24', deadlineTo: '2026-07-07',
    status: '완료', targetCount: 153, __source: 'backend',
  },
  {
    id: '2026-WILDFIRE', year: 2026, disasterType: 'WILDFIRE', label: '산불',
    from: '2026-04-06', to: '2026-04-08', deadlineFrom: '2026-04-19', deadlineTo: '2026-05-02',
    status: '완료', targetCount: 214, __source: 'backend',
  },
  {
    id: '2026-LANDSLIDE', year: 2026, disasterType: 'LANDSLIDE', label: '산사태',
    from: '2026-04-03', to: '2026-04-05', deadlineFrom: '2026-04-16', deadlineTo: '2026-04-29',
    status: '완료', targetCount: 206, __source: 'backend',
  },
  {
    id: '2026-HEAVY_SNOW', year: 2026, disasterType: 'HEAVY_SNOW', label: '대설',
    from: '2026-02-07', to: '2026-02-09', deadlineFrom: '2026-02-20', deadlineTo: '2026-03-05',
    status: '완료', targetCount: 123, __source: 'backend',
  },
  {
    id: 'mock-disaster-2025-heavy-snow-01', year: 2025, disasterType: 'HEAVY_SNOW', label: '대설',
    from: '2025-12-18', to: '2025-12-21', deadlineFrom: '2025-12-22', deadlineTo: '2026-01-04',
    status: '완료', targetCount: 60, __source: 'mock',
  },
  {
    id: 'mock-disaster-2025-landslide-01', year: 2025, disasterType: 'LANDSLIDE', label: '산사태',
    from: '2025-09-03', to: '2025-09-05', deadlineFrom: '2025-09-16', deadlineTo: '2025-09-29',
    status: '완료', targetCount: 80, __source: 'mock',
  },
  {
    id: 'mock-disaster-2025-heavy-rain-01', year: 2025, disasterType: 'HEAVY_RAIN', label: '집중호우',
    from: '2025-07-18', to: '2025-07-21', deadlineFrom: '2025-07-30', deadlineTo: '2025-08-12',
    status: '완료', targetCount: 120, __source: 'mock',
  },
]);

const pad = (value, length = 2) => String(value).padStart(length, '0');
const MOCK_CASE_NUMBER_START_BY_YEAR = Object.freeze({
  2025: 1,
  2026: 361,
});
const daysBetween = (from, to) => Math.round((new Date(`${to}T00:00:00`) - new Date(`${from}T00:00:00`)) / 86400000);
const addDays = (date, amount) => {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
};
const toLocalIso = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:00`;
const formatDisplayDate = (date) => `${date.getFullYear()}. ${pad(date.getMonth() + 1)}. ${pad(date.getDate())}. ${pad(date.getHours())}:${pad(date.getMinutes())}`;

const STATUS_DISTRIBUTIONS = {
  '2026-HEAVY_RAIN': { completed: 44, incomplete: 46 },
  '2026-LANDSLIDE': { completed: 75, incomplete: 15 },
  '2026-WILDFIRE': { completed: 80, incomplete: 12 },
  '2026-HEAVY_SNOW': { completed: 85, incomplete: 10 },
  '2026-EARTHQUAKE': { completed: 80, incomplete: 12 },
  'mock-disaster-2025-heavy-rain-01': { completed: 88, incomplete: 7 },
  'mock-disaster-2025-landslide-01': { completed: 88, incomplete: 7 },
  'mock-disaster-2025-heavy-snow-01': { completed: 88, incomplete: 7 },
};

const COMPLETED_DETAIL_STATUSES = ['최종 승인', '반려'];
const INCOMPLETE_DETAIL_STATUSES = ['접수', 'AI 분석 중', '검토 대기', '심사 진행'];

const getStatus = (disasterEventId, index) => {
  const distribution = STATUS_DISTRIBUTIONS[disasterEventId];
  const bucket = (index * 37) % 100;

  if (bucket < distribution.completed) {
    return COMPLETED_DETAIL_STATUSES[index % 11 === 0 ? 1 : 0];
  }

  if (bucket < distribution.completed + distribution.incomplete) {
    return INCOMPLETE_DETAIL_STATUSES[index % INCOMPLETE_DETAIL_STATUSES.length];
  }

  return '보류';
};

const STATUS_META = {
  접수: { api: 'RECEIVED', ai: '분석 대기', review: '검토 전', stage: '신고서 확인' },
  'AI 분석 중': { api: 'AI_PENDING', ai: '분석 중', review: '검토 전', stage: 'AI 분석' },
  '검토 대기': { api: 'AI_COMPLETED', ai: '분석 완료', review: '검토 대기', stage: 'AI 분석' },
  보류: { api: 'AI_COMPLETED', ai: '분석 완료', review: '보류', stage: 'AI 분석' },
  '심사 진행': { api: 'AI_COMPLETED', ai: '분석 완료', review: '승인', stage: '지원금 심사' },
  '최종 승인': { api: 'COMPLETED', ai: '분석 완료', review: '승인', stage: '보고서' },
  반려: { api: 'COMPLETED', ai: '분석 완료', review: '반려', stage: 'AI 분석' },
};

const makeAddress = (region, index) => {
  const meta = REGION_META[region];
  const city = meta.cities[index % meta.cities.length];
  const street = STREETS[(index * 3) % STREETS.length];
  return `${region} ${city} ${street} ${(index * 17) % 489 + 1}`;
};

const makePhotos = (disaster, index, caseId) => Array.from(
  { length: (index % 3) + 1 },
  (_, photoIndex) => {
    const filename = disaster.photos[(index + photoIndex) % disaster.photos.length];
    const url = `${PHOTO_ROOT}/${filename}`;
    return {
      image_id: caseId * 10 + photoIndex + 1,
      image_url: url,
      thumbnail_url: url,
      name: filename,
      url,
      thumbnailUrl: url,
    };
  },
);

const createMockCase = (disaster, index, caseId, typeRegionIndex, yearCaseIndex) => {
  const facility = disaster.facilities[index % disaster.facilities.length];
  const region = REGION_SEQUENCE_BY_TYPE[disaster.key][typeRegionIndex];
  const regionMeta = REGION_META[region];
  const reporter = REPORTER_NAMES[index % REPORTER_NAMES.length];
  const genderDigit = index % 2 === 0 ? 1 : 2;
  const birthYear = 1956 + (index % 31);
  const damageDate = addDays(new Date(`${disaster.from}T00:00:00`), index % (daysBetween(disaster.from, disaster.to) + 1));
  damageDate.setHours(5 + (index * 7) % 17, (index * 13) % 60, 0, 0);
  const receivedDate = new Date(damageDate);
  receivedDate.setHours(Math.min(23, damageDate.getHours() + 1 + (index % 4)), (damageDate.getMinutes() + 11) % 60, 0, 0);
  const address = makeAddress(region, index);
  const descriptionOptions = disaster.descriptions[facility];
  const description = descriptionOptions[index % descriptionOptions.length];
  const status = getStatus(disaster.id, index);
  const statusMeta = STATUS_META[status];
  const gradeCode = `DS${1 + (index % 4)}`;
  const confidence = Number((72 + (index * 7) % 27 + (index % 10) / 10).toFixed(1));
  const photos = makePhotos(disaster, index, caseId);
  const caseNumberSequence = (MOCK_CASE_NUMBER_START_BY_YEAR[disaster.year] || 1)
    + yearCaseIndex;
  const externalReportId = `SAFE24-${disaster.year}-${pad(caseNumberSequence, 6)}`;
  const caseNumber = `DS-${disaster.year}-${pad(caseNumberSequence, 6)}`;
  const residentNumber = `${String(birthYear).slice(2)}${pad((index % 12) + 1)}${pad((index % 27) + 1)}-${genderDigit}******`;
  const phone = `010-****-${pad(1000 + (caseId * 37) % 9000, 4)}`;
  const accountNumber = `${pad(100 + index % 900, 3)}-**-******`;
  const damageDetails = [{ category: facility, quantity: '1건', details: description }];

  return {
    case_id: caseId,
    case_number: caseNumber,
    external_report_id: externalReportId,
    externalReportId,
    received_at: toLocalIso(receivedDate),
    reported_at: toLocalIso(receivedDate),
    damage_occurred_at: toLocalIso(damageDate),
    reporter_name: reporter,
    resident_registration_number: residentNumber,
    address,
    contact_number: phone,
    household_members: 1 + (index % 6),
    bank_name: BANKS[index % BANKS.length],
    account_number: accountNumber,
    account_holder: reporter,
    disaster_type: disaster.key,
    disaster_event_id: disaster.id,
    frontendDisasterKey: disaster.id,
    facility_type: facility,
    damage_details: damageDetails,
    images: photos,
    representative_image_url: photos[0].url,
    status: statusMeta.api,
    processing_status: status,
    ai_analysis_status: statusMeta.ai,
    damage_grade: gradeCode,
    ai_confidence: confidence,
    review_status: statusMeta.review,
    workflow_stage: statusMeta.stage,
    priority: index % 7 === 0 ? 'URGENT' : 'NORMAL',
    duplicate_suspected: index % 29 === 0,
    sido: region,
    latitude: Number((regionMeta.lat + ((index % 11) - 5) * 0.018).toFixed(6)),
    longitude: Number((regionMeta.lng + ((index % 13) - 6) * 0.018).toFixed(6)),
    id: `${MOCK_CASE_ID_PREFIX}${caseId}`,
    frontendKey: `${MOCK_CASE_ID_PREFIX}${caseId}`,
    __source: 'mock',
    caseId,
    caseNumber,
    reporter,
    type: disaster.label,
    facility,
    location: address,
    reportedAt: formatDisplayDate(receivedDate),
    displayStatus: status,
    urgency: index % 7 === 0 ? '긴급' : '보통',
    urgencyScore: 35 + (index * 11) % 65,
    duplicate: index % 29 === 0,
    damage: gradeCode,
    description,
    photos,
    representativeImageUrl: photos[0].url,
    isDetail: true,
    externalReport: {
      reportId: externalReportId,
      receivedAt: toLocalIso(receivedDate),
      residentNumber,
      householdMembers: 1 + (index % 6),
      bankName: BANKS[index % BANKS.length],
      accountNumber,
      accountHolder: reporter,
    },
    raw_payload: {
      external_report_id: externalReportId,
      disaster_event_id: disaster.id,
      reporter_name: reporter,
      resident_registration_number: residentNumber,
      contact_number: phone,
      household_members: 1 + (index % 6),
      bank_name: BANKS[index % BANKS.length],
      account_number: accountNumber,
      account_holder: reporter,
      damage_grade: gradeCode,
      ai_confidence: confidence,
      ai_analysis_status: statusMeta.ai,
      review_status: statusMeta.review,
      workflow_stage: statusMeta.stage,
    },
  };
};

const DISASTER_TYPE_CONFIG = Object.fromEntries(
  MOCK_DISASTER_CONFIG.map((disaster) => [disaster.key, disaster]),
);

const typeRegionOffsets = {};
const yearCaseOffsets = {};
const GENERATED_CASES = MOCK_DISASTER_EVENTS.flatMap((event, eventIndex, allEvents) => {
  const startId = allEvents.slice(0, eventIndex).reduce((sum, item) => sum + item.targetCount, 0) + 1;
  const disaster = {
    ...DISASTER_TYPE_CONFIG[event.disasterType],
    ...event,
    key: event.disasterType,
  };
  const typeRegionOffset = typeRegionOffsets[event.disasterType] || 0;
  typeRegionOffsets[event.disasterType] = typeRegionOffset + event.targetCount;
  const yearCaseOffset = yearCaseOffsets[event.year] || 0;
  yearCaseOffsets[event.year] = yearCaseOffset + event.targetCount;
  return Array.from(
    { length: event.targetCount },
    (_, index) => createMockCase(
      disaster,
      index,
      startId + index,
      typeRegionOffset + index,
      yearCaseOffset + index,
    ),
  );
}).sort((left, right) => right.reported_at.localeCompare(left.reported_at) || right.case_id - left.case_id);

const eventSequence = {};
export const CASES = Object.freeze(GENERATED_CASES.map((item, sortedIndex) => {
  const disasterIndex = eventSequence[item.disaster_event_id] || 0;
  eventSequence[item.disaster_event_id] = disasterIndex + 1;
  const reporter = REPORTER_NAMES[sortedIndex % REPORTER_NAMES.length];
  const genderDigit = sortedIndex % 2 === 0 ? 1 : 2;
  const residentNumber = item.resident_registration_number.replace(/-\d/, `-${genderDigit}`);
  const displayStatus = getStatus(item.disaster_event_id, disasterIndex);
  const statusMeta = STATUS_META[displayStatus];

  return {
    ...item,
    reporter_name: reporter,
    resident_registration_number: residentNumber,
    account_holder: reporter,
    status: statusMeta.api,
    processing_status: displayStatus,
    ai_analysis_status: statusMeta.ai,
    review_status: statusMeta.review,
    workflow_stage: statusMeta.stage,
    reporter,
    displayStatus,
    externalReport: {
      ...item.externalReport,
      residentNumber,
      accountHolder: reporter,
    },
    raw_payload: {
      ...item.raw_payload,
      reporter_name: reporter,
      resident_registration_number: residentNumber,
      account_holder: reporter,
      ai_analysis_status: statusMeta.ai,
      review_status: statusMeta.review,
      workflow_stage: statusMeta.stage,
    },
  };
}));

export const STATUS_COUNTS = Object.freeze([
  { label: '전체 신고', value: TOTAL_MOCK_REPORTS.toLocaleString('ko-KR'), note: 'Mock 데이터 전체', tone: 'default' },
  ...Object.entries(CASES.reduce((counts, item) => ({ ...counts, [item.displayStatus]: (counts[item.displayStatus] || 0) + 1 }), {}))
    .map(([label, value]) => ({ label, value: value.toLocaleString('ko-KR'), note: '처리 상태별 현황', tone: 'info' })),
]);

export const DELETED_DEMO_CASE_IDS = [];

export const getMockCaseByRouteId = (caseId) => {
  const routeId = String(caseId);
  if (!routeId.startsWith(MOCK_CASE_ID_PREFIX)) return null;
  return CASES.find((item) => item.id === routeId) || null;
};

export const getDisasterEventIdForCase = (item) => {
  if (item.disaster_event_id) return item.disaster_event_id;

  const occurredAt = item.reported_at || item.received_at || '';
  const year = Number(String(occurredAt).slice(0, 4));
  const disasterType = item.disaster_type;
  const reportedAt = Date.parse(occurredAt);

  const matchingEvent = MOCK_DISASTER_EVENTS.find((event) => {
    if (event.year !== year || event.disasterType !== disasterType) return false;
    if (Number.isNaN(reportedAt)) return false;
    const from = new Date(`${event.from}T00:00:00`).getTime();
    const to = new Date(`${event.to}T23:59:59.999`).getTime();
    return reportedAt >= from && reportedAt <= to;
  });

  if (matchingEvent) return matchingEvent.id;
  if (!disasterType || !year) return null;
  return `backend-${year}-${disasterType}`;
};

const normalizeCaseIdentifier = (value) => {
  if (value === null || value === undefined) return null;
  const normalized = String(value).trim();
  return normalized || null;
};

export const getCaseKey = (item) => normalizeCaseIdentifier(
  item?.external_report_id
  ?? item?.externalReportId
  ?? item?.case_id
  ?? item?.caseId
  ?? item?.case_number
  ?? item?.caseNumber,
);

const getCaseIdentifiers = (item) => ({
  externalReportId: normalizeCaseIdentifier(
    item?.external_report_id ?? item?.externalReportId,
  ),
  caseId: normalizeCaseIdentifier(item?.case_id ?? item?.caseId),
  caseNumber: normalizeCaseIdentifier(item?.case_number ?? item?.caseNumber),
});

const createIdentifierSets = () => ({
  externalReportIds: new Set(),
  caseIds: new Set(),
  caseNumbers: new Set(),
});

const addCaseIdentifiers = (sets, item) => {
  const identifiers = getCaseIdentifiers(item);
  if (identifiers.externalReportId) sets.externalReportIds.add(identifiers.externalReportId);
  if (identifiers.caseId) sets.caseIds.add(identifiers.caseId);
  if (identifiers.caseNumber) sets.caseNumbers.add(identifiers.caseNumber);
};

const hasMatchingIdentifier = (sets, item) => {
  const identifiers = getCaseIdentifiers(item);
  return Boolean(
    (identifiers.externalReportId && sets.externalReportIds.has(identifiers.externalReportId))
    || (identifiers.caseId && sets.caseIds.has(identifiers.caseId))
    || (identifiers.caseNumber && sets.caseNumbers.has(identifiers.caseNumber)),
  );
};

export const mergeBackendAndMockCases = (backendItems, generatedItems = CASES) => {
  const backendCases = (Array.isArray(backendItems) ? backendItems : []).map((item) => (
    item.sourcePriority === 0 && item.__source === 'backend'
      ? item
      : { ...item, __source: 'backend', sourcePriority: 0 }
  ));
  const identifiers = createIdentifierSets();
  backendCases.forEach((item) => addCaseIdentifiers(identifiers, item));

  const mockCases = [];
  (Array.isArray(generatedItems) ? generatedItems : []).forEach((item) => {
    if (hasMatchingIdentifier(identifiers, item)) return;
    const generatedCase = item.sourcePriority === 1
      ? item
      : { ...item, __source: 'mock', sourcePriority: 1 };
    mockCases.push(generatedCase);
    addCaseIdentifiers(identifiers, generatedCase);
  });

  const backendCounts = backendCases.reduce((counts, item) => {
    const disasterEventId = item.disaster_event_id || getDisasterEventIdForCase(item);
    if (disasterEventId) {
      counts[disasterEventId] = (counts[disasterEventId] || 0) + 1;
    }
    return counts;
  }, {});

  return {
    backendCases,
    mockCases,
    items: [...backendCases, ...mockCases],
    backendCounts,
  };
};

export const validateMockCases = (cases = CASES) => {
  const expected = Object.fromEntries(MOCK_DISASTER_CONFIG.map(({ key, count }) => [key, count]));
  const actual = cases.reduce((counts, item) => ({ ...counts, [item.disaster_type]: (counts[item.disaster_type] || 0) + 1 }), {});
  const expectedEvents = Object.fromEntries(MOCK_DISASTER_EVENTS.map(({ id, targetCount }) => [id, targetCount]));
  const actualEvents = cases.reduce((counts, item) => ({
    ...counts,
    [item.disaster_event_id]: (counts[item.disaster_event_id] || 0) + 1,
  }), {});
  const actualRegions = cases.reduce((counts, item) => {
    const region = normalizeRegionName(item.sido || item.address);
    counts[region] = (counts[region] || 0) + 1;
    return counts;
  }, {});
  const checks = [
    ['전체 신고 수', cases.length === TOTAL_MOCK_REPORTS],
    ...Object.entries(expected).map(([key, count]) => [`${key} 신고 수`, actual[key] === count]),
    ...Object.entries(expectedEvents).map(([id, count]) => [`${id} 신고 수`, actualEvents[id] === count]),
    ...Object.entries(REGION_TARGETS).map(([region, count]) => [`${region} 신고 수`, actualRegions[region] === count]),
    ['재난 발생 건수', new Set(cases.map((item) => item.disaster_event_id)).size === MOCK_DISASTER_EVENTS.length],
    ['신고번호 중복 없음', new Set(cases.map((item) => item.case_number)).size === cases.length],
    ['외부 신고번호 중복 없음', new Set(cases.map((item) => item.external_report_id)).size === cases.length],
    ['caseId 중복 없음', new Set(cases.map((item) => item.case_id)).size === cases.length],
    ['프론트 신고 식별자 중복 없음', new Set(cases.map((item) => item.frontendKey)).size === cases.length],
    ['재난 ID 중복 없음', new Set(MOCK_DISASTER_EVENTS.map((event) => event.id)).size === MOCK_DISASTER_EVENTS.length],
    ['재난별 합계', Object.values(actual).reduce((sum, count) => sum + count, 0) === cases.length],
  ];
  checks.filter(([, valid]) => !valid).forEach(([label]) => console.error(`[Mock 데이터 검증 오류] ${label}`));
  return checks.every(([, valid]) => valid);
};

export const validateMergedCases = (cases) => {
  const items = Array.isArray(cases) ? cases : [];
  const backendCases = items.filter((item) => item.sourcePriority === 0 || item.__source === 'backend');
  const frontendCases = items.filter((item) => item.sourcePriority === 1 || item.__source === 'mock');
  const backendIdentifiers = createIdentifierSets();
  backendCases.forEach((item) => addCaseIdentifiers(backendIdentifiers, item));

  const duplicateValues = (selector) => {
    const seen = new Set();
    const duplicates = new Set();
    items.forEach((item) => {
      const value = normalizeCaseIdentifier(selector(item));
      if (!value) return;
      if (seen.has(value)) duplicates.add(value);
      seen.add(value);
    });
    return [...duplicates];
  };

  const firstFrontendIndex = items.findIndex((item) => item.sourcePriority === 1 || item.__source === 'mock');
  const backendAfterFrontend = firstFrontendIndex >= 0
    && items.slice(firstFrontendIndex + 1).some((item) => item.sourcePriority === 0 || item.__source === 'backend');
  const failures = [
    ...(backendAfterFrontend ? ['백엔드 데이터보다 먼저 배치된 프론트 생성 데이터'] : []),
    ...(frontendCases.some((item) => hasMatchingIdentifier(backendIdentifiers, item))
      ? ['백엔드와 프론트 생성 데이터 간 식별자 중복']
      : []),
    ...(duplicateValues((item) => item.external_report_id ?? item.externalReportId).length
      ? ['외부 신고번호 중복']
      : []),
    ...(duplicateValues((item) => item.case_id ?? item.caseId).length
      ? ['caseId 중복']
      : []),
    ...(duplicateValues((item) => item.case_number ?? item.caseNumber).length
      ? ['신고번호 중복']
      : []),
  ];
  if (failures.length) {
    console.error('[병합 데이터 검증 오류]', failures);
  }
  return failures.length === 0;
};

if (import.meta.env?.DEV) validateMockCases();
