import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCaseStore } from '../stores/caseStore';
import { ROUTES } from '../routes/routeConfig';
import DisasterTypeStatus from '../components/dashboard/DisasterTypeStatus';
import PriorityReportTable from '../components/dashboard/PriorityReportTable';
import SatelliteDamageMap from '../components/dashboard/SatelliteDamageMap';
import '../components/dashboard/dashboard.css';

const DashboardPage = () => {
  const navigate = useNavigate();
  const cases = useCaseStore((state) => state.cases);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('전체');

  const metrics = useMemo(() => {
    const reportedDates = cases
      .map((item) => {
        const match = item.reportedAt?.match(/(\d{4})\.(\d{2})\.(\d{2})\s+(\d{2}):(\d{2})/);
        if (!match) return null;
        const [, year, month, day, hour, minute] = match;
        return new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute));
      })
      .filter(Boolean);
    const latestReportedAt = reportedDates.length
      ? new Date(Math.max(...reportedDates.map((date) => date.getTime())))
      : new Date();
    const weekAgo = new Date(latestReportedAt);
    weekAgo.setDate(weekAgo.getDate() - 7);

    return [
      { label: '전체 건수', value: cases.length, note: '누적 신고 기준', tone: 'default' },
      {
        label: '최근 1주일 신고건수',
        value: reportedDates.filter((date) => date >= weekAgo && date <= latestReportedAt).length,
        note: '최근 7일 신고 기준',
        tone: 'info',
      },
      {
        label: '처리완료 건수',
        value: cases.filter((item) => ['AI 분석 완료', '처리 완료', '최종 승인'].includes(item.status)).length,
        note: '처리 완료 상태 기준',
        tone: 'success',
      },
    ];
  }, [cases]);

  const filteredCases = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return [...cases]
      .sort((a, b) => {
        const score = (item) => (
          (item.urgency === '긴급' ? 4 : 0)
          + (item.duplicate ? 3 : 0)
          + (item.status === '검토 필요' ? 2 : 0)
          + (item.status === 'AI 분석 완료' ? 1 : 0)
        );
        return score(b) - score(a);
      })
      .filter((item) => {
        if (statusFilter !== '전체' && item.status !== statusFilter) return false;
        if (!normalizedSearch) return true;

        return [item.id, item.location, item.type]
          .some((value) => value?.toLowerCase().includes(normalizedSearch));
      });
  }, [cases, searchTerm, statusFilter]);

  return <div className="case-page dashboard-page">
    <header className="case-page-head">
      <div>
        <p>업무 현황 / 신고 대시보드</p>
        <h1>신고 대시보드</h1>
        <span>처리 상태와 우선 확인이 필요한 재해 신고를 한눈에 확인합니다.</span>
      </div>
      <button className="primary-action" onClick={() => navigate(ROUTES.CASES)}>신고 목록 보기</button>
    </header>

    <section className="dashboard-summary-grid" aria-label="신고 요약 지표">
      {metrics.map((item) => <article key={item.label} className={`case-metric ${item.tone}`}>
        <span>{item.label}</span>
        <strong>{item.value}<small>건</small></strong>
        <p>{item.note}</p>
      </article>)}
    </section>

    <section className="dashboard-main-grid">
      <PriorityReportTable
        filteredCases={filteredCases}
        searchTerm={searchTerm}
        statusFilter={statusFilter}
        onSearchChange={setSearchTerm}
        onStatusChange={setStatusFilter}
        onOpenCase={(caseId) => navigate(`/cases/${caseId}`)}
      />

      <aside className="dashboard-side-column">
        <DisasterTypeStatus cases={cases} />
        <SatelliteDamageMap cases={cases} />
      </aside>
    </section>
  </div>;
};

export default DashboardPage;
