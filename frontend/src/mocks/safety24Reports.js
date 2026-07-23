import damagePhoto from '../assets/hero.png';

// Frontend-only sample payload. In production this data is received through a
// backend integration, and sensitive values must remain masked in the browser.
export const SAFETY24_REPORTS = [
  {
    reportId: 'SAFETY24-20260723-001',
    receivedAt: '2026.07.23 10:20',
    disasterType: '집중호우',
    applicant: {
      name: '한상호',
      residentNumber: '900101-1******',
      address: '부산광역시 해운대구 우동 123',
      householdMembers: 3,
    },
    payoutAccount: {
      bankName: '국민은행',
      accountNumber: '123-45-******',
      accountHolder: '한상호',
    },
    damagePlace: '부산광역시 해운대구 우동 123',
    facilityType: '주택',
    damageDetails: [
      { category: '주택', value: '반파 · 단독주택 1동' },
      { category: '기타', value: '가재도구 침수 피해' },
    ],
    photos: [
      { name: '국민안전24_피해사진_01.png', url: damagePhoto },
      { name: '국민안전24_피해사진_02.png', url: damagePhoto },
    ],
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
