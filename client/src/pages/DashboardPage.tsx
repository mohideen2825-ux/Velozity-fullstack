import React, { useEffect, useState } from 'react';
import { getStatsApi } from '../api/admin';
import { getActivityApi } from '../api/activity';
import { DashboardStats, TaskActivity } from '../types';
import Spinner from '../components/ui/Spinner';
import { format } from 'date-fns';
import { getSocket } from '../hooks/useSocket';

const StatCard: React.FC<{ label: string; value: number | string; icon: string; accent?: string }> = ({
  label, value, icon, accent = 'accent-blue',
}) => (
  <div className={`stat-card ${accent}`}>
    <div className="stat-icon">{icon}</div>
    <div className="stat-value">{value}</div>
    <div className="stat-label">{label}</div>
  </div>
);

const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activity, setActivity] = useState<TaskActivity[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingActivity, setLoadingActivity] = useState(true);

  const fetchStats = async () => {
    try {
      const res = await getStatsApi();
      setStats(res.data.data);
    } catch { /* silent */ }
    finally { setLoadingStats(false); }
  };

  const fetchActivity = async () => {
    try {
      const res = await getActivityApi();
      setActivity(res.data.data);
    } catch { /* silent */ }
    finally { setLoadingActivity(false); }
  };

  useEffect(() => {
    fetchStats();
    fetchActivity();
  }, []);

  // Real-time: refresh activity when any task_activity event fires
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const handler = () => {
      fetchActivity();
      fetchStats();
    };
    socket.on('task_activity', handler);
    socket.on('task_overdue', handler);
    return () => {
      socket.off('task_activity', handler);
      socket.off('task_overdue', handler);
    };
  }, []);

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Overview</h1>
        <button className="btn btn-ghost btn-sm" onClick={() => { fetchStats(); fetchActivity(); }}>
          ↻ Refresh
        </button>
      </div>

      {/* Stats */}
      {loadingStats ? (
        <div className="center"><Spinner /></div>
      ) : stats ? (
        <div className="stats-grid">
          <StatCard label="Total Projects" value={stats.totalProjects} icon="📁" accent="accent-blue" />
          <StatCard label="Overdue Tasks" value={stats.overdueTasks} icon="⚠️" accent="accent-red" />
          <StatCard label="Online Users" value={stats.activeOnlineUsers} icon="🟢" accent="accent-green" />
          <StatCard label="To Do" value={stats.tasksByStatus.TO_DO} icon="📋" accent="accent-neutral" />
          <StatCard label="In Progress" value={stats.tasksByStatus.IN_PROGRESS} icon="🔄" accent="accent-blue" />
          <StatCard label="In Review" value={stats.tasksByStatus.IN_REVIEW} icon="🔍" accent="accent-yellow" />
          <StatCard label="Done" value={stats.tasksByStatus.DONE} icon="✅" accent="accent-green" />
        </div>
      ) : (
        <p className="text-muted">Could not load stats.</p>
      )}

      {/* Activity Feed */}
      <div className="section">
        <h2 className="section-title">Recent Activity</h2>
        {loadingActivity ? (
          <div className="center"><Spinner /></div>
        ) : activity.length === 0 ? (
          <p className="text-muted">No recent activity.</p>
        ) : (
          <ul className="activity-list">
            {activity.map((a) => (
              <li key={a.id} className="activity-item">
                <div className="activity-avatar">{a.user.name.charAt(0).toUpperCase()}</div>
                <div className="activity-content">
                  <span className="activity-user">{a.user.name}</span>
                  {' changed '}
                  <span className="activity-task">"{a.task.title}"</span>
                  {a.previousStatus && (
                    <> from <span className="status-text">{a.previousStatus.replace('_', ' ')}</span></>
                  )}
                  {' → '}
                  <span className="status-text">{a.newStatus.replace('_', ' ')}</span>
                </div>
                <div className="activity-time">
                  {format(new Date(a.timestamp), 'MMM d, HH:mm')}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
