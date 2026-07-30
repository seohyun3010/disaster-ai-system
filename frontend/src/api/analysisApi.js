/**
 * AI 분석 API — 백엔드 실제 엔드포인트 연동
 *
 * 백엔드와 프론트의 규격이 달라 이 계층에서 변환한다.
 *   경로   POST /cases/{caseId}/ai-jobs
 *          GET  /ai-jobs/{jobId}
 *          GET  /cases/{caseId}/ai-results
 *   필드   job_id / case_id        →  jobId / caseId
 *   상태   PENDING RUNNING DONE FAILED
 *          →  queued processing completed failed
 *
 * 결과 조회는 caseId 기준인데 스토어는 jobId만 전달하므로
 * 작업 생성 시점에 jobId → caseId 대응을 보관한다.
 *
 * 스토어(analysisStore)와 화면(AnalysisResultCard)은 수정하지 않고
 * 이 파일에서 필드명을 맞춘다.
 */
import axiosInstance from './axiosInstance';

export const ANALYSIS_POLLING_INTERVAL = 2000;

/* ------------------------------------------------------------------
   이미지 경로 변환
   ------------------------------------------------------------------ */

// 백엔드가 반환하는 상대 경로(/uploads/...)를 API 서버 절대 URL로 바꾼다.
// 프론트 dev 서버(5173)로 요청하면 SPA fallback 때문에 PNG 대신
// index.html이 응답되어 이미지가 깨진다.
const API_ORIGIN = (axiosInstance.defaults.baseURL || 'http://localhost:8000')
  .replace(/\/$/, '');

const toAbsolute = (url) => {
  if (!url) return url;
  if (/^https?:\/\//.test(url)) return url;
  return `${API_ORIGIN}${url.startsWith('/') ? '' : '/'}${url}`;
};

/* ------------------------------------------------------------------
   jobId → caseId 대응 보관
   ------------------------------------------------------------------ */

const JOB_CASE_KEY = 'ndrms.jobCaseMap';

const loadJobCaseMap = () => {
  try {
    return JSON.parse(localStorage.getItem(JOB_CASE_KEY) || '{}');
  } catch {
    return {};
  }
};

const rememberJobCase = (jobId, caseId) => {
  if (!jobId || !caseId) return;
  const map = loadJobCaseMap();
  map[String(jobId)] = String(caseId);
  try {
    localStorage.setItem(JOB_CASE_KEY, JSON.stringify(map));
  } catch {
    // 저장 실패는 무시 — 상태 조회로 caseId를 다시 확인할 수 있다
  }
};

const findCaseId = (jobId) => loadJobCaseMap()[String(jobId)] || null;

/* ------------------------------------------------------------------
   상태·등급 매핑
   ------------------------------------------------------------------ */

const STATUS_MAP = {
  PENDING: 'queued',
  RUNNING: 'processing',
  DONE: 'completed',
  FAILED: 'failed',
};

const STAGE_MAP = {
  PENDING: '분석 요청 접수',
  RUNNING: '피해등급 판독 중',
  DONE: '판독 완료',
  FAILED: '분석 실패',
};

// 손상등급 코드 → 심사 업무 용어
// AI는 예비판정만 수행하므로 '후보'로 표기하고 확정 표현을 쓰지 않는다.
const GRADE_LABEL = {
  DS0: '피해 없음',
  DS1: '경미',
  DS2: '반파 경계 · 현장조사 필요',
  DS3: '반파 후보',
  DS4: '전파 후보',
};

const GRADE_INDEX = { DS0: 0, DS1: 1, DS2: 2, DS3: 3, DS4: 4 };

const PART_NAMES = {
  roof: '지붕',
  wall: '외벽',
  opening: '창호',
  structure: '구조체',
  inundation: '침수',
};

// 손상 부위 카운트에 쓰는 건물 부위 (침수는 별도 트랙이므로 제외)
const RATIO_PARTS = ['roof', 'wall', 'opening', 'structure'];

/* ------------------------------------------------------------------
   변환
   ------------------------------------------------------------------ */

/** ai_explanation(JSON 문자열)을 안전하게 파싱 */
const parseExplanation = (raw) => {
  if (!raw) return {};
  if (typeof raw === 'object') return raw;
  try {
    return JSON.parse(raw);
  } catch {
    // 구버전 레코드는 순수 문자열일 수 있다
    return { rationale: String(raw) };
  }
};

/** 백엔드 ai_results 레코드 → 화면용 결과 객체 */
const toResult = (record) => {
  const meta = parseExplanation(record.ai_explanation);
  const observation = meta.observation || {};
  const consistency = meta.consistency || {};

  // 관찰 가능한 부위 중 손상 부위 개수
  const visible = RATIO_PARTS.filter((p) =>
    ['DAMAGED', 'UNDAMAGED'].includes(observation[p]?.status),
  );
  const damaged = visible.filter((p) => observation[p]?.status === 'DAMAGED');

  // 판정 근거 문장 조립 (구버전 rationale 호환용)
  const details = Object.entries(observation)
    .filter(([key, value]) => PART_NAMES[key] && value?.status === 'DAMAGED')
    .map(([key, value]) => `${PART_NAMES[key]}: ${value.note || '손상 확인'}`);

  const lines = [];
  if (observation.summary) lines.push(observation.summary);
  else if (meta.rationale) lines.push(meta.rationale);
  if (details.length) lines.push(details.join(' / '));
  if (consistency.consistent === false && consistency.reason) {
    lines.push(`⚠ ${consistency.reason} — 현장조사 대상`);
  }

  const gradeCode = record.damage_grade;

  return {
    resultId: record.result_id,
    caseId: record.case_id,
    caseNumber: record.case_number,

    // 화면 표시용
    recommendedGrade: GRADE_LABEL[gradeCode]
      ? `${gradeCode} · ${GRADE_LABEL[gradeCode]}`
      : gradeCode,
    confidence: (record.confidence * 100).toFixed(1),
    rationale: lines.join('\n') || '관찰 소견을 생성하지 못했습니다.',
    duplicateResult: record.inspection_required
      ? '현장조사 필요 — 신뢰도 미달 또는 관찰 불일치'
      : '자동 판정 가능',
    damagedParts: damaged.length,
    visibleParts: visible.length,

    // 판독 근거 시각화
    camUrls: (meta.cam_urls || []).map(toAbsolute),
    sourceUrls: (meta.source_urls || []).map(toAbsolute),
    gate: meta.gate || {},
    preprocess: meta.preprocess || [],
    viewProbs: meta.view_probs || [],
    damageGradeIndex: GRADE_INDEX[gradeCode] ?? null,

    // 상세 정보
    damageGrade: gradeCode,
    inspectionRequired: record.inspection_required,
    secondGrade: meta.second_grade ?? null,
    secondConfidence: meta.second_confidence ?? null,
    distribution: meta.distribution || [],
    modelVersion: meta.model_version || '',
    viewCount: meta.view_count ?? null,
    observation,
    consistency,
    analysisTime: record.analysis_time,
    completedAt: record.created_at,
  };
};

/* ------------------------------------------------------------------
   API
   ------------------------------------------------------------------ */

/** AI 분석 작업 생성 */
export const requestAnalysis = async (caseId) => {
  const response = await axiosInstance.post(`/cases/${caseId}/ai-jobs`);
  const data = response.data;
  rememberJobCase(data.job_id, caseId);
  return {
    jobId: data.job_id,
    caseId: data.case_id,
    status: STATUS_MAP[data.status] || 'queued',
    requestedAt: data.started_at,
  };
};

/** 작업 상태 조회 */
export const getAnalysisStatus = async (jobId) => {
  const response = await axiosInstance.get(`/ai-jobs/${jobId}`);
  const data = response.data;
  rememberJobCase(jobId, data.case_id);
  return {
    jobId: data.job_id,
    caseId: data.case_id,
    status: STATUS_MAP[data.status] || 'queued',
    stage: STAGE_MAP[data.status] || null,
    requestedAt: data.started_at,
    completedAt: data.finished_at,
  };
};

/** 사건 단위 결과 조회 — 재분석 이력 중 최신 1건 */
export const getCaseAnalysisResult = async (caseId) => {
  const response = await axiosInstance.get(`/cases/${caseId}/ai-results`);
  const records = Array.isArray(response.data) ? response.data : [];
  if (records.length === 0) return null;
  const latest = [...records].sort(
    (a, b) => new Date(b.created_at) - new Date(a.created_at),
  )[0];
  return toResult(latest);
};

/** 작업 단위 결과 조회 — 내부적으로 caseId로 환원 */
export const getAnalysisResult = async (jobId) => {
  let caseId = findCaseId(jobId);
  if (!caseId) {
    const status = await getAnalysisStatus(jobId);
    caseId = status.caseId;
  }
  if (!caseId) throw new Error('분석 결과를 조회할 사건을 찾지 못했습니다.');
  return getCaseAnalysisResult(caseId);
};

/* ------------------------------------------------------------------
   백엔드 미구현 — 화면 흐름 유지를 위한 통과 처리
   ------------------------------------------------------------------ */

export const saveAnalysisResult = async (_jobId, data) => ({ ...data, saved: true });

export const submitAnalysisReview = async (_jobId, review) => ({ ...review, reviewed: true });