import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { dashboardService } from '../../services/dashboard';
import { StatCard } from '../../components/common/StatCard';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { ProgressBar } from '../../components/common/ProgressBar';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { SkillHeatmap } from '../../components/charts/SkillHeatmap';
import {
  UsersIcon,
  AcademicCapIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  FolderOpenIcon,
  CheckBadgeIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

export function ManagerDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await dashboardService.getManagerDashboard();
      setData(res);
    } catch (err) {
      toast.error('Failed to load manager dashboard');
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
        <LoadingSpinner size="lg" text="Loading team intelligence..." />
      </div>
    );
  }

  const {
    user_name,
    team_count = 0,
    total_skills = 0,
    critical_gaps = 0,
    pending_validations = 0,
    team_members = [],
    skill_heatmap = { skills: [], employees: [] },
  } = data || {};

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-navy-900 rounded-2xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/30 text-emerald-200 text-xs font-semibold uppercase tracking-wider">
                Engineering Leadership
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold">Welcome back, {user_name}!</h1>
            <p className="text-emerald-100/80 text-sm mt-1 max-w-xl">
              Monitor team readiness, validate employee capabilities, and ensure mission-critical project staffing.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {pending_validations > 0 && (
              <Button
                variant="secondary"
                className="bg-white/15 hover:bg-white/25 text-white border-white/20"
                onClick={() => navigate('/manager/validations')}
              >
                <ShieldCheckIcon className="h-4 w-4 mr-1.5" />
                Validate ({pending_validations})
              </Button>
            )}
            <Button
              className="bg-white text-emerald-900 hover:bg-emerald-50 font-semibold shadow"
              onClick={() => navigate('/manager/projects')}
            >
              <FolderOpenIcon className="h-4 w-4 mr-1.5 text-emerald-700" />
              Manage Projects
            </Button>
          </div>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard
          title="Direct Reports"
          value={team_count}
          subtitle="Active team members"
          icon={UsersIcon}
          color="blue"
        />
        <StatCard
          title="Total Team Skills"
          value={total_skills}
          subtitle="Declared capabilities"
          icon={AcademicCapIcon}
          color="purple"
        />
        <StatCard
          title="Pending Validations"
          value={pending_validations}
          subtitle="Awaiting manager sign-off"
          icon={ShieldCheckIcon}
          color={pending_validations > 0 ? 'orange' : 'green'}
        />
        <StatCard
          title="Critical Skill Gaps"
          value={critical_gaps}
          subtitle="Urgent staffing risks"
          icon={ExclamationTriangleIcon}
          color={critical_gaps > 0 ? 'red' : 'green'}
        />
      </div>

      {/* Skill Heatmap */}
      <Card
        title="Team Competency Heatmap"
        subtitle="Visual matrix of team capabilities across key technologies"
      >
        <SkillHeatmap
          skills={skill_heatmap?.skills}
          employees={skill_heatmap?.employees}
          data={skill_heatmap?.data}
        />
      </Card>

      {/* Team Members List */}
      <Card
        title="Team Readiness Overview"
        subtitle="Overall role alignment and critical gap indicators"
        action={
          <Button size="sm" variant="outline" onClick={() => navigate('/manager/team-skills')}>
            Team Skills Matrix
          </Button>
        }
      >
        {team_members.length === 0 ? (
          <p className="text-center py-8 text-gray-400 text-sm">No team members assigned.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-100 text-xs font-semibold uppercase text-gray-500 bg-gray-50/50">
                <tr>
                  <th className="py-3 px-4">Member</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Level</th>
                  <th className="py-3 px-4">Skills Count</th>
                  <th className="py-3 px-4">Overall Readiness</th>
                  <th className="py-3 px-4">Critical Gaps</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {team_members.map((member) => (
                  <tr key={member.id} className="hover:bg-gray-50/60 transition">
                    <td className="py-3.5 px-4 font-semibold text-gray-900">{member.name}</td>
                    <td className="py-3.5 px-4 text-gray-500">{member.department}</td>
                    <td className="py-3.5 px-4 text-gray-600">{member.experience_level}</td>
                    <td className="py-3.5 px-4 font-medium">{member.skill_count}</td>
                    <td className="py-3.5 px-4 w-40">
                      <ProgressBar
                        value={member.overall_readiness}
                        showLabel
                        size="sm"
                      />
                    </td>
                    <td className="py-3.5 px-4">
                      {member.critical_gaps > 0 ? (
                        <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                          {member.critical_gaps} Critical
                        </span>
                      ) : (
                        <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                          Ready
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => navigate(`/manager/team-skills`)}
                        className="text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                      >
                        Inspect Skills
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
