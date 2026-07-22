export const MOCK_ANALYSIS_RESULT = {
  recommendedGrade: '반파',
  damageRatio: 48,
  confidence: 91.4,
  rationale: '건물 외벽 및 지붕 일부가 파손되었고, 피해 영역이 전체 시설 면적의 약 48%로 추정됨',
  modelVersion: 'YOLOv11-Seg v1.0',
  duplicateResult: '중복 의심 없음',
  boundingBoxes: [
    { id: 'roof', label: '지붕 파손', left: 21, top: 14, width: 58, height: 28 },
    { id: 'wall', label: '외벽 파손', left: 29, top: 43, width: 44, height: 32 },
  ],
  segmentation: {
    clipPath: 'polygon(18% 20%, 72% 14%, 82% 48%, 68% 78%, 27% 72%, 12% 45%)',
  },
};

const jobs = new Map();

const formatDateTime = (date) => new Intl.DateTimeFormat('ko-KR', {
  dateStyle: 'medium',
  timeStyle: 'medium',
}).format(date);

export const createMockAnalysisJob = (caseId) => {
  const requestedAt = new Date();
  const job = {
    caseId,
    jobId: `AI-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
    requestedAt: formatDateTime(requestedAt),
    requestedAtMs: requestedAt.getTime(),
  };
  jobs.set(job.jobId, job);
  return { jobId: job.jobId, requestedAt: job.requestedAt };
};

export const readMockAnalysisStatus = (jobId) => {
  const job = jobs.get(jobId);
  if (!job) throw new Error('분석 작업을 찾을 수 없습니다.');

  const elapsed = Date.now() - job.requestedAtMs;
  if (elapsed < 1000) return { status: 'queued', stage: '분석 서버 배정 대기' };
  if (elapsed < 3000) return { status: 'processing', stage: '피해 영역 탐지 및 판정' };
  return { status: 'completed', stage: '분석 완료' };
};

export const readMockAnalysisResult = (jobId) => {
  const job = jobs.get(jobId);
  if (!job) throw new Error('분석 작업을 찾을 수 없습니다.');
  if (readMockAnalysisStatus(jobId).status !== 'completed') {
    throw new Error('분석이 아직 완료되지 않았습니다.');
  }
  return {
    ...MOCK_ANALYSIS_RESULT,
    completedAt: formatDateTime(new Date(job.requestedAtMs + 3000)),
  };
};
