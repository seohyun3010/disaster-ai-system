import { useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { DISASTER_EVENTS, isCaseInDisasterEvent } from '../mocks/disasterEvents';
import { useAnalysisStore } from '../stores/analysisStore';
import { useCaseStore } from '../stores/caseStore';
import { useWorkflowStore } from '../stores/workflowStore';
import './case-list.css';

const PAGE_SIZE = 5;
const FACILITY_TYPES = ['전체', '주택', '상가', '도로', '교량', '농경지', '공장·창고', '공공시설', '학교·병원', '하천·제방', '상하수도', '전기·통신시설', '농축산시설', '기타'];
const DAMAGE_GRADES = ['전파', '반파', '부분 파손', '침수', '경미'];
const COMPLETED_STATUSES = ['AI 분석 완료', '처리 완료', '최종 승인'];
const FINAL_APPROVED_STATUSES = ['최종 승인', '금액 수정 후 승인'];
const STATUS_FILTERS = ['전체', '완료', '미완료', '보류'];

const getSimpleStatus = (caseStatus, reviewStatus, approvalStatus) => {
  if (FINAL_APPROVED_STATUSES.includes(approvalStatus)) return '완료';
  if (reviewStatus === '보류') return '보류';
  return COMPLETED_STATUSES.includes(caseStatus) ? '완료' : '미완료';
};

const FacilityFilter = ({ value, onChange }) => {
  const detailsRef = useRef(null);
  const selectFacility = (facility) => {
    onChange(facility);
    detailsRef.current?.removeAttribute('open');
  };

  return <div className="scroll-select-field">
    <span>시설 유형</span>
    <details ref={detailsRef} onBlur={(event) => {
      if (!event.currentTarget.contains(event.relatedTarget)) event.currentTarget.removeAttribute('open');
    }}>
      <summary aria-label={`시설 유형, 현재 선택 ${value}`}>{value}</summary>
      <div className="scroll-select-options" role="listbox" aria-label="시설 유형">
        {FACILITY_TYPES.map((facility) => <button type="button" role="option" aria-selected={value === facility} className={value === facility ? 'selected' : ''} key={facility} onClick={() => selectFacility(facility)}>{facility}</button>)}
      </div>
    </details>
  </div>;
};

const DisasterEventSelection = ({ cases, onSelect }) => <div className="case-page disaster-selection-page">
  <section className="case-card disaster-event-card">
    <div className="disaster-event-table-wrap">
      <table className="disaster-event-table">
        <thead><tr><th>년도</th><th>재해명</th><th>신고 기한</th><th>신고</th><th /></tr></thead>
        <tbody>
          {DISASTER_EVENTS.map((event) => {
            const linkedCount = cases.filter((item) => isCaseInDisasterEvent(item, event)).length;
            const count = event.reportCount ?? linkedCount;
            return <tr key={event.id}>
              <td><strong>{event.year}</strong></td>
              <td><strong>{event.name}</strong><span className={`event-status ${event.status}`}>{event.status}</span></td>
              <td>{event.filingDeadline}</td>
              <td><b className="event-case-count">{count}건</b></td>
              <td><button type="button" className="event-select-button" onClick={() => onSelect(event.id)} aria-label={`${event.name} 신고목록 보기`}>신고목록 보기</button></td>
            </tr>;
          })}
        </tbody>
      </table>
    </div>
  </section>
</div>;

const CaseListPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const cases = useCaseStore((state) => state.cases);
  const analyses = useAnalysisStore((state) => state.analyses);
  const confirmHeldReview = useAnalysisStore((state) => state.confirmHeldReview);
  const workflows = useWorkflowStore((state) => state.workflows);
  const selectedEventId = searchParams.get('event');
  const selectedEvent = DISASTER_EVENTS.find((event) => event.id === selectedEventId);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('전체');
  const [facility, setFacility] = useState('전체');
  const [page, setPage] = useState(1);
  const [heldCase, setHeldCase] = useState(null);
  const [fieldGrade, setFieldGrade] = useState('반파');
  const [fieldReason, setFieldReason] = useState('');
  const [fieldError, setFieldError] = useState('');

  const eventCases = useMemo(() => selectedEvent
    ? cases.filter((item) => isCaseInDisasterEvent(item, selectedEvent))
    : [], [cases, selectedEvent]);

  const filtered = useMemo(() => eventCases.filter((item) => {
    const simpleStatus = getSimpleStatus(
      item.status,
      analyses[item.id]?.reviewStatus,
      workflows[item.id]?.approvalStatus,
    );
    const matchesStatus = status === '전체' || simpleStatus === status;
    const matchesFacility = facility === '전체' || item.facility === facility;
    const keyword = `${item.id} ${item.reporter} ${item.location}`.toLowerCase();
    return matchesStatus && matchesFacility && keyword.includes(search.trim().toLowerCase());
  }), [analyses, eventCases, facility, search, status, workflows]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const rows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const resetFilters = () => {
    setSearch('');
    setStatus('전체');
    setFacility('전체');
    setPage(1);
  };
  const selectEvent = (eventId) => {
    resetFilters();
    setSearchParams({ event: eventId });
  };
  const clearEvent = () => {
    resetFilters();
    setSearchParams({});
  };
  const openCase = (item) => {
    const caseAnalysis = analyses[item.id];
    if (caseAnalysis?.reviewStatus !== '보류') {
      navigate(`/cases/${item.id}`);
      return;
    }
    if (caseAnalysis.holdFieldVerified) {
      navigate(`/cases/${item.id}/severity`);
      return;
    }

    setHeldCase(item);
    setFieldGrade(caseAnalysis.reviewedGrade || caseAnalysis.result?.recommendedGrade || item.damage || '반파');
    setFieldReason('');
    setFieldError('');
  };
  const closeHeldCase = () => {
    setHeldCase(null);
    setFieldReason('');
    setFieldError('');
  };
  const completeFieldReview = () => {
    if (!fieldReason.trim()) {
      setFieldError('현장 확인 및 수정 사유를 입력해 주세요.');
      return;
    }

    confirmHeldReview(heldCase.id, {
      grade: fieldGrade,
      reason: fieldReason.trim(),
    });
    const targetCaseId = heldCase.id;
    closeHeldCase();
    navigate(`/cases/${targetCaseId}/severity`);
  };

  if (!selectedEvent) return <DisasterEventSelection cases={cases} onSelect={selectEvent} />;

  return <div className="case-page event-case-list-page">
    <header className="case-page-head">
      <div><p>자연재난 선택 / 신고목록</p><h1>{selectedEvent.name}</h1></div>
      <button type="button" className="secondary-action" onClick={clearEvent}>← 자연재난 다시 선택</button>
    </header>

    <section className="event-selection-summary" aria-label="선택한 자연재난">
      <dl>
        <div><dt>재난 기간</dt><dd>{selectedEvent.period}</dd></div>
        <div><dt>신고 기한</dt><dd>{selectedEvent.filingDeadline}</dd></div>
        <div><dt>진행 상태</dt><dd><span className={`event-status ${selectedEvent.status}`}>{selectedEvent.status}</span></dd></div>
        <div><dt>신고 건수</dt><dd>{eventCases.length}건</dd></div>
      </dl>
    </section>

    <section className="case-card list-filter">
      <div className="filter-grid">
        <label>검색<input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="사건번호, 신고자, 위치 검색" /></label>
        <label>처리 상태<select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }}>{STATUS_FILTERS.map((value) => <option key={value}>{value}</option>)}</select></label>
        <FacilityFilter value={facility} onChange={(value) => { setFacility(value); setPage(1); }} />
        <button type="button" className="filter-reset" onClick={resetFilters}>초기화</button>
      </div>
    </section>

    <section className="case-card">
      <div className="list-title"><div><h2>신고 목록</h2><span>총 <b>{filtered.length}</b>건</span></div></div>
      <div className="case-table-wrap">
        <table className="case-table case-list-table">
          <thead><tr><th>사건번호 / 신고일시</th><th>피해 위치</th><th>신고자</th><th>시설 유형</th><th>상태</th></tr></thead>
          <tbody>{rows.map((item) => {
            const simpleStatus = getSimpleStatus(
              item.status,
              analyses[item.id]?.reviewStatus,
              workflows[item.id]?.approvalStatus,
            );
            return <tr key={item.id} className="clickable-row" onClick={() => openCase(item)}>
              <td><strong>{item.id}</strong><small>{item.reportedAt}</small></td>
              <td>{item.location}</td>
              <td>{item.reporter}</td>
              <td>{item.facility}</td>
              <td><span className={`status-badge ${simpleStatus}`}>{simpleStatus}</span></td>
            </tr>;
          })}</tbody>
        </table>
        {!rows.length && <p className="empty-case">선택한 재난에 등록된 신고가 없습니다.</p>}
      </div>
      {totalPages > 1 && <nav className="pagination" aria-label="목록 페이지">{Array.from({ length: totalPages }, (_, index) => <button type="button" key={index + 1} className={page === index + 1 ? 'current' : ''} onClick={() => setPage(index + 1)}>{index + 1}</button>)}</nav>}
    </section>
    {heldCase && createPortal(<div className="case-modal-backdrop" role="presentation">
      <section className="case-modal held-review-modal" role="dialog" aria-modal="true" aria-labelledby="held-review-title">
        <header>
          <div><p>보류 건 현장 확인</p><h2 id="held-review-title">현장 방문 확인 보고</h2></div>
          <button type="button" className="modal-close" onClick={closeHeldCase} aria-label="닫기">×</button>
        </header>
        <dl className="hold-review-summary">
          <div><dt>사건번호</dt><dd>{heldCase.id}</dd></div>
          <div><dt>피해 위치</dt><dd>{heldCase.location}</dd></div>
          <div className="full"><dt>기존 보류 사유</dt><dd>{analyses[heldCase.id]?.holdReason || analyses[heldCase.id]?.reviewReason}</dd></div>
        </dl>
        <div className="decision-form">
          <label>현장 확인 피해등급
            <select value={fieldGrade} onChange={(event) => setFieldGrade(event.target.value)}>
              {DAMAGE_GRADES.map((grade) => <option key={grade}>{grade}</option>)}
            </select>
          </label>
          <label>현장 확인 및 수정 사유 <span className="required-mark">필수</span>
            <textarea
              value={fieldReason}
              onChange={(event) => { setFieldReason(event.target.value); setFieldError(''); }}
              placeholder="예: 현장 방문 결과 전파가 아닌 반파로 판단한 근거와 확인 내용을 입력해 주세요."
            />
          </label>
          <p className="reason-hint">확인하면 보류가 해제되고 복구 긴급도 단계로 이동합니다.</p>
        </div>
        {fieldError && <p className="form-error" role="alert">{fieldError}</p>}
        <footer>
          <button type="button" className="secondary-action" onClick={closeHeldCase}>취소</button>
          <button type="button" className="primary-action" onClick={completeFieldReview}>확인</button>
        </footer>
      </section>
    </div>, document.body)}
  </div>;
};

export default CaseListPage;
