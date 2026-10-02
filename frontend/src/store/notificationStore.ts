import { create } from 'zustand';

import { fetchNotifications, markAllNotificationsRead, markNotificationRead } from '../api/notifications';
import type { AppNotification } from '../types/notification';

function countUnread(notifications: AppNotification[]): number {
  return notifications.filter((notification) => !notification.is_read).length;
}

interface NotificationState {
  notifications: AppNotification[];
  unreadCount: number;
  isLoading: boolean;
  hasLoadedOnce: boolean;
  load: () => Promise<void>;
  markRead: (id: number) => Promise<void>;
  markAllRead: () => Promise<void>;
}

/**
 * Ver TODO en src/api/notifications.ts: hasta que exista el backend real de
 * notificaciones, este store envuelve esa capa simulada — la UI (campana +
 * pantalla de notificaciones) no depende de si los datos son reales o no.
 */
export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  hasLoadedOnce: false,

  load: async () => {
    if (get().isLoading) {
      return;
    }

    set({ isLoading: true });

    try {
      const notifications = await fetchNotifications();
      set({ notifications, unreadCount: countUnread(notifications), hasLoadedOnce: true });
    } finally {
      set({ isLoading: false });
    }
  },

  markRead: async (id) => {
    const previous = get().notifications;
    const next = previous.map((notification) => (notification.id === id ? { ...notification, is_read: true } : notification));
    set({ notifications: next, unreadCount: countUnread(next) });

    try {
      await markNotificationRead(id);
    } catch {
      set({ notifications: previous, unreadCount: countUnread(previous) });
    }
  },

  markAllRead: async () => {
    const previous = get().notifications;
    const next = previous.map((notification) => ({ ...notification, is_read: true }));
    set({ notifications: next, unreadCount: 0 });

    try {
      await markAllNotificationsRead();
    } catch {
      set({ notifications: previous, unreadCount: countUnread(previous) });
    }
  },
}));
