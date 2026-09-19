import api from './api';

export const notificationsService = {
  getNotifications: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const { data } = await api.get(`/notifications/${query ? '?' + query : ''}`);
    return data;
  },

  markRead: async (notificationId) => {
    const { data } = await api.put(`/notifications/${notificationId}/read`);
    return data;
  },

  markAllRead: async () => {
    const { data } = await api.put('/notifications/read-all');
    return data;
  },

  getUnreadCount: async () => {
    const { data } = await api.get('/notifications/count');
    return data;
  },

  deleteNotification: async (notificationId) => {
    const { data } = await api.delete(`/notifications/${notificationId}`);
    return data;
  },
};
