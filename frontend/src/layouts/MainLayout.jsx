import { Outlet } from 'react-router-dom';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';

const MainLayout = () => (
  <div className="app-layout">
    <div className="app-content">
      <Header />
      <main className="workspace"><Outlet /></main>
      <Footer />
    </div>
  </div>
);

export default MainLayout;
