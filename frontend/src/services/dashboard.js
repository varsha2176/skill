import api from './api';

export const dashboardService = {
  getEmployeeDashboard: async () => {
    const { data } = await api.get('/dashboard/employee');
    return data;
  },

  getSMEDashboard: async () => {
    const { data } = await api.get('/dashboard/sme');
    return data;
  },

  getManagerDashboard: async () => {
    const { data } = await api.get('/dashboard/manager');
    return data;
  },

  getAdminDashboard: async () => {
    const { data } = await api.get('/dashboard/admin');
    return data;
  },
};
