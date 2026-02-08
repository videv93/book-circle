'use client';

import { useEffect } from 'react';
import { markActivityViewed } from '@/actions/social/markActivityViewed';
import { useNotificationStore } from '@/stores/useNotificationStore';

export function ActivityPageEffect() {
  const resetUnread = useNotificationStore((s) => s.resetUnread);

  useEffect(() => {
    resetUnread();
    markActivityViewed();
  }, [resetUnread]);

  return null;
}
