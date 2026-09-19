import api from './api';

export const usersService = {
  getAllUsers: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const { data } = await api.get(`/users/${query ? '?' + query : ''}`);
    return data;
  },

  getUser: async (userId) => {
    const { data } = await api.get(`/users/${userId}`);
    return data;
  },

  createUser: async (userData) => {
    const { data } = await api.post('/users/', userData);
    return data;
  },

  updateUser: async (userId, userData) => {
    const { data } = await api.put(`/users/${userId}`, userData);
    return data;
  },

  deleteUser: async (userId) => {
    const { data } = await api.delete(`/users/${userId}`);
    return data;
  },

  getTeamMembers: async () => {
    const { data } = await api.get('/users/team');
    return data;
  },

  getManagers: async () => {
    const { data } = await api.get('/users/?role=MANAGER');
    return data;
  },

  getDepartments: async () => {
    const { data } = await api.get('/users/departments');
    return data;
  },
};
