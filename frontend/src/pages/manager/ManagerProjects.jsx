import React, { useState, useEffect } from 'react';
import { projectsService } from '../../services/projects';
import { skillsService } from '../../services/skills';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { ProgressBar } from '../../components/common/ProgressBar';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ReadinessChart } from '../../components/charts/ReadinessChart';
import {
  FolderPlusIcon,
  PlusIcon,
  ChartBarSquareIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

export function ManagerProjects() {
  const [projects, setProjects] = useState([]);
  const [availableSkills, setAvailableSkills] = useState([]);
  const [loading, setLoading] = useState(true);

  // New Project modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [projectDesc, setProjectDesc] = useState('');
  const [creating, setCreating] = useState(false);

  // Add Requirement modal
  const [reqModalOpen, setReqModalOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [reqSkillId, setReqSkillId] = useState('');
  const [reqPeople, setReqPeople] = useState(2);
  const [reqMinLevel, setReqMinLevel] = useState(3);
  const [addingReq, setAddingReq] = useState(false);

  // Readiness detail modal
  const [readinessModalOpen, setReadinessModalOpen] = useState(false);
  const [readinessData, setReadinessData] = useState(null);
  const [readinessLoading, setReadinessLoading] = useState(false);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const [projList, skillsList] = await Promise.all([
        projectsService.getProjects(),
        skillsService.getAllSkills(),
      ]);
      setProjects(projList || []);
      setAvailableSkills(skillsList || []);
    } catch (err) {
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!projectName) return;
    try {
      setCreating(true);
      await projectsService.createProject({
        name: projectName,
        description: projectDesc,
      });
      toast.success('Project created successfully!');
      setCreateModalOpen(false);
      setProjectName('');
      setProjectDesc('');
      fetchProjects();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to create project');
    } finally {
      setCreating(false);
    }
  };

  const handleOpenReqModal = (projectId) => {
    setSelectedProjectId(projectId);
    setReqSkillId(availableSkills[0]?.id || '');
    setReqPeople(2);
    setReqMinLevel(3);
    setReqModalOpen(true);
  };

  const handleAddRequirement = async (e) => {
    e.preventDefault();
    if (!reqSkillId || !selectedProjectId) return;
    try {
      setAddingReq(true);
      await projectsService.addRequirement(selectedProjectId, {
        skill_id: Number(reqSkillId),
        required_people: Number(reqPeople),
        minimum_level: Number(reqMinLevel),
      });
      toast.success('Skill requirement added to project!');
      setReqModalOpen(false);
      fetchProjects();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to add requirement');
    } finally {
      setAddingReq(false);
    }
  };

  const handleViewReadiness = async (projectId) => {
    try {
      setReadinessLoading(true);
      setReadinessModalOpen(true);
      const res = await projectsService.getProjectReadiness(projectId);
      setReadinessData(res);
    } catch (err) {
      toast.error('Could not compute project readiness');
      setReadinessModalOpen(false);
    } finally {
      setReadinessLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading projects..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Project Staffing &amp; Readiness</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Configure skill requirements for initiatives and compute real-time team staffing readiness.
          </p>
        </div>
        <Button onClick={() => setCreateModalOpen(true)}>
          <FolderPlusIcon className="h-4 w-4 mr-1.5" />
          Create New Project
        </Button>
      </div>

      {/* Projects list */}
      {projects.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <p className="text-gray-400 text-sm">No projects currently configured.</p>
            <Button size="sm" variant="outline" className="mt-3" onClick={() => setCreateModalOpen(true)}>
              Initialize First Project
            </Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {projects.map((proj) => (
            <div
              key={proj.id}
              className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-3">
                  <h3 className="font-bold text-lg text-gray-900">{proj.name}</h3>
                  <Badge variant={proj.status === 'ACTIVE' ? 'success' : 'default'}>
                    {proj.status}
                  </Badge>
                </div>
                {proj.description && (
                  <p className="text-xs text-gray-500 max-w-2xl">{proj.description}</p>
                )}

                {/* Requirements Badges */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {proj.requirements?.length === 0 ? (
                    <span className="text-xs text-gray-400 italic">No skill requirements specified yet</span>
                  ) : (
                    proj.requirements.map((r) => (
                      <span
                        key={r.id}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs bg-slate-100 text-slate-700 font-medium"
                      >
                        <span className="font-bold">{r.skill_name}</span> &ge; L{r.minimum_level} ({r.required_people} needed)
                      </span>
                    ))
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleOpenReqModal(proj.id)}
                >
                  <PlusIcon className="h-4 w-4 mr-1" />
                  Add Skill Req
                </Button>
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => handleViewReadiness(proj.id)}
                >
                  <ChartBarSquareIcon className="h-4 w-4 mr-1" />
                  Readiness Score
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Project Modal */}
      <Modal isOpen={createModalOpen} onClose={() => setCreateModalOpen(false)} title="Create New Project">
        <form onSubmit={handleCreateProject} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Project Name</label>
            <input
              type="text"
              required
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="e.g. Cloud Migration Phase 2"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
            <textarea
              rows={3}
              value={projectDesc}
              onChange={(e) => setProjectDesc(e.target.value)}
              placeholder="High level project scope and tech stack expectations..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
            <Button variant="secondary" type="button" onClick={() => setCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={creating}>
              {creating ? 'Creating...' : 'Create Project'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add Requirement Modal */}
      <Modal isOpen={reqModalOpen} onClose={() => setReqModalOpen(false)} title="Add Skill Requirement">
        <form onSubmit={handleAddRequirement} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Required Skill</label>
            <select
              value={reqSkillId}
              onChange={(e) => setReqSkillId(e.target.value)}
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

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Minimum Level</label>
              <select
                value={reqMinLevel}
                onChange={(e) => setReqMinLevel(Number(e.target.value))}
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
              <label className="block text-xs font-medium text-gray-700 mb-1">Required People</label>
              <input
                type="number"
                min={1}
                max={50}
                value={reqPeople}
                onChange={(e) => setReqPeople(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
            <Button variant="secondary" type="button" onClick={() => setReqModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={addingReq}>
              {addingReq ? 'Adding...' : 'Add Requirement'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Project Readiness Modal */}
      <Modal
        isOpen={readinessModalOpen}
        onClose={() => {
          setReadinessModalOpen(false);
          setReadinessData(null);
        }}
        title={`Project Readiness: ${readinessData?.project_name || 'Calculating...'}`}
        size="lg"
      >
        {readinessLoading ? (
          <div className="py-12 flex justify-center">
            <LoadingSpinner size="md" />
          </div>
        ) : readinessData ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-xl border border-emerald-100">
              <div>
                <p className="text-xs font-medium text-emerald-800">Overall Team Readiness</p>
                <p className="text-3xl font-extrabold text-emerald-700 mt-0.5">
                  {readinessData.overall_readiness}%
                </p>
              </div>
              <div className="w-48">
                <ProgressBar value={readinessData.overall_readiness} />
              </div>
            </div>

            {/* Readiness Bar Chart */}
            {readinessData.requirements?.length > 0 && (
              <ReadinessChart data={readinessData.requirements} />
            )}

            {/* Requirement Breakdown */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                Staffing Requirement Breakdown
              </h4>
              <div className="divide-y divide-gray-100 border border-gray-100 rounded-xl overflow-hidden">
                {readinessData.requirements?.map((req) => (
                  <div key={req.requirement_id || req.skill_name} className="p-3 bg-white flex items-center justify-between text-xs">
                    <div>
                      <p className="font-semibold text-gray-900">{req.skill_name}</p>
                      <p className="text-gray-500">Min Level: L{req.minimum_level}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-800">
                        {req.qualified_count} of {req.required_people} qualified
                      </p>
                      <p className="text-emerald-600 font-medium">{req.readiness_percentage}% Ready</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
