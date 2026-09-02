import React, { createContext, useContext, useState, useEffect } from 'react';
import io from 'socket.io-client';
import api from '../utils/api';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await api.get('/notifications');
      const fetched = res.data.notifications || [];
      
      setNotifications(fetched);
      const unread = fetched.filter(n => !n.isRead).length;
      setUnreadCount(unread);
      setError(null);
    } catch (err) {
      setError('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let socket;

    const initializeNotifications = () => {
      const token = localStorage.getItem('token');
      const user = localStorage.getItem('user');

      socket?.disconnect();
      socket = undefined;

      if (!user || !token) {
        setNotifications([]);
        setUnreadCount(0);
        setLoading(false);
        return;
      }

      fetchNotifications();

      const apiUrl = (import.meta.env.VITE_API_URL || 'http://13.60.72.235:5000/api').replace(/\/api\/?$/, '');
      socket = io(apiUrl, {
        auth: { token },
        transports: ['websocket', 'polling']
      });

      socket.on('connect_error', (socketError) => {
        console.error('Notification socket error:', socketError.message);
      });

      socket.on('newNotification', (newNotif) => {
        setNotifications(prev => [newNotif, ...prev]);
        setUnreadCount(prev => prev + 1);
      });
    };

    initializeNotifications();
    window.addEventListener('auth-changed', initializeNotifications);
    window.addEventListener('storage', initializeNotifications);

    return () => {
      window.removeEventListener('auth-changed', initializeNotifications);
      window.removeEventListener('storage', initializeNotifications);
      socket?.disconnect();
    };
  }, []);

  const markAsRead = async (notificationId) => {
    try {
      setNotifications(prev =>
        prev.map(n => n._id === notificationId ? { ...n, isRead: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));

      await api.put(`/notifications/${notificationId}/read`);
    } catch (err) {
      fetchNotifications();
    }
  };

  const markAllAsRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    setUnreadCount(0);

    const unreadItems = notifications.filter(n => !n.isRead);
    if (unreadItems.length > 0) {
      try {
        await Promise.allSettled(unreadItems.map(n => api.put(`/notifications/${n._id}/read`)));
      } catch (err) {
        console.error('Failed to sync read status:', err);
      }
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        error,
        markAsRead,
        markAllAsRead,
        refreshNotifications: fetchNotifications
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};