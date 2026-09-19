import React, { useState, useEffect } from 'react';
import { trainingService } from '../../services/training';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { formatDate, formatRelativeTime } from '../../utils/calculations';
import { BookOpenIcon, CheckBadgeIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

export function SMEHistory() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        const res = await trainingService.getSMEHistory();
        setHistory(res || []);
      } catch (err) {
        toast.error('Failed to load training history');
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  if (loading) {
    return (
      <div className="py-24 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading mentorship records..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Training &amp; Mentorship History</h1>
        <p className="text-gray-500 text-sm mt-0.5">
          Archived record of all completed employee coaching sessions.
        </p>
      </div>

      <Card>
        {history.length === 0 ? (
          <div className="text-center py-12">
            <BookOpenIcon className="h-10 w-10 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500 text-sm">No historical training sessions completed yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-100 text-xs font-semibold uppercase text-gray-500 bg-gray-50/50">
                <tr>
                  <th className="py-3 px-4">Learner</th>
                  <th className="py-3 px-4">Skill Covered</th>
                  <th className="py-3 px-4">Certified Level</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Completed Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {history.map((item) => (
                  <tr key={item.id || item.assignment_id} className="hover:bg-gray-50/60 transition">
                    <td className="py-3.5 px-4 font-semibold text-gray-900">{item.employee_name}</td>
                    <td className="py-3.5 px-4 text-gray-700">{item.skill_name}</td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex px-2 py-0.5 rounded text-xs font-semibold bg-purple-50 text-purple-700">
                        Level {item.requested_level}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge variant="success">Completed</Badge>
                    </td>
                    <td className="py-3.5 px-4 text-right text-gray-500 text-xs">
                      {formatDate(item.completed_at || item.created_at)}
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
