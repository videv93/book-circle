import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('next/navigation', () => ({
  usePathname: vi.fn(() => '/admin'),
}));

vi.mock('@/hooks/useMediaQuery', () => ({
  useMediaQuery: vi.fn(() => true),
}));

import { AdminShell } from './AdminShell';
import { usePathname } from 'next/navigation';
import { useMediaQuery } from '@/hooks/useMediaQuery';

const mockUsePathname = usePathname as unknown as ReturnType<typeof vi.fn>;
const mockUseMediaQuery = useMediaQuery as unknown as ReturnType<typeof vi.fn>;

describe('AdminShell', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUsePathname.mockReturnValue('/admin');
    mockUseMediaQuery.mockReturnValue(true);
  });

  it('renders children', () => {
    render(
      <AdminShell>
        <div data-testid="child">Content</div>
      </AdminShell>
    );

    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  it('renders admin header with shield icon and title', () => {
    render(
      <AdminShell>
        <div>Content</div>
      </AdminShell>
    );

    expect(screen.getByText('Admin')).toBeInTheDocument();
    expect(screen.getByLabelText('Back to app')).toBeInTheDocument();
  });

  it('renders desktop sidebar navigation with all links', () => {
    mockUseMediaQuery.mockReturnValue(true);

    render(
      <AdminShell>
        <div>Content</div>
      </AdminShell>
    );

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Moderation')).toBeInTheDocument();
    expect(screen.getByText('Users')).toBeInTheDocument();
    expect(screen.getByText('Authors')).toBeInTheDocument();
    expect(screen.getByText('Metrics')).toBeInTheDocument();
  });

  it('marks dashboard as active when on /admin', () => {
    mockUsePathname.mockReturnValue('/admin');

    render(
      <AdminShell>
        <div>Content</div>
      </AdminShell>
    );

    const dashboardLink = screen.getByText('Dashboard').closest('a');
    expect(dashboardLink).toHaveAttribute('aria-current', 'page');
  });

  it('marks claims as active when on /admin/claims', () => {
    mockUsePathname.mockReturnValue('/admin/claims');

    render(
      <AdminShell>
        <div>Content</div>
      </AdminShell>
    );

    const authorsLink = screen.getByText('Authors').closest('a');
    expect(authorsLink).toHaveAttribute('aria-current', 'page');

    const dashboardLink = screen.getByText('Dashboard').closest('a');
    expect(dashboardLink).not.toHaveAttribute('aria-current');
  });

  it('renders mobile bottom nav when not desktop', () => {
    mockUseMediaQuery.mockReturnValue(false);

    render(
      <AdminShell>
        <div>Content</div>
      </AdminShell>
    );

    const navElements = screen.getAllByRole('navigation');
    expect(navElements.length).toBeGreaterThanOrEqual(1);

    // Should have bottom nav items as aria-labels
    expect(screen.getByLabelText('Dashboard')).toBeInTheDocument();
    expect(screen.getByLabelText('Moderation')).toBeInTheDocument();
  });

  it('has correct link hrefs', () => {
    render(
      <AdminShell>
        <div>Content</div>
      </AdminShell>
    );

    const dashboardLink = screen.getByText('Dashboard').closest('a');
    expect(dashboardLink).toHaveAttribute('href', '/admin');

    const usersLink = screen.getByText('Users').closest('a');
    expect(usersLink).toHaveAttribute('href', '/admin/users');

    const authorsLink = screen.getByText('Authors').closest('a');
    expect(authorsLink).toHaveAttribute('href', '/admin/claims');
  });
});
