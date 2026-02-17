import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PostList } from './PostList';

const mockListPosts = vi.fn();

vi.mock('@/actions/discussions', () => ({
  listPosts: (...args: unknown[]) => mockListPosts(...args),
}));

const makePosts = (count: number) =>
  Array.from({ length: count }, (_, i) => ({
    id: `post-${i}`,
    title: `Post ${i}`,
    body: `Body ${i}`,
    createdAt: new Date('2026-01-15'),
    author: { id: `user-${i}`, name: `User ${i}`, image: null },
    commentCount: i,
  }));

describe('PostList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading skeletons initially', () => {
    mockListPosts.mockReturnValue(new Promise(() => {})); // never resolves
    render(<PostList bookId="book-1" />);

    expect(screen.getAllByTestId('post-card-skeleton')).toHaveLength(3);
  });

  it('renders posts after loading', async () => {
    mockListPosts.mockResolvedValue({
      success: true,
      data: { posts: makePosts(2), nextCursor: null },
    });

    render(<PostList bookId="book-1" />);

    await waitFor(() => {
      expect(screen.getAllByTestId('post-card')).toHaveLength(2);
    });
  });

  it('shows empty state when no posts', async () => {
    mockListPosts.mockResolvedValue({
      success: true,
      data: { posts: [], nextCursor: null },
    });

    render(<PostList bookId="book-1" />);

    await waitFor(() => {
      expect(screen.getByTestId('discussions-empty')).toBeInTheDocument();
    });
    expect(screen.getByText(/No discussions yet/)).toBeInTheDocument();
    expect(screen.getByTestId('new-post-button')).toBeDisabled();
  });

  it('shows error state on failure', async () => {
    mockListPosts.mockResolvedValue({
      success: false,
      error: 'Failed',
    });

    render(<PostList bookId="book-1" />);

    await waitFor(() => {
      expect(screen.getByTestId('discussions-error')).toBeInTheDocument();
    });
    expect(screen.getByText('Discussions unavailable')).toBeInTheDocument();
  });

  it('shows load more button and loads next page', async () => {
    const user = userEvent.setup();
    mockListPosts
      .mockResolvedValueOnce({
        success: true,
        data: { posts: makePosts(2), nextCursor: 'cursor-1' },
      })
      .mockResolvedValueOnce({
        success: true,
        data: { posts: [{ id: 'post-extra', title: 'Extra', body: 'Body', createdAt: new Date(), author: { id: 'u1', name: 'User', image: null }, commentCount: 0 }], nextCursor: null },
      });

    render(<PostList bookId="book-1" />);

    await waitFor(() => {
      expect(screen.getByTestId('load-more-button')).toBeInTheDocument();
    });

    await user.click(screen.getByTestId('load-more-button'));

    await waitFor(() => {
      expect(screen.getAllByTestId('post-card')).toHaveLength(3);
    });

    expect(screen.queryByTestId('load-more-button')).not.toBeInTheDocument();
  });

  it('shows error message when load more fails', async () => {
    const user = userEvent.setup();
    mockListPosts
      .mockResolvedValueOnce({
        success: true,
        data: { posts: makePosts(2), nextCursor: 'cursor-1' },
      })
      .mockResolvedValueOnce({
        success: false,
        error: 'Failed',
      });

    render(<PostList bookId="book-1" />);

    await waitFor(() => {
      expect(screen.getByTestId('load-more-button')).toBeInTheDocument();
    });

    await user.click(screen.getByTestId('load-more-button'));

    await waitFor(() => {
      expect(screen.getByTestId('load-more-error')).toBeInTheDocument();
    });
    expect(screen.getByText('Retry')).toBeInTheDocument();
  });
});
