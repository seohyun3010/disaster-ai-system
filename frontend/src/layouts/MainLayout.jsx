import { Outlet } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';

const MainLayout = () => (
  <div className="app-layout">
    <Sidebar />
    <div className="app-content">
      <Header />
      <main className="workspace"><Outlet /></main>
    </div>
  </div>
);

export default MainLayout;
