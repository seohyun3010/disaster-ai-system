import { Outlet } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';

const MainLayout = () => (
  <div className="app-layout">
    <Sidebar />
    <main className="workspace"><Outlet /></main>
  </div>
);

export default MainLayout;
