export const DELETED_DEMO_CASE_IDS = [
  'NDMS-20260728-0049',
  'NDMS-2026-0728-0049',
  'NDMS-2026-0716-0048',
  'NDMS-2026-0716-0042',
  'NDMS-2026-0715-0039',
  'NDMS-2026-0715-0031',
  'NDMS-2026-0714-0028',
  'NDMS-2026-0714-0021',
];

const DAMAGE_SCENARIOS = [
  {
    facility: '상가',
    photo: '/mock/flood-2026/store-01.png',
    damage: '침수',
    descriptions: [
      '상가 1층 바닥이 약 35cm 침수되어 냉장설비와 집기류가 손상되었습니다.',
      '상가 출입구로 토사가 유입되어 판매상품 42점과 진열장이 침수되었습니다.',
      '상가 지하 창고가 약 50cm 침수되어 재고품과 전기설비가 손상되었습니다.',
    ],
  },
  {
    facility: '도로',
    photo: '/mock/flood-2026/road-02.png',
    damage: '침수',
    descriptions: [
      '집중호우로 도로 약 120m 구간이 40cm가량 침수되어 차량 통행이 제한되었습니다.',
      '배수 능력 초과로 교차로와 인접 차로 약 95m가 침수되었습니다.',
      '도로 저지대 약 160m 구간에 물이 차올라 차량 2대가 일시 고립되었습니다.',
    ],
  },
  {
    facility: '도로',
    photo: '/mock/flood-2026/road-02.png',
    damage: '침수',
    descriptions: [
      '간선도로 약 180m 구간이 침수되어 버스 운행과 일반 차량 통행이 중단되었습니다.',
      '도로 배수구 역류로 왕복 4차로 중 2개 차로가 약 45cm 침수되었습니다.',
      '차도와 보행로가 함께 침수되어 안전시설과 경계석 일부가 파손되었습니다.',
    ],
  },
  {
    facility: '도로',
    photo: '/mock/flood-2026/road-03.png',
    damage: '침수',
    descriptions: [
      '지하차도 진입부가 약 80cm 침수되어 전면 통제와 배수 작업이 필요합니다.',
      '철도 하부 통과도로에 빗물이 고여 차량 통행이 불가능한 상태입니다.',
      '지하통로 배수펌프 정지로 진입로와 내부 약 70m 구간이 침수되었습니다.',
    ],
  },
  {
    facility: '도로',
    photo: '/mock/flood-2026/road-04.png',
    damage: '유실',
    descriptions: [
      '하천 범람으로 도로 가장자리 약 35m와 가드레일 18m가 유실되었습니다.',
      '급류로 도로 노반 약 42m가 붕괴되고 인접 배수로가 파손되었습니다.',
      '제방 인접 도로 약 30m가 세굴되어 차량 통행이 불가능합니다.',
    ],
  },
  {
    facility: '상가',
    photo: '/mock/flood-2026/store-02.png',
    damage: '침수',
    descriptions: [
      '음식점 내부가 약 25cm 침수되어 냉장고와 조리기구 등 1식이 손상되었습니다.',
      '상가 바닥과 창고에 흙탕물이 유입되어 식자재와 비품 폐기가 필요합니다.',
      '점포 전면과 주방이 침수되어 영업 중단 및 전기 안전점검이 필요합니다.',
    ],
  },
  {
    facility: '주택',
    photo: '/mock/flood-2026/house-01.png',
    damage: '침수',
    descriptions: [
      '단독주택 마당과 1층이 침수되어 가재도구와 보일러가 손상되었습니다.',
      '주택 내부에 토사와 빗물이 유입되어 방 2칸과 주방이 침수되었습니다.',
      '주택 기초 주변이 세굴되고 실내가 약 20cm 침수되었습니다.',
    ],
  },
  {
    facility: '주택',
    photo: '/mock/flood-2026/house-02.png',
    damage: '반파',
    descriptions: [
      '산비탈 토사가 주택 외벽과 부속 창고를 덮쳐 건물 일부가 파손되었습니다.',
      '토사 유입으로 주택 후면 벽체와 지붕 구조 일부가 붕괴되었습니다.',
      '주택 측면 옹벽이 무너지며 차량과 외벽이 파손되어 임시 거주가 어렵습니다.',
    ],
  },
  {
    facility: '농경지',
    photo: '/mock/flood-2026/farmland-01.png',
    damage: '침수',
    descriptions: [
      '시설하우스 3동과 고추 재배지 약 1,200㎡가 침수되었습니다.',
      '논과 밭 약 1,850㎡가 침수되고 관수시설 일부가 유실되었습니다.',
      '시설채소 재배지 약 980㎡에 흙탕물이 유입되어 작물 피해가 발생했습니다.',
    ],
  },
  {
    facility: '상가',
    photo: '/mock/flood-2026/store-03.png',
    damage: '침수',
    descriptions: [
      '계곡 인접 상가에 급류가 유입되어 영업장과 야외 시설물이 침수되었습니다.',
      '상가 전면 도로 범람으로 매장 내부와 창고 재고가 침수되었습니다.',
      '상가 출입구와 주차장에 급류가 유입되어 간판과 외부 집기가 파손되었습니다.',
    ],
  },
];

const MOCK_APPLICANTS = [
  ['박현우', '충청북도 청주시 상당구 상당로81번길 14, 302호', '충청북도 청주시 상당구 복구로 18, 1층 101호'],
  ['김지연', '충청북도 청주시 흥덕구 가경로 126, 105동 804호', '충청북도 청주시 흥덕구 안전대로 214, 가경시장 앞 도로'],
  ['이준서', '충청북도 제천시 의림대로42길 9, 201호', '충청북도 제천시 중앙로2가 104, 중앙시장 교차로'],
  ['최은정', '충청남도 공주시 번영1로 37, 103동 502호', '충청남도 공주시 무령로 218, 신관지하차도'],
  ['정민호', '전북특별자치도 익산시 무왕로22길 18, 202호', '전북특별자치도 익산시 함열읍 익산대로 1672, 하천변 도로'],
  ['윤서진', '충청남도 부여군 부여읍 사비로72번길 11', '충청남도 부여군 부여읍 중앙로 9, 1층 음식점'],
  ['한도윤', '충청북도 충주시 연수서편2길 16, 104동 603호', '충청북도 충주시 살미면 세성로 132, 단독주택'],
  ['송하윤', '충청남도 논산시 시민로258번길 22, 202호', '충청남도 논산시 연산면 계백로 1874-12, 단독주택'],
  ['임재훈', '전북특별자치도 완주군 삼례읍 삼례로 381', '전북특별자치도 완주군 삼례읍 후정리 418-7, 시설하우스'],
  ['오수빈', '경기도 여주시 세종로14번길 8, 301호', '경기도 여주시 강천면 강문로 225, 1층 상가'],
  ['강태욱', '충청북도 청주시 서원구 산남로62번길 15, 706호', '충청북도 청주시 서원구 분평로 36, 1층 소매점'],
  ['배지우', '세종특별자치시 한누리대로 312, 708동 1104호', '세종특별자치시 조치원읍 새내로 76, 조치원교차로'],
  ['신예린', '충청남도 천안시 서북구 두정로 228, 103동 902호', '충청남도 천안시 서북구 성정공원5로 21, 성정사거리'],
  ['문성호', '충청남도 아산시 배방읍 모산로 112, 107동 402호', '충청남도 아산시 온천대로 1496, 온양지하차도'],
  ['조아라', '충청북도 음성군 금왕읍 무극로 276, 204호', '충청북도 음성군 금왕읍 대금로 1218, 응천교 인접 도로'],
  ['권민재', '충청남도 공주시 웅진로 154, 401호', '충청남도 공주시 산성시장5길 8, 1층 음식점'],
  ['남유진', '충청남도 예산군 예산읍 역전로140번길 17', '충청남도 예산군 삽교읍 수암산로 63-8, 단독주택'],
  ['백승현', '충청북도 괴산군 괴산읍 읍내로15길 12', '충청북도 괴산군 칠성면 쌍곡로 184, 단독주택'],
  ['서채원', '전북특별자치도 김제시 중앙로 91, 302호', '전북특별자치도 김제시 백산면 하정리 611-3, 시설하우스'],
  ['황도경', '전북특별자치도 남원시 시청로 32, 102동 503호', '전북특별자치도 남원시 광한서로 27, 1층 상가'],
  ['장서윤', '충청북도 보은군 보은읍 삼산로4길 19', '충청북도 보은군 보은읍 장신로 42, 1층 철물점'],
  ['고민준', '충청북도 옥천군 옥천읍 중앙로 88, 405호', '충청북도 옥천군 옥천읍 금장로 56, 금구천변 도로'],
  ['류하린', '충청북도 진천군 진천읍 중앙동로 93, 301호', '충청북도 진천군 덕산읍 산수산단로 177, 산업단지 진입로'],
  ['노정우', '충청남도 논산시 대학로65번길 12, 203호', '충청남도 논산시 강경읍 계백로 141, 강경지하차도'],
  ['심가은', '충청남도 금산군 금산읍 비호로 38, 201호', '충청남도 금산군 제원면 금강로 218, 제원대교 인접 도로'],
  ['유상민', '충청북도 제천시 용두대로15길 20, 502호', '충청북도 제천시 풍양로17길 6, 1층 식당'],
  ['홍예원', '충청북도 단양군 단양읍 삼봉로 287, 301호', '충청북도 단양군 대강면 사인암로 126-4, 단독주택'],
  ['전우진', '충청남도 청양군 청양읍 중앙로 141, 202호', '충청남도 청양군 정산면 칠갑산로 1876-9, 단독주택'],
  ['마지수', '전북특별자치도 정읍시 중앙로 118, 104동 703호', '전북특별자치도 정읍시 태인면 태흥리 327-5, 시설하우스'],
  ['양현석', '강원특별자치도 원주시 남원로469번길 13, 604호', '강원특별자치도 원주시 문막읍 왕건로 52, 1층 상가'],
];

const BANKS = ['국민은행', '농협은행', '신한은행', '우리은행', '하나은행', '기업은행'];
const HOUSEHOLD_COUNTS = [3, 2, 4, 1, 3, 2, 5, 3, 4, 2];

const formatMockDateTime = (index, hourOffset = 0) => {
  const date = new Date(2026, 6, 17 + (index % 8), 6 + ((index * 3) % 14) + hourOffset, (index * 7) % 60);
  const pad = (value) => String(value).padStart(2, '0');
  return `${date.getFullYear()}.${pad(date.getMonth() + 1)}.${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

export const CASES = MOCK_APPLICANTS.map(([reporter, address, damagePlace], index) => {
  const scenario = DAMAGE_SCENARIOS[index % DAMAGE_SCENARIOS.length];
  const sequence = String(index + 1).padStart(4, '0');
  const urgencyScore = 94 - index;
  const caseId = `NDMS-2026-0724-${sequence}`;
  const receivedAt = formatMockDateTime(index, 2);
  const damageOccurredAt = formatMockDateTime(index);

  return {
    id: caseId,
    reporter,
    type: '집중호우',
    facility: scenario.facility,
    location: damagePlace,
    reportedAt: receivedAt,
    status: '접수 완료',
    urgency: urgencyScore >= 85 ? '긴급' : urgencyScore >= 70 ? '높음' : '보통',
    urgencyScore,
    duplicate: false,
    damage: scenario.damage,
    description: scenario.descriptions[Math.floor(index / DAMAGE_SCENARIOS.length)],
    disasterEventId: 'rain-2026-0717',
    source: 'safety24',
    photos: [{
      name: `${scenario.facility}_호우피해_${sequence}.png`,
      url: scenario.photo,
    }],
    externalReport: {
      reportId: `SAFETY24-20260724-${sequence}`,
      receivedAt,
      address,
      residentNumber: `${String(67 + index).padStart(2, '0')}${String((index % 12) + 1).padStart(2, '0')}${String((index % 27) + 1).padStart(2, '0')}-${index % 2 === 0 ? '1' : '2'}******`,
      phone: `010-****-${String(4101 + index)}`,
      householdMembers: HOUSEHOLD_COUNTS[index % HOUSEHOLD_COUNTS.length],
      bankName: BANKS[index % BANKS.length],
      accountNumber: `${String(301 + index)}-${String(12 + (index % 70)).padStart(2, '0')}-******`,
      accountHolder: reporter,
      damageOccurredAt,
    },
  };
});

export const STATUS_COUNTS = [
  { label: '전체 신고', value: '1,284', note: '전일 대비 42건 증가', tone: 'default' },
  { label: '검토 필요', value: '96', note: '우선 확인 대상', tone: 'danger' },
  { label: 'AI 분석 대기', value: '412', note: '분석 요청 순서 대기', tone: 'info' },
  { label: 'AI 분석 완료', value: '872', note: '공무원 검토 가능', tone: 'success' },
];
