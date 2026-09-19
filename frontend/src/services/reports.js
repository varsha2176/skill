import api from './api';

export const reportsService = {
  getEmployeeReport: async (employeeId) => {
    const url = employeeId ? `/reports/employee/${employeeId}` : '/reports/employee/me';
    const { data } = await api.get(url);
    return data;
  },

  getTeamReport: async () => {
    const { data } = await api.get('/reports/team');
    return data;
  },

  getTrainingReport: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const { data } = await api.get(`/reports/training${query ? '?' + query : ''}`);
    return data;
  },

  getAdminReport: async () => {
    const { data } = await api.get('/reports/admin');
    return data;
  },

  downloadPDF: async (reportType, params = {}) => {
    const query = new URLSearchParams(params).toString();
    const response = await api.get(`/reports/${reportType}/pdf${query ? '?' + query : ''}`, {
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${reportType}-report.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};
