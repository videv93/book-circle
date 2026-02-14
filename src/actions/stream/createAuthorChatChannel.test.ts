import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockWatch = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));
const mockChannel = vi.hoisted(() =>
  vi.fn().mockReturnValue({ watch: mockWatch }),
);
const mockGetStreamServerClient = vi.hoisted(() =>
  vi.fn().mockReturnValue({ channel: mockChannel }),
);
const mockGetSession = vi.hoisted(() => vi.fn());
const mockHeaders = vi.hoisted(() =>
  vi.fn().mockResolvedValue(new Headers()),
);

vi.mock('@/lib/stream', () => ({
  getStreamServerClient: mockGetStreamServerClient,
}));

vi.mock('@/lib/auth', () => ({
  auth: {
    api: {
      getSession: mockGetSession,
    },
  },
}));

vi.mock('next/headers', () => ({
  headers: mockHeaders,
}));

// Mock crypto.randomUUID
vi.stubGlobal(
  'crypto',
  Object.assign({}, globalThis.crypto, {
    randomUUID: () => 'test-session-uuid',
  }),
);

import { createAuthorChatChannel } from './createAuthorChatChannel';

describe('createAuthorChatChannel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns error when user is not authenticated', async () => {
    mockGetSession.mockResolvedValue(null);

    const result = await createAuthorChatChannel('book-123');

    expect(result).toEqual({ success: false, error: 'Unauthorized' });
    expect(mockChannel).not.toHaveBeenCalled();
  });

  it('returns error for invalid bookId', async () => {
    const result = await createAuthorChatChannel('');

    expect(result).toEqual({ success: false, error: 'Invalid bookId' });
    expect(mockGetSession).not.toHaveBeenCalled();
  });

  it('creates ephemeral channel with correct ID format and members', async () => {
    mockGetSession.mockResolvedValue({
      user: { id: 'user-1', name: 'Test User' },
    });

    const result = await createAuthorChatChannel('book-123', 'author-42');

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.channelId).toBe(
        'author-chat-book-123-test-session-uuid',
      );
    }
    expect(mockChannel).toHaveBeenCalledWith(
      'messaging',
      'author-chat-book-123-test-session-uuid',
      expect.objectContaining({
        created_by_id: 'user-1',
        members: ['user-1', 'author-42'],
      }),
    );
    expect(mockWatch).toHaveBeenCalled();
  });

  it('does not duplicate member when caller is the author', async () => {
    mockGetSession.mockResolvedValue({
      user: { id: 'author-42', name: 'The Author' },
    });

    await createAuthorChatChannel('book-123', 'author-42');

    expect(mockChannel).toHaveBeenCalledWith(
      'messaging',
      expect.any(String),
      expect.objectContaining({
        members: ['author-42'],
      }),
    );
  });

  it('works without authorUserId', async () => {
    mockGetSession.mockResolvedValue({
      user: { id: 'user-1', name: 'Test User' },
    });

    await createAuthorChatChannel('book-123');

    expect(mockChannel).toHaveBeenCalledWith(
      'messaging',
      expect.any(String),
      expect.objectContaining({
        members: ['user-1'],
      }),
    );
  });

  it('returns error when Stream client fails', async () => {
    mockGetSession.mockResolvedValue({
      user: { id: 'user-1', name: 'Test User' },
    });
    mockWatch.mockRejectedValueOnce(new Error('Stream unavailable'));

    const result = await createAuthorChatChannel('book-123');

    expect(result).toEqual({
      success: false,
      error: 'Failed to create author chat channel',
    });
  });
});
