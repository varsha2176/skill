import React, { useState, useEffect } from 'react';
import { trainingService } from '../../services/training';
import { skillsService } from '../../services/skills';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { formatDate, formatRelativeTime } from '../../utils/calculations';
import {
  PlusIcon,
  XMarkIcon,
  ChatBubbleLeftRightIcon,
  AcademicCapIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

export function EmployeeTraining() {
  const [requests, setRequests] = useState([]);
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ALL');

  // Request Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedSkillId, setSelectedSkillId] = useState('');
  const [requestedLevel, setRequestedLevel] = useState(3);
  const [priority, setPriority] = useState('MEDIUM');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const [reqList, allSkills] = await Promise.all([
        trainingService.getMyRequests(),
        skillsService.getAllSkills(),
      ]);
      setRequests(reqList || []);
      setSkills(allSkills || []);
    } catch (err) {
      toast.error('Failed to load training requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleCreateRequest = async (e) => {
    e.preventDefault();
    if (!selectedSkillId) {
      toast.error('Please choose a skill');
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
      toast.success('Training request created!');
      setModalOpen(false);
      setSelectedSkillId('');
      setMessage('');
      fetchRequests();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelRequest = async (requestId) => {
    if (!window.confirm('Cancel this training request?')) return;
    try {
      await trainingService.cancelRequest(requestId, 'Cancelled by employee');
      toast.success('Request cancelled');
      fetchRequests();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Could not cancel request');
    }
  };

  if (loading) {
    return (
      <div className="py-24 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading training requests..." />
      </div>
    );
  }

  const tabs = ['ALL', 'PENDING', 'CLAIMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
  const filteredRequests = requests.filter(
    (r) => activeTab === 'ALL' || r.status?.toUpperCase() === activeTab
  );

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Training &amp; Mentorship</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Submit requests to Subject Matter Experts (SMEs) to master critical competencies.
          </p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <PlusIcon className="h-4 w-4 mr-1.5" />
          Request Mentoring
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200 overflow-x-auto">
        {tabs.map((tab) => {
          const count =
            tab === 'ALL'
              ? requests.length
              : requests.filter((r) => r.status?.toUpperCase() === tab).length;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 px-3 text-sm font-semibold whitespace-nowrap transition border-b-2 cursor-pointer ${
                activeTab === tab
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.replace('_', ' ')} ({count})
            </button>
          );
        })}
      </div>

      {/* Requests List */}
      {filteredRequests.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <AcademicCapIcon className="h-10 w-10 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500 text-sm">No training requests found in this category.</p>
            <Button size="sm" variant="outline" className="mt-3" onClick={() => setModalOpen(true)}>
              Submit a request
            </Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredRequests.map((req) => (
            <div
              key={req.id}
              className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-bold text-base text-gray-900">{req.skill_name}</h3>
                  <Badge variant={req.priority?.toLowerCase()}>{req.priority}</Badge>
                  <Badge variant={req.status?.toLowerCase()}>{req.status}</Badge>
                </div>
                <p className="text-xs text-gray-500">
                  Target Proficiency: <span className="font-semibold text-gray-700">Level {req.requested_level}</span> &bull; Submitted {formatRelativeTime(req.created_at)}
                </p>
                {req.message && (
                  <p className="text-xs text-gray-600 bg-gray-50 p-2 rounded-lg border border-gray-100 max-w-xl">
                    &ldquo;{req.message}&rdquo;
                  </p>
                )}
                {req.sme_name && (
                  <p className="text-xs text-indigo-700 font-medium">
                    Mentoring by: <span className="font-bold">{req.sme_name}</span>
                  </p>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2">
                {req.status === 'PENDING' && (
                  <Button
                    size="xs"
                    variant="danger"
                    onClick={() => handleCancelRequest(req.id)}
                  >
                    Cancel Request
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New Request Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="New Training Request">
        <form onSubmit={handleCreateRequest} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Target Skill</label>
            <select
              value={selectedSkillId}
              onChange={(e) => setSelectedSkillId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              required
            >
              <option value="">-- Choose skill --</option>
              {skills.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.category})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Desired Level (1-5)</label>
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
            <label className="block text-xs font-medium text-gray-700 mb-1">Urgency / Priority</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="LOW">Low - General upskilling</option>
              <option value="MEDIUM">Medium - Quarterly goal</option>
              <option value="HIGH">High - Immediate project need</option>
              <option value="CRITICAL">Critical - Blocking release / deployment</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Goals &amp; Details</label>
            <textarea
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="What specifically would you like to achieve in this mentoring program?"
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
