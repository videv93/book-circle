import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RecommendationCard } from './RecommendationCard';
import type { RecommendedBook } from '@/actions/books/getRecommendations';

const mockBook: RecommendedBook = {
  title: 'Recommended Book',
  author: 'Rec Author',
  coverUrl: 'https://example.com/cover.jpg',
  isbn10: '1111111111',
  isbn13: '9781111111111',
  friendCount: 3,
  source: 'author',
};

describe('RecommendationCard', () => {
  it('renders book title and author', () => {
    render(<RecommendationCard book={mockBook} />);
    expect(screen.getByText('Recommended Book')).toBeInTheDocument();
    expect(screen.getByText('Rec Author')).toBeInTheDocument();
  });

  it('renders cover image when coverUrl provided', () => {
    render(<RecommendationCard book={mockBook} />);
    const img = screen.getByAltText('Cover of Recommended Book');
    expect(img).toHaveAttribute('src', 'https://example.com/cover.jpg');
  });

  it('renders placeholder when no coverUrl', () => {
    render(<RecommendationCard book={{ ...mockBook, coverUrl: undefined }} />);
    expect(screen.getByTestId('cover-placeholder')).toBeInTheDocument();
  });

  it('shows social proof when friendCount > 0', () => {
    render(<RecommendationCard book={mockBook} />);
    expect(screen.getByTestId('social-proof')).toHaveTextContent('3 friends read this');
  });

  it('shows singular form for 1 friend', () => {
    render(<RecommendationCard book={{ ...mockBook, friendCount: 1 }} />);
    expect(screen.getByTestId('social-proof')).toHaveTextContent('1 friend read this');
  });

  it('hides social proof when friendCount is 0', () => {
    render(<RecommendationCard book={{ ...mockBook, friendCount: 0 }} />);
    expect(screen.queryByTestId('social-proof')).not.toBeInTheDocument();
  });

  it('renders OpenLibrary free link', () => {
    render(<RecommendationCard book={mockBook} />);
    const link = screen.getByRole('link', { name: /free on openlibrary/i });
    expect(link).toHaveAttribute('href', 'https://openlibrary.org/isbn/9781111111111');
    expect(link).toHaveAttribute('target', '_blank');
  });

  it('renders Amazon affiliate link with source=recommendation and bookId', () => {
    render(<RecommendationCard book={mockBook} bookId="book-123" />);
    const link = screen.getByRole('link', { name: /amazon/i });
    const href = link.getAttribute('href')!;
    expect(href).toContain('/api/affiliate');
    expect(href).toContain('provider=amazon');
    expect(href).toContain('source=recommendation');
    expect(href).toContain('bookId=book-123');
  });

  it('renders Bookshop.org affiliate link with source=recommendation', () => {
    render(<RecommendationCard book={mockBook} />);
    const link = screen.getByRole('link', { name: /bookshop\.org/i });
    const href = link.getAttribute('href')!;
    expect(href).toContain('/api/affiliate');
    expect(href).toContain('provider=bookshop');
    expect(href).toContain('source=recommendation');
  });

  it('has minimum 44px touch targets', () => {
    render(<RecommendationCard book={mockBook} />);
    const links = screen.getAllByRole('link');
    links.forEach((link) => {
      expect(link.className).toContain('min-h-[44px]');
    });
  });
});
