import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';

const mockUseChatClient = vi.hoisted(() => vi.fn());
const mockCreateAuthorChatChannel = vi.hoisted(() => vi.fn());
const mockGetAuthorChatAccess = vi.hoisted(() => vi.fn());
const mockDeleteAuthorChatChannel = vi.hoisted(() => vi.fn());
const mockWatch = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));
const mockChannelFn = vi.hoisted(() =>
  vi.fn().mockReturnValue({ watch: mockWatch }),
);

vi.mock('@/components/features/discussions/useChatClient', () => ({
  useChatClient: mockUseChatClient,
}));

vi.mock('@/actions/stream', () => ({
  createAuthorChatChannel: mockCreateAuthorChatChannel,
  getAuthorChatAccess: mockGetAuthorChatAccess,
  deleteAuthorChatChannel: mockDeleteAuthorChatChannel,
}));

vi.mock('@/components/features/discussions/DiscussionMessage', () => ({
  createDiscussionMessage: () => function MockMessage() {
    return <div>Mock Message</div>;
  },
}));

vi.mock('stream-chat-react', () => ({
  Channel: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="stream-channel">{children}</div>
  ),
  MessageList: () => <div data-testid="stream-message-list" />,
  MessageInput: () => <div data-testid="stream-message-input" />,
  Window: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

vi.mock('framer-motion', () => ({
  motion: {
    div: ({
      children,
      ...props
    }: React.PropsWithChildren<Record<string, unknown>>) => {
      const { initial, animate, exit, transition, ...rest } = props;
      return <div {...(rest as React.HTMLAttributes<HTMLDivElement>)}>{children}</div>;
    },
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
  useReducedMotion: () => false,
}));

import { AuthorChatPanel } from './AuthorChatPanel';

describe('AuthorChatPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    mockDeleteAuthorChatChannel.mockResolvedValue({ success: true, data: undefined });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders nothing when authorPresent is false', () => {
    mockUseChatClient.mockReturnValue({ channel: mockChannelFn });
    mockGetAuthorChatAccess.mockResolvedValue({
      success: true,
      data: { isPremium: true },
    });

    const { container } = render(
      <AuthorChatPanel bookId="book-1" authorPresent={false} />,
    );

    expect(container.innerHTML).toBe('');
  });

  it('shows loading while premium status is being checked', () => {
    mockUseChatClient.mockReturnValue({ channel: mockChannelFn });
    mockGetAuthorChatAccess.mockReturnValue(new Promise(() => {}));

    render(
      <AuthorChatPanel
        bookId="book-1"
        authorPresent={true}
        authorName="Jane Author"
      />,
    );

    expect(screen.getByTestId('author-chat-panel')).toBeInTheDocument();
    expect(screen.getByText('Chat with Jane Author')).toBeInTheDocument();
    expect(screen.getByTestId('author-chat-loading')).toBeInTheDocument();
  });

  it('shows locked overlay for free users', async () => {
    mockUseChatClient.mockReturnValue({ channel: mockChannelFn });
    mockGetAuthorChatAccess.mockResolvedValue({
      success: true,
      data: { isPremium: false },
    });

    render(
      <AuthorChatPanel
        bookId="book-1"
        authorPresent={true}
        authorName="Jane Author"
      />,
    );

    await vi.waitFor(() => {
      expect(
        screen.getByTestId('author-chat-locked-overlay'),
      ).toBeInTheDocument();
    });

    expect(
      screen.getByText('Chat with Jane Author — Premium feature'),
    ).toBeInTheDocument();
  });

  it('does not connect free users to Stream channel', async () => {
    mockUseChatClient.mockReturnValue({ channel: mockChannelFn });
    mockGetAuthorChatAccess.mockResolvedValue({
      success: true,
      data: { isPremium: false },
    });

    render(
      <AuthorChatPanel bookId="book-1" authorPresent={true} />,
    );

    await vi.waitFor(() => {
      expect(
        screen.getByTestId('author-chat-locked-overlay'),
      ).toBeInTheDocument();
    });

    expect(mockCreateAuthorChatChannel).not.toHaveBeenCalled();
    expect(mockChannelFn).not.toHaveBeenCalled();
  });

  it('shows full chat for premium users', async () => {
    const mockClient = { channel: mockChannelFn };
    mockUseChatClient.mockReturnValue(mockClient);
    mockGetAuthorChatAccess.mockResolvedValue({
      success: true,
      data: { isPremium: true },
    });
    mockCreateAuthorChatChannel.mockResolvedValue({
      success: true,
      data: { channelId: 'author-chat-book-1-uuid' },
    });

    render(
      <AuthorChatPanel
        bookId="book-1"
        authorPresent={true}
        authorUserId="author-1"
        authorName="Jane Author"
      />,
    );

    await vi.waitFor(() => {
      expect(screen.getByTestId('stream-channel')).toBeInTheDocument();
    });

    expect(mockCreateAuthorChatChannel).toHaveBeenCalledWith('book-1', 'author-1');
    expect(mockChannelFn).toHaveBeenCalledWith('messaging', 'author-chat-book-1-uuid');
    expect(screen.getByTestId('stream-message-list')).toBeInTheDocument();
    expect(screen.getByTestId('stream-message-input')).toBeInTheDocument();
  });

  it('shows error when Stream client is null for premium user', async () => {
    mockUseChatClient.mockReturnValue(null);
    mockGetAuthorChatAccess.mockResolvedValue({
      success: true,
      data: { isPremium: true },
    });

    render(
      <AuthorChatPanel
        bookId="book-1"
        authorPresent={true}
        authorName="Jane Author"
      />,
    );

    await vi.waitFor(() => {
      expect(screen.getByTestId('author-chat-error')).toBeInTheDocument();
    });

    expect(screen.getByText('Chat unavailable')).toBeInTheDocument();
  });

  it('shows error when channel creation fails for premium user', async () => {
    const mockClient = { channel: mockChannelFn };
    mockUseChatClient.mockReturnValue(mockClient);
    mockGetAuthorChatAccess.mockResolvedValue({
      success: true,
      data: { isPremium: true },
    });
    mockCreateAuthorChatChannel.mockResolvedValue({
      success: false,
      error: 'Failed',
    });

    render(
      <AuthorChatPanel bookId="book-1" authorPresent={true} />,
    );

    await vi.waitFor(() => {
      expect(screen.getByTestId('author-chat-error')).toBeInTheDocument();
    });

    expect(screen.getByText('Chat unavailable')).toBeInTheDocument();
  });

  it('transitions from locked to chat when user upgrades mid-session', async () => {
    const mockClient = { channel: mockChannelFn };
    mockUseChatClient.mockReturnValue(mockClient);
    mockCreateAuthorChatChannel.mockResolvedValue({
      success: true,
      data: { channelId: 'author-chat-book-1-uuid' },
    });

    mockGetAuthorChatAccess.mockResolvedValue({
      success: true,
      data: { isPremium: false },
    });

    render(
      <AuthorChatPanel
        bookId="book-1"
        authorPresent={true}
        authorName="Jane Author"
      />,
    );

    await vi.waitFor(() => {
      expect(
        screen.getByTestId('author-chat-locked-overlay'),
      ).toBeInTheDocument();
    });

    mockGetAuthorChatAccess.mockResolvedValue({
      success: true,
      data: { isPremium: true },
    });

    await act(async () => {
      window.dispatchEvent(new Event('focus'));
    });

    await vi.waitFor(() => {
      expect(screen.getByTestId('stream-channel')).toBeInTheDocument();
    });

    expect(
      screen.queryByTestId('author-chat-locked-overlay'),
    ).not.toBeInTheDocument();
  });

  it('polls for upgrade on 30-second interval', async () => {
    mockUseChatClient.mockReturnValue({ channel: mockChannelFn });
    mockGetAuthorChatAccess.mockResolvedValue({
      success: true,
      data: { isPremium: false },
    });

    render(
      <AuthorChatPanel bookId="book-1" authorPresent={true} />,
    );

    await vi.waitFor(() => {
      expect(
        screen.getByTestId('author-chat-locked-overlay'),
      ).toBeInTheDocument();
    });

    const callCountAfterInit = mockGetAuthorChatAccess.mock.calls.length;

    await act(async () => {
      vi.advanceTimersByTime(30_000);
    });

    expect(mockGetAuthorChatAccess.mock.calls.length).toBeGreaterThan(
      callCountAfterInit,
    );
  });

  it('shows error when access check fails', async () => {
    mockUseChatClient.mockReturnValue({ channel: mockChannelFn });
    mockGetAuthorChatAccess.mockResolvedValue({
      success: false,
      error: 'Server error',
    });

    render(
      <AuthorChatPanel bookId="book-1" authorPresent={true} />,
    );

    await vi.waitFor(() => {
      expect(screen.getByTestId('author-chat-error')).toBeInTheDocument();
    });

    expect(screen.getByText('Chat unavailable')).toBeInTheDocument();
  });

  it('displays author name in header', async () => {
    mockUseChatClient.mockReturnValue(null);
    mockGetAuthorChatAccess.mockResolvedValue({
      success: true,
      data: { isPremium: false },
    });

    render(
      <AuthorChatPanel
        bookId="book-1"
        authorPresent={true}
        authorName="Test Author"
      />,
    );

    expect(screen.getByText('Chat with Test Author')).toBeInTheDocument();
  });

  it('falls back to "the Author" when authorName not provided', async () => {
    mockUseChatClient.mockReturnValue(null);
    mockGetAuthorChatAccess.mockResolvedValue({
      success: true,
      data: { isPremium: false },
    });

    render(
      <AuthorChatPanel bookId="book-1" authorPresent={true} />,
    );

    expect(screen.getByText('Chat with the Author')).toBeInTheDocument();
  });

  // --- Story 10.3: Ephemeral Chat Lifecycle Tests ---

  it('shows "Author has left — chat ended" when author leaves during active chat', async () => {
    const mockClient = { channel: mockChannelFn };
    mockUseChatClient.mockReturnValue(mockClient);
    mockGetAuthorChatAccess.mockResolvedValue({
      success: true,
      data: { isPremium: true },
    });
    mockCreateAuthorChatChannel.mockResolvedValue({
      success: true,
      data: { channelId: 'author-chat-book-1-uuid' },
    });

    const { rerender } = render(
      <AuthorChatPanel
        bookId="book-1"
        authorPresent={true}
        authorName="Jane Author"
      />,
    );

    // Wait for chat to be active
    await vi.waitFor(() => {
      expect(screen.getByTestId('stream-channel')).toBeInTheDocument();
    });

    // Author leaves
    rerender(
      <AuthorChatPanel
        bookId="book-1"
        authorPresent={false}
        authorName="Jane Author"
      />,
    );

    expect(screen.getByTestId('author-chat-ended')).toBeInTheDocument();
    expect(screen.getByText('Author has left — chat ended')).toBeInTheDocument();
    expect(screen.queryByTestId('stream-channel')).not.toBeInTheDocument();
  });

  it('auto-dismisses chat ended panel after 7 seconds', async () => {
    const mockClient = { channel: mockChannelFn };
    mockUseChatClient.mockReturnValue(mockClient);
    mockGetAuthorChatAccess.mockResolvedValue({
      success: true,
      data: { isPremium: true },
    });
    mockCreateAuthorChatChannel.mockResolvedValue({
      success: true,
      data: { channelId: 'author-chat-book-1-uuid' },
    });

    const { rerender } = render(
      <AuthorChatPanel
        bookId="book-1"
        authorPresent={true}
        authorName="Jane Author"
      />,
    );

    await vi.waitFor(() => {
      expect(screen.getByTestId('stream-channel')).toBeInTheDocument();
    });

    // Author leaves
    rerender(
      <AuthorChatPanel
        bookId="book-1"
        authorPresent={false}
        authorName="Jane Author"
      />,
    );

    expect(screen.getByTestId('author-chat-ended')).toBeInTheDocument();

    // Advance 7 seconds
    await act(async () => {
      vi.advanceTimersByTime(7_000);
    });

    expect(screen.queryByTestId('author-chat-ended')).not.toBeInTheDocument();
    expect(screen.queryByTestId('author-chat-panel')).not.toBeInTheDocument();
  });

  it('calls deleteAuthorChatChannel after dismiss delay', async () => {
    const mockClient = { channel: mockChannelFn };
    mockUseChatClient.mockReturnValue(mockClient);
    mockGetAuthorChatAccess.mockResolvedValue({
      success: true,
      data: { isPremium: true },
    });
    mockCreateAuthorChatChannel.mockResolvedValue({
      success: true,
      data: { channelId: 'author-chat-book-1-uuid' },
    });

    const { rerender } = render(
      <AuthorChatPanel
        bookId="book-1"
        authorPresent={true}
        authorName="Jane Author"
      />,
    );

    await vi.waitFor(() => {
      expect(screen.getByTestId('stream-channel')).toBeInTheDocument();
    });

    // Author leaves
    rerender(
      <AuthorChatPanel
        bookId="book-1"
        authorPresent={false}
        authorName="Jane Author"
      />,
    );

    expect(mockDeleteAuthorChatChannel).not.toHaveBeenCalled();

    // Advance 7 seconds
    await act(async () => {
      vi.advanceTimersByTime(7_000);
    });

    expect(mockDeleteAuthorChatChannel).toHaveBeenCalledWith('author-chat-book-1-uuid');
  });

  it('creates fresh channel when author rejoins after leaving', async () => {
    const mockClient = { channel: mockChannelFn };
    mockUseChatClient.mockReturnValue(mockClient);
    mockGetAuthorChatAccess.mockResolvedValue({
      success: true,
      data: { isPremium: true },
    });
    mockCreateAuthorChatChannel.mockResolvedValue({
      success: true,
      data: { channelId: 'author-chat-book-1-first' },
    });

    const { rerender } = render(
      <AuthorChatPanel
        bookId="book-1"
        authorPresent={true}
        authorName="Jane Author"
      />,
    );

    await vi.waitFor(() => {
      expect(screen.getByTestId('stream-channel')).toBeInTheDocument();
    });

    // Author leaves
    rerender(
      <AuthorChatPanel
        bookId="book-1"
        authorPresent={false}
        authorName="Jane Author"
      />,
    );

    // Wait for dismiss + cleanup
    await act(async () => {
      vi.advanceTimersByTime(7_000);
    });

    // Author rejoins — should create new channel
    mockCreateAuthorChatChannel.mockResolvedValue({
      success: true,
      data: { channelId: 'author-chat-book-1-second' },
    });

    rerender(
      <AuthorChatPanel
        bookId="book-1"
        authorPresent={true}
        authorName="Jane Author"
      />,
    );

    await vi.waitFor(() => {
      expect(screen.getByTestId('stream-channel')).toBeInTheDocument();
    });

    // Verify new channel was created (not reusing old one)
    expect(mockCreateAuthorChatChannel).toHaveBeenCalledTimes(2);
    expect(mockChannelFn).toHaveBeenLastCalledWith('messaging', 'author-chat-book-1-second');
  });

  it('has accessible chat ended announcement', async () => {
    const mockClient = { channel: mockChannelFn };
    mockUseChatClient.mockReturnValue(mockClient);
    mockGetAuthorChatAccess.mockResolvedValue({
      success: true,
      data: { isPremium: true },
    });
    mockCreateAuthorChatChannel.mockResolvedValue({
      success: true,
      data: { channelId: 'author-chat-book-1-uuid' },
    });

    const { rerender } = render(
      <AuthorChatPanel
        bookId="book-1"
        authorPresent={true}
        authorName="Jane Author"
      />,
    );

    await vi.waitFor(() => {
      expect(screen.getByTestId('stream-channel')).toBeInTheDocument();
    });

    rerender(
      <AuthorChatPanel
        bookId="book-1"
        authorPresent={false}
        authorName="Jane Author"
      />,
    );

    const ended = screen.getByTestId('author-chat-ended');
    expect(ended).toHaveAttribute('role', 'status');
    expect(ended).toHaveAttribute('aria-live', 'polite');
  });

  it('does not show chat ended when author leaves without active channel', () => {
    mockUseChatClient.mockReturnValue({ channel: mockChannelFn });
    mockGetAuthorChatAccess.mockResolvedValue({
      success: true,
      data: { isPremium: false },
    });

    const { rerender } = render(
      <AuthorChatPanel
        bookId="book-1"
        authorPresent={true}
        authorName="Jane Author"
      />,
    );

    // Author leaves (free user never had a channel)
    rerender(
      <AuthorChatPanel
        bookId="book-1"
        authorPresent={false}
        authorName="Jane Author"
      />,
    );

    // Should not show ended state — just hide
    expect(screen.queryByTestId('author-chat-ended')).not.toBeInTheDocument();
    expect(screen.queryByTestId('author-chat-panel')).not.toBeInTheDocument();
  });
});
