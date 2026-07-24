import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import LoginPage from '../pages/LoginPage';
import DashboardPage from '../pages/DashboardPage';
import CaseListPage from '../pages/CaseListPage';
import Safety24IntegrationPage from '../pages/Safety24IntegrationPage';
import ApprovalHistoryPage from '../pages/ApprovalHistoryPage';
import ReviewHistoryPage from '../pages/ReviewHistoryPage';
import CaseDetailPage from '../pages/CaseDetailPage';
import AiResultPage from '../pages/AiResultPage';
import AiAnalysisPage from '../pages/AiAnalysisPage';
import AiReviewPage from '../pages/AiReviewPage';
import SeverityPage from '../pages/SeverityPage';
import SupportPage from '../pages/SupportPage';
import FinalApprovalPage from '../pages/FinalApprovalPage';
import ReportsPage from '../pages/ReportsPage';
import StatisticsPage from '../pages/StatisticsPage';
import DisasterMapPage from '../pages/DisasterMapPage';
import ReportDetailPage from '../pages/ReportDetailPage';
import NotFoundPage from '../pages/NotFoundPage';
import ProtectedRoute from './ProtectedRoute';
import ReviewCompletionGuard from '../components/case/ReviewCompletionGuard';
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
            <Route path={ROUTES.SAFETY24_INTEGRATION} element={<Safety24IntegrationPage />} />
            <Route path={ROUTES.APPROVAL_HISTORY} element={<ApprovalHistoryPage />} />
            <Route path={ROUTES.REVIEW_HISTORY} element={<ReviewHistoryPage />} />
            <Route path={ROUTES.CASE_DETAIL} element={<CaseDetailPage />} />
            <Route path={ROUTES.AI_RESULT} element={<AiResultPage />} />
            <Route path={ROUTES.AI_ANALYSIS} element={<AiAnalysisPage />} />
            <Route path={ROUTES.AI_REVIEW} element={<AiReviewPage />} />
            <Route path={ROUTES.SEVERITY} element={<ReviewCompletionGuard><SeverityPage /></ReviewCompletionGuard>} />
            <Route path={ROUTES.SUPPORT} element={<SupportPage />} />
            <Route path={ROUTES.FINAL_APPROVAL} element={<FinalApprovalPage />} />
            <Route path={ROUTES.CASE_REPORTS} element={<ReportsPage />} />
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
