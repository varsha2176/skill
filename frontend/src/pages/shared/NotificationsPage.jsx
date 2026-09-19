import React, { useState, useEffect } from 'react';
import { notificationsService } from '../../services/notifications';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { formatRelativeTime } from '../../utils/calculations';
import {
  BellIcon,
  CheckIcon,
  TrashIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

export function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await notificationsService.getNotifications();
      setNotifications(Array.isArray(res) ? res : res.notifications || []);
    } catch (err) {
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await notificationsService.markAllRead();
      toast.success('All marked as read');
      fetchNotifications();
    } catch (err) {
      toast.error('Failed to mark all as read');
    }
  };

  const handleMarkRead = async (id) => {
    try {
      await notificationsService.markRead(id);
      fetchNotifications();
    } catch (err) {
      toast.error('Failed to update notification');
    }
  };

  const handleDelete = async (id) => {
    try {
      await notificationsService.deleteNotification(id);
      fetchNotifications();
    } catch (err) {
      toast.error('Failed to delete notification');
    }
  };

  if (loading) {
    return (
      <div className="py-24 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading notifications..." />
      </div>
    );
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            System alerts, mentorship updates, and validation notices.
          </p>
        </div>
        {unreadCount > 0 && (
          <Button size="sm" variant="outline" onClick={handleMarkAllRead}>
            <CheckIcon className="h-4 w-4 mr-1" />
            Mark all as read
          </Button>
        )}
      </div>

      <Card>
        {notifications.length === 0 ? (
          <div className="text-center py-12">
            <BellIcon className="h-10 w-10 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500 text-sm">No notifications found.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {notifications.map((n) => (
              <div
                key={n.id}
                className={`py-4 px-3 sm:px-4 rounded-xl transition flex items-start justify-between gap-4 ${
                  !n.is_read ? 'bg-blue-50/40' : 'hover:bg-gray-50/60'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-sm text-gray-900">{n.title}</h4>
                    {!n.is_read && (
                      <span className="w-2 h-2 rounded-full bg-blue-600 flex-shrink-0" />
                    )}
                    {n.type && <Badge variant="info">{n.type}</Badge>}
                  </div>
                  <p className="text-xs text-gray-600">{n.message}</p>
                  <p className="text-[11px] text-gray-400">{formatRelativeTime(n.created_at)}</p>
                </div>

                <div className="flex items-center gap-1">
                  {!n.is_read && (
                    <button
                      onClick={() => handleMarkRead(n.id)}
                      className="p-1 text-gray-400 hover:text-blue-600 rounded cursor-pointer"
                      title="Mark as read"
                    >
                      <CheckCircleIcon className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(n.id)}
                    className="p-1 text-gray-400 hover:text-red-600 rounded cursor-pointer"
                    title="Delete"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
