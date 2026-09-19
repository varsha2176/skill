import React, { useState, useEffect } from 'react';
import { skillsService } from '../../services/skills';
import { trainingService } from '../../services/training';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { ProgressBar } from '../../components/common/ProgressBar';
import { Modal } from '../../components/common/Modal';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { getGapColor } from '../../utils/calculations';
import {
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

export function EmployeeSkillGaps() {
  const [gaps, setGaps] = useState([]);
  const [loading, setLoading] = useState(true);

  // Request Training modal
  const [modalOpen, setModalOpen] = useState(false);
  const [activeGap, setActiveGap] = useState(null);
  const [requestedLevel, setRequestedLevel] = useState(3);
  const [priority, setPriority] = useState('MEDIUM');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchGaps = async () => {
    try {
      setLoading(true);
      const res = await skillsService.getSkillGaps();
      setGaps(res || []);
    } catch (err) {
      toast.error('Failed to load skill gaps');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGaps();
  }, []);

  const openTrainingModal = (gap) => {
    setActiveGap(gap);
    setRequestedLevel(gap.target_level || 3);
    setPriority(gap.gap_status === 'CRITICAL' ? 'CRITICAL' : gap.gap >= 2 ? 'HIGH' : 'MEDIUM');
    setMessage(`Requesting mentoring to close gap on ${gap.skill_name} from L${gap.current_level} to L${gap.target_level}`);
    setModalOpen(true);
  };

  const handleSubmitRequest = async (e) => {
    e.preventDefault();
    if (!activeGap) return;
    try {
      setSubmitting(true);
      await trainingService.createTrainingRequest({
        skill_id: activeGap.skill_id,
        requested_level: Number(requestedLevel),
        priority,
        message,
      });
      toast.success('Training requested for ' + activeGap.skill_name);
      setModalOpen(false);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to request training');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Analyzing skill gaps..." />
      </div>
    );
  }

  const criticalCount = gaps.filter((g) => g.gap_status === 'CRITICAL').length;
  const readyCount = gaps.filter((g) => g.gap <= 0).length;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Skill Gap Analysis</h1>
        <p className="text-gray-500 text-sm mt-0.5">
          Benchmark your capabilities against target role requirements and discover training opportunities.
        </p>
      </div>

      {/* Overview stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-red-50 text-red-600 rounded-xl">
            <ExclamationTriangleIcon className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Critical Gaps</p>
            <p className="text-2xl font-bold text-red-600">{criticalCount}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-green-50 text-green-600 rounded-xl">
            <CheckCircleIcon className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Target Ready Skills</p>
            <p className="text-2xl font-bold text-green-600">{readyCount}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <SparklesIcon className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Total Tracked Targets</p>
            <p className="text-2xl font-bold text-blue-600">{gaps.length}</p>
          </div>
        </div>
      </div>

      {/* Gaps Table */}
      <Card>
        {gaps.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400 text-sm">No target skills assigned. Your manager can assign target skill proficiencies.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-100 text-xs font-semibold uppercase text-gray-500 bg-gray-50/50">
                <tr>
                  <th className="py-3 px-4">Skill</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Current Level</th>
                  <th className="py-3 px-4">Target Level</th>
                  <th className="py-3 px-4">Gap</th>
                  <th className="py-3 px-4">Readiness</th>
                  <th className="py-3 px-4">Gap Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {gaps.map((gap) => (
                  <tr key={gap.skill_id} className="hover:bg-gray-50/60 transition">
                    <td className="py-3.5 px-4 font-semibold text-gray-900">{gap.skill_name}</td>
                    <td className="py-3.5 px-4 text-gray-500">{gap.skill_category}</td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex px-2 py-0.5 rounded text-xs font-semibold bg-gray-100 text-gray-700">
                        Level {gap.current_level}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex px-2 py-0.5 rounded text-xs font-semibold bg-blue-50 text-blue-700">
                        Level {gap.target_level}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-semibold">
                      {gap.gap <= 0 ? (
                        <span className="text-green-600 font-bold">None (Met)</span>
                      ) : (
                        <span className="text-red-500">-{gap.gap}</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 w-40">
                      <ProgressBar value={gap.readiness_percentage} showLabel size="sm" />
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${getGapColor(gap.gap_status)}`}>
                        {gap.gap_status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {gap.gap > 0 ? (
                        <Button
                          size="xs"
                          variant="primary"
                          onClick={() => openTrainingModal(gap)}
                        >
                          Request Training
                        </Button>
                      ) : (
                        <span className="text-xs text-green-600 font-medium inline-flex items-center gap-1">
                          <CheckCircleIcon className="h-3.5 w-3.5" /> Met
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={`Request Training: ${activeGap?.skill_name}`}
      >
        <form onSubmit={handleSubmitRequest} className="space-y-4">
          <div className="p-3 bg-blue-50 rounded-lg text-xs text-blue-800 flex items-center justify-between">
            <span>Current: Level {activeGap?.current_level}</span>
            <ArrowRightIcon className="h-4 w-4 text-blue-500" />
            <span>Target: Level {activeGap?.target_level}</span>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Target Proficiency Level</label>
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
            <label className="block text-xs font-medium text-gray-700 mb-1">Message for SME Mentor</label>
            <textarea
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
            <Button variant="secondary" type="button" onClick={() => setModalOpen(false)}>
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
