import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCaseStore } from '../stores/caseStore';

const PAGE_SIZE = 5;
const DISASTER_TYPES = ['집중호우', '산사태', '지진', '태풍', '낙뢰', '가뭄', '기타'];
const FACILITY_TYPES = ['주택', '상가', '농경지', '도로', '공공시설', '기타'];
const EMPTY_FORM = { reporter: '', type: '', facility: '', location: '', photo: null };

const CaseListPage = () => {
  const navigate = useNavigate();
  const cases = useCaseStore((state) => state.cases);
  const addCase = useCaseStore((state) => state.addCase);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('전체');
  const [type, setType] = useState('전체');
  const [page, setPage] = useState(1);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const filtered = useMemo(() => cases.filter((item) => (status === '전체' || item.status === status) && (type === '전체' || item.type === type) && `${item.id} ${item.reporter} ${item.location}`.toLowerCase().includes(search.toLowerCase())), [cases, search, status, type]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const rows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const updateFilter = (setter) => (event) => { setter(event.target.value); setPage(1); };
  const closeForm = () => { setIsFormOpen(false); setForm(EMPTY_FORM); setFormError(''); };

  const submitCase = (event) => {
    event.preventDefault();
    if (!form.reporter.trim() || !form.type || !form.facility || !form.location.trim() || !form.photo) {
      setFormError('신고자, 재난 유형, 시설 유형, 피해 위치, 사진을 모두 입력해 주세요.');
      return;
    }
    const created = addCase({ reporter: form.reporter.trim(), type: form.type, facility: form.facility, location: form.location.trim(), photoName: form.photo.name, photoUrl: URL.createObjectURL(form.photo) });
    closeForm();
    navigate(`/cases/${created.id}`);
  };

  return <div className="case-page">
    <header className="case-page-head"><div><p>신고 관리 / 신고 목록</p><h1>재해 신고 목록</h1><span>접수된 재해 신고를 검색하고 처리 상태별로 관리합니다.</span></div><button type="button" className="primary-action" onClick={() => setIsFormOpen(true)}>+ 신고 추가</button></header>
    <section className="case-card list-filter"><div className="filter-grid"><label>검색<input value={search} onChange={updateFilter(setSearch)} placeholder="사건번호, 신고자, 위치 검색" /></label><label>처리 상태<select value={status} onChange={updateFilter(setStatus)}>{['전체', '접수 완료', '검토 필요', 'AI 분석 대기', 'AI 분석 완료', '현장 확인'].map((value) => <option key={value}>{value}</option>)}</select></label><label>재난 유형<select value={type} onChange={updateFilter(setType)}><option>전체</option>{DISASTER_TYPES.map((value) => <option key={value}>{value}</option>)}</select></label><button type="button" className="filter-reset" onClick={() => { setSearch(''); setStatus('전체'); setType('전체'); setPage(1); }}>초기화</button></div></section>
    <section className="case-card"><div className="list-title"><div><h2>신고 목록</h2><span>총 <b>{filtered.length}</b>건</span></div><p>긴급 신고와 중복 의심 신고는 별도 뱃지로 표시됩니다.</p></div><div className="case-table-wrap"><table className="case-table"><thead><tr><th>사건번호 / 신고일시</th><th>신고자</th><th>재난 유형</th><th>시설 유형</th><th>피해 위치</th><th>상태</th><th>긴급도</th><th>중복</th></tr></thead><tbody>{rows.map((item) => <tr key={item.id} className="clickable-row" onClick={() => navigate(`/cases/${item.id}`)}><td><strong>{item.id}</strong><small>{item.reportedAt}</small></td><td>{item.reporter}</td><td>{item.type}</td><td>{item.facility}</td><td>{item.location}</td><td><span className={`status-badge ${item.status.replaceAll(' ', '-')}`}>{item.status}</span></td><td><span className={`urgency-badge ${item.urgency}`}>{item.urgency}</span></td><td>{item.duplicate ? <span className="duplicate-badge">중복 의심</span> : '-'}</td></tr>)}</tbody></table>{!rows.length && <p className="empty-case">검색 조건에 맞는 신고가 없습니다.</p>}</div><nav className="pagination" aria-label="목록 페이지">{Array.from({ length: totalPages }, (_, index) => <button type="button" key={index + 1} className={page === index + 1 ? 'current' : ''} onClick={() => setPage(index + 1)}>{index + 1}</button>)}</nav></section>
    {isFormOpen && <div className="case-modal-backdrop" role="presentation"><section className="case-modal" role="dialog" aria-modal="true" aria-labelledby="case-form-title"><header><div><p>공무원 직접 등록</p><h2 id="case-form-title">재해 신고 추가</h2></div><button type="button" className="modal-close" onClick={closeForm} aria-label="닫기">×</button></header><p className="form-guide">사건번호와 신고일시는 등록 완료 시 자동으로 생성됩니다.</p><form onSubmit={submitCase} className="case-form"><label>신고자<input value={form.reporter} onChange={(event) => setForm({ ...form, reporter: event.target.value })} placeholder="신고자 이름" autoFocus /></label><label>재난 유형<select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })}><option value="">선택하세요</option>{DISASTER_TYPES.map((value) => <option key={value}>{value}</option>)}</select></label><label>시설 유형<select value={form.facility} onChange={(event) => setForm({ ...form, facility: event.target.value })}><option value="">선택하세요</option>{FACILITY_TYPES.map((value) => <option key={value}>{value}</option>)}</select></label><label>피해 위치<input value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} placeholder="예: 충북 청주시 상당구" /></label><label className="photo-field">사진 등록<input type="file" accept="image/*" onChange={(event) => setForm({ ...form, photo: event.target.files?.[0] || null })} /><span>{form.photo ? form.photo.name : '현장 사진을 선택해 주세요.'}</span></label>{formError && <p className="form-error" role="alert">{formError}</p>}<footer><button type="button" className="secondary-action" onClick={closeForm}>취소</button><button type="submit" className="primary-action">신고 등록</button></footer></form></section></div>}
  </div>;
};

export default CaseListPage;
