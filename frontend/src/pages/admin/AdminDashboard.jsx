import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { dashboardService } from '../../services/dashboard';
import { StatCard } from '../../components/common/StatCard';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { formatRelativeTime } from '../../utils/calculations';
import {
  UsersIcon,
  AcademicCapIcon,
  BookOpenIcon,
  ClipboardDocumentListIcon,
  BuildingOffice2Icon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

export function AdminDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await dashboardService.getAdminDashboard();
      setData(res);
    } catch (err) {
      toast.error('Failed to load admin dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="py-24 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading enterprise admin controls..." />
      </div>
    );
  }

  const {
    total_users = 0,
    total_skills = 0,
    total_courses = 0,
    total_training_requests = 0,
    users_by_role = {},
    users_by_department = {},
    training_by_status = {},
    recent_activity = [],
  } = data || {};

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-orange-600 via-rose-700 to-navy-900 rounded-2xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full bg-orange-500/30 text-orange-200 text-xs font-semibold uppercase tracking-wider">
                Enterprise Administration
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold">Skill Sync Control Center</h1>
            <p className="text-orange-100/80 text-sm mt-1 max-w-xl">
              Maintain platform taxonomy, manage user permissions, and oversee workforce capability transformation.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              className="bg-white text-orange-900 hover:bg-orange-50 font-semibold shadow"
              onClick={() => navigate('/admin/users')}
            >
              <UsersIcon className="h-4 w-4 mr-1 text-orange-600" />
              Manage Users
            </Button>
          </div>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard
          title="Active Users"
          value={total_users}
          subtitle="Platform accounts"
          icon={UsersIcon}
          color="blue"
        />
        <StatCard
          title="Master Skills"
          value={total_skills}
          subtitle="Taxonomy catalog"
          icon={AcademicCapIcon}
          color="purple"
        />
        <StatCard
          title="Course Catalog"
          value={total_courses}
          subtitle="Available learning modules"
          icon={BookOpenIcon}
          color="indigo"
        />
        <StatCard
          title="Training Requests"
          value={total_training_requests}
          subtitle="Total submitted"
          icon={ClipboardDocumentListIcon}
          color="orange"
        />
      </div>

      {/* Distribution Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Role Breakdown */}
        <Card title="Users by Role" subtitle="Account privilege distribution">
          <div className="space-y-3">
            {Object.entries(users_by_role).map(([role, count]) => (
              <div key={role} className="flex items-center justify-between p-3 rounded-lg bg-gray-50/70 border border-gray-100">
                <span className="font-semibold text-sm text-gray-800">{role}</span>
                <span className="font-bold text-sm px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800">
                  {count}
                </span>
              </div>
            ))}
          </div>
        </Card>

        {/* Department Breakdown */}
        <Card title="Department Representation" subtitle="Talent allocation across org">
          <div className="space-y-3">
            {Object.entries(users_by_department).map(([dept, count]) => (
              <div key={dept} className="flex items-center justify-between p-3 rounded-lg bg-gray-50/70 border border-gray-100">
                <span className="font-semibold text-sm text-gray-800">{dept}</span>
                <span className="font-bold text-sm px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800">
                  {count}
                </span>
              </div>
            ))}
          </div>
        </Card>

        {/* Training Status Breakdown */}
        <Card title="Training Request Pipeline" subtitle="Status of all employee requests">
          <div className="space-y-3">
            {Object.entries(training_by_status).map(([st, count]) => (
              <div key={st} className="flex items-center justify-between p-3 rounded-lg bg-gray-50/70 border border-gray-100">
                <span className="font-semibold text-sm text-gray-800">{st.replace('_', ' ')}</span>
                <span className="font-bold text-sm px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800">
                  {count}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card title="Recent Training &amp; Mentoring Activity" subtitle="Live updates from across the platform">
        {recent_activity.length === 0 ? (
          <p className="text-center py-8 text-gray-400 text-sm">No recent activity logged.</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {recent_activity.map((act) => (
              <div key={act.id} className="py-3 px-2 flex items-center justify-between hover:bg-gray-50 rounded-lg transition">
                <div className="space-y-0.5">
                  <p className="text-sm font-semibold text-gray-900">
                    {act.employee_name} requested mentorship in <span className="text-blue-600">{act.skill_name}</span>
                  </p>
                  <p className="text-xs text-gray-400">{formatRelativeTime(act.created_at)}</p>
                </div>
                <Badge variant={act.status?.toLowerCase()}>{act.status}</Badge>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
