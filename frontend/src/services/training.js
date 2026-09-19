import api from './api';

export const trainingService = {
  createTrainingRequest: async (requestData) => {
    const { data } = await api.post('/training-requests/', requestData);
    return data;
  },

  getTrainingRequests: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const { data } = await api.get(`/training-requests/${query ? '?' + query : ''}`);
    return data;
  },

  getTrainingRequest: async (requestId) => {
    const { data } = await api.get(`/training-requests/${requestId}`);
    return data;
  },

  claimRequest: async (requestId) => {
    const { data } = await api.post(`/training-requests/${requestId}/claim`);
    return data;
  },

  startTraining: async (requestId) => {
    const { data } = await api.post(`/training-requests/${requestId}/start`);
    return data;
  },

  completeTraining: async (requestId, completionData = {}) => {
    const { data } = await api.post(`/training-requests/${requestId}/complete`, completionData);
    return data;
  },

  cancelRequest: async (requestId, reason = '') => {
    const { data } = await api.post(`/training-requests/${requestId}/cancel`, { reason });
    return data;
  },

  getAvailableRequests: async () => {
    const { data } = await api.get('/training-requests/available');
    return data;
  },

  getMyRequests: async () => {
    const { data } = await api.get('/training-requests/my-requests');
    return data;
  },

  getSMEActiveRequests: async () => {
    const { data } = await api.get('/training-requests/sme-active');
    return data;
  },

  getSMEHistory: async () => {
    const { data } = await api.get('/training-requests/sme-history');
    return data;
  },
};
