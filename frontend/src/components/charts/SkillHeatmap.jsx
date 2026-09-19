import React from 'react';
import { SKILL_LEVELS } from '../../utils/constants';

function getLevelColor(level) {
  if (!level) return 'bg-gray-100 text-gray-400';
  if (level <= 2) return 'bg-red-100 text-red-700';
  if (level === 3) return 'bg-yellow-100 text-yellow-700';
  return 'bg-green-100 text-green-700';
}

function normalizeSkill(skill, index) {
  if (typeof skill === 'string' || typeof skill === 'number') {
    return { id: String(skill), name: String(skill) };
  }

  const name =
    skill?.name ??
    skill?.skill_name ??
    `Skill ${index + 1}`;

  return {
    id: String(skill?.id ?? skill?.skill_id ?? name),
    name: String(name),
  };
}

function normalizeEmployee(emp, index) {
  if (typeof emp === 'string' || typeof emp === 'number') {
    return {
      id: String(emp),
      name: String(emp),
      skills: null,
    };
  }

  return {
    id: String(emp?.employee_id ?? emp?.id ?? index),
    name: String(
      emp?.employee_name ??
      emp?.full_name ??
      emp?.name ??
      'Unknown'
    ),
    skills: emp?.skills ?? null,
  };
}

function resolveLevel(employee, skill, data) {
  const s = employee.skills;

  if (Array.isArray(s)) {
    const match = s.find((item) => {
      if (typeof item === 'string') {
        return item === skill.name;
      }

      return (
        String(item?.skill_id ?? item?.id ?? '') === skill.id ||
        (item?.skill_name ?? item?.name) === skill.name
      );
    });

    const raw =
      match && typeof match === 'object'
        ? (
            match.level ??
            match.proficiency_level ??
            match.current_level
          )
        : match;

    return Number(raw) || 0;
  }

  if (s && typeof s === 'object') {
    const raw =
      s[skill.id] ??
      s[skill.name];

    const value =
      raw && typeof raw === 'object'
        ? (
            raw.level ??
            raw.proficiency_level ??
            raw.current_level
          )
        : raw;

    return Number(value) || 0;
  }

  const fallback = data?.[employee.id]?.[skill.id] ?? data?.[employee.id]?.[skill.name];
  if (fallback && typeof fallback === 'object') {
    return Number(fallback.level ?? fallback.proficiency_level ?? fallback.current_level) || 0;
  }
  return Number(fallback) || 0;
}

export function SkillHeatmap({
  employees = [],
  skills = [],
  data = {},
}) {
  const rows = (
    Array.isArray(employees)
      ? employees
      : []
  ).map(normalizeEmployee);

  const cols = (
    Array.isArray(skills)
      ? skills
      : []
  ).map(normalizeSkill);

  if (!rows.length || !cols.length) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
        No team skill data available
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border-separate border-spacing-1">
        <thead>
          <tr>
            <th className="text-left text-xs font-semibold text-gray-500 pb-2 pr-4 sticky left-0 bg-white z-10">
              Employee
            </th>

            {cols.map((skill, i) => (
              <th
                key={`head-${skill.id}-${i}`}
                className="text-xs font-medium text-gray-600 pb-2 px-1 text-center whitespace-nowrap"
                style={{ maxWidth: 80 }}
              >
                <div className="writing-mode-vertical rotate-[-45deg] w-20 text-right">
                  {skill.name}
                </div>
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {rows.map((employee, rowIndex) => (
            <tr
              key={`row-${employee.id}-${rowIndex}`}
            >
              <td className="text-sm text-gray-700 font-medium pr-4 py-1 sticky left-0 bg-white z-10 whitespace-nowrap">
                {employee.name}
              </td>

              {cols.map((skill, colIndex) => {
                const level = resolveLevel(
                  employee,
                  skill,
                  data
                );

                return (
                  <td
                    key={`cell-${employee.id}-${skill.id}-${colIndex}`}
                    className="py-1 px-0.5 text-center"
                  >
                    <div
                      className={`w-10 h-10 mx-auto rounded-lg flex items-center justify-center text-xs font-bold ${getLevelColor(level)}`}
                      title={`${employee.name}: ${skill.name} = ${SKILL_LEVELS[level] || 'No Data'}`}
                    >
                      {level || '—'}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex items-center gap-4 mt-4 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <span className="w-4 h-4 rounded bg-gray-100 inline-block" />
          No Data
        </span>

        <span className="flex items-center gap-1">
          <span className="w-4 h-4 rounded bg-red-100 inline-block" />
          Beginner (1-2)
        </span>

        <span className="flex items-center gap-1">
          <span className="w-4 h-4 rounded bg-yellow-100 inline-block" />
          Intermediate (3)
        </span>

        <span className="flex items-center gap-1">
          <span className="w-4 h-4 rounded bg-green-100 inline-block" />
          Advanced+ (4-5)
        </span>
      </div>
    </div>
  );
}
