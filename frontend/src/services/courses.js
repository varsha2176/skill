import api from './api';

export const coursesService = {
  getAllCourses: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const { data } = await api.get(`/courses/${query ? '?' + query : ''}`);
    return data;
  },

  getCourse: async (courseId) => {
    const { data } = await api.get(`/courses/${courseId}`);
    return data;
  },

  createCourse: async (courseData) => {
    const { data } = await api.post('/courses/', courseData);
    return data;
  },

  updateCourse: async (courseId, courseData) => {
    const { data } = await api.put(`/courses/${courseId}`, courseData);
    return data;
  },

  deleteCourse: async (courseId) => {
    const { data } = await api.delete(`/courses/${courseId}`);
    return data;
  },

  getCoursesBySkill: async (skillId) => {
    const { data } = await api.get(`/courses/?skill_id=${skillId}`);
    return data;
  },
};
