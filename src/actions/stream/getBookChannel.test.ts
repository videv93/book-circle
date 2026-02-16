import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockGetSession = vi.fn();
const mockChannel = vi.fn();
const mockQuery = vi.fn();

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
    queryChannels: (...args: unknown[]) => mockQuery(...args),
  }),
}));

describe('getBookChannel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns error when user is not authenticated', async () => {
    mockGetSession.mockResolvedValue(null);
    const { getBookChannel } = await import('./getBookChannel');
    const result = await getBookChannel({ bookId: 'book-1' });
    expect(result).toEqual({ success: false, error: 'Unauthorized' });
  });

  it('creates/watches channel and returns channelId for authenticated user', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'user-1' } });
    const mockWatch = vi.fn().mockResolvedValue({});
    mockChannel.mockReturnValue({
      watch: mockWatch,
      id: 'book-book-1',
    });

    const { getBookChannel } = await import('./getBookChannel');
    const result = await getBookChannel({ bookId: 'book-1' });

    expect(mockChannel).toHaveBeenCalledWith('messaging', 'book-book-1');
    expect(mockWatch).toHaveBeenCalled();
    expect(result).toEqual({ success: true, data: { channelId: 'book-book-1' } });
  });

  it('returns error when Stream client fails', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'user-1' } });
    mockChannel.mockImplementation(() => {
      throw new Error('Stream unavailable');
    });

    const { getBookChannel } = await import('./getBookChannel');
    const result = await getBookChannel({ bookId: 'book-1' });

    expect(result).toEqual({ success: false, error: 'Failed to get or create book discussion channel' });
  });
});
