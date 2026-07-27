import damagePhoto from '../assets/hero.png';

const createPhotos = (prefix, count) => Array.from({ length: count }, (_, index) => ({
  name: `${prefix}_피해사진_${String(index + 1).padStart(2, '0')}.png`,
  url: damagePhoto,
}));

// Frontend-only examples. The real list will later be supplied by the backend
// after the National Safety 24 integration succeeds.
export const SAFETY24_REPORTS = [
  {
    reportId: 'SAFETY24-20260724-005', receivedAt: '2026.07.24 10:20', disasterType: '집중호우', facilityType: '주택',
    applicant: { name: '한상호', residentNumber: '900101-1******', address: '부산광역시 해운대구 우동 123', householdMembers: 3 },
    payoutAccount: { bankName: '국민은행', accountNumber: '123-45-******', accountHolder: '한상호' },
    damagePlace: '부산광역시 해운대구 우동 123', damageDetails: [{ category: '주택', value: '반파 · 단독주택 1동' }, { category: '기타', value: '가재도구 침수 피해' }], photos: createPhotos('부산', 2),
  },
  {
    reportId: 'SAFETY24-20260724-004', receivedAt: '2026.07.24 09:48', disasterType: '강풍', facilityType: '상가',
    applicant: { name: '김서연', residentNumber: '850406-2******', address: '서울특별시 강서구 마곡동 45', householdMembers: 2 },
    payoutAccount: { bankName: '신한은행', accountNumber: '110-34-******', accountHolder: '김서연' },
    damagePlace: '서울특별시 강서구 마곡동 45', damageDetails: [{ category: '기타', value: '소상공인 사업장 간판 및 외벽 파손 1식' }], photos: createPhotos('서울', 1),
  },
  {
    reportId: 'SAFETY24-20260724-003', receivedAt: '2026.07.24 09:15', disasterType: '산사태', facilityType: '농경지',
    applicant: { name: '이도현', residentNumber: '780912-1******', address: '충청북도 제천시 봉양읍 88', householdMembers: 4 },
    payoutAccount: { bankName: '농협은행', accountNumber: '301-12-******', accountHolder: '이도현' },
    damagePlace: '충청북도 제천시 봉양읍 88', damageDetails: [{ category: '농림수산시설', value: '고추 재배지 토사 유입 1,200㎡' }], photos: createPhotos('충북', 3),
  },
  {
    reportId: 'SAFETY24-20260724-002', receivedAt: '2026.07.24 08:52', disasterType: '태풍', facilityType: '수산시설',
    applicant: { name: '오민지', residentNumber: '910808-2******', address: '제주특별자치도 서귀포시 성산읍 201', householdMembers: 3 },
    payoutAccount: { bankName: '제주은행', accountNumber: '900-11-******', accountHolder: '오민지' },
    damagePlace: '제주특별자치도 서귀포시 성산읍 201', damageDetails: [{ category: '농림수산시설', value: '양식장 부대시설 파손 1식' }], photos: createPhotos('제주', 2),
  },
  {
    reportId: 'SAFETY24-20260724-001', receivedAt: '2026.07.24 08:30', disasterType: '집중호우', facilityType: '주택',
    applicant: { name: '박준호', residentNumber: '880223-1******', address: '인천광역시 연수구 송도동 77', householdMembers: 1 },
    payoutAccount: { bankName: '우리은행', accountNumber: '1002-56-******', accountHolder: '박준호' },
    damagePlace: '인천광역시 연수구 송도동 77', damageDetails: [{ category: '주택', value: '침수 · 공동주택 1세대' }, { category: '기타', value: '가재도구 침수 피해' }], photos: createPhotos('인천', 2),
  },
];

export const makeCaseFromSafety24Report = (report) => ({
  reporter: report.applicant.name,
  type: report.disasterType,
  facility: report.facilityType,
  location: report.damagePlace,
  description: report.damageDetails.map(({ category, value }) => `${category}: ${value}`).join('\n'),
  photos: report.photos,
  source: 'safety24',
  externalReport: {
    reportId: report.reportId,
    receivedAt: report.receivedAt,
    residentNumber: report.applicant.residentNumber,
    householdMembers: report.applicant.householdMembers,
    bankName: report.payoutAccount.bankName,
    accountNumber: report.payoutAccount.accountNumber,
    accountHolder: report.payoutAccount.accountHolder,
  },
});
