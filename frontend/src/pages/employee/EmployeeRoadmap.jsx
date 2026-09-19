import React, { useState, useEffect } from 'react';
import { skillsService } from '../../services/skills';
import { coursesService } from '../../services/courses';
import api from '../../services/api';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { ProgressBar } from '../../components/common/ProgressBar';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import {
  MapIcon,
  BookOpenIcon,
  CheckCircleIcon,
  ClockIcon,
  ArrowTopRightOnSquareIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

export function EmployeeRoadmap() {
  const [gaps, setGaps] = useState([]);
  const [courses, setCourses] = useState([]);
  const [learningProgress, setLearningProgress] = useState({});
  const [loading, setLoading] = useState(true);

  const fetchRoadmapData = async () => {
    try {
      setLoading(true);
      const [gapsRes, coursesRes] = await Promise.all([
        skillsService.getSkillGaps(),
        coursesService.getAllCourses(),
      ]);
      setGaps(gapsRes || []);
      setCourses(coursesRes || []);

      // Fetch user's current progress records
      try {
        const { data: me } = await api.get('/auth/me');
        if (me?.id) {
          const { data: progList } = await api.get(`/learning-progress/${me.id}`);
          const pMap = {};
          (progList || []).forEach((p) => {
            pMap[p.course_id] = p;
          });
          setLearningProgress(pMap);
        }
      } catch {
        // progress fetch optional
      }
    } catch (err) {
      toast.error('Failed to load learning roadmap');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoadmapData();
  }, []);

  const handleStartOrUpdateCourse = async (courseId, targetPercentage = 100) => {
    try {
      const existing = learningProgress[courseId];
      if (!existing) {
        const { data: created } = await api.post('/learning-progress', {
          course_id: courseId,
        });
        toast.success('Enrolled in course!');
        setLearningProgress((prev) => ({ ...prev, [courseId]: created }));
      } else {
        const newStatus = targetPercentage >= 100 ? 'COMPLETED' : 'IN_PROGRESS';
        const { data: updated } = await api.put(`/learning-progress/${existing.id}`, {
          progress_percentage: targetPercentage,
          status: newStatus,
        });
        toast.success(targetPercentage >= 100 ? 'Course marked as completed!' : 'Progress saved');
        setLearningProgress((prev) => ({ ...prev, [courseId]: updated }));
      }
      fetchRoadmapData();
    } catch (err) {
      toast.error('Failed to update course progress');
    }
  };

  if (loading) {
    return (
      <div className="py-24 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Generating personalized learning roadmap..." />
      </div>
    );
  }

  // Prioritize gaps: CRITICAL first, then SKILL_GAP, then NEEDS_IMPROVEMENT
  const priorityOrder = { CRITICAL: 0, SKILL_GAP: 1, NEEDS_IMPROVEMENT: 2, READY: 3 };
  const sortedGaps = [...gaps].sort(
    (a, b) => (priorityOrder[a.gap_status] ?? 4) - (priorityOrder[b.gap_status] ?? 4)
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold uppercase">
            Curated Curriculum
          </span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Personalized Learning Roadmap</h1>
        <p className="text-gray-500 text-sm mt-0.5">
          Step-by-step learning modules aligned directly with your targeted competency gaps.
        </p>
      </div>

      {sortedGaps.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <SparklesIcon className="h-10 w-10 text-yellow-500 mx-auto mb-2" />
            <h3 className="font-semibold text-gray-900">All Targets Satisfied!</h3>
            <p className="text-gray-500 text-sm mt-1">You do not currently have any open skill gaps.</p>
          </div>
        </Card>
      ) : (
        <div className="relative border-l-2 border-blue-200 ml-4 pl-6 space-y-8">
          {sortedGaps.map((gap, idx) => {
            const gapCourses = courses.filter((c) => c.skill_id === gap.skill_id);

            return (
              <div key={gap.skill_id} className="relative">
                {/* Node Bullet */}
                <div className="absolute -left-[33px] top-1.5 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold ring-4 ring-white shadow">
                  {idx + 1}
                </div>

                {/* Milestone Content */}
                <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold text-gray-900">{gap.skill_name}</h3>
                        <span className="text-xs px-2 py-0.5 bg-gray-100 rounded text-gray-600 font-medium">
                          {gap.skill_category}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Current: Level {gap.current_level} &rarr; Target: Level {gap.target_level} (Gap: {gap.gap > 0 ? `-${gap.gap}` : 'Met'})
                      </p>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                      gap.gap_status === 'CRITICAL'
                        ? 'bg-red-100 text-red-800'
                        : gap.gap_status === 'SKILL_GAP'
                        ? 'bg-orange-100 text-orange-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {gap.gap_status}
                    </span>
                  </div>

                  {/* Recommended Courses List */}
                  <div className="mt-4 space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                      Recommended Modules &amp; Courses ({gapCourses.length})
                    </p>

                    {gapCourses.length === 0 ? (
                      <p className="text-xs text-gray-400 italic py-2">
                        No specific catalog courses linked yet. Request an SME mentoring session.
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {gapCourses.map((c) => {
                          const prog = learningProgress[c.id];
                          const isCompleted = prog?.status === 'COMPLETED' || prog?.progress_percentage >= 100;
                          const inProgress = prog && !isCompleted;

                          return (
                            <div
                              key={c.id}
                              className="p-4 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-gray-50 transition flex flex-col justify-between"
                            >
                              <div>
                                <div className="flex items-start justify-between gap-2">
                                  <h4 className="font-semibold text-sm text-gray-900 leading-snug">{c.title}</h4>
                                  <Badge variant={c.difficulty?.toLowerCase()}>{c.difficulty}</Badge>
                                </div>
                                <p className="text-xs text-gray-500 mt-1 line-clamp-2">{c.description}</p>
                                <div className="flex items-center gap-3 text-xs text-gray-400 mt-3">
                                  <span className="flex items-center gap-1">
                                    <ClockIcon className="h-3.5 w-3.5" />
                                    {c.duration_hours} hrs
                                  </span>
                                  <span>&bull;</span>
                                  <span>{c.provider || 'Internal Academy'}</span>
                                </div>
                              </div>

                              {/* Action & Progress */}
                              <div className="mt-4 pt-3 border-t border-gray-200/60 flex items-center justify-between gap-2">
                                {isCompleted ? (
                                  <span className="text-xs font-semibold text-green-600 inline-flex items-center gap-1">
                                    <CheckCircleIcon className="h-4 w-4" /> Completed
                                  </span>
                                ) : inProgress ? (
                                  <span className="text-xs font-semibold text-blue-600">
                                    In Progress ({Math.round(prog.progress_percentage)}%)
                                  </span>
                                ) : (
                                  <span className="text-xs text-gray-400">Not Started</span>
                                )}

                                <div className="flex items-center gap-2">
                                  {c.url && (
                                    <a
                                      href={c.url}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="p-1 text-gray-400 hover:text-blue-600"
                                      title="Open course URL"
                                    >
                                      <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                                    </a>
                                  )}
                                  {!isCompleted ? (
                                    <Button
                                      size="xs"
                                      variant={inProgress ? 'outline' : 'primary'}
                                      onClick={() => handleStartOrUpdateCourse(c.id, inProgress ? 100 : 50)}
                                    >
                                      {inProgress ? 'Mark Complete' : 'Start Course'}
                                    </Button>
                                  ) : (
                                    <Button
                                      size="xs"
                                      variant="secondary"
                                      onClick={() => handleStartOrUpdateCourse(c.id, 0)}
                                    >
                                      Restart
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
