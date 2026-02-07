import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FinishedBooksList } from './FinishedBooksList';
import type { FinishedBook } from '@/actions/social/getUserProfile';

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

describe('FinishedBooksList', () => {
  const mockBooks: FinishedBook[] = [
    {
      id: 'ub-1',
      dateFinished: new Date('2026-01-15T00:00:00Z'),
      book: {
        id: 'book-1',
        title: 'Project Hail Mary',
        author: 'Andy Weir',
        coverUrl: 'https://example.com/cover1.jpg',
      },
    },
    {
      id: 'ub-2',
      dateFinished: new Date('2026-01-10T00:00:00Z'),
      book: {
        id: 'book-2',
        title: 'Klara and the Sun',
        author: 'Kazuo Ishiguro',
        coverUrl: null,
      },
    },
  ];

  it('renders finished books with titles and authors', () => {
    render(<FinishedBooksList books={mockBooks} />);
    expect(screen.getByText('Project Hail Mary')).toBeInTheDocument();
    expect(screen.getByText('Andy Weir')).toBeInTheDocument();
    expect(screen.getByText('Klara and the Sun')).toBeInTheDocument();
    expect(screen.getByText('Kazuo Ishiguro')).toBeInTheDocument();
  });

  it('shows completion dates formatted correctly', () => {
    render(<FinishedBooksList books={mockBooks} />);
    // Date format: "Finished Jan 15, 2026" — locale-dependent
    const finishedTexts = screen.getAllByText(/^Finished /);
    expect(finishedTexts.length).toBe(2);
  });

  it('shows empty state when no books', () => {
    render(<FinishedBooksList books={[]} />);
    expect(screen.getByText('No finished books yet.')).toBeInTheDocument();
  });

  it('shows empty state when books is null (privacy mode)', () => {
    render(<FinishedBooksList books={null} />);
    expect(screen.getByText('No finished books yet.')).toBeInTheDocument();
  });

  it('book cards link to book detail pages', () => {
    render(<FinishedBooksList books={mockBooks} />);
    const links = screen.getAllByRole('link');
    expect(links[0]).toHaveAttribute('href', '/book/book-1');
    expect(links[1]).toHaveAttribute('href', '/book/book-2');
  });

  it('renders book covers when available', () => {
    render(<FinishedBooksList books={mockBooks} />);
    const img = screen.getByAltText('Cover of Project Hail Mary');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', 'https://example.com/cover1.jpg');
  });

  it('renders fallback when no cover url', () => {
    render(<FinishedBooksList books={[mockBooks[1]]} />);
    expect(screen.getByText('?')).toBeInTheDocument();
  });

  it('handles null dateFinished gracefully', () => {
    const booksWithNullDate: FinishedBook[] = [
      {
        id: 'ub-3',
        dateFinished: null,
        book: { id: 'book-3', title: 'No Date Book', author: 'Unknown', coverUrl: null },
      },
    ];
    render(<FinishedBooksList books={booksWithNullDate} />);
    expect(screen.getByText('No Date Book')).toBeInTheDocument();
    expect(screen.queryByText(/^Finished /)).not.toBeInTheDocument();
  });
});
