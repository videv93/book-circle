import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RecentSessionsList } from './RecentSessionsList';
import type { RecentSession } from '@/actions/social/getUserProfile';

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

describe('RecentSessionsList', () => {
  const mockSessions: RecentSession[] = [
    {
      id: 'session-1',
      duration: 1920, // 32 min
      startedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      book: { id: 'book-1', title: 'The Great Gatsby', coverUrl: 'https://example.com/cover.jpg' },
    },
    {
      id: 'session-2',
      duration: 4500, // 1h 15min
      startedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      book: { id: 'book-2', title: 'Dune', coverUrl: null },
    },
  ];

  it('renders session list with book titles', () => {
    render(<RecentSessionsList sessions={mockSessions} />);
    expect(screen.getByText('The Great Gatsby')).toBeInTheDocument();
    expect(screen.getByText('Dune')).toBeInTheDocument();
  });

  it('formats durations correctly (minutes)', () => {
    render(<RecentSessionsList sessions={[mockSessions[0]]} />);
    expect(screen.getByText('32 min')).toBeInTheDocument();
  });

  it('formats durations correctly (hours)', () => {
    render(<RecentSessionsList sessions={[mockSessions[1]]} />);
    expect(screen.getByText('1h 15min')).toBeInTheDocument();
  });

  it('shows relative timestamps', () => {
    render(<RecentSessionsList sessions={mockSessions} />);
    expect(screen.getByText('2 days ago')).toBeInTheDocument();
    expect(screen.getByText('5 days ago')).toBeInTheDocument();
  });

  it('shows empty state when no sessions', () => {
    render(<RecentSessionsList sessions={[]} />);
    expect(screen.getByText('No recent sessions.')).toBeInTheDocument();
  });

  it('shows empty state when sessions is null (privacy mode)', () => {
    render(<RecentSessionsList sessions={null} />);
    expect(screen.getByText('No recent sessions.')).toBeInTheDocument();
  });

  it('renders book covers when available', () => {
    render(<RecentSessionsList sessions={mockSessions} />);
    const img = screen.getByAltText('Cover of The Great Gatsby');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', 'https://example.com/cover.jpg');
  });

  it('session cards link to book detail pages', () => {
    render(<RecentSessionsList sessions={mockSessions} />);
    const links = screen.getAllByRole('link');
    expect(links[0]).toHaveAttribute('href', '/book/book-1');
    expect(links[1]).toHaveAttribute('href', '/book/book-2');
  });

  it('renders fallback when no cover url', () => {
    render(<RecentSessionsList sessions={[mockSessions[1]]} />);
    expect(screen.getByText('?')).toBeInTheDocument();
  });
});
