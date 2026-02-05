import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BookDetailSkeleton } from './BookDetailSkeleton';

describe('BookDetailSkeleton', () => {
  it('renders skeleton loading state', () => {
    render(<BookDetailSkeleton />);

    expect(screen.getByTestId('book-detail-skeleton')).toBeInTheDocument();
  });

  it('has animate-pulse class for loading animation', () => {
    render(<BookDetailSkeleton />);

    const skeleton = screen.getByTestId('book-detail-skeleton');
    expect(skeleton.className).toContain('animate-pulse');
  });

  it('accepts additional className', () => {
    render(<BookDetailSkeleton className="custom-class" />);

    const skeleton = screen.getByTestId('book-detail-skeleton');
    expect(skeleton.className).toContain('custom-class');
  });

  it('renders multiple skeleton elements', () => {
    render(<BookDetailSkeleton />);

    const container = screen.getByTestId('book-detail-skeleton');
    const skeletonElements = container.querySelectorAll('[data-slot="skeleton"]');
    expect(skeletonElements.length).toBeGreaterThan(5);
  });
});
