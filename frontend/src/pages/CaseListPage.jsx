import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAnalysisStore } from '../stores/analysisStore';
import { useCaseStore } from '../stores/caseStore';
import { useWorkflowStore } from '../stores/workflowStore';
import { buildDisasterEvents, filterCasesByDisasterPeriod } from '../utils/disasterEvents';
import { isZeroSupportGrade } from '../utils/reviewRules';
import { submitDamageGradeReview } from '../api/reviewApi';
import { useAuthStore } from '../stores/authStore';
import { DEFAULT_DISASTER_QUERY_RANGE } from '../mocks/cases';
import './case-list.css';
import './report-management.css';

const PAGE_SIZE = 10;
const EVENT_PAGE_SIZE_OPTIONS = [5, 10, 20];
const SOURCE_PRIORITY = { backend: 0, mock: 1 };

const formatFilterDate = (value) => String(value || '').replaceAll('-', '.');

const FINAL_APPROVAL_STATUSES = [
  '최종 승인',
  '금액 수정 후 승인',
];

const STATUS_FILTERS = [
  '전체',
  '완료',
  '미완료',
  '보류',
];

const COMPLETED_LIST_STATUSES = [
  ...FINAL_APPROVAL_STATUSES,
  '완료',
  '승인',
  '수정 승인',
  '처리 완료',
  '보고서 생성 완료',
  '반려',
];

const HOLD_LIST_STATUSES = [
  '보류',
  '현장조사 필요',
  '현장조사 대기',
  '재판정 대기',
];

const FACILITY_FILTERS = [
  '전체',
  '주택',
  '상가',
  '농경지',
  '도로',
];

const DAMAGE_GRADE_OPTIONS = [
  'DS0 · 피해 없음',
  'DS1 · 경미',
  'DS2 · 반파 경계',
  'DS3 · 반파',
  'DS4 · 전파',
];

const getSimpleStatus = (
  reviewStatus,
  approvalStatus,
) => {
  const storedStatuses = [reviewStatus, approvalStatus].filter(Boolean);

  if (storedStatuses.some((value) => HOLD_LIST_STATUSES.includes(value))) {
    return '보류';
  }

  if (storedStatuses.some((value) => COMPLETED_LIST_STATUSES.includes(value))) {
    return '완료';
  }

  return '미완료';
};

const getItemCaseId = (item) => String(item.id ?? item.case_id);
const getItemFrontendKey = (item) => item.frontendKey || getItemCaseId(item);

const getListStatus = (item, reviewStatus, approvalStatus) => {
  if (reviewStatus || approvalStatus) {
    const storedStatus = getSimpleStatus(reviewStatus, approvalStatus);

    if (storedStatus === '보류') return '보류';
    if (storedStatus === '완료') return '완료';
    return '미완료';
  }

  const detailedStatus =
    item.processing_status
    || item.processingStatus
    || item.displayStatus
    || item.status
    || item.workflow_status
    || item.workflowStatus
    || item.review_status
    || item.reviewStatus
    || item.ai_analysis_status;

  if (HOLD_LIST_STATUSES.includes(detailedStatus)) return '보류';
  if (COMPLETED_LIST_STATUSES.includes(detailedStatus)) return '완료';
  return '미완료';
};

const matchesStatusFilter = (listStatus, filter) => (
  filter === '전체' || listStatus === filter
);

const getReportTimestamp = (item) => {
  const rawValue = item.reported_at || item.received_at;
  if (rawValue) {
    const timestamp = Date.parse(rawValue);
    if (!Number.isNaN(timestamp)) return timestamp;
  }

  const displayMatch = String(item.reportedAt || '').match(
    /^(\d{4})\.\s*(\d{1,2})\.\s*(\d{1,2})\.\s*(\d{1,2}):(\d{2})$/,
  );
  if (!displayMatch) return null;

  const [, year, month, day, hour, minute] = displayMatch.map(Number);
  const timestamp = new Date(year, month - 1, day, hour, minute).getTime();
  return Number.isNaN(timestamp) ? null : timestamp;
};

const compareCasesByReportDate = (left, right, sortOrder) => {
  const sourcePriority = (SOURCE_PRIORITY[left.__source] ?? 2)
    - (SOURCE_PRIORITY[right.__source] ?? 2);
  if (sourcePriority) return sourcePriority;

  const leftTimestamp = getReportTimestamp(left);
  const rightTimestamp = getReportTimestamp(right);
  if (leftTimestamp === null && rightTimestamp !== null) return 1;
  if (leftTimestamp !== null && rightTimestamp === null) return -1;
  if (leftTimestamp !== rightTimestamp) {
    return sortOrder === 'oldest'
      ? leftTimestamp - rightTimestamp
      : rightTimestamp - leftTimestamp;
  }

  return getItemFrontendKey(left).localeCompare(getItemFrontendKey(right));
};

const getReviewGrade = (analysis, item) => {
  const currentGrade =
    analysis?.reviewedGrade
    || analysis?.result?.recommendedGrade
    || item?.damage
    || '';

  const gradeCode = String(currentGrade)
    .match(/DS[0-4]/i)?.[0]
    ?.toUpperCase();

  if (gradeCode) {
    return (
      DAMAGE_GRADE_OPTIONS.find(
        (grade) => grade.startsWith(gradeCode),
      )
      || currentGrade
    );
  }

  if (String(currentGrade).includes('전파')) {
    return DAMAGE_GRADE_OPTIONS[4];
  }

  if (String(currentGrade).includes('반파')) {
    return DAMAGE_GRADE_OPTIONS[3];
  }

  if (String(currentGrade).includes('경미')) {
    return DAMAGE_GRADE_OPTIONS[1];
  }

  return DAMAGE_GRADE_OPTIONS[2];
};

const getHeldReviewDestination = (grade) => {
  const gradeCode = String(grade)
    .match(/DS[0-4]/i)?.[0]
    ?.toUpperCase();

  if (isZeroSupportGrade(gradeCode)) {
    return {
      stage: 4,
      path: 'support',
      label: '지원금 심사',
    };
  }

  return {
    stage: 3,
    path: 'severity',
    label: '복구 긴급도',
  };
};

const HeldReviewModal = ({
  record,
  onClose,
  onConfirm,
  submitting = false,
  submitError = '',
}) => {
  const { item, analysis } = record;

  const [grade, setGrade] = useState(
    () => getReviewGrade(analysis, item),
  );

  const [reason, setReason] = useState('');
  const [fieldVisitConfirmed, setFieldVisitConfirmed] =
    useState(false);
  const [formError, setFormError] = useState('');

  const destination = getHeldReviewDestination(grade);

  const checkboxId = `field-visit-confirm-${getItemFrontendKey(item)}`;

  const checkboxDescriptionId =
    `${checkboxId}-description`;

  const submit = () => {
    if (!fieldVisitConfirmed) {
      setFormError(
        '현장 방문 및 피해 상태 재확인 완료 여부를 확인해 주세요.',
      );
      return;
    }

    if (!reason.trim()) {
      setFormError(
        '현장 확인 결과와 등급 재판정 사유를 입력해 주세요.',
      );
      return;
    }

    onConfirm({
      grade,
      reason: reason.trim(),
    });
  };

  return createPortal(
    <div
      className="case-modal-backdrop"
      role="presentation"
    >
      <section
        className="case-modal decision-modal held-review-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="held-review-modal-title"
      >
        <header>
          <div>
            <p>보류 사건 현장 확인</p>

            <h2 id="held-review-modal-title">
              피해등급 재판정
            </h2>
          </div>

          <button
            type="button"
            className="modal-close"
            onClick={onClose}
            aria-label="닫기"
          >
            ×
          </button>
        </header>

        <dl className="hold-review-summary">
          <div>
            <dt>사건번호</dt>
            <dd>{item.case_number}</dd>
          </div>

          <div>
            <dt>신고자</dt>
            <dd>{item.reporter}</dd>
          </div>

          <div className="full">
            <dt>피해 위치</dt>
            <dd>{item.address}</dd>
          </div>

          <div className="full">
            <dt>기존 보류 사유</dt>
            <dd>
              {analysis?.holdReason
                || analysis?.reviewReason
                || '등록된 보류 사유가 없습니다.'}
            </dd>
          </div>
        </dl>

        <div className="decision-form">
          <label>
            현장 확인 피해등급
            {' '}
            <span className="required-mark">
              필수
            </span>

            <select
              value={grade}
              onChange={(event) => {
                setGrade(event.target.value);
                setFormError('');
              }}
            >
              {DAMAGE_GRADE_OPTIONS.map((option) => (
                <option
                  key={option}
                  value={option}
                >
                  {option}
                </option>
              ))}
            </select>
          </label>

          <label>
            등급 재판정 사유
            {' '}
            <span className="required-mark">
              필수
            </span>

            <textarea
              value={reason}
              onChange={(event) => {
                setReason(event.target.value);
                setFormError('');
              }}
              placeholder="현장 방문에서 확인한 피해 범위와 등급 변경 근거를 입력해 주세요."
            />
          </label>

          <div className="fieldset held-review-checklist">
            <div className="form-group">
              <div className="form-conts">
                <div className="krds-check-area chk-column">
                  <div className="krds-form-check">
                    <input
                      type="checkbox"
                      id={checkboxId}
                      checked={fieldVisitConfirmed}
                      aria-describedby={
                        checkboxDescriptionId
                      }
                      onChange={(event) => {
                        setFieldVisitConfirmed(
                          event.target.checked,
                        );
                        setFormError('');
                      }}
                    />

                    <label htmlFor={checkboxId}>
                      현장 방문 및 피해 상태 재확인 완료
                    </label>

                    <div className="krds-form-check-cnt">
                      <p
                        className="krds-form-check-p"
                        id={checkboxDescriptionId}
                      >
                        확인하면 선택한
                        {' '}
                        {grade.split(' · ')[0]}
                        {' '}
                        등급에 따라
                        {' '}
                        {destination.label}
                        {' '}
                        단계로 이동합니다.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {(formError || submitError) && (
          <p
            className="form-error"
            role="alert"
          >
            {formError || submitError}
          </p>
        )}

        <footer>
          <button
            type="button"
            className="secondary-action"
            onClick={onClose}
            disabled={submitting}
          >
            취소
          </button>

          <button
            type="button"
            className="primary-action"
            onClick={submit}
            disabled={submitting}
          >
            {submitting ? '저장 중...' : '확인'}
          </button>
        </footer>
      </section>
    </div>,
    document.body,
  );
};

const DisasterEventSelection = ({
  events,
  loading,
  error,
  onSelect,
}) => {
  const [eventSearch, setEventSearch] = useState('');
  const [eventPageSize, setEventPageSize] = useState(10);
  const [eventSortOrder, setEventSortOrder] =
    useState('latest');
  const [eventPage, setEventPage] = useState(1);

  const filteredEvents = useMemo(() => {
    const term = eventSearch.trim().toLowerCase();

    return [...events]
      .filter((event) => {
        const searchText = (
          `${event.year} `
          + `${event.name} `
          + `${event.deadlinePeriod} `
          + `${event.status}`
        ).toLowerCase();

        return !term || searchText.includes(term);
      })
      .sort((left, right) => (
        eventSortOrder === 'latest'
          ? right.startAt - left.startAt
          : left.startAt - right.startAt
      ));
  }, [
    eventSearch,
    eventSortOrder,
    events,
  ]);

  const eventTotalPages = Math.max(
    1,
    Math.ceil(
      filteredEvents.length / eventPageSize,
    ),
  );

  const visibleEvents = filteredEvents.slice(
    (eventPage - 1) * eventPageSize,
    eventPage * eventPageSize,
  );

  return (
    <div className="case-page disaster-selection-page">
      <section className="case-card disaster-event-card">
        <div className="report-management-toolbar">
          <label>
            신고 목록 검색

            <input
              value={eventSearch}
              onChange={(event) => {
                setEventSearch(event.target.value);
                setEventPage(1);
              }}
              placeholder="년도, 재해명, 마감 기간 검색"
            />
          </label>

          <p className="report-management-count">
            총
            {' '}
            <strong>
              {filteredEvents.length}
            </strong>
            건
          </p>
        </div>

        <div className="krds-structured-report-list">
          <div className="report-list-controls filter-only-list-controls">
            <div className="report-sort-controls">
              <label>
                목록 표시 개수

                <select
                  value={eventPageSize}
                  onChange={(event) => {
                    setEventPageSize(
                      Number(event.target.value),
                    );
                    setEventPage(1);
                  }}
                >
                  {EVENT_PAGE_SIZE_OPTIONS.map(
                    (size) => (
                      <option
                        key={size}
                        value={size}
                      >
                        {size}개
                      </option>
                    ),
                  )}
                </select>
              </label>

              <div
                className="report-sort-buttons"
                aria-label="정렬 기준"
              >
                <span>정렬기준</span>

                <button
                  type="button"
                  className={
                    eventSortOrder === 'latest'
                      ? 'active'
                      : ''
                  }
                  onClick={() => {
                    setEventSortOrder('latest');
                    setEventPage(1);
                  }}
                >
                  최신순
                </button>

                <button
                  type="button"
                  className={
                    eventSortOrder === 'oldest'
                      ? 'active'
                      : ''
                  }
                  onClick={() => {
                    setEventSortOrder('oldest');
                    setEventPage(1);
                  }}
                >
                  오래된순
                </button>
              </div>

              <label className="report-mobile-sort">
                정렬기준

                <select
                  value={eventSortOrder}
                  onChange={(event) => {
                    setEventSortOrder(
                      event.target.value,
                    );
                    setEventPage(1);
                  }}
                >
                  <option value="latest">
                    최신순
                  </option>

                  <option value="oldest">
                    오래된순
                  </option>
                </select>
              </label>
            </div>
          </div>

          {loading && (
            <p className="empty-case">
              신고 목록을 불러오는 중입니다.
            </p>
          )}

          {error && (
            <p className="empty-case">
              {error}
            </p>
          )}

          {!loading && !error && (
            <div className="disaster-event-table-wrap">
              <table className="disaster-event-table">
                <thead>
                  <tr>
                    <th>년도</th>
                    <th>재해명</th>
                    <th>마감 기간</th>
                    <th>신고</th>
                    <th aria-label="신고목록 보기" />
                  </tr>
                </thead>

                <tbody>
                  {visibleEvents.map((event) => (
                    <tr key={event.id}>
                      <td>
                        <strong>
                          {event.year}
                        </strong>
                      </td>

                      <td>
                        <strong>
                          {event.name}
                        </strong>

                        <span
                          className={
                            `event-status ${event.status}`
                          }
                        >
                          {event.status}
                        </span>
                      </td>

                      <td>
                        {event.deadlinePeriod}
                      </td>

                      <td>
                        <b className="event-case-count">
                          {event.reportCount}건
                        </b>
                      </td>

                      <td>
                        <button
                          type="button"
                          className="event-select-button"
                          onClick={() => onSelect(event)}
                        >
                          신고목록 보기
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {!visibleEvents.length && (
                <p className="empty-case">
                  조건에 맞는 신고 목록이 없습니다.
                </p>
              )}
            </div>
          )}

          {!loading
            && !error
            && eventTotalPages > 1
            && (
              <nav
                className="krds-report-pagination"
                aria-label="자연재난 신고 목록 페이지"
              >
                <button
                  type="button"
                  className="page-navi"
                  disabled={eventPage === 1}
                  onClick={() => {
                    setEventPage(
                      (current) => current - 1,
                    );
                  }}
                >
                  이전
                </button>

                <div>
                  {Array.from(
                    { length: eventTotalPages },
                    (_, index) => index + 1,
                  ).map((pageNumber) => (
                    <button
                      type="button"
                      key={pageNumber}
                      className={
                        eventPage === pageNumber
                          ? 'active'
                          : ''
                      }
                      onClick={() => {
                        setEventPage(pageNumber);
                      }}
                    >
                      <span className="sr-only">
                        {eventPage === pageNumber
                          ? '현재 페이지 '
                          : ''}
                      </span>

                      {pageNumber}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  className="page-navi"
                  disabled={
                    eventPage === eventTotalPages
                  }
                  onClick={() => {
                    setEventPage(
                      (current) => current + 1,
                    );
                  }}
                >
                  다음
                </button>
              </nav>
            )}
        </div>
      </section>
    </div>
  );
};

const CaseListPage = () => {
  const navigate = useNavigate();

  const [
    searchParams,
    setSearchParams,
  ] = useSearchParams();

  const analyses = useAnalysisStore(
    (state) => state.analyses,
  );

  const workflows = useWorkflowStore(
    (state) => state.workflows,
  );

  const cases = useCaseStore(
    (state) => state.cases,
  );

  const loading = useCaseStore(
    (state) => state.loading,
  );

  const error = useCaseStore(
    (state) => state.error,
  );

  const fetchCases = useCaseStore(
    (state) => state.fetchCases,
  );

  const confirmHeldReview = useAnalysisStore(
    (state) => state.confirmHeldReview,
  );

  const currentUser = useAuthStore((state) => state.user);

  const unlockStage = useWorkflowStore(
    (state) => state.unlockStage,
  );

  const [search, setSearch] = useState(() => searchParams.get('search') || '');
  const [status, setStatus] = useState(() => (
    STATUS_FILTERS.includes(searchParams.get('status')) ? searchParams.get('status') : '전체'
  ));
  const [facility, setFacility] = useState(() => (
    FACILITY_FILTERS.includes(searchParams.get('facility')) ? searchParams.get('facility') : '전체'
  ));
  const [sortOrder, setSortOrder] = useState(() => (
    ['newest', 'oldest'].includes(searchParams.get('sort')) ? searchParams.get('sort') : 'newest'
  ));
  const [page, setPage] = useState(() => {
    const requestedPage = Number(searchParams.get('page'));
    return Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  });

  const [
    heldReviewRecord,
    setHeldReviewRecord,
  ] = useState(null);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewSubmitError, setReviewSubmitError] = useState('');

  useEffect(() => {
    fetchCases({
      limit: 100,
      offset: 0,
    }).catch(() => {});
  }, [fetchCases]);

  const rangeFrom = searchParams.get('from') || DEFAULT_DISASTER_QUERY_RANGE.from;
  const rangeTo = searchParams.get('to') || DEFAULT_DISASTER_QUERY_RANGE.to;

  const events = useMemo(
    () => buildDisasterEvents(cases, { from: rangeFrom, to: rangeTo }),
    [cases, rangeFrom, rangeTo],
  );

  const selectedEventId = searchParams.get('historyId') || searchParams.get('event');
  const globalSearch = searchParams.get('search')?.trim() || '';
  const requestedDisasterType = searchParams.get('disasterType') || '';
  const requestedStartDate = searchParams.get('startDate') || '';
  const requestedEndDate = searchParams.get('endDate') || '';

  const selectedEvent = useMemo(() => (
    events.find((event) => event.id === selectedEventId)
    || (requestedStartDate && requestedEndDate ? {
      id: selectedEventId || 'disaster-period-filter',
      name: `${requestedDisasterType || '재난'} 신고`,
      label: requestedDisasterType || '재난',
      disasterType: requestedDisasterType,
      from: requestedStartDate,
      to: requestedEndDate,
      occurredPeriod: `${formatFilterDate(requestedStartDate)} ~ ${formatFilterDate(requestedEndDate)}`,
      deadlinePeriod: '-',
      status: '기간 조회',
      caseIds: [],
    } : null)
    || (globalSearch ? {
      id: 'all-search-results',
      name: '전체 재난 신고 검색 결과',
      occurredPeriod: '2025.8.12 ~ 2026.7.18',
      deadlinePeriod: '-',
      status: '진행중',
      caseIds: cases.map(getItemFrontendKey),
    } : null)
  ), [
    cases,
    events,
    globalSearch,
    requestedDisasterType,
    requestedEndDate,
    requestedStartDate,
    selectedEventId,
  ]);

  const activeDisasterFilter = useMemo(() => ({
    disasterType: requestedDisasterType || selectedEvent?.disasterType || '',
    startDate: requestedStartDate || selectedEvent?.from || '',
    endDate: requestedEndDate || selectedEvent?.to || '',
  }), [
    requestedDisasterType,
    requestedEndDate,
    requestedStartDate,
    selectedEvent,
  ]);

  /*
   * selectedEvent가 아직 없을 때도
   * status를 읽다가 화면이 중단되지 않도록 처리합니다.
   */
  const eventCases = useMemo(() => {
    if (!selectedEvent) {
      return [];
    }

    if (selectedEvent.id === 'all-search-results') return cases;

    return filterCasesByDisasterPeriod(cases, activeDisasterFilter);
  }, [
    activeDisasterFilter,
    cases,
    selectedEvent,
  ]);

  const filtered = useMemo(
    () => eventCases.filter((item) => {
      const itemCaseId = getItemCaseId(item);

      const reviewStatus =
        analyses[itemCaseId]?.reviewStatus;

      const approvalStatus =
        workflows[itemCaseId]?.approvalStatus;

      const listStatus = getListStatus(item, reviewStatus, approvalStatus);

      const matchesStatus = matchesStatusFilter(listStatus, status);

      const matchesFacility =
        facility === '전체'
        || item.facility === facility;

      const keyword = (
        `${item.case_number ?? ''} `
        + `${item.reporter ?? ''} `
        + `${item.address ?? ''}`
      ).toLowerCase();

      return (
        matchesStatus
        && matchesFacility
        && keyword.includes(
          search.trim().toLowerCase(),
        )
      );
    }),
    [
      analyses,
      eventCases,
      facility,
      search,
      status,
      workflows,
    ],
  );

  const sorted = useMemo(
    () => [...filtered].sort((left, right) => (
      compareCasesByReportDate(left, right, sortOrder)
    )),
    [filtered, sortOrder],
  );

  const totalPages = Math.max(
    1,
    Math.ceil(sorted.length / PAGE_SIZE),
  );
  const pageGroupStart = Math.floor((page - 1) / 10) * 10 + 1;
  const visiblePageNumbers = Array.from(
    { length: Math.min(10, totalPages - pageGroupStart + 1) },
    (_, index) => pageGroupStart + index,
  );

  const rows = sorted.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  );

  useEffect(() => {
    const nextParams = new URLSearchParams(searchParams);
    const setOptionalParam = (key, value, defaultValue) => {
      if (!value || value === defaultValue) nextParams.delete(key);
      else nextParams.set(key, String(value));
    };

    setOptionalParam('search', search.trim(), '');
    setOptionalParam('status', status, '전체');
    setOptionalParam('facility', facility, '전체');
    setOptionalParam('sort', sortOrder, 'newest');
    setOptionalParam('page', page, 1);

    if (nextParams.toString() !== searchParams.toString()) {
      setSearchParams(nextParams, { replace: true });
    }
  }, [facility, page, search, searchParams, setSearchParams, sortOrder, status]);

  const resetFilters = () => {
    setSearch('');
    setStatus('전체');
    setFacility('전체');
    setSortOrder('newest');
    setPage(1);
  };

  const openCase = (item) => {
    const itemCaseId = getItemCaseId(item);

    const itemAnalysis =
      analyses[itemCaseId];

    if (
      itemAnalysis?.reviewStatus === '보류'
      && !itemAnalysis?.holdFieldVerified
    ) {
      setHeldReviewRecord({
        item,
        analysis: itemAnalysis,
      });

      return;
    }

    const listSearch = searchParams.toString();
    const caseListPath = `/cases${listSearch ? `?${listSearch}` : ''}`;

    navigate(`/cases/${itemCaseId}`, {
      state: { caseListPath },
    });
  };

  const completeHeldReview = async (review) => {
    if (!heldReviewRecord?.item) {
      return;
    }

    const heldCaseId = getItemCaseId(heldReviewRecord.item);

    const destination =
      getHeldReviewDestination(review.grade);

    const reviewerId = currentUser?.id ?? currentUser?.user_id;
    if (!reviewerId) {
      setReviewSubmitError('로그인한 담당자 정보를 확인할 수 없습니다.');
      return;
    }

    setReviewSubmitting(true);
    setReviewSubmitError('');

    try {
      await submitDamageGradeReview(heldCaseId, review, reviewerId);

      confirmHeldReview(
        heldCaseId,
        review,
      );

      unlockStage(
        heldCaseId,
        destination.stage,
      );

      setHeldReviewRecord(null);

      navigate(
        `/cases/${heldCaseId}/${destination.path}`,
      );
    } catch (requestError) {
      setReviewSubmitError(
        requestError.message || '피해등급 재판정 저장에 실패했습니다.',
      );
    } finally {
      setReviewSubmitting(false);
    }
  };

  if (!selectedEvent) {
    return (
      <DisasterEventSelection
        events={events}
        loading={loading}
        error={error}
        onSelect={(event) => {
          const nextParams = new URLSearchParams(searchParams);
          nextParams.set('event', event.id);
          nextParams.set('historyId', event.id);
          nextParams.set('disasterType', event.label);
          nextParams.set('startDate', event.from);
          nextParams.set('endDate', event.to);
          nextParams.delete('search');
          nextParams.delete('status');
          nextParams.delete('facility');
          nextParams.delete('sort');
          nextParams.delete('page');
          setSearchParams(nextParams);
        }}
      />
    );
  }

  return (
    <div className="case-page event-case-list-page">
      <header className="case-page-head">
        <div>
          <p>
            자연재난 선택 / 신고목록
          </p>

          <h1>
            {activeDisasterFilter.startDate && activeDisasterFilter.endDate
              ? `${selectedEvent.label || selectedEvent.name} · ${formatFilterDate(activeDisasterFilter.startDate)} ~ ${formatFilterDate(activeDisasterFilter.endDate)}`
              : selectedEvent.name}
          </h1>
        </div>

        <button
          type="button"
          className="secondary-action"
          onClick={() => {
            resetFilters();
            const nextParams = new URLSearchParams(searchParams);
            nextParams.delete('event');
            nextParams.delete('historyId');
            nextParams.delete('disasterType');
            nextParams.delete('startDate');
            nextParams.delete('endDate');
            nextParams.delete('search');
            setSearchParams(nextParams);
          }}
        >
          ← 자연재난 다시 선택
        </button>
      </header>

      <section
        className="event-selection-summary"
        aria-label="선택한 자연재난"
      >
        <dl>
          <div>
            <dt>재해 발생 기간</dt>
            <dd>
              {selectedEvent.occurredPeriod}
            </dd>
          </div>

          <div>
            <dt>마감 기간</dt>
            <dd>
              {selectedEvent.deadlinePeriod}
            </dd>
          </div>

          <div>
            <dt>진행 상태</dt>

            <dd>
              <span
                className={
                  `event-status ${selectedEvent.status}`
                }
              >
                {selectedEvent.status}
              </span>
            </dd>
          </div>

          <div>
            <dt>신고 건수</dt>
            <dd>{eventCases.length}건</dd>
          </div>
        </dl>
      </section>

      <section className="case-card list-filter">
        <div className="filter-grid">
          <label>
            검색

            <input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="사건번호, 신고자, 위치 검색"
            />
          </label>

          <label>
            처리 상태

            <select
              value={status}
              onChange={(event) => {
                setStatus(event.target.value);
                setPage(1);
              }}
            >
              {STATUS_FILTERS.map((value) => (
                <option
                  key={value}
                  value={value}
                >
                  {value}
                </option>
              ))}
            </select>
          </label>

          <label>
            시설 유형

            <select
              value={facility}
              onChange={(event) => {
                setFacility(event.target.value);
                setPage(1);
              }}
            >
              {FACILITY_FILTERS.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>

          <label>
            정렬 기준

            <select
              value={sortOrder}
              onChange={(event) => {
                setSortOrder(event.target.value);
                setPage(1);
              }}
            >
              <option value="newest">신고일 최신순</option>
              <option value="oldest">신고일 오래된순</option>
            </select>
          </label>

          <button
            type="button"
            className="filter-reset"
            onClick={resetFilters}
          >
            초기화
          </button>
        </div>
      </section>

      <section className="case-card">
        <div className="list-title">
          <div>
            <h2>신고 목록</h2>

            <span>
              조회 결과
              {' '}
              <b>{filtered.length}</b>
              건
            </span>
          </div>
        </div>

        <div className="case-table-wrap">
          <table className="case-table case-list-table">
            <thead>
              <tr>
                <th>사건번호 / 신고일시</th>
                <th>피해 위치</th>
                <th>신고자</th>
                <th>시설 유형</th>
                <th>상태</th>
              </tr>
            </thead>

            <tbody>
              {rows.map((item) => {
                const itemCaseId = getItemCaseId(item);

                const reviewStatus =
                  analyses[itemCaseId]?.reviewStatus;

                const approvalStatus =
                  workflows[itemCaseId]?.approvalStatus;

                const listStatus = getListStatus(item, reviewStatus, approvalStatus);

                return (
                  <tr
                    key={getItemFrontendKey(item)}
                    className="clickable-row"
                    onClick={() => openCase(item)}
                  >
                    <td>
                      <strong>
                        {item.case_number}
                      </strong>

                      <small>
                        {item.reportedAt}
                      </small>
                    </td>

                    <td>
                      {item.address}
                    </td>

                    <td>
                      {item.reporter}
                    </td>

                    <td>
                      {item.facility}
                    </td>

                    <td>
                      <span
                        className={
                          `status-badge ${listStatus}`
                        }
                      >
                        {listStatus}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {!rows.length && (
            <p className="empty-case">
              선택한 재난에 등록된 신고가 없습니다.
            </p>
          )}
        </div>

        {totalPages > 1 && (
          <nav
            className="pagination"
            aria-label="목록 페이지"
          >
            <button
              type="button"
              disabled={page === 1}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
            >
              이전
            </button>
            {visiblePageNumbers.map((pageNumber) => (
              <button
                type="button"
                key={pageNumber}
                className={
                  page === pageNumber
                    ? 'current'
                    : ''
                }
                onClick={() => {
                  setPage(pageNumber);
                }}
              >
                {pageNumber}
              </button>
            ))}
            <button
              type="button"
              disabled={page === totalPages}
              onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
            >
              다음
            </button>
          </nav>
        )}
      </section>

      {heldReviewRecord && (
        <HeldReviewModal
          record={heldReviewRecord}
          onClose={() => {
            if (reviewSubmitting) return;
            setHeldReviewRecord(null);
            setReviewSubmitError('');
          }}
          onConfirm={completeHeldReview}
          submitting={reviewSubmitting}
          submitError={reviewSubmitError}
        />
      )}
    </div>
  );
};

export default CaseListPage;
