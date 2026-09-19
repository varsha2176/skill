import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const RADIAN = Math.PI / 180;
const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={13} fontWeight="600">
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

export function ReadinessChart({ percentage, size = 180 }) {
  const pct = Math.min(100, Math.max(0, percentage ?? 0));
  const COLORS = pct >= 80 ? ['#22c55e', '#f3f4f6'] : pct >= 60 ? ['#eab308', '#f3f4f6'] : pct >= 40 ? ['#f97316', '#f3f4f6'] : ['#ef4444', '#f3f4f6'];
  const data = [
    { name: 'Ready', value: pct },
    { name: 'Gap', value: 100 - pct },
  ];
  const label = pct >= 80 ? 'Excellent' : pct >= 60 ? 'Good' : pct >= 40 ? 'Fair' : 'Needs Work';

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={size * 0.32}
              outerRadius={size * 0.46}
              startAngle={90}
              endAngle={-270}
              dataKey="value"
              strokeWidth={0}
            >
              {data.map((_, index) => (
                <Cell key={index} fill={COLORS[index]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-gray-900">{Math.round(pct)}%</span>
          <span className="text-xs text-gray-500 mt-0.5">{label}</span>
        </div>
      </div>
    </div>
  );
}

export function DistributionPieChart({ data = [], colors = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444'] }) {
  if (!data.length) return null;
  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie data={data} cx="50%" cy="50%" outerRadius={100} dataKey="value" labelLine={false} label={renderCustomLabel}>
          {data.map((_, index) => (
            <Cell key={index} fill={colors[index % colors.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(value, name) => [value, name]} contentStyle={{ borderRadius: '8px' }} />
        <Legend wrapperStyle={{ fontSize: '12px' }} />
      </PieChart>
    </ResponsiveContainer>
  );
}
