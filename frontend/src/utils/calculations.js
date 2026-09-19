import { SKILL_LEVELS, GAP_STATUS } from './constants';

export function formatSkillLevel(level) {
  return SKILL_LEVELS[level] || `Level ${level}`;
}

export function getGapStatus(currentLevel, targetLevel) {
  if (!targetLevel || currentLevel === undefined || currentLevel === null) return GAP_STATUS.READY;
  const gap = targetLevel - currentLevel;
  if (gap <= 0) return GAP_STATUS.READY;
  if (gap === 1) return GAP_STATUS.NEEDS_IMPROVEMENT;
  if (gap === 2) return GAP_STATUS.SKILL_GAP;
  return GAP_STATUS.CRITICAL;
}

export function getGapColor(status) {
  switch (status) {
    case GAP_STATUS.READY: return 'text-green-600 bg-green-50';
    case GAP_STATUS.NEEDS_IMPROVEMENT: return 'text-yellow-600 bg-yellow-50';
    case GAP_STATUS.SKILL_GAP: return 'text-orange-600 bg-orange-50';
    case GAP_STATUS.CRITICAL: return 'text-red-600 bg-red-50';
    default: return 'text-gray-600 bg-gray-50';
  }
}

export function formatPercentage(value) {
  if (value === null || value === undefined) return '0%';
  return `${Math.round(value)}%`;
}

export function getProgressColor(percentage) {
  if (percentage >= 80) return 'bg-green-500';
  if (percentage >= 60) return 'bg-yellow-500';
  if (percentage >= 40) return 'bg-orange-500';
  return 'bg-red-500';
}

export function getReadinessColor(percentage) {
  if (percentage >= 80) return { bg: 'bg-green-100', text: 'text-green-800', bar: 'bg-green-500' };
  if (percentage >= 60) return { bg: 'bg-yellow-100', text: 'text-yellow-800', bar: 'bg-yellow-500' };
  if (percentage >= 40) return { bg: 'bg-orange-100', text: 'text-orange-800', bar: 'bg-orange-500' };
  return { bg: 'bg-red-100', text: 'text-red-800', bar: 'bg-red-500' };
}

export function getInitials(name) {
  if (!name) return '?';
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function formatDate(dateString) {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatRelativeTime(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(dateString);
}

export function getPriorityColor(priority) {
  switch (priority?.toUpperCase()) {
    case 'CRITICAL': return 'bg-red-100 text-red-800';
    case 'HIGH': return 'bg-orange-100 text-orange-800';
    case 'MEDIUM': return 'bg-yellow-100 text-yellow-800';
    case 'LOW': return 'bg-gray-100 text-gray-800';
    default: return 'bg-gray-100 text-gray-800';
  }
}

export function getRoleBadgeColor(role) {
  switch (role) {
    case 'ADMIN': return 'bg-red-100 text-red-800';
    case 'MANAGER': return 'bg-purple-100 text-purple-800';
    case 'SME': return 'bg-blue-100 text-blue-800';
    case 'EMPLOYEE': return 'bg-green-100 text-green-800';
    default: return 'bg-gray-100 text-gray-800';
  }
}
