import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { notificationsService } from '../../services/notifications';
import { getInitials, formatRelativeTime } from '../../utils/calculations';
import {
  Bars3Icon,
  BellIcon,
  ChevronDownIcon,
  ArrowRightOnRectangleIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const PAGE_TITLES = {
  '/employee/dashboard': 'Dashboard',
  '/employee/profile': 'My Profile',
  '/employee/skills': 'My Skills',
  '/employee/skill-gaps': 'Skill Gaps',
  '/employee/roadmap': 'Learning Roadmap',
  '/employee/training': 'Training Requests',
  '/employee/notifications': 'Notifications',
  '/sme/dashboard': 'Dashboard',
  '/sme/skills': 'My Skills',
  '/sme/training': 'Training Requests',
  '/sme/learners': 'My Learners',
  '/sme/history': 'Training History',
  '/sme/notifications': 'Notifications',
  '/manager/dashboard': 'Dashboard',
  '/manager/team-skills': 'Team Skills',
  '/manager/validations': 'Skill Validation',
  '/manager/skill-gaps': 'Skill Gaps',
  '/manager/projects': 'Projects',
  '/manager/reports': 'Reports',
  '/manager/notifications': 'Notifications',
  '/admin/dashboard': 'Dashboard',
  '/admin/users': 'User Management',
  '/admin/skills': 'Skill Management',
  '/admin/courses': 'Course Management',
  '/admin/reports': 'Reports',
  '/admin/notifications': 'Notifications',
};

export function Navbar({ onToggleSidebar }) {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const userMenuRef = useRef(null);
  const notifRef = useRef(null);

  const pageTitle = PAGE_TITLES[location.pathname] || 'Skill Sync';

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const data = await notificationsService.getUnreadCount();
        setUnreadCount(data.count || data.unread_count || 0);
      } catch { /* silently ignore */ }
    };
    fetchCount();
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClick(e) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setShowUserMenu(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifMenu(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleBellClick = async () => {
    setShowNotifMenu((v) => !v);
    if (!showNotifMenu) {
      try {
        const data = await notificationsService.getNotifications({ limit: 5 });
        setNotifications(Array.isArray(data) ? data : data.notifications || []);
      } catch { /* silent */ }
    }
  };

  const handleLogout = () => {
    logout();
    toast.success('Logged out');
    navigate('/login');
  };

  const rolePrefix = role?.toLowerCase();

  return (
    <header className="h-16 bg-white border-b border-gray-100 flex items-center px-4 gap-4 sticky top-0 z-10 shadow-sm">
      {/* Hamburger */}
      <button
        onClick={onToggleSidebar}
        className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
      >
        <Bars3Icon className="h-5 w-5" />
      </button>

      {/* Page title */}
      <h1 className="text-lg font-semibold text-gray-900 flex-1 truncate">{pageTitle}</h1>

      {/* Right side */}
      <div className="flex items-center gap-2">
        {/* Notification bell */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={handleBellClick}
            className="relative p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
          >
            <BellIcon className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifMenu && (
            <div className="absolute right-0 top-12 w-80 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                <span className="font-semibold text-sm text-gray-900">Notifications</span>
                <button
                  onClick={() => navigate(`/${rolePrefix}/notifications`)}
                  className="text-xs text-blue-600 hover:underline"
                >
                  View all
                </button>
              </div>
              <div className="max-h-72 overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-8">No new notifications</p>
                ) : (
                  notifications.map((n) => (
                    <div key={n.id} className={`px-4 py-3 border-b border-gray-50 hover:bg-gray-50 ${!n.is_read ? 'bg-blue-50/50' : ''}`}>
                      <p className="text-sm text-gray-800">{n.message || n.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{formatRelativeTime(n.created_at)}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User menu */}
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => setShowUserMenu((v) => !v)}
            className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
              {getInitials(user?.full_name || user?.email || '?')}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-medium text-gray-900 leading-none">{user?.full_name || user?.email}</p>
              <p className="text-xs text-gray-500 capitalize">{role?.toLowerCase()}</p>
            </div>
            <ChevronDownIcon className="h-4 w-4 text-gray-400 hidden sm:block" />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 top-12 w-48 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden py-1">
              <button
                onClick={() => { navigate(`/${rolePrefix}/profile`); setShowUserMenu(false); }}
                className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
              >
                <UserCircleIcon className="h-4 w-4" /> My Profile
              </button>
              <div className="border-t border-gray-100 my-1" />
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
              >
                <ArrowRightOnRectangleIcon className="h-4 w-4" /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
