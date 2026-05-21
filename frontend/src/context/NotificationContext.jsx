import React, { createContext, useState, useContext, useCallback, useMemo, useEffect } from 'react';
import { useAuth } from './AuthContext';
import Toast from '../components/Toast';

const NotificationContext = createContext();

const API_BASE = import.meta.env.VITE_API_BASE;

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  
  // Global toast state
  const [toast, setToast] = useState(null);

  // Fetch notifications on mount/token change
  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    const fetchNotifications = async () => {
      try {
        const res = await fetch(`${API_BASE}/notifications`, {
          credentials: 'include'
        });
        if (res.ok) {
          const data = await res.json();
          setNotifications(data);
          setUnreadCount(data.filter(n => !n.read).length);
        }
      } catch (error) {
        console.error('Failed to fetch notifications', error);
      }
    };
    fetchNotifications();
  }, [user]);

  // Show a transient global toast that doesn't save to DB
  const showGlobalToast = useCallback((message, duration = 3000) => {
    setToast(message);
    const timer = setTimeout(() => {
      setToast(null);
    }, duration);
    return () => clearTimeout(timer);
  }, []);

  const addNotification = useCallback(async (notification) => {
    // Show visual toast immediately using the global toast
    showGlobalToast(notification.message);

    // Optimistic update for the Bell icon list
    const tempId = Date.now() + Math.random();
    const newNotif = {
      id: tempId,
      message: notification.message,
      type: notification.type || 'info',
      timestamp: new Date().toISOString(),
      read: false,
    };
    setNotifications(prev => [newNotif, ...prev]);
    setUnreadCount(prev => prev + 1);

    if (user) {
      try {
        const res = await fetch(`${API_BASE}/notifications`, {
          method: 'POST',
          credentials: 'include', headers: {
            'Content-Type': 'application/json' },
          body: JSON.stringify({ message: notification.message, type: notification.type })
        });
        if (res.ok) {
          const savedNotif = await res.json();
          // Replace tempId with actual id
          setNotifications(prev => prev.map(n => n.id === tempId ? savedNotif : n));
        }
      } catch (error) {
        console.error('Failed to save notification to DB', error);
      }
    }
  }, [user, showGlobalToast]);

  const markAllRead = useCallback(async () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);

    if (user) {
      try {
        await fetch(`${API_BASE}/notifications/read-all`, {
          method: 'PATCH',
          credentials: 'include'
        });
      } catch (error) {
        console.error('Failed to mark notifications as read in DB', error);
      }
    }
  }, [user]);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  const value = useMemo(() => ({
    notifications,
    unreadCount,
    addNotification,
    showGlobalToast,
    markAllRead,
    clearNotifications,
  }), [notifications, unreadCount, addNotification, showGlobalToast, markAllRead, clearNotifications]);

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <Toast message={toast} />
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);
