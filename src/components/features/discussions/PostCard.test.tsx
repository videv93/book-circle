import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PostCard } from './PostCard';
import type { PostSummary } from '@/actions/discussions';

const mockPost: PostSummary = {
  id: 'post-1',
  title: 'Great book discussion',
  body: 'This is a really long body text that should be truncated to two lines in the card display',
  createdAt: new Date('2026-01-15T10:00:00Z'),
  author: { id: 'user-1', name: 'Jane Reader', image: 'https://example.com/jane.jpg' },
  commentCount: 5,
};

describe('PostCard', () => {
  it('renders title, body, author, timestamp, and comment count', () => {
    render(<PostCard post={mockPost} />);

    expect(screen.getByText('Great book discussion')).toBeInTheDocument();
    expect(screen.getByText(/This is a really long body/)).toBeInTheDocument();
    expect(screen.getByText('Jane Reader')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('shows author badge when authorUserId matches post author', () => {
    render(<PostCard post={mockPost} authorUserId="user-1" />);

    expect(screen.getByTestId('author-badge')).toBeInTheDocument();
    expect(screen.getByText('Author')).toBeInTheDocument();
  });

  it('does not show author badge when authorUserId does not match', () => {
    render(<PostCard post={mockPost} authorUserId="user-99" />);

    expect(screen.queryByTestId('author-badge')).not.toBeInTheDocument();
  });

  it('does not show author badge when authorUserId is not provided', () => {
    render(<PostCard post={mockPost} />);

    expect(screen.queryByTestId('author-badge')).not.toBeInTheDocument();
  });

  it('renders avatar with fallback', () => {
    const postNoImage: PostSummary = {
      ...mockPost,
      author: { id: 'user-2', name: 'Bob', image: null },
    };

    render(<PostCard post={postNoImage} />);
    expect(screen.getByText('B')).toBeInTheDocument();
  });
});
