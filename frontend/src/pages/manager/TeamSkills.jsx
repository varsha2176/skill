import React, { useState, useEffect } from 'react';
import { skillsService } from '../../services/skills';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import {
  MagnifyingGlassIcon,
  CheckBadgeIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

export function TeamSkills() {
  const [teamSkills, setTeamSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedMember, setSelectedMember] = useState('ALL');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  const fetchTeamSkills = async () => {
    try {
      setLoading(true);
      const res = await skillsService.getTeamSkills();
      setTeamSkills(res || []);
    } catch (err) {
      toast.error('Failed to load team skills');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeamSkills();
  }, []);

  if (loading) {
    return (
      <div className="py-24 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading team skills..." />
      </div>
    );
  }

  const members = ['ALL', ...new Set(teamSkills.map((s) => s.employee_name).filter(Boolean))];
  const categories = ['ALL', ...new Set(teamSkills.map((s) => s.skill_category).filter(Boolean))];

  const filtered = teamSkills.filter((s) => {
    const matchesSearch =
      s.skill_name?.toLowerCase().includes(search.toLowerCase()) ||
      s.employee_name?.toLowerCase().includes(search.toLowerCase());
    const matchesMember = selectedMember === 'ALL' || s.employee_name === selectedMember;
    const matchesCategory = selectedCategory === 'ALL' || s.skill_category === selectedCategory;
    return matchesSearch && matchesMember && matchesCategory;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Team Skills Inventory</h1>
        <p className="text-gray-500 text-sm mt-0.5">
          Comprehensive catalog of all declared and verified competencies across your reporting unit.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-72">
          <MagnifyingGlassIcon className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Search skill or member..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Member selector */}
          <select
            value={selectedMember}
            onChange={(e) => setSelectedMember(e.target.value)}
            className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 focus:outline-none"
          >
            {members.map((m) => (
              <option key={m} value={m}>
                {m === 'ALL' ? 'All Team Members' : m}
              </option>
            ))}
          </select>

          {/* Category selector */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 focus:outline-none"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c === 'ALL' ? 'All Categories' : c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Skills Table */}
      <Card>
        {filtered.length === 0 ? (
          <p className="text-center py-12 text-gray-400 text-sm">No skills found matching filter criteria.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-100 text-xs font-semibold uppercase text-gray-500 bg-gray-50/50">
                <tr>
                  <th className="py-3 px-4">Team Member</th>
                  <th className="py-3 px-4">Skill</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Proficiency Level</th>
                  <th className="py-3 px-4">Validation Status</th>
                  <th className="py-3 px-4">Validator</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50/60 transition">
                    <td className="py-3.5 px-4 font-semibold text-gray-900">{s.employee_name}</td>
                    <td className="py-3.5 px-4 font-medium text-gray-800">{s.skill_name}</td>
                    <td className="py-3.5 px-4 text-gray-500">{s.skill_category}</td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-gray-900">L{s.current_level}</span>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((lvl) => (
                            <div
                              key={lvl}
                              className={`w-2 h-2 rounded-full ${
                                lvl <= s.current_level ? 'bg-emerald-600' : 'bg-gray-200'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      {s.validated ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200">
                          <CheckBadgeIcon className="h-3.5 w-3.5 text-green-600" />
                          Validated
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                          Self-Declared
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-gray-500">
                      {s.validated_by_name || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
