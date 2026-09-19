import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ROLES } from '../../utils/constants';
import { getInitials } from '../../utils/calculations';
import {
  HomeIcon,
  UserCircleIcon,
  AcademicCapIcon,
  ChartBarIcon,
  ClipboardDocumentListIcon,
  BellIcon,
  ArrowRightOnRectangleIcon,
  MapIcon,
  UsersIcon,
  ShieldCheckIcon,
  FolderOpenIcon,
  DocumentChartBarIcon,
  WrenchScrewdriverIcon,
  BookOpenIcon,
  StarIcon,
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const EMPLOYEE_NAV = [
  { to: '/employee/dashboard', icon: HomeIcon, label: 'Dashboard' },
  { to: '/employee/profile', icon: UserCircleIcon, label: 'My Profile' },
  { to: '/employee/skills', icon: AcademicCapIcon, label: 'My Skills' },
  { to: '/employee/skill-gaps', icon: ChartBarIcon, label: 'Skill Gaps' },
  { to: '/employee/roadmap', icon: MapIcon, label: 'Learning Roadmap' },
  { to: '/employee/training', icon: ClipboardDocumentListIcon, label: 'Training Requests' },
  { to: '/employee/notifications', icon: BellIcon, label: 'Notifications' },
];

const SME_CAPABILITY_NAV = [
  { to: '/sme/dashboard', icon: HomeIcon, label: 'SME Hub' },
  { to: '/sme/skills', icon: AcademicCapIcon, label: 'SME Expertise' },
  { to: '/sme/training', icon: ClipboardDocumentListIcon, label: 'Available Trainings' },
  { to: '/sme/learners', icon: UsersIcon, label: 'My Learners' },
  { to: '/sme/history', icon: BookOpenIcon, label: 'Mentorship History' },
];

const MANAGER_NAV = [
  { to: '/manager/dashboard', icon: HomeIcon, label: 'Dashboard' },
  { to: '/manager/team-skills', icon: ChartBarIcon, label: 'Team Skills' },
  { to: '/manager/validations', icon: ShieldCheckIcon, label: 'Skill Validations' },
  { to: '/manager/skill-gaps', icon: StarIcon, label: 'Team Skill Gaps' },
  { to: '/manager/projects', icon: FolderOpenIcon, label: 'Project Readiness' },
  { to: '/manager/reports', icon: DocumentChartBarIcon, label: 'Team Reports' },
  { to: '/manager/notifications', icon: BellIcon, label: 'Notifications' },
];

const ADMIN_NAV = [
  { to: '/admin/dashboard', icon: HomeIcon, label: 'Dashboard' },
  { to: '/admin/users', icon: UsersIcon, label: 'User Management' },
  { to: '/admin/skills', icon: AcademicCapIcon, label: 'Skill Taxonomy' },
  { to: '/admin/courses', icon: BookOpenIcon, label: 'Course Catalog' },
  { to: '/admin/reports', icon: DocumentChartBarIcon, label: 'Analytics Reports' },
  { to: '/admin/notifications', icon: BellIcon, label: 'Notifications' },
];

export function Sidebar({ isOpen, onToggle }) {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();

  let navLinks = [];
  if (role === ROLES.MANAGER) {
    navLinks = MANAGER_NAV;
  } else if (role === ROLES.ADMIN) {
    navLinks = ADMIN_NAV;
  } else {
    // EMPLOYEE
    navLinks = EMPLOYEE_NAV;
  }

  const showSmeSection = user?.is_sme && role === ROLES.EMPLOYEE;

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/40 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-full z-30 flex flex-col
          bg-gradient-to-b from-navy-900 to-navy-800
          transition-all duration-300 ease-in-out
          ${isOpen ? 'w-64' : 'w-0 lg:w-16'}
          overflow-hidden
        `}
        style={{
          background: 'linear-gradient(180deg, #0f1e33 0%, #162d4a 100%)',
        }}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-4 py-5 border-b border-white/10 min-w-64">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
              <WrenchScrewdriverIcon className="h-5 w-5 text-white" />
            </div>
            <div className={`transition-opacity duration-200 ${isOpen ? 'opacity-100' : 'opacity-0 lg:hidden'}`}>
              <p className="text-white font-bold text-sm tracking-wide">SKILL SYNC</p>
              <p className="text-blue-300 text-[10px] tracking-wider uppercase">Talent Platform</p>
            </div>
          </div>
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto overflow-x-hidden min-w-64">
          {navLinks.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 whitespace-nowrap
                ${isActive
                  ? 'bg-blue-600/30 text-white border border-blue-500/30'
                  : 'text-blue-100/80 hover:bg-white/10 hover:text-white'
                }`
              }
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              <span className={`transition-opacity duration-200 ${isOpen ? 'opacity-100' : 'opacity-0 lg:hidden'}`}>
                {label}
              </span>
            </NavLink>
          ))}

          {/* SME Capability Links for Employees who are approved SMEs */}
          {showSmeSection && (
            <div className="pt-4 mt-4 border-t border-white/10">
              <div className="px-3 pb-2">
                <span className={`text-[10px] font-bold uppercase tracking-wider text-purple-300 ${isOpen ? 'opacity-100' : 'opacity-0 lg:hidden'}`}>
                  SME Capability
                </span>
              </div>
              {SME_CAPABILITY_NAV.map(({ to, icon: Icon, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 whitespace-nowrap
                    ${isActive
                      ? 'bg-purple-600/30 text-white border border-purple-500/30'
                      : 'text-purple-200/80 hover:bg-white/10 hover:text-white'
                    }`
                  }
                >
                  <Icon className="h-5 w-5 flex-shrink-0 text-purple-400" />
                  <span className={`transition-opacity duration-200 ${isOpen ? 'opacity-100' : 'opacity-0 lg:hidden'}`}>
                    {label}
                  </span>
                </NavLink>
              ))}
            </div>
          )}
        </nav>

        {/* User + Logout */}
        <div className="border-t border-white/10 p-3 min-w-64">
          {user && (
            <div className="flex items-center gap-3 px-3 py-2 mb-2">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                {getInitials(user.full_name || user.email)}
              </div>
              <div className={`min-w-0 transition-opacity duration-200 ${isOpen ? 'opacity-100' : 'opacity-0 lg:hidden'}`}>
                <p className="text-white text-xs font-semibold truncate">{user.full_name || user.email}</p>
                <p className="text-blue-300 text-[10px] capitalize">{role?.toLowerCase()}</p>
              </div>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-300 hover:bg-red-500/20 hover:text-red-200 transition-colors w-full whitespace-nowrap"
          >
            <ArrowRightOnRectangleIcon className="h-5 w-5 flex-shrink-0" />
            <span className={`transition-opacity duration-200 ${isOpen ? 'opacity-100' : 'opacity-0 lg:hidden'}`}>
              Logout
            </span>
          </button>
        </div>
      </aside>
    </>
  );
}
