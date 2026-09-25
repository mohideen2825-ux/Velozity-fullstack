import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getNotificationsApi, markAllAsReadApi, markAsReadApi } from '../../api/notifications';
import { getSocket } from '../../hooks/useSocket';
import { Notification } from '../../types';
import toast from 'react-hot-toast';

const Topbar: React.FC = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      const res = await getNotificationsApi();
      setNotifications(res.data.data.notifications);
      setUnreadCount(res.data.data.unreadCount);
    } catch { /* silent */ }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  // Real-time: listen for notification_count updates
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const handler = (count: number) => {
      setUnreadCount(count);
      fetchNotifications();
      toast('You have a new notification!', { icon: '🔔' });
    };
    socket.on('notification_count', handler);
    return () => { socket.off('notification_count', handler); };
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleMarkAll = async () => {
    await markAllAsReadApi();
    setUnreadCount(0);
    setNotifications((n) => n.map((notif) => ({ ...notif, isRead: true })));
  };

  const handleMarkOne = async (id: string) => {
    await markAsReadApi(id);
    setNotifications((n) =>
      n.map((notif) => (notif.id === id ? { ...notif, isRead: true } : notif))
    );
    setUnreadCount((c) => Math.max(0, c - 1));
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="topbar">
      <div className="topbar-title">
        {user?.role === 'ADMIN' ? 'Admin Dashboard' : `Welcome, ${user?.name}`}
      </div>

      <div className="topbar-actions">
        {/* Notification Bell */}
        <div className="notif-wrapper" ref={dropdownRef}>
          <button
            className="notif-btn"
            onClick={() => setShowDropdown((v) => !v)}
            aria-label={`Notifications, ${unreadCount} unread`}
          >
            🔔
            {unreadCount > 0 && (
              <span className="notif-badge" aria-label={`${unreadCount} unread`}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          {showDropdown && (
            <div className="notif-dropdown" role="menu">
              <div className="notif-dropdown-header">
                <span>Notifications</span>
                {unreadCount > 0 && (
                  <button className="notif-mark-all" onClick={handleMarkAll}>
                    Mark all read
                  </button>
                )}
              </div>
              <ul className="notif-list">
                {notifications.length === 0 && (
                  <li className="notif-empty">No notifications</li>
                )}
                {notifications.map((n) => (
                  <li
                    key={n.id}
                    className={`notif-item ${n.isRead ? '' : 'unread'}`}
                    onClick={() => !n.isRead && handleMarkOne(n.id)}
                  >
                    <span className="notif-msg">{n.message}</span>
                    <span className="notif-type">{n.type}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Logout */}
        <button className="btn btn-ghost" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </header>
  );
};

export default Topbar;
