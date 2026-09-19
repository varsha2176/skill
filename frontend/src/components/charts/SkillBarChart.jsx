import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { SKILL_LEVELS } from '../../utils/constants';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-sm">
        <p className="font-semibold text-gray-900 mb-1">{label}</p>
        {payload.map((entry) => (
          <p key={entry.name} style={{ color: entry.fill }}>
            {entry.name}: Level {entry.value} ({SKILL_LEVELS[entry.value] || entry.value})
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export function SkillBarChart({ data = [], horizontal = true }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
        No data available
      </div>
    );
  }

  const chartData = data.map((item) => ({
    name: item.skill_name || item.skill || 'Unknown',
    Current: item.current_level ?? item.current ?? 0,
    Target: item.target_level ?? item.target ?? 0,
  }));

  if (horizontal) {
    return (
      <ResponsiveContainer width="100%" height={Math.max(200, chartData.length * 50)}>
        <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f3f4f6" />
          <XAxis type="number" domain={[0, 5]} tickCount={6} tick={{ fontSize: 11 }} />
          <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 12, fill: '#374151' }} />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: '12px' }} />
          <Bar dataKey="Current" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={10} />
          <Bar dataKey="Target" fill="#d1d5db" radius={[0, 4, 4, 0]} barSize={10} />
        </BarChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
        <YAxis domain={[0, 5]} tickCount={6} tick={{ fontSize: 11 }} />
        <Tooltip content={<CustomTooltip />} />
        <Legend wrapperStyle={{ fontSize: '12px' }} />
        <Bar dataKey="Current" fill="#3b82f6" radius={[4, 4, 0, 0]} />
        <Bar dataKey="Target" fill="#d1d5db" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
