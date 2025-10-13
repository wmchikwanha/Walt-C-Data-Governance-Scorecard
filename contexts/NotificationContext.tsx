// FIX: Replaced placeholder content with the NotificationContext implementation.
import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Notification, NotificationType } from '../types';

interface NotificationContextType {
  notifications: Notification[];
  addNotification: (notification: { message: string; type: NotificationType }) => void;
  removeNotification: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = useCallback(({ message, type }: { message: string; type: NotificationType }) => {
    const id = Date.now().toString() + Math.random().toString();
    setNotifications(currentNotifications => [...currentNotifications, { id, message, type }]);
    
    setTimeout(() => {
      removeNotification(id);
    }, 5000); // Auto-remove after 5 seconds
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(currentNotifications => currentNotifications.filter(n => n.id !== id));
  }, []);

  return (
    <NotificationContext.Provider value={{ notifications, addNotification, removeNotification }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};
