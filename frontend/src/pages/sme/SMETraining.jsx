import React, { useState, useEffect } from 'react';
import { trainingService } from '../../services/training';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { formatRelativeTime } from '../../utils/calculations';
import {
  HandRaisedIcon,
  PlayIcon,
  CheckBadgeIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

export function SMETraining() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [actionId, setActionId] = useState(null);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await trainingService.getTrainingRequests();
      setRequests(res || []);
    } catch (err) {
      toast.error('Failed to load training requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleClaim = async (requestId) => {
    try {
      setActionId(requestId);
      await trainingService.claimRequest(requestId);
      toast.success('You claimed this request!');
      fetchRequests();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to claim');
    } finally {
      setActionId(null);
    }
  };

  const handleStart = async (requestId) => {
    try {
      setActionId(requestId);
      await trainingService.startTraining(requestId);
      toast.success('Mentorship session started!');
      fetchRequests();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to start');
    } finally {
      setActionId(null);
    }
  };

  const handleComplete = async (requestId) => {
    try {
      setActionId(requestId);
      await trainingService.completeTraining(requestId);
      toast.success('Training marked completed!');
      fetchRequests();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to complete');
    } finally {
      setActionId(null);
    }
  };

  if (loading) {
    return (
      <div className="py-24 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading mentorship board..." />
      </div>
    );
  }

  const filtered = requests.filter((r) => {
    const matchesSearch =
      r.skill_name?.toLowerCase().includes(search.toLowerCase()) ||
      r.employee_name?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = activeFilter === 'ALL' || r.status === activeFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Training Requests Marketplace</h1>
        <p className="text-gray-500 text-sm mt-0.5">
          Browse all active upskilling demands, claim mentoring sessions, and certify completions.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
        <div className="relative w-full sm:w-72">
          <MagnifyingGlassIcon className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Search skill or learner..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
          {['ALL', 'PENDING', 'CLAIMED', 'IN_PROGRESS', 'COMPLETED'].map((st) => (
            <button
              key={st}
              onClick={() => setActiveFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                activeFilter === st
                  ? 'bg-purple-700 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {st.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Requests List */}
      {filtered.length === 0 ? (
        <Card>
          <p className="text-center py-12 text-gray-400 text-sm">No training requests found.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((req) => (
            <div
              key={req.id}
              className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h3 className="font-bold text-base text-gray-900">{req.skill_name}</h3>
                  <Badge variant={req.priority?.toLowerCase()}>{req.priority}</Badge>
                  <Badge variant={req.status?.toLowerCase()}>{req.status}</Badge>
                </div>
                <p className="text-xs text-gray-600">
                  Learner: <span className="font-semibold text-gray-900">{req.employee_name}</span> &bull; Target: Level {req.requested_level}
                </p>
                {req.message && (
                  <p className="text-xs text-gray-600 bg-gray-50 p-2.5 rounded-lg border border-gray-100 mt-2 max-w-xl">
                    &ldquo;{req.message}&rdquo;
                  </p>
                )}
                <p className="text-[11px] text-gray-400 mt-2">
                  Created {formatRelativeTime(req.created_at)}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                {req.status === 'PENDING' && (
                  <Button
                    size="sm"
                    variant="primary"
                    disabled={actionId === req.id}
                    onClick={() => handleClaim(req.id)}
                  >
                    <HandRaisedIcon className="h-4 w-4 mr-1" />
                    Claim
                  </Button>
                )}
                {req.status === 'CLAIMED' && (
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={actionId === req.id}
                    onClick={() => handleStart(req.id)}
                  >
                    <PlayIcon className="h-4 w-4 mr-1" />
                    Start Session
                  </Button>
                )}
                {req.status === 'IN_PROGRESS' && (
                  <Button
                    size="sm"
                    variant="primary"
                    disabled={actionId === req.id}
                    onClick={() => handleComplete(req.id)}
                  >
                    <CheckBadgeIcon className="h-4 w-4 mr-1" />
                    Complete
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
