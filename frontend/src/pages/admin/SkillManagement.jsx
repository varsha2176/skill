import React, { useState, useEffect } from 'react';
import { skillsService } from '../../services/skills';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  PencilSquareIcon,
  TrashIcon,
  AcademicCapIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

export function SkillManagement() {
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  // Add modal
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [skillName, setSkillName] = useState('');
  const [skillCategory, setSkillCategory] = useState('Programming');
  const [skillDesc, setSkillDesc] = useState('');
  const [saving, setSaving] = useState(false);

  // Edit modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingSkill, setEditingSkill] = useState(null);
  const [editName, setEditName] = useState('');
  const [editCat, setEditCat] = useState('');
  const [editDesc, setEditDesc] = useState('');

  const fetchSkills = async () => {
    try {
      setLoading(true);
      const res = await skillsService.getAllSkills();
      setSkills(res || []);
    } catch (err) {
      toast.error('Failed to load skills taxonomy');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSkills();
  }, []);

  const handleCreateSkill = async (e) => {
    e.preventDefault();
    if (!skillName) return;
    try {
      setSaving(true);
      await skillsService.createSkill({
        name: skillName,
        category: skillCategory,
        description: skillDesc,
      });
      toast.success('Skill added to taxonomy!');
      setAddModalOpen(false);
      setSkillName('');
      setSkillDesc('');
      fetchSkills();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to create skill');
    } finally {
      setSaving(false);
    }
  };

  const handleOpenEdit = (s) => {
    setEditingSkill(s);
    setEditName(s.name);
    setEditCat(s.category);
    setEditDesc(s.description || '');
    setEditModalOpen(true);
  };

  const handleUpdateSkill = async (e) => {
    e.preventDefault();
    if (!editingSkill) return;
    try {
      setSaving(true);
      await skillsService.updateSkill(editingSkill.id, {
        name: editName,
        category: editCat,
        description: editDesc,
      });
      toast.success('Skill updated!');
      setEditModalOpen(false);
      setEditingSkill(null);
      fetchSkills();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to update skill');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSkill = async (id) => {
    if (!window.confirm('Delete this skill from master taxonomy?')) return;
    try {
      await skillsService.deleteSkill(id);
      toast.success('Skill deleted');
      fetchSkills();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Cannot delete skill');
    }
  };

  if (loading) {
    return (
      <div className="py-24 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading master taxonomy..." />
      </div>
    );
  }

  const categories = ['ALL', ...new Set(skills.map((s) => s.category).filter(Boolean))];

  const filtered = skills.filter((s) => {
    const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === 'ALL' || s.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Skill Taxonomy Management</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Define corporate competency frameworks and standard skill categories.
          </p>
        </div>
        <Button onClick={() => setAddModalOpen(true)}>
          <PlusIcon className="h-4 w-4 mr-1.5" />
          Add Master Skill
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-72">
          <MagnifyingGlassIcon className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Search skill name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setSelectedCategory(c)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                selectedCategory === c
                  ? 'bg-orange-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Skills Table */}
      <Card>
        {filtered.length === 0 ? (
          <p className="text-center py-12 text-gray-400 text-sm">No skills found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-100 text-xs font-semibold uppercase text-gray-500 bg-gray-50/50">
                <tr>
                  <th className="py-3 px-4">Skill Name</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50/60 transition">
                    <td className="py-3.5 px-4 font-semibold text-gray-900">{s.name}</td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex px-2 py-0.5 rounded text-xs font-semibold bg-gray-100 text-gray-700">
                        {s.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-gray-500 text-xs max-w-md">{s.description || '—'}</td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      <button
                        onClick={() => handleOpenEdit(s)}
                        className="p-1 rounded text-gray-400 hover:text-blue-600 cursor-pointer"
                        title="Edit Skill"
                      >
                        <PencilSquareIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteSkill(s.id)}
                        className="p-1 rounded text-gray-400 hover:text-red-600 cursor-pointer"
                        title="Delete Skill"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Add Skill Modal */}
      <Modal isOpen={addModalOpen} onClose={() => setAddModalOpen(false)} title="Add Skill to Taxonomy">
        <form onSubmit={handleCreateSkill} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Skill Name</label>
            <input
              type="text"
              required
              value={skillName}
              onChange={(e) => setSkillName(e.target.value)}
              placeholder="e.g. GraphQL, Terraform, PyTorch"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Category</label>
            <input
              type="text"
              required
              value={skillCategory}
              onChange={(e) => setSkillCategory(e.target.value)}
              placeholder="e.g. Frontend, DevOps, Machine Learning"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
            <textarea
              rows={3}
              value={skillDesc}
              onChange={(e) => setSkillDesc(e.target.value)}
              placeholder="Competency description and standards..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
            <Button variant="secondary" type="button" onClick={() => setAddModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Add Skill'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Skill Modal */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setEditingSkill(null);
        }}
        title={`Edit Skill: ${editingSkill?.name}`}
      >
        <form onSubmit={handleUpdateSkill} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Skill Name</label>
            <input
              type="text"
              required
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Category</label>
            <input
              type="text"
              required
              value={editCat}
              onChange={(e) => setEditCat(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
            <textarea
              rows={3}
              value={editDesc}
              onChange={(e) => setEditDesc(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none"
            />
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
            <Button type="submit" disabled={saving}>
              {saving ? 'Updating...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
