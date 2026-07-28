export const SEVERITY_FACTORS = [
  { key: 'damageScale', label: '피해 규모', aiScore: 22, maxScore: 25 },
  { key: 'facilityImportance', label: '시설 중요도', aiScore: 18, maxScore: 20 },
  { key: 'accessibility', label: '접근성', aiScore: 14, maxScore: 15 },
  { key: 'vulnerableImpact', label: '취약계층 영향', aiScore: 16, maxScore: 20 },
  { key: 'secondaryDamage', label: '2차 피해 가능성', aiScore: 17, maxScore: 20 },
];

export const calculateSeverityTotal = (scores) =>
  SEVERITY_FACTORS.reduce((total, factor) => total + Number(scores[factor.key] || 0), 0);

export const getUrgencyGrade = (total) => {
  if (total >= 80) return { grade: '긴급', rank: '1순위' };
  if (total >= 60) return { grade: '높음', rank: '2순위' };
  if (total >= 40) return { grade: '보통', rank: '3순위' };
  return { grade: '낮음', rank: '4순위' };
};

export const SUPPORT_STANDARD = {
  standard: '주택 반파 복구 지원 기준',
  unitPrice: 12000000,
  damageRatio: 0.48,
  duplicateResult: '중복 수혜 의심 없음',
};

export const calculateExpectedSupport = () =>
  Math.round(SUPPORT_STANDARD.unitPrice * SUPPORT_STANDARD.damageRatio);

export const REPORT_VERSIONS = [
  { id: 'RPT-002', version: 'v1.1', createdAt: '2026.07.22 15:40', creator: formatOfficerFull(getCurrentUser()), status: '최종' },
];

export const PROCESS_HISTORY = [
  ['2026.07.16 09:42', '신고 접수', '국민안전24 신고가 접수되었습니다.'],
  ['2026.07.16 10:05', 'AI 분석 요청', '피해 이미지 분석 작업을 요청했습니다.'],
  ['2026.07.16 10:08', 'AI 분석 완료', '피해등급 반파, 신뢰도 91.4%로 분석했습니다.'],
  ['2026.07.16 11:15', '피해등급 승인', `AI 추천 피해등급을 ${formatOfficerFull(getCurrentUser())}이 검토 승인했습니다.`],
  ['2026.07.16 13:30', '긴급도 검토', `${formatOfficerFull(getCurrentUser())}이 복구 긴급도 1순위로 검토했습니다.`],
  ['2026.07.16 14:10', '지원금 산정', `${formatOfficerFull(getCurrentUser())}이 예상 지원금을 산정했습니다.`],
  ['2026.07.22 14:00', '최종 승인', `${formatOfficerFull(getCurrentUser())}이 복구 지원을 최종 승인했습니다.`],
  ['2026.07.22 15:40', '보고서 생성', `${formatOfficerFull(getCurrentUser())}이 최종 보고서를 생성했습니다.`],
];

export const downloadMockReport = (report, caseId, details = {}) => {
  const content = [
    '재해복구 업무 처리 보고서',
    `사건번호: ${caseId}`,
    `보고서 상태: ${report.status}`,
    report.status !== '최종' && report.version && `보고서 버전: ${report.version}`,
    `생성일시: ${report.createdAt}`,
    `생성자: ${report.creator}`,
    details.reporter && `신고자: ${details.reporter}`,
    details.disasterType && `재난 유형: ${details.disasterType}`,
    details.facility && `시설 유형: ${details.facility}`,
    details.location && `피해 위치: ${details.location}`,
    details.damageGrade && `최종 피해등급: ${details.damageGrade}`,
    details.urgencyScore !== undefined && `긴급도 점수: ${details.urgencyScore}점`,
    details.supportAmount !== undefined && `최종 지원금: ${Number(details.supportAmount).toLocaleString('ko-KR')}원`,
    details.approvalStatus && `최종 처리 결과: ${details.approvalStatus}`,
    details.description && `피해 내용: ${details.description}`,
    '',
    '본 보고서는 최종 승인된 사건 처리 내용을 기준으로 생성되었습니다.',
  ].filter(Boolean).join('\n');
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = report.status === '최종' ? `${caseId}_final_report.txt` : `${caseId}_${report.version}_report.txt`;
  anchor.click();
  URL.revokeObjectURL(url);
};

export const createInitialWorkflow = () => {
  const severityScores = Object.fromEntries(SEVERITY_FACTORS.map((factor) => [factor.key, factor.aiScore]));
  return {
    severityScores,
    severityReason: '',
    severityConfirmed: false,
    supportAmount: calculateExpectedSupport(),
    supportReason: '',
    supportConfirmed: false,
    approvalStatus: '승인 대기',
    approvalReason: '',
    approvalAmount: calculateExpectedSupport(),
  };
};

export const DEFAULT_WORKFLOW = createInitialWorkflow();
import { formatOfficerFull, getCurrentUser } from './currentUser';
