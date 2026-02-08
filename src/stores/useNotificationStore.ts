import { create } from 'zustand';

export interface KudosEvent {
  fromUserName: string;
  fromUserAvatar: string | null;
  sessionId: string;
  bookTitle: string;
  kudosId: string;
}

interface NotificationState {
  unreadCount: number;
  pendingToasts: KudosEvent[];
  batchTimerId: ReturnType<typeof setTimeout> | null;

  setUnreadCount: (n: number) => void;
  incrementUnread: () => void;
  resetUnread: () => void;
  queueToast: (event: KudosEvent) => void;
  flushToasts: () => KudosEvent[];
}

export const useNotificationStore = create<NotificationState>()((set, get) => ({
  unreadCount: 0,
  pendingToasts: [],
  batchTimerId: null,

  setUnreadCount: (n: number) => set({ unreadCount: n }),

  incrementUnread: () => set((state) => ({ unreadCount: state.unreadCount + 1 })),

  resetUnread: () => set({ unreadCount: 0 }),

  queueToast: (event: KudosEvent) => {
    const { batchTimerId } = get();
    if (batchTimerId) clearTimeout(batchTimerId);

    set((state) => ({
      pendingToasts: [...state.pendingToasts, event],
    }));

    const timerId = setTimeout(() => {
      get().flushToasts();
    }, 5000);

    set({ batchTimerId: timerId });
  },

  flushToasts: () => {
    const { pendingToasts, batchTimerId } = get();
    if (batchTimerId) clearTimeout(batchTimerId);

    set({ pendingToasts: [], batchTimerId: null });
    return pendingToasts;
  },
}));
