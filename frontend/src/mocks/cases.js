export const CASES = [
  { id: 'NDMS-2026-0716-0048', reporter: '김영수', type: '집중호우', facility: '주택', location: '충북 청주시 상당구', reportedAt: '2026.07.16 09:42', status: '검토 필요', urgency: '긴급', duplicate: true, damage: '반파', description: '집중호우로 주택 지붕 일부가 파손되고 실내 누수가 발생했습니다.' },
  { id: 'NDMS-2026-0716-0042', reporter: '박정자', type: '산사태', facility: '농경지', location: '충북 보은군 마로면', reportedAt: '2026.07.16 08:17', status: '현장 확인', urgency: '높음', duplicate: false, damage: '침수', description: '토사 유입으로 비닐하우스와 농경지 일부가 매몰되었습니다.' },
  { id: 'NDMS-2026-0715-0039', reporter: '이성호', type: '집중호우', facility: '상가', location: '충남 공주시 신관동', reportedAt: '2026.07.15 16:25', status: 'AI 분석 대기', urgency: '보통', duplicate: false, damage: '침수', description: '상가 1층 침수와 집기류 피해가 접수되었습니다.' },
  { id: 'NDMS-2026-0715-0031', reporter: '최경자', type: '태풍', facility: '주택', location: '충남 천안시 동남구', reportedAt: '2026.07.15 13:11', status: 'AI 분석 완료', urgency: '보통', duplicate: false, damage: '부분 파손', description: '태풍으로 지붕 마감재와 외벽 일부가 파손되었습니다.' },
  { id: 'NDMS-2026-0714-0028', reporter: '한상철', type: '집중호우', facility: '도로', location: '충북 제천시 봉양읍', reportedAt: '2026.07.14 18:34', status: '검토 필요', urgency: '긴급', duplicate: true, damage: '유실', description: '도로 사면 붕괴와 배수로 유실이 발생했습니다.' },
  { id: 'NDMS-2026-0714-0021', reporter: '송미숙', type: '산사태', facility: '주택', location: '충남 예산군 예산읍', reportedAt: '2026.07.14 10:08', status: '접수 완료', urgency: '낮음', duplicate: false, damage: '경미', description: '주택 주변 토사 유입 여부를 확인 요청했습니다.' },
];

export const STATUS_COUNTS = [
  { label: '전체 신고', value: '1,284', note: '전일 대비 42건 증가', tone: 'default' },
  { label: '검토 필요', value: '96', note: '우선 확인 대상', tone: 'danger' },
  { label: 'AI 분석 대기', value: '412', note: '분석 요청 순서 대기', tone: 'info' },
  { label: 'AI 분석 완료', value: '872', note: '공무원 검토 가능', tone: 'success' },
];
