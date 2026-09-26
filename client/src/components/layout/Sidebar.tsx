import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LogoIcon, DashboardIcon, ProjectsIcon, TasksIcon, ClientsIcon, UsersIcon } from '../ui/Icons';

const Sidebar: React.FC = () => {
  const { user } = useAuth();

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <LogoIcon size={30} className="sidebar-brand-icon" />
        <div className="sidebar-brand-details">
          <span className="sidebar-brand-text">Velozity</span>
          <span className="sidebar-brand-badge">Workspace</span>
        </div>
      </div>

      <div className="sidebar-section-title">MAIN NAVIGATION</div>

      <nav className="sidebar-nav" aria-label="Main navigation">
        {user?.role === 'ADMIN' && (
          <NavLink to="/dashboard" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <span className="sidebar-link-icon"><DashboardIcon size={18} /></span>
            <span className="sidebar-link-label">Overview</span>
          </NavLink>
        )}
        <NavLink to="/projects" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <span className="sidebar-link-icon"><ProjectsIcon size={18} /></span>
          <span className="sidebar-link-label">Projects</span>
        </NavLink>
        <NavLink to="/tasks" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <span className="sidebar-link-icon"><TasksIcon size={18} /></span>
          <span className="sidebar-link-label">Tasks</span>
        </NavLink>
        {user?.role === 'ADMIN' && (
          <NavLink to="/clients" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <span className="sidebar-link-icon"><ClientsIcon size={18} /></span>
            <span className="sidebar-link-label">Clients</span>
          </NavLink>
        )}
        {user?.role === 'ADMIN' && (
          <NavLink to="/users" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <span className="sidebar-link-icon"><UsersIcon size={18} /></span>
            <span className="sidebar-link-label">Team Members</span>
          </NavLink>
        )}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-avatar-wrapper">
            <div className="sidebar-user-avatar">{user?.name?.charAt(0).toUpperCase()}</div>
            <span className="sidebar-user-status-dot" title="Active" />
          </div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{user?.name}</div>
            <div className="sidebar-user-role">{user?.role?.replace('_', ' ')}</div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
