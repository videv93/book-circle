import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { PostReadingRecommendations } from './PostReadingRecommendations';

const mockGetRecommendations = vi.fn();

vi.mock('@/actions/books/getRecommendations', () => ({
  getRecommendations: (...args: unknown[]) => mockGetRecommendations(...args),
}));

vi.mock('./RecommendationCard', () => ({
  RecommendationCard: ({ book }: { book: { title: string } }) => (
    <div data-testid="mock-recommendation-card">{book.title}</div>
  ),
}));

describe('PostReadingRecommendations', () => {
  it('shows loading skeleton initially', () => {
    mockGetRecommendations.mockReturnValue(new Promise(() => {})); // never resolves
    render(<PostReadingRecommendations bookId="book-1" bookTitle="Test" />);
    expect(screen.getByTestId('recommendations-loading')).toBeInTheDocument();
  });

  it('renders recommendations when available', async () => {
    mockGetRecommendations.mockResolvedValue({
      success: true,
      data: [
        { title: 'Rec 1', author: 'A', isbn13: '111', friendCount: 0, source: 'author' },
        { title: 'Rec 2', author: 'B', isbn13: '222', friendCount: 2, source: 'similar' },
      ],
    });

    render(<PostReadingRecommendations bookId="book-1" bookTitle="Test" />);

    await waitFor(() => {
      expect(screen.getByTestId('recommendations-section')).toBeInTheDocument();
    });

    expect(screen.getByText('What to read next')).toBeInTheDocument();
    expect(screen.getAllByTestId('mock-recommendation-card')).toHaveLength(2);
  });

  it('renders nothing when no recommendations', async () => {
    mockGetRecommendations.mockResolvedValue({ success: true, data: [] });

    const { container } = render(
      <PostReadingRecommendations bookId="book-1" bookTitle="Test" />
    );

    await waitFor(() => {
      expect(screen.queryByTestId('recommendations-loading')).not.toBeInTheDocument();
    });

    expect(screen.queryByTestId('recommendations-section')).not.toBeInTheDocument();
    expect(container.innerHTML).toBe('');
  });

  it('renders nothing on error', async () => {
    mockGetRecommendations.mockResolvedValue({ success: false, error: 'Failed' });

    const { container } = render(
      <PostReadingRecommendations bookId="book-1" bookTitle="Test" />
    );

    await waitFor(() => {
      expect(screen.queryByTestId('recommendations-loading')).not.toBeInTheDocument();
    });

    expect(container.innerHTML).toBe('');
  });

  it('passes bookId to getRecommendations', async () => {
    mockGetRecommendations.mockResolvedValue({ success: true, data: [] });

    render(<PostReadingRecommendations bookId="my-book-id" bookTitle="Test" />);

    await waitFor(() => {
      expect(mockGetRecommendations).toHaveBeenCalledWith('my-book-id');
    });
  });
});
