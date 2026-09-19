import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { skillsService } from '../../services/skills';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import api from '../../services/api';
import { getInitials } from '../../utils/calculations';
import {
  UserCircleIcon,
  EnvelopeIcon,
  BuildingOfficeIcon,
  MapPinIcon,
  BriefcaseIcon,
  AcademicCapIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

export function EmployeeProfile() {
  const { user } = useAuth();
  const [skills, setSkills] = useState([]);
  const [targets, setTargets] = useState([]);
  const [loading, setLoading] = useState(true);

  const [smeStatus, setSmeStatus] = useState(null);
  const [smeModalOpen, setSmeModalOpen] = useState(false);
  const [availableSkills, setAvailableSkills] = useState([]);
  const [selectedSkillId, setSelectedSkillId] = useState('');
  const [reason, setReason] = useState('');
  const [requesting, setRequesting] = useState(false);

  const fetchSmeStatus = async () => {
    try {
      const res = await api.get('/sme-access/my-status');
      setSmeStatus(res.data);
    } catch {
      // Ignored if not applicable
    }
  };

  useEffect(() => {
    const loadProfileData = async () => {
      try {
        setLoading(true);
        const [userSkills, targetSkills] = await Promise.all([
          skillsService.getEmployeeSkills(),
          skillsService.getTargetSkills(),
        ]);
        setSkills(userSkills || []);
        setTargets(targetSkills || []);
        await fetchSmeStatus();
      } catch (err) {
        toast.error('Failed to load profile details');
      } finally {
        setLoading(false);
      }
    };
    loadProfileData();
  }, []);

  const openSmeModal = async () => {
    try {
      const res = await api.get('/sme-access/skills');
      setAvailableSkills(res.data || []);
      if (res.data?.length > 0) setSelectedSkillId(res.data[0].id);
      setSmeModalOpen(true);
    } catch {
      toast.error('Failed to load available skills');
    }
  };

  const handleRequestSme = async (e) => {
    e.preventDefault();
    try {
      setRequesting(true);
      await api.post('/sme-access/request', {
        skill_id: Number(selectedSkillId),
        reason,
      });
      toast.success('SME capability request submitted to your manager!');
      setSmeModalOpen(false);
      setReason('');
      await fetchSmeStatus();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to submit SME request');
    } finally {
      setRequesting(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading profile..." />
      </div>
    );
  }

  const validatedCount = skills.filter((s) => s.validated).length;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Profile Header Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-6">
        <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold shadow-md shadow-blue-500/20 flex-shrink-0">
          {getInitials(user?.name || user?.email || '?')}
        </div>
        <div className="text-center sm:text-left flex-1 min-w-0">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1">
            <h1 className="text-2xl font-bold text-gray-900">{user?.name || 'User Profile'}</h1>
            <Badge variant="blue">{user?.role}</Badge>
            {user?.is_sme ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-200">
                <ShieldCheckIcon className="h-3.5 w-3.5 text-purple-600" />
                Approved SME
              </span>
            ) : smeStatus?.has_pending_request ? (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                SME Request: Pending Manager Review
              </span>
            ) : null}
          </div>
          <p className="text-gray-500 text-sm">{user?.email}</p>
          <div className="mt-4 flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-gray-600">
            <span className="flex items-center gap-1.5">
              <BuildingOfficeIcon className="h-4 w-4 text-gray-400" />
              {user?.department || 'Engineering'}
            </span>
            <span className="flex items-center gap-1.5">
              <MapPinIcon className="h-4 w-4 text-gray-400" />
              {user?.location || 'Remote'}
            </span>
            <span className="flex items-center gap-1.5">
              <BriefcaseIcon className="h-4 w-4 text-gray-400" />
              {user?.experience_level || 'Mid'} Level
            </span>
          </div>

          {/* SME Action Button for regular employees */}
          {!user?.is_sme && (
            <div className="mt-4 pt-3 border-t border-gray-100">
              {smeStatus?.has_pending_request ? (
                <p className="text-xs text-amber-700 bg-amber-50 p-2.5 rounded-lg inline-block border border-amber-200">
                  Your SME capability application is pending manager approval.
                </p>
              ) : (
                <button
                  onClick={openSmeModal}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-purple-600 hover:bg-purple-700 text-white shadow-sm transition"
                >
                  <AcademicCapIcon className="h-4 w-4" />
                  Request SME Capability
                </button>
              )}
            </div>
          )}
        </div>
        <div className="flex sm:flex-col gap-3 text-center border-t sm:border-t-0 sm:border-l border-gray-100 pt-4 sm:pt-0 sm:pl-6">
          <div>
            <p className="text-2xl font-bold text-gray-900">{skills.length}</p>
            <p className="text-xs text-gray-500">Skills Total</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-green-600">{validatedCount}</p>
            <p className="text-xs text-gray-500">Manager Validated</p>
          </div>
        </div>
      </div>

      {/* Target Skills Summary */}
      <Card title="Assigned Target Skills" subtitle="Career and project readiness objectives">
        {targets.length === 0 ? (
          <p className="text-sm text-gray-400 py-6 text-center">No target skills assigned currently.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {targets.map((t) => (
              <div key={t.id} className="p-4 rounded-xl border border-gray-100 bg-gray-50/50 flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-sm text-gray-900">{t.skill_name}</h4>
                  <p className="text-xs text-gray-500">{t.skill_category}</p>
                  <p className="text-xs text-blue-600 mt-1">Current: L{t.current_level} &rarr; Target: L{t.target_level}</p>
                </div>
                <div className="text-right">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${
                    t.gap <= 0 ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
                  }`}>
                    {t.gap <= 0 ? 'Achieved' : `Gap: -${t.gap}`}
                  </span>
                  <p className="text-[11px] text-gray-400 mt-1">Readiness: {t.readiness_percentage}%</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* SME Request Modal */}
      <Modal
        isOpen={smeModalOpen}
        onClose={() => setSmeModalOpen(false)}
        title="Apply for Subject Matter Expert (SME) Capability"
      >
        <form onSubmit={handleRequestSme} className="space-y-4">
          <p className="text-xs text-gray-500">
            SME status enables you to mentor colleagues, claim incoming training requests, and lead technical sessions. Your submission requires direct Manager approval.
          </p>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
              Primary Skill Domain
            </label>
            <select
              value={selectedSkillId}
              onChange={(e) => setSelectedSkillId(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-purple-500"
            >
              {availableSkills.map((sk) => (
                <option key={sk.id} value={sk.id}>
                  {sk.name} ({sk.category})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
              Justification &amp; Experience
            </label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain your hands-on experience, key projects, and readiness to mentor others..."
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <Button variant="secondary" onClick={() => setSmeModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={requesting}>
              {requesting ? 'Submitting...' : 'Submit Request'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
