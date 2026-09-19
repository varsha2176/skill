import React, { useState, useEffect } from 'react';
import { skillsService } from '../../services/skills';
import api from '../../services/api';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { formatRelativeTime, formatDate } from '../../utils/calculations';
import {
  ShieldCheckIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

export function SkillValidations() {
  const [pending, setPending] = useState([]);
  const [smeRequests, setSmeRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('SKILLS'); // 'SKILLS' or 'SME_REQUESTS'

  // Validate Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [approvedLevel, setApprovedLevel] = useState(3);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchValidations = async () => {
    try {
      setLoading(true);
      const [valRes, smeRes] = await Promise.all([
        skillsService.getPendingValidations().catch(() => []),
        api.get('/sme-access/pending').then(r => r.data).catch(() => []),
      ]);
      setPending(valRes || []);
      setSmeRequests(smeRes || []);
    } catch (err) {
      toast.error('Failed to load validations queue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchValidations();
  }, []);

  const handleSmeAction = async (requestId, approve) => {
    try {
      const endpoint = approve
        ? `/sme-access/${requestId}/approve`
        : `/sme-access/${requestId}/reject`;
      await api.put(endpoint);
      toast.success(approve ? 'SME capability granted to employee!' : 'SME capability request rejected');
      fetchValidations();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to process SME request');
    }
  };

  const openApproveModal = (item) => {
    setSelectedItem(item);
    setApprovedLevel(item.current_level || 3);
    setComment('Verified through recent project deliverables.');
    setModalOpen(true);
  };

  const handleValidate = async (approved) => {
    if (!selectedItem) return;
    try {
      setSubmitting(true);
      await api.put(`/validations/${selectedItem.employee_skill_id}`, {
        approved,
        new_level: approved ? Number(approvedLevel) : selectedItem.current_level,
        comment,
      });
      toast.success(approved ? 'Skill officially validated!' : 'Skill declared unverified');
      setModalOpen(false);
      setSelectedItem(null);
      fetchValidations();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Validation action failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading validation queue..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Skill Validations Queue</h1>
        <p className="text-gray-500 text-sm mt-0.5">
          Review self-reported employee capabilities, verify proficiency levels, and certify competencies.
        </p>
      </div>

      <div className="flex border-b border-gray-200 gap-4">
        <button
          onClick={() => setActiveTab('SKILLS')}
          className={`pb-3 font-semibold text-sm border-b-2 transition ${
            activeTab === 'SKILLS'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Team Skill Validations ({pending.length})
        </button>
        <button
          onClick={() => setActiveTab('SME_REQUESTS')}
          className={`pb-3 font-semibold text-sm border-b-2 transition flex items-center gap-1.5 ${
            activeTab === 'SME_REQUESTS'
              ? 'border-purple-600 text-purple-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <span>SME Capability Applications</span>
          {smeRequests.length > 0 && (
            <span className="px-1.5 py-0.2 bg-purple-100 text-purple-800 rounded-full text-xs font-bold">
              {smeRequests.length}
            </span>
          )}
        </button>
      </div>

      {activeTab === 'SKILLS' ? (
        <Card>
          {pending.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircleIcon className="h-10 w-10 text-green-500 mx-auto mb-2" />
              <h3 className="font-bold text-gray-900">Queue is Clear!</h3>
              <p className="text-gray-500 text-sm mt-1">All declared team member skills have been validated.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-gray-100 text-xs font-semibold uppercase text-gray-500 bg-gray-50/50">
                  <tr>
                    <th className="py-3 px-4">Employee</th>
                    <th className="py-3 px-4">Skill</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Declared Level</th>
                    <th className="py-3 px-4">Submission Date</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {pending.map((item) => (
                    <tr key={item.employee_skill_id} className="hover:bg-gray-50/60 transition">
                      <td className="py-3.5 px-4 font-semibold text-gray-900">{item.employee_name}</td>
                      <td className="py-3.5 px-4 font-medium text-blue-700">{item.skill_name}</td>
                      <td className="py-3.5 px-4 text-gray-500">{item.skill_category}</td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex px-2 py-0.5 rounded text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                          Level {item.current_level} (Declared)
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-gray-400 text-xs">
                        {formatRelativeTime(item.created_at)}
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-2">
                        <Button
                          size="xs"
                          variant="primary"
                          onClick={() => openApproveModal(item)}
                        >
                          <ShieldCheckIcon className="h-3.5 w-3.5 mr-1" />
                          Validate
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      ) : (
        <Card>
          {smeRequests.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircleIcon className="h-10 w-10 text-purple-500 mx-auto mb-2" />
              <h3 className="font-bold text-gray-900">No Pending SME Applications</h3>
              <p className="text-gray-500 text-sm mt-1">
                When employees apply for Subject Matter Expert privileges, their applications will appear here for review.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-gray-100 text-xs font-semibold uppercase text-gray-500 bg-gray-50/50">
                  <tr>
                    <th className="py-3 px-4">Applicant</th>
                    <th className="py-3 px-4">Department</th>
                    <th className="py-3 px-4">Skill Domain</th>
                    <th className="py-3 px-4">Justification</th>
                    <th className="py-3 px-4 text-right">Review Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {smeRequests.map((req) => (
                    <tr key={req.id} className="hover:bg-gray-50/60 transition">
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-gray-900">{req.user_name}</div>
                        <div className="text-xs text-gray-400">{req.user_email}</div>
                      </td>
                      <td className="py-3.5 px-4 text-gray-600">{req.department}</td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex px-2 py-0.5 rounded text-xs font-semibold bg-purple-50 text-purple-800 border border-purple-200">
                          {req.skill_name || 'General SME Domain'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-gray-600 text-xs max-w-xs truncate">
                        {req.reason || 'No statement provided.'}
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-2">
                        <Button
                          size="xs"
                          variant="secondary"
                          onClick={() => handleSmeAction(req.id, false)}
                        >
                          Reject
                        </Button>
                        <Button
                          size="xs"
                          variant="primary"
                          onClick={() => handleSmeAction(req.id, true)}
                        >
                          <ShieldCheckIcon className="h-3.5 w-3.5 mr-1" />
                          Approve SME
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* Validation Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedItem(null);
        }}
        title={`Validate Skill: ${selectedItem?.skill_name}`}
      >
        <div className="space-y-4">
          <div className="p-3 bg-gray-50 rounded-lg text-xs space-y-1 text-gray-600">
            <p>
              Candidate: <span className="font-bold text-gray-900">{selectedItem?.employee_name}</span>
            </p>
            <p>
              Declared Proficiency: <span className="font-bold text-blue-600">Level {selectedItem?.current_level}</span>
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Certified Proficiency Level (1 - 5)
            </label>
            <select
              value={approvedLevel}
              onChange={(e) => setApprovedLevel(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            >
              <option value={1}>Level 1 - Beginner</option>
              <option value={2}>Level 2 - Basic</option>
              <option value={3}>Level 3 - Intermediate</option>
              <option value={4}>Level 4 - Advanced</option>
              <option value={5}>Level 5 - Expert</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Validation Comment / Feedback</label>
            <textarea
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="E.g. Validated via code review and pull requests..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-between items-center pt-3 border-t border-gray-100">
            <Button
              variant="danger"
              type="button"
              disabled={submitting}
              onClick={() => handleValidate(false)}
            >
              Reject Validation
            </Button>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                type="button"
                onClick={() => setModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                type="button"
                disabled={submitting}
                onClick={() => handleValidate(true)}
              >
                {submitting ? 'Saving...' : 'Confirm Validation'}
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
