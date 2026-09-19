import React, { useState, useEffect } from 'react';
import { skillsService } from '../../services/skills';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import {
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  CheckBadgeIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

export function EmployeeSkills() {
  const [skills, setSkills] = useState([]);
  const [availableSkills, setAvailableSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  // Add Skill Modal
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [selectedSkillId, setSelectedSkillId] = useState('');
  const [newSkillLevel, setNewSkillLevel] = useState(3);
  const [adding, setAdding] = useState(false);

  // Edit Skill Modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingSkill, setEditingSkill] = useState(null);
  const [editLevel, setEditLevel] = useState(3);
  const [updating, setUpdating] = useState(false);

  const fetchSkills = async () => {
    try {
      setLoading(true);
      const [empSkills, all] = await Promise.all([
        skillsService.getEmployeeSkills(),
        skillsService.getAllSkills(),
      ]);
      setSkills(empSkills || []);
      setAvailableSkills(all || []);
    } catch (err) {
      toast.error('Failed to load skills');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSkills();
  }, []);

  const handleAddSkill = async (e) => {
    e.preventDefault();
    if (!selectedSkillId) {
      toast.error('Please select a skill');
      return;
    }
    try {
      setAdding(true);
      await skillsService.addEmployeeSkill({
        skill_id: Number(selectedSkillId),
        current_level: Number(newSkillLevel),
      });
      toast.success('Skill added successfully!');
      setAddModalOpen(false);
      setSelectedSkillId('');
      fetchSkills();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to add skill');
    } finally {
      setAdding(false);
    }
  };

  const handleUpdateLevel = async (e) => {
    e.preventDefault();
    if (!editingSkill) return;
    try {
      setUpdating(true);
      await skillsService.updateEmployeeSkill(editingSkill.id, {
        current_level: Number(editLevel),
      });
      toast.success('Skill level updated!');
      setEditModalOpen(false);
      setEditingSkill(null);
      fetchSkills();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to update skill level');
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteSkill = async (skillId) => {
    if (!window.confirm('Are you sure you want to remove this skill?')) return;
    try {
      await skillsService.deleteEmployeeSkill(skillId);
      toast.success('Skill removed');
      fetchSkills();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to remove skill');
    }
  };

  // Categories list
  const categories = ['ALL', ...new Set(skills.map((s) => s.skill_category).filter(Boolean))];

  // Filter skills
  const filteredSkills = skills.filter((s) => {
    const matchesSearch = s.skill_name.toLowerCase().includes(search.toLowerCase());
    const matchesCat = selectedCategory === 'ALL' || s.skill_category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  // Filter unadded skills for the dropdown
  const unaddedSkills = availableSkills.filter(
    (as) => !skills.some((s) => s.skill_id === as.id)
  );

  if (loading) {
    return (
      <div className="py-24 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading skills..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Skills Portfolio</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Manage your declared proficiencies and view manager validation status.
          </p>
        </div>
        <Button onClick={() => setAddModalOpen(true)}>
          <PlusIcon className="h-4 w-4 mr-1.5" />
          Add New Skill
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
        <div className="relative w-full sm:w-72">
          <MagnifyingGlassIcon className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Search skills..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Skills Grid */}
      {filteredSkills.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <p className="text-gray-400 text-sm">No skills found matching the criteria.</p>
            <Button size="sm" variant="outline" className="mt-3" onClick={() => setAddModalOpen(true)}>
              Add your first skill
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filteredSkills.map((s) => (
            <div
              key={s.id}
              className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <h3 className="font-bold text-gray-900 text-base">{s.skill_name}</h3>
                    <span className="text-xs font-medium text-gray-400">{s.skill_category}</span>
                  </div>
                  {s.validated ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200">
                      <CheckBadgeIcon className="h-3.5 w-3.5 text-green-600" />
                      Validated
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                      Self-declared
                    </span>
                  )}
                </div>

                {/* Level Display */}
                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-gray-500 font-medium">Proficiency Level</span>
                    <span className="font-bold text-blue-600">Level {s.current_level} of 5</span>
                  </div>
                  <div className="grid grid-cols-5 gap-1.5 h-2">
                    {[1, 2, 3, 4, 5].map((lvl) => (
                      <div
                        key={lvl}
                        className={`rounded-full ${
                          lvl <= s.current_level ? 'bg-blue-600' : 'bg-gray-200'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {s.validated_by_name && (
                  <p className="text-[11px] text-gray-400 mt-3">
                    Validated by {s.validated_by_name}
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="mt-5 pt-3 border-t border-gray-50 flex items-center justify-end gap-2">
                <button
                  onClick={() => {
                    setEditingSkill(s);
                    setEditLevel(s.current_level);
                    setEditModalOpen(true);
                  }}
                  className="p-1.5 rounded-lg text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition cursor-pointer"
                  title="Update Level"
                >
                  <PencilSquareIcon className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDeleteSkill(s.id)}
                  className="p-1.5 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                  title="Remove Skill"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Skill Modal */}
      <Modal isOpen={addModalOpen} onClose={() => setAddModalOpen(false)} title="Add Skill to Profile">
        <form onSubmit={handleAddSkill} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Skill</label>
            <select
              value={selectedSkillId}
              onChange={(e) => setSelectedSkillId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              required
            >
              <option value="">-- Select a skill --</option>
              {unaddedSkills.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.category})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Current Proficiency Level ({newSkillLevel}/5)
            </label>
            <select
              value={newSkillLevel}
              onChange={(e) => setNewSkillLevel(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value={1}>1 - Beginner (Basic concept awareness)</option>
              <option value={2}>2 - Basic (Can complete guided tasks)</option>
              <option value={3}>3 - Intermediate (Independent contributor)</option>
              <option value={4}>4 - Advanced (Subject authority &amp; problem solver)</option>
              <option value={5}>5 - Expert (Organization authority / architect)</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
            <Button variant="secondary" type="button" onClick={() => setAddModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={adding}>
              {adding ? 'Adding...' : 'Add Skill'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Level Modal */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setEditingSkill(null);
        }}
        title={`Update Level: ${editingSkill?.skill_name}`}
      >
        <form onSubmit={handleUpdateLevel} className="space-y-4">
          <p className="text-xs text-amber-600 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
            Note: Updating your self-declared proficiency will mark this skill for manager validation.
          </p>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              New Proficiency Level ({editLevel}/5)
            </label>
            <select
              value={editLevel}
              onChange={(e) => setEditLevel(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value={1}>1 - Beginner</option>
              <option value={2}>2 - Basic</option>
              <option value={3}>3 - Intermediate</option>
              <option value={4}>4 - Advanced</option>
              <option value={5}>5 - Expert</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
            <Button
              variant="secondary"
              type="button"
              onClick={() => {
                setEditModalOpen(false);
                setEditingSkill(null);
              }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={updating}>
              {updating ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
