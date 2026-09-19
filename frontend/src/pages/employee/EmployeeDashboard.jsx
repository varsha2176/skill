import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { dashboardService } from '../../services/dashboard';
import { trainingService } from '../../services/training';
import { skillsService } from '../../services/skills';
import { StatCard } from '../../components/common/StatCard';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { ProgressBar } from '../../components/common/ProgressBar';
import { Modal } from '../../components/common/Modal';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { SkillRadar } from '../../components/charts/SkillRadar';
import { SkillBarChart } from '../../components/charts/SkillBarChart';
import { formatRelativeTime, getGapColor } from '../../utils/calculations';
import {
  AcademicCapIcon,
  ChartBarIcon,
  ClipboardDocumentCheckIcon,
  ArrowTrendingUpIcon,
  PlusIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

export function EmployeeDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Quick training request modal
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [allSkills, setAllSkills] = useState([]);
  const [selectedSkillId, setSelectedSkillId] = useState('');
  const [requestedLevel, setRequestedLevel] = useState(3);
  const [priority, setPriority] = useState('MEDIUM');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await dashboardService.getEmployeeDashboard();
      setData(res);
    } catch (err) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleOpenRequestModal = async (prefillSkillId = null) => {
    try {
      if (allSkills.length === 0) {
        const skillsList = await skillsService.getAllSkills();
        setAllSkills(skillsList);
      }
      if (prefillSkillId) {
        setSelectedSkillId(prefillSkillId);
      } else if (allSkills.length > 0) {
        setSelectedSkillId(allSkills[0].id);
      }
      setRequestModalOpen(true);
    } catch (err) {
      toast.error('Could not load skills list');
    }
  };

  const handleCreateRequest = async (e) => {
    e.preventDefault();
    if (!selectedSkillId) {
      toast.error('Please select a skill');
      return;
    }
    try {
      setSubmitting(true);
      await trainingService.createTrainingRequest({
        skill_id: Number(selectedSkillId),
        requested_level: Number(requestedLevel),
        priority,
        message,
      });
      toast.success('Training request created successfully!');
      setRequestModalOpen(false);
      setMessage('');
      fetchDashboard();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to submit training request');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading dashboard..." />
      </div>
    );
  }

  const {
    user_name,
    overall_readiness = 0,
    total_skills = 0,
    skill_gaps_count = 0,
    training_requests_count = 0,
    radar_data = [],
    skill_gaps = [],
    recent_training_requests = [],
  } = data || {};

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-navy-900 rounded-2xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full bg-blue-500/30 text-blue-200 text-xs font-semibold uppercase tracking-wider">
                Employee Portal
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold">Welcome back, {user_name}!</h1>
            <p className="text-blue-100/80 text-sm mt-1 max-w-xl">
              Track your skill development, close gaps with expert SME mentoring, and achieve market-ready capability.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              className="bg-white/15 hover:bg-white/25 text-white border-white/20"
              onClick={() => handleOpenRequestModal()}
            >
              <PlusIcon className="h-4 w-4 mr-1" />
              Request Training
            </Button>
            <Button
              className="bg-white text-blue-900 hover:bg-blue-50 font-semibold shadow"
              onClick={() => navigate('/employee/roadmap')}
            >
              <SparklesIcon className="h-4 w-4 mr-1 text-blue-600" />
              View Roadmap
            </Button>
          </div>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard
          title="Overall Readiness"
          value={`${overall_readiness}%`}
          subtitle="Target skill attainment"
          icon={ArrowTrendingUpIcon}
          color="blue"
        />
        <StatCard
          title="Total Skills"
          value={total_skills}
          subtitle="Verified & self-reported"
          icon={AcademicCapIcon}
          color="purple"
        />
        <StatCard
          title="Skill Gaps"
          value={skill_gaps_count}
          subtitle="Identified areas to improve"
          icon={ChartBarIcon}
          color={skill_gaps_count > 0 ? 'orange' : 'green'}
        />
        <StatCard
          title="Training Requests"
          value={training_requests_count}
          subtitle="Active & completed"
          icon={ClipboardDocumentCheckIcon}
          color="indigo"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Radar Chart */}
        <Card title="Skill Readiness Radar" subtitle="Current vs Target level comparison">
          {radar_data.length > 0 ? (
            <SkillRadar data={radar_data} />
          ) : (
            <p className="text-center py-12 text-gray-400 text-sm">No skill data available for radar.</p>
          )}
        </Card>

        {/* Bar Chart */}
        <Card title="Skill Levels Breakdown" subtitle="Proficiency comparison">
          {radar_data.length > 0 ? (
            <SkillBarChart data={radar_data} />
          ) : (
            <p className="text-center py-12 text-gray-400 text-sm">No skill data available.</p>
          )}
        </Card>
      </div>

      {/* Target Skills & Gaps Table */}
      <Card
        title="Priority Skill Gaps"
        subtitle="Skills requiring advancement for target readiness"
        action={
          <Button size="sm" variant="outline" onClick={() => navigate('/employee/skill-gaps')}>
            View All Gaps
          </Button>
        }
      >
        {skill_gaps.length === 0 ? (
          <p className="text-center py-8 text-gray-400 text-sm">No target skills or gaps defined.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-100 text-xs font-semibold uppercase text-gray-500 bg-gray-50/50">
                <tr>
                  <th className="py-3 px-4">Skill</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Current</th>
                  <th className="py-3 px-4">Target</th>
                  <th className="py-3 px-4">Readiness</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {skill_gaps.slice(0, 6).map((gap) => (
                  <tr key={gap.skill_id} className="hover:bg-gray-50/60 transition">
                    <td className="py-3 px-4 font-medium text-gray-900">{gap.skill_name}</td>
                    <td className="py-3 px-4 text-gray-500">{gap.skill_category}</td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-gray-100 text-gray-700">
                        L{gap.current_level}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-blue-50 text-blue-700">
                        L{gap.target_level}
                      </span>
                    </td>
                    <td className="py-3 px-4 w-36">
                      <ProgressBar
                        value={gap.readiness_percentage}
                        showLabel
                        size="sm"
                      />
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${getGapColor(gap.gap_status)}`}>
                        {gap.gap_status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {gap.gap > 0 && (
                        <button
                          onClick={() => handleOpenRequestModal(gap.skill_id)}
                          className="text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                        >
                          Request Training
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Recent Training Requests */}
      <Card
        title="Recent Training Requests"
        subtitle="Status of your mentoring and skill acquisition requests"
        action={
          <Button size="sm" variant="outline" onClick={() => navigate('/employee/training')}>
            Manage Requests
          </Button>
        }
      >
        {recent_training_requests.length === 0 ? (
          <p className="text-center py-8 text-gray-400 text-sm">No training requests submitted yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-100 text-xs font-semibold uppercase text-gray-500 bg-gray-50/50">
                <tr>
                  <th className="py-3 px-4">Skill</th>
                  <th className="py-3 px-4">Requested Level</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Assigned SME</th>
                  <th className="py-3 px-4 text-right">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recent_training_requests.map((req) => (
                  <tr key={req.id} className="hover:bg-gray-50/60 transition">
                    <td className="py-3 px-4 font-medium text-gray-900">{req.skill_name}</td>
                    <td className="py-3 px-4">Level {req.requested_level}</td>
                    <td className="py-3 px-4">
                      <Badge variant={req.priority?.toLowerCase()}>{req.priority}</Badge>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={req.status?.toLowerCase()}>{req.status}</Badge>
                    </td>
                    <td className="py-3 px-4 text-gray-600">{req.sme_name || 'Pending claim'}</td>
                    <td className="py-3 px-4 text-right text-gray-400 text-xs">
                      {formatRelativeTime(req.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Request Training Modal */}
      <Modal
        isOpen={requestModalOpen}
        onClose={() => setRequestModalOpen(false)}
        title="Request Skill Training"
      >
        <form onSubmit={handleCreateRequest} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Select Skill</label>
            <select
              value={selectedSkillId}
              onChange={(e) => setSelectedSkillId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              required
            >
              <option value="">-- Choose a skill --</option>
              {allSkills.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.category})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Target Proficiency Level (1 - 5)</label>
            <select
              value={requestedLevel}
              onChange={(e) => setRequestedLevel(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value={1}>Level 1 - Beginner</option>
              <option value={2}>Level 2 - Basic</option>
              <option value={3}>Level 3 - Intermediate</option>
              <option value={4}>Level 4 - Advanced</option>
              <option value={5}>Level 5 - Expert</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Priority</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="CRITICAL">Critical</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Message / Learning Goals</label>
            <textarea
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Describe your current blockers or specific objectives..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
            <Button variant="secondary" type="button" onClick={() => setRequestModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit Request'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
