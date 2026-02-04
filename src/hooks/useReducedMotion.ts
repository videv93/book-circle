'use client';

import { useSyncExternalStore } from 'react';

const QUERY = '(prefers-reduced-motion: reduce)';

/**
 * Hook to detect if user prefers reduced motion
 * Returns true if user has set prefers-reduced-motion: reduce
 * Uses useSyncExternalStore for safe subscription pattern
 */
export function useReducedMotion(): boolean {
  const subscribe = (callback: () => void) => {
    const mediaQuery = window.matchMedia(QUERY);
    mediaQuery.addEventListener('change', callback);
    return () => mediaQuery.removeEventListener('change', callback);
  };

  const getSnapshot = () => {
    return window.matchMedia(QUERY).matches;
  };

  const getServerSnapshot = () => {
    // Return false on server - assume motion is enabled
    return false;
  };

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
