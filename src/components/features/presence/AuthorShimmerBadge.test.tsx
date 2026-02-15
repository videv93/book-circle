import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AuthorShimmerBadge } from './AuthorShimmerBadge';

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

describe('AuthorShimmerBadge', () => {
  const defaultProps = {
    authorName: 'Jane Author',
    lastSeenAt: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
    isLive: false,
    authorId: 'author-1',
  };

  it('renders "was here" state with timestamp', () => {
    render(<AuthorShimmerBadge {...defaultProps} />);

    expect(screen.getByTestId('author-shimmer-badge')).toBeInTheDocument();
    expect(screen.getByTestId('author-shimmer-text').textContent).toContain('Author was here');
    expect(screen.getByTestId('author-shimmer-text').textContent).toContain('3h ago');
  });

  it('renders "live" state when author is present', () => {
    render(<AuthorShimmerBadge {...defaultProps} isLive={true} />);

    expect(screen.getByTestId('author-shimmer-text').textContent).toBe('Author is here!');
  });

  it('links to author profile', () => {
    render(<AuthorShimmerBadge {...defaultProps} />);

    const link = screen.getByTestId('author-shimmer-badge');
    expect(link).toHaveAttribute('href', '/user/author-1');
  });

  it('has correct aria-label for was-here state', () => {
    render(<AuthorShimmerBadge {...defaultProps} />);

    const badge = screen.getByTestId('author-shimmer-badge');
    expect(badge).toHaveAttribute('aria-label', expect.stringContaining('Author Jane Author was here'));
  });

  it('has correct aria-label for live state', () => {
    render(<AuthorShimmerBadge {...defaultProps} isLive={true} />);

    const badge = screen.getByTestId('author-shimmer-badge');
    expect(badge).toHaveAttribute('aria-label', 'Author Jane Author is here now');
  });

  it('applies shimmer animation class only when live', () => {
    const { rerender } = render(<AuthorShimmerBadge {...defaultProps} isLive={false} />);
    const badge = screen.getByTestId('author-shimmer-badge');
    expect(badge.className).not.toContain('animate-shimmer');

    rerender(<AuthorShimmerBadge {...defaultProps} isLive={true} />);
    const liveBadge = screen.getByTestId('author-shimmer-badge');
    expect(liveBadge.className).toContain('animate-shimmer');
  });

  it('shows "just now" for very recent timestamps', () => {
    render(
      <AuthorShimmerBadge
        {...defaultProps}
        lastSeenAt={new Date(Date.now() - 30 * 1000)} // 30 seconds ago
      />
    );

    expect(screen.getByTestId('author-shimmer-text').textContent).toContain('just now');
  });

  it('has minimum 44px touch target', () => {
    render(<AuthorShimmerBadge {...defaultProps} />);

    const badge = screen.getByTestId('author-shimmer-badge');
    expect(badge.className).toContain('min-h-[44px]');
  });
});
