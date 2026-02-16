import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

// Mock stream-chat-react
const mockWatch = vi.fn().mockResolvedValue({});

vi.mock('stream-chat-react', () => ({
  Channel: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="stream-channel">{children}</div>
  ),
  MessageList: () => <div data-testid="message-list">Messages</div>,
  Window: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="stream-window">{children}</div>
  ),
  ChatContext: {
    Provider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  },
  MessageSimple: () => <div data-testid="message-simple">Message</div>,
  useMessageContext: () => ({
    message: { user: { id: 'user-1' }, text: 'Hello' },
  }),
}));

vi.mock('stream-chat-react/dist/css/v2/index.css', () => ({}));

vi.mock('./useChatClient', () => ({
  useChatClient: vi.fn(),
}));

vi.mock('@/actions/stream', () => ({
  getBookChannel: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  usePathname: () => '/book/123',
}));

import { BookDiscussion } from './BookDiscussion';
import { useChatClient } from './useChatClient';
import { getBookChannel } from '@/actions/stream';

const mockUseChatClient = vi.mocked(useChatClient);
const mockGetBookChannel = vi.mocked(getBookChannel);

describe('BookDiscussion', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockWatch.mockResolvedValue({});
  });

  it('shows loading skeleton initially when client exists', () => {
    mockUseChatClient.mockReturnValue({
      channel: () => ({ watch: mockWatch, id: 'book-1' }),
    } as never);
    mockGetBookChannel.mockReturnValue(new Promise(() => {})); // never resolves

    render(<BookDiscussion bookId="1" />);

    expect(screen.getByTestId('discussion-loading')).toBeInTheDocument();
    expect(screen.getByText('Discussion')).toBeInTheDocument();
  });

  it('shows login prompt when no client available (unauthenticated)', async () => {
    mockUseChatClient.mockReturnValue(null);

    render(<BookDiscussion bookId="1" />);

    await waitFor(() => {
      expect(screen.getByTestId('discussion-login-prompt')).toBeInTheDocument();
    });
    expect(screen.getByText('Log in to join the discussion')).toBeInTheDocument();
    expect(screen.getByRole('link')).toHaveAttribute(
      'href',
      '/login?callbackUrl=%2Fbook%2F123',
    );
  });

  it('shows error when getBookChannel fails', async () => {
    mockUseChatClient.mockReturnValue({
      channel: vi.fn(),
    } as never);
    mockGetBookChannel.mockResolvedValue({ success: false, error: 'Failed' });

    render(<BookDiscussion bookId="1" />);

    await waitFor(() => {
      expect(screen.getByTestId('discussion-error')).toBeInTheDocument();
    });
  });

  it('renders Stream channel with message list on success', async () => {
    mockUseChatClient.mockReturnValue({
      channel: () => ({ watch: mockWatch, id: 'book-1' }),
    } as never);
    mockGetBookChannel.mockResolvedValue({
      success: true,
      data: { channelId: 'book-1' },
    });

    render(<BookDiscussion bookId="1" />);

    await waitFor(() => {
      expect(screen.getByTestId('book-discussion')).toBeInTheDocument();
    });
    expect(screen.getByTestId('stream-channel')).toBeInTheDocument();
    expect(screen.getByTestId('message-list')).toBeInTheDocument();
  });

  it('shows error when channel watch throws', async () => {
    mockUseChatClient.mockReturnValue({
      channel: () => ({
        watch: vi.fn().mockRejectedValue(new Error('Network error')),
        id: 'book-1',
      }),
    } as never);
    mockGetBookChannel.mockResolvedValue({
      success: true,
      data: { channelId: 'book-1' },
    });

    render(<BookDiscussion bookId="1" />);

    await waitFor(() => {
      expect(screen.getByTestId('discussion-error')).toBeInTheDocument();
    });
  });
});
