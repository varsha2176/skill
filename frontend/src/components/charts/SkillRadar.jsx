import React from 'react';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

export function SkillRadar({ data = [] }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
        No skill data to display
      </div>
    );
  }

  const chartData = data.map((item) => ({
    skill: item.skill_name || item.skill || 'Unknown',
    Current: item.current_level ?? item.current ?? 0,
    Target: item.target_level ?? item.target ?? 0,
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <RadarChart data={chartData} margin={{ top: 10, right: 30, left: 30, bottom: 10 }}>
        <PolarGrid stroke="#e5e7eb" />
        <PolarAngleAxis
          dataKey="skill"
          tick={{ fill: '#6b7280', fontSize: 12 }}
          tickLine={false}
        />
        <PolarRadiusAxis
          angle={90}
          domain={[0, 5]}
          tickCount={6}
          tick={{ fill: '#9ca3af', fontSize: 10 }}
          axisLine={false}
        />
        <Radar
          name="Current Level"
          dataKey="Current"
          stroke="#3b82f6"
          fill="#3b82f6"
          fillOpacity={0.3}
          strokeWidth={2}
        />
        <Radar
          name="Target Level"
          dataKey="Target"
          stroke="#10b981"
          fill="#10b981"
          fillOpacity={0.1}
          strokeWidth={2}
          strokeDasharray="4 2"
        />
        <Tooltip
          formatter={(value) => [`Level ${value}`, '']}
          contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
        />
        <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
      </RadarChart>
    </ResponsiveContainer>
  );
}
