import api from './api';

export const projectsService = {
  getProjects: async () => {
    const { data } = await api.get('/projects/');
    return data;
  },

  getProject: async (projectId) => {
    const { data } = await api.get(`/projects/${projectId}`);
    return data;
  },

  createProject: async (projectData) => {
    const { data } = await api.post('/projects/', projectData);
    return data;
  },

  updateProject: async (projectId, projectData) => {
    const { data } = await api.put(`/projects/${projectId}`, projectData);
    return data;
  },

  deleteProject: async (projectId) => {
    const { data } = await api.delete(`/projects/${projectId}`);
    return data;
  },

  addRequirement: async (projectId, requirement) => {
    const { data } = await api.post(`/projects/${projectId}/requirements`, requirement);
    return data;
  },

  updateRequirement: async (projectId, requirementId, requirement) => {
    const { data } = await api.put(`/projects/${projectId}/requirements/${requirementId}`, requirement);
    return data;
  },

  deleteRequirement: async (projectId, requirementId) => {
    const { data } = await api.delete(`/projects/${projectId}/requirements/${requirementId}`);
    return data;
  },

  getProjectReadiness: async (projectId) => {
    const { data } = await api.get(`/projects/${projectId}/readiness`);
    return data;
  },
};
