import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import LoginPage from '../pages/LoginPage';
import DashboardPage from '../pages/DashboardPage';
import CaseListPage from '../pages/CaseListPage';
import CaseDetailPage from '../pages/CaseDetailPage';
import AiResultPage from '../pages/AiResultPage';
import StatisticsPage from '../pages/StatisticsPage';
import DisasterMapPage from '../pages/DisasterMapPage';
import ReportDetailPage from '../pages/ReportDetailPage';
import NotFoundPage from '../pages/NotFoundPage';
import ProtectedRoute from './ProtectedRoute';
import { ROUTES } from './routeConfig';

const AppRouter = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path={ROUTES.LOGIN} element={<LoginPage />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<MainLayout />}>
            <Route
              index
              element={<Navigate to={ROUTES.DASHBOARD} replace />}
            />
            <Route path={ROUTES.DASHBOARD} element={<DashboardPage />} />
            <Route path={ROUTES.CASES} element={<CaseListPage />} />
            <Route path={ROUTES.CASE_DETAIL} element={<CaseDetailPage />} />
            <Route path={ROUTES.AI_RESULT} element={<AiResultPage />} />
            <Route path={ROUTES.STATISTICS} element={<StatisticsPage />} />
            <Route path={ROUTES.MAP} element={<DisasterMapPage />} />
            <Route path={ROUTES.REPORT_DETAIL} element={<ReportDetailPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default AppRouter;
