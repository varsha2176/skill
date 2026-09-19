import React, { useState, useEffect } from 'react';
import { skillsService } from '../../services/skills';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { CheckBadgeIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

export function SMESkills() {
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMySkills = async () => {
      try {
        setLoading(true);
        const res = await skillsService.getEmployeeSkills();
        setSkills(res || []);
      } catch (err) {
        toast.error('Failed to load SME skills');
      } finally {
        setLoading(false);
      }
    };
    fetchMySkills();
  }, []);

  if (loading) {
    return (
      <div className="py-24 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading expert competencies..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Subject Matter Expertise</h1>
        <p className="text-gray-500 text-sm mt-0.5">
          Verified high-proficiency skills qualifying you to mentor and certify learners.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {skills.map((s) => (
          <div
            key={s.id}
            className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <h3 className="font-bold text-gray-900">{s.skill_name}</h3>
                  <p className="text-xs text-gray-400">{s.skill_category}</p>
                </div>
                {s.validated ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200">
                    <CheckBadgeIcon className="h-3.5 w-3.5 text-green-600" />
                    Verified SME
                  </span>
                ) : (
                  <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                    Declared
                  </span>
                )}
              </div>

              <div className="mt-4">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-gray-500">Expertise Level</span>
                  <span className="font-bold text-purple-700">Level {s.current_level} of 5</span>
                </div>
                <div className="grid grid-cols-5 gap-1.5 h-2">
                  {[1, 2, 3, 4, 5].map((lvl) => (
                    <div
                      key={lvl}
                      className={`rounded-full ${
                        lvl <= s.current_level ? 'bg-purple-600' : 'bg-gray-200'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
            {s.validated_by_name && (
              <p className="text-[11px] text-gray-400 mt-4 pt-2 border-t border-gray-50">
                Endorsed by {s.validated_by_name}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
