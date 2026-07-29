import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import CaseWorkflowLayout from '../layouts/CaseWorkflowLayout';
import LoginPage from '../pages/LoginPage';
import DashboardPage from '../pages/DashboardPage';
import CaseListPage from '../pages/CaseListPage';
import ApprovalHistoryPage from '../pages/ApprovalHistoryPage';
import ReviewHistoryPage from '../pages/ReviewHistoryPage';
import ReportManagementPage from '../pages/ReportManagementPage';
import NotificationsPage from '../pages/NotificationsPage';
import CaseDetailPage from '../pages/CaseDetailPage';
import AiResultPage from '../pages/AiResultPage';
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
import SupportCompletionGuard from '../components/case/SupportCompletionGuard';
import StageAccessGuard from '../components/case/StageAccessGuard';
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
            <Route path={ROUTES.SAFETY24_INTEGRATION} element={<Navigate to={ROUTES.CASES} replace />} />
            <Route path={ROUTES.APPROVAL_HISTORY} element={<ApprovalHistoryPage />} />
            <Route path={ROUTES.REVIEW_HISTORY} element={<ReviewHistoryPage />} />
            <Route path={ROUTES.REPORT_MANAGEMENT} element={<ReportManagementPage />} />
            <Route path={ROUTES.NOTIFICATIONS} element={<NotificationsPage />} />
            <Route path={ROUTES.CASE_DETAIL} element={<CaseWorkflowLayout />}>
              <Route index element={<CaseDetailPage />} />
              <Route path="ai-result" element={<AiResultPage />} />
              <Route path="analysis" element={<CaseDetailPage initialScreen="analysis" />} />
              <Route path="review" element={<Navigate to={ROUTES.REVIEW_HISTORY} replace />} />
              <Route path="severity" element={<ReviewCompletionGuard><SeverityPage /></ReviewCompletionGuard>} />
              <Route path="support" element={<StageAccessGuard stage="support"><SupportPage /></StageAccessGuard>} />
              <Route path="final-approval" element={<SupportCompletionGuard><FinalApprovalPage /></SupportCompletionGuard>} />
              <Route path="reports" element={<StageAccessGuard stage="reports"><ReportsPage /></StageAccessGuard>} />
            </Route>
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
