import React from 'react';
import { CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/solid';

const statusMap = {
  // Training statuses
  PENDING: { label: 'Pending', className: 'bg-yellow-100 text-yellow-800' },
  CLAIMED: { label: 'Claimed', className: 'bg-blue-100 text-blue-800' },
  IN_PROGRESS: { label: 'In Progress', className: 'bg-purple-100 text-purple-800' },
  COMPLETED: { label: 'Completed', className: 'bg-green-100 text-green-800' },
  CANCELLED: { label: 'Cancelled', className: 'bg-red-100 text-red-800' },
  // Gap statuses
  READY: { label: 'Ready', className: 'bg-green-100 text-green-800' },
  NEEDS_IMPROVEMENT: { label: 'Needs Improvement', className: 'bg-yellow-100 text-yellow-800' },
  SKILL_GAP: { label: 'Skill Gap', className: 'bg-orange-100 text-orange-800' },
  CRITICAL: { label: 'Critical', className: 'bg-red-100 text-red-800' },
  // Priority
  LOW: { label: 'Low', className: 'bg-gray-100 text-gray-700' },
  MEDIUM: { label: 'Medium', className: 'bg-yellow-100 text-yellow-800' },
  HIGH: { label: 'High', className: 'bg-orange-100 text-orange-800' },
  // Roles
  ADMIN: { label: 'Admin', className: 'bg-red-100 text-red-800' },
  MANAGER: { label: 'Manager', className: 'bg-purple-100 text-purple-800' },
  SME: { label: 'SME', className: 'bg-blue-100 text-blue-800' },
  EMPLOYEE: { label: 'Employee', className: 'bg-green-100 text-green-800' },
  // Skill validation
  VALIDATED: { label: 'Validated', className: 'bg-green-100 text-green-700', icon: CheckCircleIcon },
  SELF_REPORTED: { label: 'Self-Reported', className: 'bg-yellow-100 text-yellow-700', icon: ExclamationTriangleIcon },
  // Difficulty
  BEGINNER: { label: 'Beginner', className: 'bg-teal-100 text-teal-800' },
  INTERMEDIATE: { label: 'Intermediate', className: 'bg-blue-100 text-blue-800' },
  ADVANCED: { label: 'Advanced', className: 'bg-indigo-100 text-indigo-800' },
};

export function Badge({ status, label: customLabel, className: customClass }) {
  const key = (status || '').toUpperCase().replace(/ /g, '_');
  const config = statusMap[key] || { label: status || '—', className: 'bg-gray-100 text-gray-700' };
  const Icon = config.icon;
  const label = customLabel || config.label;

  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className} ${customClass || ''}`}>
      {Icon && <Icon className="h-3 w-3" />}
      {label}
    </span>
  );
}
