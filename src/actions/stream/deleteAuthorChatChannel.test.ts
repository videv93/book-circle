import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockGetSession = vi.fn();
const mockChannel = vi.fn();
const mockDelete = vi.fn();

vi.mock('@/lib/auth', () => ({
  auth: {
    api: {
      getSession: (...args: unknown[]) => mockGetSession(...args),
    },
  },
}));

vi.mock('next/headers', () => ({
  headers: vi.fn().mockResolvedValue(new Headers()),
}));

vi.mock('@/lib/stream', () => ({
  getStreamServerClient: () => ({
    channel: (...args: unknown[]) => mockChannel(...args),
  }),
}));

import { deleteAuthorChatChannel } from './deleteAuthorChatChannel';

describe('deleteAuthorChatChannel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockChannel.mockReturnValue({ delete: mockDelete });
    mockDelete.mockResolvedValue(undefined);
  });

  it('returns unauthorized when no session', async () => {
    mockGetSession.mockResolvedValue(null);

    const result = await deleteAuthorChatChannel('channel-1');

    expect(result).toEqual({ success: false, error: 'Unauthorized' });
    expect(mockChannel).not.toHaveBeenCalled();
  });

  it('returns error for invalid channelId', async () => {
    const result = await deleteAuthorChatChannel('');

    expect(result).toEqual({ success: false, error: 'Invalid channelId' });
  });

  it('deletes channel successfully', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'user-1' } });

    const result = await deleteAuthorChatChannel('author-chat-book-1-uuid');

    expect(result).toEqual({ success: true, data: undefined });
    expect(mockChannel).toHaveBeenCalledWith('messaging', 'author-chat-book-1-uuid');
    expect(mockDelete).toHaveBeenCalled();
  });

  it('returns error when deletion fails', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'user-1' } });
    mockDelete.mockRejectedValue(new Error('Stream error'));

    const result = await deleteAuthorChatChannel('author-chat-book-1-uuid');

    expect(result).toEqual({
      success: false,
      error: 'Failed to delete author chat channel',
    });
  });
});
