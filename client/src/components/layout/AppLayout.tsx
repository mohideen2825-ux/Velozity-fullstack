import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import Spinner from '../ui/Spinner';
import { useSocket } from '../../hooks/useSocket';

const AppLayout: React.FC = () => {
  const { user, loading } = useAuth();
  const token = localStorage.getItem('accessToken');

  // Initialize socket connection for the logged-in user
  useSocket(user ? token : null);

  if (loading) {
    return (
      <div className="loading-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="app-main">
        <Topbar />
        <main className="app-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
