import React, { createContext, useState, useContext, useCallback, useMemo } from 'react';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const addNotification = useCallback((notification) => {
    const newNotif = {
      id: Date.now() + Math.random(),
      message: notification.message,
      type: notification.type || 'info', // 'success', 'error', 'info'
      timestamp: new Date(),
      read: false,
    };
    setNotifications(prev => [newNotif, ...prev]);
    setUnreadCount(prev => prev + 1);
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  const value = useMemo(() => ({
    notifications,
    unreadCount,
    addNotification,
    markAllRead,
    clearNotifications,
  }), [notifications, unreadCount, addNotification, markAllRead, clearNotifications]);

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);
