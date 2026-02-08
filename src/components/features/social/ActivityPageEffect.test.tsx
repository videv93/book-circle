import { render } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ActivityPageEffect } from './ActivityPageEffect';
import { useNotificationStore } from '@/stores/useNotificationStore';

vi.mock('@/actions/social/markActivityViewed', () => ({
  markActivityViewed: vi.fn().mockResolvedValue({ success: true, data: { success: true } }),
}));

import { markActivityViewed } from '@/actions/social/markActivityViewed';
const mockMarkActivityViewed = markActivityViewed as ReturnType<typeof vi.fn>;

describe('ActivityPageEffect', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useNotificationStore.setState({
      unreadCount: 5,
      pendingToasts: [],
      batchTimerId: null,
    });
  });

  it('calls markActivityViewed on mount', () => {
    render(<ActivityPageEffect />);

    expect(mockMarkActivityViewed).toHaveBeenCalledTimes(1);
  });

  it('resets unread count in store on mount', () => {
    render(<ActivityPageEffect />);

    expect(useNotificationStore.getState().unreadCount).toBe(0);
  });

  it('renders null (invisible component)', () => {
    const { container } = render(<ActivityPageEffect />);

    expect(container.firstChild).toBeNull();
  });

  it('does not call markActivityViewed on re-render if resetUnread reference is stable', () => {
    const { rerender } = render(<ActivityPageEffect />);

    expect(mockMarkActivityViewed).toHaveBeenCalledTimes(1);

    rerender(<ActivityPageEffect />);

    // Should not call again since resetUnread is stable from zustand
    expect(mockMarkActivityViewed).toHaveBeenCalledTimes(1);
  });
});
