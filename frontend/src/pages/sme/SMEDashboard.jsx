import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { dashboardService } from '../../services/dashboard';
import { trainingService } from '../../services/training';
import { StatCard } from '../../components/common/StatCard';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { formatRelativeTime } from '../../utils/calculations';
import {
  SparklesIcon,
  UserGroupIcon,
  CheckBadgeIcon,
  ClockIcon,
  HandRaisedIcon,
  PlayIcon,
  AcademicCapIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

export function SMEDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await dashboardService.getSMEDashboard();
      setData(res);
    } catch (err) {
      toast.error('Failed to load SME dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleClaim = async (requestId) => {
    try {
      setActionLoading(requestId);
      await trainingService.claimRequest(requestId);
      toast.success('You have claimed this training request!');
      fetchDashboard();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to claim request');
    } finally {
      setActionLoading(null);
    }
  };

  const handleStart = async (requestId) => {
    try {
      setActionLoading(requestId);
      await trainingService.startTraining(requestId);
      toast.success('Mentorship session started!');
      fetchDashboard();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to start session');
    } finally {
      setActionLoading(null);
    }
  };

  const handleComplete = async (requestId) => {
    try {
      setActionLoading(requestId);
      await trainingService.completeTraining(requestId);
      toast.success('Training marked as successfully completed!');
      fetchDashboard();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to complete session');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="py-24 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading SME Dashboard..." />
      </div>
    );
  }

  const {
    user_name,
    claimable_requests = 0,
    sessions_completed = 0,
    learners_helped = 0,
    training_hours = 0,
    impact_score = 0,
    sme_skills = [],
    available_requests = [],
    active_assignments = [],
  } = data || {};

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-purple-800 via-indigo-800 to-navy-900 rounded-2xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full bg-purple-500/30 text-purple-200 text-xs font-semibold uppercase tracking-wider">
                SME &amp; Mentorship Hub
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold">Welcome back, {user_name}!</h1>
            <p className="text-purple-100/80 text-sm mt-1 max-w-xl">
              Mentor team members, share institutional knowledge, and elevate team competencies across the organization.
            </p>
          </div>
          <Button
            className="bg-white text-purple-900 hover:bg-purple-50 font-semibold shadow"
            onClick={() => navigate('/sme/training')}
          >
            <HandRaisedIcon className="h-4 w-4 mr-1.5 text-purple-600" />
            Explore Requests ({claimable_requests})
          </Button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard
          title="Open Matching Requests"
          value={claimable_requests}
          subtitle="Awaiting an SME mentor"
          icon={HandRaisedIcon}
          color="purple"
        />
        <StatCard
          title="Learners Guided"
          value={learners_helped}
          subtitle="Unique employees mentored"
          icon={UserGroupIcon}
          color="blue"
        />
        <StatCard
          title="Sessions Completed"
          value={sessions_completed}
          subtitle="Mentorship engagements"
          icon={CheckBadgeIcon}
          color="green"
        />
        <StatCard
          title="Impact Score"
          value={`${impact_score} pts`}
          subtitle={`${training_hours} total mentoring hours`}
          icon={SparklesIcon}
          color="orange"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Claimable Requests & Active Assignments */}
        <div className="lg:col-span-2 space-y-6">
          {/* Claimable Training Requests */}
          <Card
            title="Available Mentoring Requests"
            subtitle="Employees needing training in your verified expertise areas"
            action={
              <Button size="sm" variant="outline" onClick={() => navigate('/sme/training')}>
                View All
              </Button>
            }
          >
            {available_requests.length === 0 ? (
              <p className="text-center py-8 text-gray-400 text-sm">
                No open training requests currently match your skill profile.
              </p>
            ) : (
              <div className="space-y-3">
                {available_requests.slice(0, 5).map((req) => (
                  <div
                    key={req.id}
                    className="p-4 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-gray-50 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-gray-900 text-sm">{req.skill_name}</h4>
                        <Badge variant={req.priority?.toLowerCase()}>{req.priority}</Badge>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Learner: <span className="font-semibold text-gray-700">{req.employee_name}</span> &bull; Target: Level {req.requested_level}
                      </p>
                      {req.message && (
                        <p className="text-xs text-gray-600 mt-1 italic">&ldquo;{req.message}&rdquo;</p>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="primary"
                      disabled={actionLoading === req.id}
                      onClick={() => handleClaim(req.id)}
                    >
                      {actionLoading === req.id ? 'Claiming...' : 'Claim Request'}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Active Mentorship Assignments */}
          <Card
            title="Active Mentorship Sessions"
            subtitle="Training requests currently assigned to you"
          >
            {active_assignments.length === 0 ? (
              <p className="text-center py-8 text-gray-400 text-sm">
                You have no active mentorship assignments right now.
              </p>
            ) : (
              <div className="space-y-3">
                {active_assignments.map((asgn) => (
                  <div
                    key={asgn.assignment_id}
                    className="p-4 rounded-xl border border-blue-100 bg-blue-50/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-gray-900 text-sm">{asgn.skill_name}</h4>
                        <Badge variant={asgn.status?.toLowerCase()}>{asgn.status}</Badge>
                      </div>
                      <p className="text-xs text-gray-600 mt-0.5">
                        Learner: <span className="font-semibold text-gray-900">{asgn.employee_name}</span> &bull; Target: Level {asgn.requested_level}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {asgn.status === 'CLAIMED' && (
                        <Button
                          size="xs"
                          variant="secondary"
                          onClick={() => handleStart(asgn.request_id)}
                        >
                          <PlayIcon className="h-3.5 w-3.5 mr-1" />
                          Start Session
                        </Button>
                      )}
                      <Button
                        size="xs"
                        variant="primary"
                        onClick={() => handleComplete(asgn.request_id)}
                      >
                        <CheckBadgeIcon className="h-3.5 w-3.5 mr-1" />
                        Complete Mentorship
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Right Col: SME Skill Badges */}
        <div>
          <Card title="My Verified Expert Skills" subtitle="Skills you are certified to teach">
            {sme_skills.length === 0 ? (
              <p className="text-center py-8 text-gray-400 text-sm">No skills found.</p>
            ) : (
              <div className="space-y-2.5">
                {sme_skills.map((s, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-lg border border-gray-100 bg-gray-50/50 flex items-center justify-between"
                  >
                    <div>
                      <p className="font-semibold text-sm text-gray-900">{s.skill_name}</p>
                      <p className="text-[11px] text-gray-400">{s.skill_category}</p>
                    </div>
                    <div className="text-right">
                      <span className="inline-flex px-2 py-0.5 rounded text-xs font-bold bg-purple-100 text-purple-800">
                        Level {s.current_level}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
