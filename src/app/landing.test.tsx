import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

// Mock next/headers
vi.mock('next/headers', () => ({
  headers: vi.fn().mockResolvedValue(new Headers()),
}));

// Mock auth
const mockGetSession = vi.fn();
vi.mock('@/lib/auth', () => ({
  auth: {
    api: {
      getSession: (...args: unknown[]) => mockGetSession(...args),
    },
  },
}));

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  BookOpen: (props: Record<string, unknown>) => <svg data-testid="icon-book-open" {...props} />,
  Users: (props: Record<string, unknown>) => <svg data-testid="icon-users" {...props} />,
  Sparkles: (props: Record<string, unknown>) => <svg data-testid="icon-sparkles" {...props} />,
}));

import Home, { metadata } from './page';

describe('Landing Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSession.mockResolvedValue(null);
  });

  describe('SEO Metadata', () => {
    it('exports metadata with title and description', () => {
      expect(metadata).toBeDefined();
      expect(metadata.title).toBeDefined();
      expect(typeof metadata.title).toBe('string');
      expect(metadata.description).toBeDefined();
      expect(typeof metadata.description).toBe('string');
    });

    it('exports metadata with openGraph fields', () => {
      expect(metadata.openGraph).toBeDefined();
      expect(metadata.openGraph).toHaveProperty('title');
      expect(metadata.openGraph).toHaveProperty('description');
      expect(metadata.openGraph).toHaveProperty('type', 'website');
    });
  });

  describe('Hero Section', () => {
    it('renders the app name as heading', async () => {
      const page = await Home();
      render(page);

      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/flappy bird/i);
    });

    it('renders a tagline', async () => {
      const page = await Home();
      render(page);

      // Tagline should communicate social reading / reading together
      expect(screen.getByText(/read together/i)).toBeInTheDocument();
    });

    it('renders a CTA button linking to /login when unauthenticated', async () => {
      mockGetSession.mockResolvedValue(null);

      const page = await Home();
      render(page);

      const ctaLink = screen.getAllByRole('link', { name: /get started/i })[0];
      expect(ctaLink).toBeInTheDocument();
      expect(ctaLink).toHaveAttribute('href', '/login');
    });
  });

  describe('Value Propositions', () => {
    it('renders 3 value proposition cards', async () => {
      const page = await Home();
      render(page);

      const headings = screen.getAllByRole('heading', { level: 2 });
      // Should have at least 3 h2 headings for value props
      expect(headings.length).toBeGreaterThanOrEqual(3);
    });

    it('renders value prop about reading habits', async () => {
      const page = await Home();
      render(page);

      expect(screen.getByText(/track your reading/i)).toBeInTheDocument();
    });

    it('renders value prop about social reading', async () => {
      const page = await Home();
      render(page);

      expect(screen.getByText(/read with friends/i)).toBeInTheDocument();
    });

    it('renders value prop about author presence', async () => {
      const page = await Home();
      render(page);

      expect(screen.getByText(/meet your authors/i)).toBeInTheDocument();
    });
  });

  describe('Bottom CTA', () => {
    it('renders a bottom CTA section', async () => {
      const page = await Home();
      render(page);

      const ctaLinks = screen.getAllByRole('link', { name: /get started/i });
      // Should have at least 2 CTA links (hero + bottom)
      expect(ctaLinks.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Authenticated State', () => {
    it('shows "Go to Home" linking to /home when authenticated', async () => {
      mockGetSession.mockResolvedValue({
        user: { id: 'user-1', name: 'Test User', email: 'test@test.com' },
        session: { id: 'session-1' },
      });

      const page = await Home();
      render(page);

      const homeLinks = screen.getAllByRole('link', { name: /go to home/i });
      expect(homeLinks.length).toBeGreaterThanOrEqual(1);
      expect(homeLinks[0]).toHaveAttribute('href', '/home');
    });

    it('does not show "Get Started" when authenticated', async () => {
      mockGetSession.mockResolvedValue({
        user: { id: 'user-1', name: 'Test User', email: 'test@test.com' },
        session: { id: 'session-1' },
      });

      const page = await Home();
      render(page);

      expect(screen.queryByText(/get started/i)).not.toBeInTheDocument();
    });
  });
});
