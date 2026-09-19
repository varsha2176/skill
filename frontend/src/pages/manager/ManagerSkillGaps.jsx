import React, { useState, useEffect } from 'react';
import { usersService } from '../../services/users';
import { skillsService } from '../../services/skills';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { ProgressBar } from '../../components/common/ProgressBar';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { getGapColor } from '../../utils/calculations';
import { PlusIcon, UserCircleIcon, SparklesIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

export function ManagerSkillGaps() {
  const [teamMembers, setTeamMembers] = useState([]);
  const [selectedMemberId, setSelectedMemberId] = useState(null);
  const [memberGaps, setMemberGaps] = useState([]);
  const [availableSkills, setAvailableSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [gapsLoading, setGapsLoading] = useState(false);

  // Target modal
  const [targetModalOpen, setTargetModalOpen] = useState(false);
  const [targetSkillId, setTargetSkillId] = useState('');
  const [targetLevel, setTargetLevel] = useState(4);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchTeam = async () => {
      try {
        setLoading(true);
        const [members, skillsList] = await Promise.all([
          usersService.getTeamMembers(),
          skillsService.getAllSkills(),
        ]);
        setTeamMembers(members || []);
        setAvailableSkills(skillsList || []);
        if (members && members.length > 0) {
          setSelectedMemberId(members[0].id);
        }
      } catch (err) {
        toast.error('Failed to load team data');
      } finally {
        setLoading(false);
      }
    };
    fetchTeam();
  }, []);

  useEffect(() => {
    if (!selectedMemberId) return;
    const fetchMemberGaps = async () => {
      try {
        setGapsLoading(true);
        const gaps = await skillsService.getSkillGaps(selectedMemberId);
        setMemberGaps(gaps || []);
      } catch (err) {
        toast.error('Failed to load member skill gaps');
      } finally {
        setGapsLoading(false);
      }
    };
    fetchMemberGaps();
  }, [selectedMemberId]);

  const handleAssignTarget = async (e) => {
    e.preventDefault();
    if (!targetSkillId || !selectedMemberId) return;
    try {
      setSubmitting(true);
      await skillsService.addTargetSkill({
        employee_id: selectedMemberId,
        skill_id: Number(targetSkillId),
        target_level: Number(targetLevel),
      });
      toast.success('Target skill assigned to team member!');
      setTargetModalOpen(false);
      // Refresh gaps
      const gaps = await skillsService.getSkillGaps(selectedMemberId);
      setMemberGaps(gaps || []);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to assign target');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading team intelligence..." />
      </div>
    );
  }

  const activeMember = teamMembers.find((m) => m.id === selectedMemberId);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Team Gap Analysis &amp; Goal Setting</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Identify readiness gaps per team member and assign target development goals.
          </p>
        </div>
        <Button onClick={() => setTargetModalOpen(true)}>
          <PlusIcon className="h-4 w-4 mr-1.5" />
          Assign Target Skill
        </Button>
      </div>

      {/* Member selection tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {teamMembers.map((m) => (
          <button
            key={m.id}
            onClick={() => setSelectedMemberId(m.id)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer flex items-center gap-2 ${
              selectedMemberId === m.id
                ? 'bg-emerald-700 text-white shadow-sm'
                : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <UserCircleIcon className="h-4 w-4" />
            {m.name}
          </button>
        ))}
      </div>

      {/* Gaps Display */}
      <Card
        title={`Competency Analysis: ${activeMember?.name || 'Selected Member'}`}
        subtitle={`${activeMember?.department || ''} &bull; ${activeMember?.experience_level || ''} Level`}
      >
        {gapsLoading ? (
          <div className="py-12 flex justify-center">
            <LoadingSpinner size="md" />
          </div>
        ) : memberGaps.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm">
            No target skills assigned to this team member yet. Click "Assign Target Skill" above.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-100 text-xs font-semibold uppercase text-gray-500 bg-gray-50/50">
                <tr>
                  <th className="py-3 px-4">Skill</th>
                  <th className="py-3 px-4">Current Level</th>
                  <th className="py-3 px-4">Target Level</th>
                  <th className="py-3 px-4">Gap</th>
                  <th className="py-3 px-4">Readiness</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {memberGaps.map((g) => (
                  <tr key={g.skill_id} className="hover:bg-gray-50/60 transition">
                    <td className="py-3.5 px-4 font-semibold text-gray-900">{g.skill_name}</td>
                    <td className="py-3.5 px-4">Level {g.current_level}</td>
                    <td className="py-3.5 px-4 font-semibold text-blue-600">Level {g.target_level}</td>
                    <td className="py-3.5 px-4 font-bold">
                      {g.gap <= 0 ? <span className="text-green-600">Met</span> : <span className="text-red-500">-{g.gap}</span>}
                    </td>
                    <td className="py-3.5 px-4 w-40">
                      <ProgressBar value={g.readiness_percentage} showLabel size="sm" />
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${getGapColor(g.gap_status)}`}>
                        {g.gap_status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Assign Target Modal */}
      <Modal
        isOpen={targetModalOpen}
        onClose={() => setTargetModalOpen(false)}
        title={`Assign Target to ${activeMember?.name}`}
      >
        <form onSubmit={handleAssignTarget} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Target Skill</label>
            <select
              value={targetSkillId}
              onChange={(e) => setTargetSkillId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              required
            >
              <option value="">-- Choose skill --</option>
              {availableSkills.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.category})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Target Level (1-5)</label>
            <select
              value={targetLevel}
              onChange={(e) => setTargetLevel(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            >
              <option value={1}>Level 1 - Beginner</option>
              <option value={2}>Level 2 - Basic</option>
              <option value={3}>Level 3 - Intermediate</option>
              <option value={4}>Level 4 - Advanced</option>
              <option value={5}>Level 5 - Expert</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
            <Button variant="secondary" type="button" onClick={() => setTargetModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Assigning...' : 'Assign Target'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
