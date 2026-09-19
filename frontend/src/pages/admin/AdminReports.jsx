import React, { useState, useEffect } from 'react';
import { reportsService } from '../../services/reports';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

export function AdminReports() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  const fetchAdminReport = async () => {
    try {
      setLoading(true);
      const data = await reportsService.getAdminReport();
      setReport(data);
    } catch (err) {
      toast.error('Failed to load enterprise analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminReport();
  }, []);

  const handleDownloadPDF = async () => {
    try {
      setDownloading(true);
      await reportsService.downloadPDF('admin');
      toast.success('Enterprise Analytics Report downloaded successfully!');
    } catch (err) {
      toast.error('Failed to download PDF report');
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Generating enterprise report..." />
      </div>
    );
  }

  const {
    total_users = 0,
    total_skills = 0,
    departments_count = 0,
    completion_rate = 0,
    department_breakdown = [],
  } = report || {};

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Enterprise Intelligence Reports</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Audit organizational talent density, competency distributions, and upskilling efficiency.
          </p>
        </div>
        <Button onClick={handleDownloadPDF} disabled={downloading}>
          <ArrowDownTrayIcon className="h-4 w-4 mr-1.5" />
          {downloading ? 'Exporting PDF...' : 'Download Enterprise PDF'}
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
          <p className="text-xs text-gray-500 font-semibold uppercase">Total Users</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{total_users}</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
          <p className="text-xs text-gray-500 font-semibold uppercase">Taxonomy Skills</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{total_skills}</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
          <p className="text-xs text-gray-500 font-semibold uppercase">Departments</p>
          <p className="text-2xl font-bold text-purple-600 mt-1">{departments_count}</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
          <p className="text-xs text-gray-500 font-semibold uppercase">Training Completion</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{completion_rate}%</p>
        </div>
      </div>

      {/* Department Breakdown */}
      <Card title="Departmental Talent Readiness Summary">
        {department_breakdown.length === 0 ? (
          <p className="text-center py-8 text-gray-400 text-sm">No department data available.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-100 text-xs font-semibold uppercase text-gray-500 bg-gray-50/50">
                <tr>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Headcount</th>
                  <th className="py-3 px-4">Avg Skills / Person</th>
                  <th className="py-3 px-4">Readiness Level</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {department_breakdown.map((dept, i) => (
                  <tr key={i} className="hover:bg-gray-50/60 transition">
                    <td className="py-3.5 px-4 font-semibold text-gray-900">{dept.department}</td>
                    <td className="py-3.5 px-4 text-gray-700">{dept.user_count}</td>
                    <td className="py-3.5 px-4 text-gray-700">{dept.avg_skills_per_user || '—'}</td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex px-2 py-0.5 rounded text-xs font-semibold bg-emerald-50 text-emerald-700">
                        {dept.readiness || 'Healthy'}
                      </span>
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
