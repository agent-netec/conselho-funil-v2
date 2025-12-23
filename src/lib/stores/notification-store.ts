import { create } from 'zustand';

export type NotificationType = 'success' | 'error' | 'info' | 'warning';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  duration?: number; // ms, 0 = persistent
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface NotificationState {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id'>) => string;
  removeNotification: (id: string) => void;
  clearAll: () => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],

  addNotification: (notification) => {
    const id = `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newNotification: Notification = {
      ...notification,
      id,
      duration: notification.duration ?? 5000,
    };

    set((state) => ({
      notifications: [...state.notifications, newNotification],
    }));

    // Auto-remove after duration (if not persistent)
    if (newNotification.duration && newNotification.duration > 0) {
      setTimeout(() => {
        get().removeNotification(id);
      }, newNotification.duration);
    }

    return id;
  },

  removeNotification: (id) => {
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    }));
  },

  clearAll: () => {
    set({ notifications: [] });
  },
}));

// Helper functions for common notifications
export const notify = {
  success: (title: string, message?: string) => {
    return useNotificationStore.getState().addNotification({
      type: 'success',
      title,
      message,
    });
  },
  error: (title: string, message?: string) => {
    return useNotificationStore.getState().addNotification({
      type: 'error',
      title,
      message,
      duration: 8000, // Errors stay longer
    });
  },
  info: (title: string, message?: string) => {
    return useNotificationStore.getState().addNotification({
      type: 'info',
      title,
      message,
    });
  },
  warning: (title: string, message?: string) => {
    return useNotificationStore.getState().addNotification({
      type: 'warning',
      title,
      message,
      duration: 6000,
    });
  },
  proposalReady: (funnelName: string, funnelId: string) => {
    return useNotificationStore.getState().addNotification({
      type: 'success',
      title: '🎯 Propostas Prontas!',
      message: `O Conselho terminou de analisar "${funnelName}"`,
      duration: 10000,
      action: {
        label: 'Ver Propostas',
        onClick: () => {
          window.location.href = `/funnels/${funnelId}`;
        },
      },
    });
  },
};

