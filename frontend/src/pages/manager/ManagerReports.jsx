import React, { useState, useEffect } from 'react';
import { reportsService } from '../../services/reports';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ProgressBar } from '../../components/common/ProgressBar';
import { ArrowDownTrayIcon, DocumentChartBarIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

export function ManagerReports() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const data = await reportsService.getTeamReport();
      setReport(data);
    } catch (err) {
      toast.error('Failed to load team report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  const handleDownloadPDF = async () => {
    try {
      setDownloading(true);
      await reportsService.downloadPDF('team');
      toast.success('Team PDF report generated and downloaded!');
    } catch (err) {
      toast.error('Failed to download PDF report');
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Generating team analytics report..." />
      </div>
    );
  }

  const {
    team_size = 0,
    average_readiness = 0,
    critical_gaps_count = 0,
    members = [],
    skills_distribution = [],
  } = report || {};

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Team Analytics &amp; Reports</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Export executive summaries and evaluate talent distribution.
          </p>
        </div>
        <Button onClick={handleDownloadPDF} disabled={downloading}>
          <ArrowDownTrayIcon className="h-4 w-4 mr-1.5" />
          {downloading ? 'Exporting PDF...' : 'Download Executive PDF'}
        </Button>
      </div>

      {/* KPI Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
          <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Team Size</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{team_size} Members</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
          <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Avg Readiness</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{average_readiness}%</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
          <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Critical Gaps</p>
          <p className="text-2xl font-bold text-red-600 mt-1">{critical_gaps_count}</p>
        </div>
      </div>

      {/* Member Breakdown */}
      <Card title="Team Member Performance &amp; Competency Scores">
        {members.length === 0 ? (
          <p className="text-center py-8 text-gray-400 text-sm">No members in report.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-100 text-xs font-semibold uppercase text-gray-500 bg-gray-50/50">
                <tr>
                  <th className="py-3 px-4">Name</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Total Skills</th>
                  <th className="py-3 px-4">Readiness</th>
                  <th className="py-3 px-4">Critical Gaps</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {members.map((m) => (
                  <tr key={m.id} className="hover:bg-gray-50/60 transition">
                    <td className="py-3.5 px-4 font-semibold text-gray-900">{m.name}</td>
                    <td className="py-3.5 px-4 text-gray-500">{m.experience_level || 'Mid'} Level</td>
                    <td className="py-3.5 px-4 font-medium">{m.skills_count || 0}</td>
                    <td className="py-3.5 px-4 w-40">
                      <ProgressBar value={m.readiness_percentage || 0} showLabel size="sm" />
                    </td>
                    <td className="py-3.5 px-4">
                      {m.critical_gaps > 0 ? (
                        <span className="text-xs font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                          {m.critical_gaps} Critical
                        </span>
                      ) : (
                        <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                          On Track
                        </span>
                      )}
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
