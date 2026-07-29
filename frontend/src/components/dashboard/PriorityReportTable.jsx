const STATUS_OPTIONS = ['전체', '검토 필요', '현장 확인', 'AI 분석 대기', 'AI 분석 완료', '접수 완료'];

const PriorityReportTable = ({
  filteredCases,
  searchTerm,
  statusFilter,
  onSearchChange,
  onStatusChange,
  onOpenCase,
}) => <article className="case-card priority-report-card">
  <div className="priority-report-heading">
    <div>
      <h2>우선 처리 신고</h2>
    </div>
  </div>

  <div className="priority-report-toolbar">
    <div className="priority-search-controls">
      <label className="priority-search">
        <span className="sr-only">사건번호 또는 위치 검색</span>
        <input
          value={searchTerm}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="사건번호, 위치 검색"
        />
        <i aria-hidden="true">⌕</i>
      </label>
      <label className="priority-status-filter">
        <span className="sr-only">진행 상태 필터</span>
        <select value={statusFilter} onChange={(event) => onStatusChange(event.target.value)}>
          {STATUS_OPTIONS.map((status) => <option key={status} value={status}>{status === '전체' ? '상태 전체' : status}</option>)}
        </select>
      </label>
    </div>
  </div>

  <div className="priority-report-table-wrap">
    <table className="priority-report-table">
      <thead>
        <tr>
          <th>우선순위</th>
          <th>재난 유형</th>
          <th>위치</th>
          <th>긴급도 점수</th>
          <th>진행 상태</th>
          <th>액션</th>
        </tr>
      </thead>
      <tbody>
        {filteredCases.slice(0, 5).map((item, index) => <tr key={item.id}>
          <td><span className={`priority-rank rank-${Math.min(index + 1, 4)}`}>{index + 1}</span></td>
          <td><strong className="disaster-type-name">{item.type}</strong></td>
          <td>{item.location}</td>
          <td>
            <span className={`priority-urgency urgency-${item.urgency}`}>
              {item.urgencyScore ?? ({ 긴급: 85, 높음: 70, 보통: 50, 낮음: 30 }[item.urgency] || 0)}점
            </span>
          </td>
          <td><span className={`progress-badge status-${item.status.replaceAll(' ', '-')}`}>{item.status}</span></td>
          <td><button className="table-secondary-action" onClick={() => onOpenCase(item.id)}>상세 보기</button></td>
        </tr>)}
      </tbody>
    </table>

    {filteredCases.length === 0 && <div className="priority-empty">조건에 맞는 신고가 없습니다.</div>}
  </div>
</article>;

export default PriorityReportTable;
