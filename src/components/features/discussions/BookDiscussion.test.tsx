import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock stream-chat-react
const mockChannel = vi.fn();
const mockWatch = vi.fn().mockResolvedValue({});
let lastMessageListProps: Record<string, unknown> = {};

vi.mock('stream-chat-react', () => ({
  Channel: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="stream-channel">{children}</div>
  ),
  MessageList: (props: Record<string, unknown>) => {
    lastMessageListProps = props;
    return <div data-testid="message-list">Messages</div>;
  },
  MessageInput: () => <div data-testid="message-input">Input</div>,
  Thread: () => <div data-testid="stream-thread">Thread</div>,
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
  defaultRenderMessages: vi.fn((opts: { messages: unknown[] }) => opts.messages.map(() => null)),
  isDateSeparatorMessage: vi.fn((m: Record<string, unknown>) => m.customType === 'message.date'),
  isIntroMessage: vi.fn((m: Record<string, unknown>) => m.customType === 'intro'),
  getGroupStyles: vi.fn(() => 'single'),
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
    lastMessageListProps = {};
    mockWatch.mockResolvedValue({});
  });

  it('shows loading skeleton initially when client exists', () => {
    mockUseChatClient.mockReturnValue({
      channel: () => ({ watch: mockWatch, id: 'book-1' }),
    } as never);
    mockGetBookChannel.mockReturnValue(new Promise(() => {})); // never resolves

    render(<BookDiscussion bookId="1" bookTitle="Test Book" />);

    expect(screen.getByTestId('discussion-loading')).toBeInTheDocument();
    expect(screen.getByText('Discussion')).toBeInTheDocument();
  });

  it('shows login prompt when no client available (unauthenticated)', async () => {
    mockUseChatClient.mockReturnValue(null);

    render(<BookDiscussion bookId="1" bookTitle="Test Book" />);

    await waitFor(() => {
      expect(screen.getByTestId('discussion-login-prompt')).toBeInTheDocument();
    });
    expect(screen.getByText('Log in to join the discussion')).toBeInTheDocument();
    expect(screen.getByRole('link')).toHaveAttribute(
      'href',
      '/login?callbackUrl=%2Fbook%2F123',
    );
    expect(screen.queryByTestId('message-input')).not.toBeInTheDocument();
  });

  it('shows error when getBookChannel fails', async () => {
    mockUseChatClient.mockReturnValue({
      channel: mockChannel,
    } as never);
    mockGetBookChannel.mockResolvedValue({ success: false, error: 'Failed' });

    render(<BookDiscussion bookId="1" bookTitle="Test Book" />);

    await waitFor(() => {
      expect(screen.getByTestId('discussion-error')).toBeInTheDocument();
    });
  });

  it('renders Stream channel with message list, input, and thread on success', async () => {
    mockUseChatClient.mockReturnValue({
      channel: () => ({ watch: mockWatch, id: 'book-1' }),
    } as never);
    mockGetBookChannel.mockResolvedValue({
      success: true,
      data: { channelId: 'book-1' },
    });

    render(<BookDiscussion bookId="1" bookTitle="Test Book" />);

    await waitFor(() => {
      expect(screen.getByTestId('book-discussion')).toBeInTheDocument();
    });
    expect(screen.getByTestId('stream-channel')).toBeInTheDocument();
    expect(screen.getByTestId('message-list')).toBeInTheDocument();
    expect(screen.getByTestId('message-input')).toBeInTheDocument();
    expect(screen.getByTestId('stream-thread')).toBeInTheDocument();
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

    render(<BookDiscussion bookId="1" bookTitle="Test Book" />);

    await waitFor(() => {
      expect(screen.getByTestId('discussion-error')).toBeInTheDocument();
    });
  });

  describe('Sort toggle', () => {
    const setupSuccess = () => {
      mockUseChatClient.mockReturnValue({
        channel: () => ({ watch: mockWatch, id: 'book-1' }),
      } as never);
      mockGetBookChannel.mockResolvedValue({
        success: true,
        data: { channelId: 'book-1' },
      });
    };

    it('renders sort toggle with Recent and Active options when authenticated and loaded', async () => {
      setupSuccess();
      render(<BookDiscussion bookId="1" bookTitle="Test Book" />);

      await waitFor(() => {
        expect(screen.getByTestId('sort-toggle')).toBeInTheDocument();
      });
      expect(screen.getByRole('button', { name: 'Recent' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Active' })).toBeInTheDocument();
    });

    it('does not render sort toggle when unauthenticated', async () => {
      mockUseChatClient.mockReturnValue(null);
      render(<BookDiscussion bookId="1" bookTitle="Test Book" />);

      await waitFor(() => {
        expect(screen.getByTestId('discussion-login-prompt')).toBeInTheDocument();
      });
      expect(screen.queryByTestId('sort-toggle')).not.toBeInTheDocument();
    });

    it('does not render sort toggle in error state', async () => {
      mockUseChatClient.mockReturnValue({
        channel: mockChannel,
      } as never);
      mockGetBookChannel.mockResolvedValue({ success: false, error: 'Failed' });

      render(<BookDiscussion bookId="1" bookTitle="Test Book" />);

      await waitFor(() => {
        expect(screen.getByTestId('discussion-error')).toBeInTheDocument();
      });
      expect(screen.queryByTestId('sort-toggle')).not.toBeInTheDocument();
    });

    it('does not render sort toggle in loading state', () => {
      mockUseChatClient.mockReturnValue({
        channel: () => ({ watch: mockWatch, id: 'book-1' }),
      } as never);
      mockGetBookChannel.mockReturnValue(new Promise(() => {}));

      render(<BookDiscussion bookId="1" bookTitle="Test Book" />);

      expect(screen.getByTestId('discussion-loading')).toBeInTheDocument();
      expect(screen.queryByTestId('sort-toggle')).not.toBeInTheDocument();
    });

    it('defaults to Recent mode with no renderMessages on MessageList', async () => {
      setupSuccess();
      render(<BookDiscussion bookId="1" bookTitle="Test Book" />);

      await waitFor(() => {
        expect(screen.getByTestId('book-discussion')).toBeInTheDocument();
      });
      expect(lastMessageListProps.renderMessages).toBeUndefined();
    });

    it('passes renderMessages to MessageList when Active is selected', async () => {
      setupSuccess();
      const user = userEvent.setup();
      render(<BookDiscussion bookId="1" bookTitle="Test Book" />);

      await waitFor(() => {
        expect(screen.getByTestId('book-discussion')).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: 'Active' }));

      expect(lastMessageListProps.renderMessages).toBeTypeOf('function');
    });

    it('removes renderMessages when switching back to Recent', async () => {
      setupSuccess();
      const user = userEvent.setup();
      render(<BookDiscussion bookId="1" bookTitle="Test Book" />);

      await waitFor(() => {
        expect(screen.getByTestId('book-discussion')).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: 'Active' }));
      expect(lastMessageListProps.renderMessages).toBeTypeOf('function');

      await user.click(screen.getByRole('button', { name: 'Recent' }));
      expect(lastMessageListProps.renderMessages).toBeUndefined();
    });

    it('sets aria-pressed on active sort button', async () => {
      setupSuccess();
      const user = userEvent.setup();
      render(<BookDiscussion bookId="1" bookTitle="Test Book" />);

      await waitFor(() => {
        expect(screen.getByTestId('book-discussion')).toBeInTheDocument();
      });

      expect(screen.getByRole('button', { name: 'Recent' })).toHaveAttribute('aria-pressed', 'true');
      expect(screen.getByRole('button', { name: 'Active' })).toHaveAttribute('aria-pressed', 'false');

      await user.click(screen.getByRole('button', { name: 'Active' }));

      expect(screen.getByRole('button', { name: 'Recent' })).toHaveAttribute('aria-pressed', 'false');
      expect(screen.getByRole('button', { name: 'Active' })).toHaveAttribute('aria-pressed', 'true');
    });

    it('sorts messages by thread activity in Active mode, stripping date separators', async () => {
      setupSuccess();
      const { defaultRenderMessages: mockDefaultRender } = await import('stream-chat-react');
      const user = userEvent.setup();
      render(<BookDiscussion bookId="1" bookTitle="Test Book" />);

      await waitFor(() => {
        expect(screen.getByTestId('book-discussion')).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: 'Active' }));

      const renderFn = lastMessageListProps.renderMessages as (opts: Record<string, unknown>) => unknown[];

      // Create mock messages: msg-old has no replies, msg-active has replies (higher updated_at)
      const mockMessages = [
        { id: 'date-sep', customType: 'message.date', date: new Date() },
        { id: 'msg-old', created_at: '2026-01-01T00:00:00Z', reply_count: 0 },
        { id: 'msg-active', created_at: '2026-01-01T00:00:00Z', reply_count: 5, updated_at: '2026-02-13T00:00:00Z' },
        { id: 'msg-recent', created_at: '2026-02-12T00:00:00Z', reply_count: 0 },
      ];

      renderFn({
        messages: mockMessages,
        messageGroupStyles: {},
        components: {},
        lastReceivedMessageId: null,
        ownMessagesDeliveredToOthers: {},
        readData: {},
        sharedMessageProps: {},
      });

      // Verify defaultRenderMessages was called with sorted messages (no date separator)
      const call = (mockDefaultRender as ReturnType<typeof vi.fn>).mock.calls.at(-1)?.[0] as {
        messages: Array<{ id: string }>;
      };
      const ids = call.messages.map((m: { id: string }) => m.id);

      // Date separator should be stripped
      expect(ids).not.toContain('date-sep');
      // Active (most thread activity) first, then recent, then old
      expect(ids).toEqual(['msg-active', 'msg-recent', 'msg-old']);
    });
  });
});
