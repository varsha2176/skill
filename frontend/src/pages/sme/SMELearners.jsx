import React, { useState, useEffect } from 'react';
import { trainingService } from '../../services/training';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { getInitials, formatRelativeTime } from '../../utils/calculations';
import { UsersIcon, AcademicCapIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

export function SMELearners() {
  const [active, setActive] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLearners = async () => {
      try {
        setLoading(true);
        const [activeRes, historyRes] = await Promise.all([
          trainingService.getSMEActiveRequests(),
          trainingService.getSMEHistory(),
        ]);
        setActive(activeRes || []);
        setHistory(historyRes || []);
      } catch (err) {
        toast.error('Failed to load learners list');
      } finally {
        setLoading(false);
      }
    };
    fetchLearners();
  }, []);

  if (loading) {
    return (
      <div className="py-24 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading learners..." />
      </div>
    );
  }

  // Combine unique learners
  const learnersMap = {};
  [...active, ...history].forEach((item) => {
    const empName = item.employee_name || 'Learner';
    if (!learnersMap[empName]) {
      learnersMap[empName] = {
        name: empName,
        sessions: [],
      };
    }
    learnersMap[empName].sessions.push(item);
  });

  const learnersList = Object.values(learnersMap);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Mentored Learners</h1>
        <p className="text-gray-500 text-sm mt-0.5">
          Employees who have engaged in your 1-on-1 skill mentorship sessions.
        </p>
      </div>

      {learnersList.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <UsersIcon className="h-10 w-10 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500 text-sm">No learners assigned yet. Claim an open training request to begin mentoring!</p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {learnersList.map((learner) => (
            <div
              key={learner.name}
              className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-purple-600 text-white font-bold flex items-center justify-center text-sm">
                  {getInitials(learner.name)}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-base">{learner.name}</h3>
                  <p className="text-xs text-gray-400">{learner.sessions.length} mentorship engagements</p>
                </div>
              </div>

              <div className="space-y-2 border-t border-gray-100 pt-3">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Topics</p>
                {learner.sessions.map((s, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs p-2 rounded bg-gray-50">
                    <span className="font-medium text-gray-800">{s.skill_name}</span>
                    <Badge variant={s.status?.toLowerCase()}>{s.status}</Badge>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
