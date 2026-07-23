import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCaseStore } from '../stores/caseStore';

const PAGE_SIZE = 5;
const DISASTER_TYPES = ['집중호우', '산사태', '지진', '태풍', '낙뢰', '가뭄', '기타'];
const FACILITY_TYPES = ['주택', '상가', '농경지', '도로', '공공시설', '기타'];
const EMPTY_FORM = { reporter: '', type: '', facility: '', location: '', description: '', photos: [] };

const readFiles = (fileList) => Promise.all([...fileList].map((file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve({ name: file.name, url: reader.result });
  reader.onerror = reject;
  reader.readAsDataURL(file);
})));

const CaseListPage = () => {
  const navigate = useNavigate();
  const cases = useCaseStore((state) => state.cases);
  const addCase = useCaseStore((state) => state.addCase);
  const updateCase = useCaseStore((state) => state.updateCase);
  const deleteCase = useCaseStore((state) => state.deleteCase);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('전체');
  const [type, setType] = useState('전체');
  const [page, setPage] = useState(1);
  const [form, setForm] = useState(null);
  const [formError, setFormError] = useState('');
  const filtered = useMemo(() => cases.filter((item) => (status === '전체' || item.status === status) && (type === '전체' || item.type === type) && `${item.id} ${item.reporter} ${item.location}`.toLowerCase().includes(search.toLowerCase())), [cases, search, status, type]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const rows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const isEditing = Boolean(form?.id);
  const closeForm = () => { setForm(null); setFormError(''); };
  const openAdd = () => { setForm(EMPTY_FORM); setFormError(''); };
  const openEdit = (event, item) => { event.stopPropagation(); setForm({ ...item, photos: item.photos || [] }); setFormError(''); };
  const changePhotos = async (event) => {
    const selected = event.target.files;
    if (!selected?.length) return;
    const additions = await readFiles(selected);
    setForm((current) => ({ ...current, photos: [...current.photos, ...additions] }));
  };
  const removePhoto = (index) => setForm((current) => ({ ...current, photos: current.photos.filter((_, photoIndex) => photoIndex !== index) }));
  const submitCase = (event) => {
    event.preventDefault();
    if (!form.reporter.trim() || !form.type || !form.facility || !form.location.trim()) { setFormError('신고자, 재난 유형, 시설 유형, 피해 위치를 모두 입력해 주세요.'); return; }
    if (!isEditing && !form.photos.length) { setFormError('신규 신고에는 피해 사진을 한 장 이상 등록해 주세요.'); return; }
    const payload = { reporter: form.reporter.trim(), type: form.type, facility: form.facility, location: form.location.trim(), description: form.description.trim(), photos: form.photos };
    if (isEditing) { updateCase(form.id, payload); closeForm(); } else { const created = addCase(payload); closeForm(); navigate(`/cases/${created.id}`); }
  };
  const removeCase = (event, item) => { event.stopPropagation(); if (window.confirm(`${item.id} 신고를 삭제할까요?`)) { deleteCase(item.id); setPage(1); } };

  return <div className="case-page">
    <header className="case-page-head"><div><p>신고 관리 / 신고 목록</p><h1>재해 신고 목록</h1><span>접수된 재해 신고를 검색하고 처리 상태별로 관리합니다.</span></div><div className="case-page-head-actions"><button type="button" className="secondary-action" onClick={() => navigate('/safety24-integration')}>국민안전24 신고서 연동</button><button type="button" className="primary-action" onClick={openAdd}>+ 신고 추가</button></div></header>
    <section className="case-card list-filter"><div className="filter-grid"><label>검색<input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="사건번호, 신고자, 위치 검색" /></label><label>처리 상태<select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }}>{['전체', '접수 완료', '검토 필요', 'AI 분석 대기', 'AI 분석 완료', '현장 확인'].map((value) => <option key={value}>{value}</option>)}</select></label><label>재난 유형<select value={type} onChange={(event) => { setType(event.target.value); setPage(1); }}><option>전체</option>{DISASTER_TYPES.map((value) => <option key={value}>{value}</option>)}</select></label><button type="button" className="filter-reset" onClick={() => { setSearch(''); setStatus('전체'); setType('전체'); setPage(1); }}>초기화</button></div></section>
    <section className="case-card"><div className="list-title"><div><h2>신고 목록</h2><span>총 <b>{filtered.length}</b>건</span></div><p>긴급 신고와 중복 의심 신고는 별도 뱃지로 표시됩니다.</p></div><div className="case-table-wrap"><table className="case-table"><thead><tr><th>사건번호 / 신고일시</th><th>신고자</th><th>재난 유형</th><th>시설 유형</th><th>피해 위치</th><th>상태</th><th>긴급도</th><th>중복</th><th>관리</th></tr></thead><tbody>{rows.map((item) => <tr key={item.id} className="clickable-row" onClick={() => navigate(`/cases/${item.id}`)}><td><strong>{item.id}</strong><small>{item.reportedAt}</small></td><td>{item.reporter}</td><td>{item.type}</td><td>{item.facility}</td><td>{item.location}</td><td><span className={`status-badge ${item.status.replaceAll(' ', '-')}`}>{item.status}</span></td><td><span className={`urgency-badge ${item.urgency}`}>{item.urgency}</span></td><td>{item.duplicate ? <span className="duplicate-badge">중복 의심</span> : '-'}</td><td><div className="table-actions"><button onClick={(event) => openEdit(event, item)}>수정</button><button className="delete" onClick={(event) => removeCase(event, item)}>삭제</button></div></td></tr>)}</tbody></table>{!rows.length && <p className="empty-case">검색 조건에 맞는 신고가 없습니다.</p>}</div><nav className="pagination" aria-label="목록 페이지">{Array.from({ length: totalPages }, (_, index) => <button type="button" key={index + 1} className={page === index + 1 ? 'current' : ''} onClick={() => setPage(index + 1)}>{index + 1}</button>)}</nav></section>
    {form && <div className="case-modal-backdrop" role="presentation"><section className="case-modal case-edit-modal" role="dialog" aria-modal="true" aria-labelledby="case-form-title"><header><div><p>공무원 직접 등록</p><h2 id="case-form-title">{isEditing ? '재해 신고 수정' : '재해 신고 추가'}</h2></div><button type="button" className="modal-close" onClick={closeForm} aria-label="닫기">×</button></header><p className="form-guide">{isEditing ? '사건번호와 신고일시는 유지되며, 수정된 내용은 즉시 반영됩니다.' : '사건번호와 신고일시는 등록 완료 시 자동으로 생성됩니다.'}</p><form onSubmit={submitCase} className="case-form"><label>신고자<input value={form.reporter} onChange={(event) => setForm({ ...form, reporter: event.target.value })} placeholder="신고자 이름" autoFocus /></label><label>재난 유형<select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })}><option value="">선택하세요</option>{DISASTER_TYPES.map((value) => <option key={value}>{value}</option>)}</select></label><label>시설 유형<select value={form.facility} onChange={(event) => setForm({ ...form, facility: event.target.value })}><option value="">선택하세요</option>{FACILITY_TYPES.map((value) => <option key={value}>{value}</option>)}</select></label><label>피해 위치<input value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} placeholder="예: 인천광역시 연수구 송도동" /></label><label className="description-field">신고 내용 <span>선택 사항</span><textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="피해 상황, 특이사항 등을 직접 입력할 수 있습니다." /></label><label className="photo-field">사진 등록<input type="file" accept="image/*" multiple onChange={changePhotos} /><span>사진을 여러 장 선택할 수 있습니다.</span></label>{form.photos.length > 0 && <div className="form-photo-list">{form.photos.map((photo, index) => <span key={`${photo.name}-${index}`}>{photo.name}<button type="button" onClick={() => removePhoto(index)} aria-label={`${photo.name} 삭제`}>×</button></span>)}</div>}{formError && <p className="form-error" role="alert">{formError}</p>}<footer><button type="button" className="secondary-action" onClick={closeForm}>취소</button><button type="submit" className="primary-action">{isEditing ? '수정 저장' : '신고 등록'}</button></footer></form></section></div>}
  </div>;
};

export default CaseListPage;
