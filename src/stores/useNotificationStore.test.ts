import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useNotificationStore, type KudosEvent } from './useNotificationStore';

const makeEvent = (name: string): KudosEvent => ({
  fromUserName: name,
  fromUserAvatar: null,
  sessionId: 'session-1',
  bookTitle: 'Test Book',
  kudosId: `kudos-${name}`,
});

describe('useNotificationStore', () => {
  beforeEach(() => {
    useNotificationStore.setState({
      unreadCount: 0,
      pendingToasts: [],
      batchTimerId: null,
    });
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('initializes with zero unread count', () => {
    const state = useNotificationStore.getState();
    expect(state.unreadCount).toBe(0);
  });

  it('setUnreadCount sets the count', () => {
    useNotificationStore.getState().setUnreadCount(5);
    expect(useNotificationStore.getState().unreadCount).toBe(5);
  });

  it('incrementUnread increases count by 1', () => {
    useNotificationStore.getState().incrementUnread();
    expect(useNotificationStore.getState().unreadCount).toBe(1);

    useNotificationStore.getState().incrementUnread();
    expect(useNotificationStore.getState().unreadCount).toBe(2);
  });

  it('resetUnread sets count to 0', () => {
    useNotificationStore.getState().setUnreadCount(10);
    useNotificationStore.getState().resetUnread();
    expect(useNotificationStore.getState().unreadCount).toBe(0);
  });

  it('queueToast adds event to pendingToasts', () => {
    const event = makeEvent('Alice');
    useNotificationStore.getState().queueToast(event);

    expect(useNotificationStore.getState().pendingToasts).toHaveLength(1);
    expect(useNotificationStore.getState().pendingToasts[0].fromUserName).toBe('Alice');
  });

  it('queueToast batches multiple events within 5 seconds', () => {
    useNotificationStore.getState().queueToast(makeEvent('Alice'));
    vi.advanceTimersByTime(2000);
    useNotificationStore.getState().queueToast(makeEvent('Bob'));
    vi.advanceTimersByTime(2000);
    useNotificationStore.getState().queueToast(makeEvent('Charlie'));

    expect(useNotificationStore.getState().pendingToasts).toHaveLength(3);
  });

  it('flushToasts clears pendingToasts and returns them', () => {
    useNotificationStore.getState().queueToast(makeEvent('Alice'));
    useNotificationStore.getState().queueToast(makeEvent('Bob'));

    const flushed = useNotificationStore.getState().flushToasts();

    expect(flushed).toHaveLength(2);
    expect(useNotificationStore.getState().pendingToasts).toHaveLength(0);
    expect(useNotificationStore.getState().batchTimerId).toBeNull();
  });

  it('auto-flushes after 5 seconds', () => {
    useNotificationStore.getState().queueToast(makeEvent('Alice'));

    expect(useNotificationStore.getState().pendingToasts).toHaveLength(1);

    vi.advanceTimersByTime(5000);

    // After flush, pendingToasts should be empty
    expect(useNotificationStore.getState().pendingToasts).toHaveLength(0);
  });

  it('resets batch timer when new toast is queued', () => {
    useNotificationStore.getState().queueToast(makeEvent('Alice'));

    vi.advanceTimersByTime(4000); // Almost flush time
    useNotificationStore.getState().queueToast(makeEvent('Bob'));

    // At 4 seconds since last queue, should still have toasts
    vi.advanceTimersByTime(4000);
    expect(useNotificationStore.getState().pendingToasts).toHaveLength(2);

    // After full 5 seconds from last queue
    vi.advanceTimersByTime(1000);
    expect(useNotificationStore.getState().pendingToasts).toHaveLength(0);
  });

  it('flushToasts returns empty array when nothing pending', () => {
    const flushed = useNotificationStore.getState().flushToasts();
    expect(flushed).toHaveLength(0);
  });
});
