import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthorVerifiedBadge } from './AuthorVerifiedBadge';

// Mock window.matchMedia for tooltip
beforeAll(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
});

describe('AuthorVerifiedBadge', () => {
  it('renders the verified badge', () => {
    render(<AuthorVerifiedBadge />);

    expect(screen.getByTestId('author-verified-badge')).toBeInTheDocument();
    expect(screen.getByText('Verified')).toBeInTheDocument();
  });

  it('displays tooltip on hover', async () => {
    const user = userEvent.setup({ delay: null });
    render(<AuthorVerifiedBadge />);

    const badge = screen.getByTestId('author-verified-badge');
    await user.hover(badge);

    // Wait for tooltip to appear (Radix tooltip has delay)
    // The tooltip content appears in multiple elements due to accessibility, use getAllByText
    await waitFor(
      () => {
        const tooltipTexts = screen.getAllByText(
          'This author has verified their identity on the platform'
        );
        expect(tooltipTexts.length).toBeGreaterThanOrEqual(1);
      },
      { timeout: 2000 }
    );
  });

  it('includes motion-safe shimmer animation classes', () => {
    // CSS-based motion detection via Tailwind's motion-safe: variant
    // The class is always present in HTML; browser applies based on user's prefers-reduced-motion
    render(<AuthorVerifiedBadge />);

    const badge = screen.getByTestId('author-verified-badge');
    expect(badge.className).toContain('motion-safe:animate-shimmer');
  });

  it('accepts additional className', () => {
    render(<AuthorVerifiedBadge className="custom-class" />);

    const badge = screen.getByTestId('author-verified-badge');
    expect(badge.className).toContain('custom-class');
  });

  it('has golden accent styling', () => {
    render(<AuthorVerifiedBadge />);

    const badge = screen.getByTestId('author-verified-badge');
    expect(badge.className).toContain('bg-amber-100');
    expect(badge.className).toContain('text-amber-800');
  });
});
