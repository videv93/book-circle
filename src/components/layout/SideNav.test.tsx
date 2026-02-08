import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SideNav } from './SideNav';
import { useNotificationStore } from '@/stores/useNotificationStore';

// Mock next/navigation
const mockPathname = vi.fn(() => '/home');
vi.mock('next/navigation', () => ({
  usePathname: () => mockPathname(),
}));

// Mock window.scrollTo
const mockScrollTo = vi.fn();
Object.defineProperty(window, 'scrollTo', { value: mockScrollTo, writable: true });

describe('SideNav', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPathname.mockReturnValue('/home');
    useNotificationStore.setState({ unreadCount: 0 });
  });

  it('renders 5 navigation tabs', () => {
    render(<SideNav />);

    expect(screen.getByRole('link', { name: /home/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /search/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /library/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /activity/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /profile/i })).toBeInTheDocument();
  });

  it('has correct navigation structure with aria attributes', () => {
    render(<SideNav />);

    const nav = screen.getByRole('navigation', { name: /sidebar navigation/i });
    expect(nav).toBeInTheDocument();
  });

  it('highlights active tab with aria-current', () => {
    mockPathname.mockReturnValue('/profile');
    render(<SideNav />);

    const profileLink = screen.getByRole('link', { name: /profile/i });
    expect(profileLink).toHaveAttribute('aria-current', 'page');
  });

  it('applies active styling to current route', () => {
    mockPathname.mockReturnValue('/home');
    render(<SideNav />);

    const homeLink = screen.getByRole('link', { name: /home/i });
    expect(homeLink).toHaveClass('text-primary');
  });

  it('scrolls to top when same tab is clicked', () => {
    mockPathname.mockReturnValue('/home');
    render(<SideNav />);

    const homeLink = screen.getByRole('link', { name: /home/i });
    fireEvent.click(homeLink);

    expect(mockScrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
  });

  it('is hidden on mobile viewports (lg breakpoint)', () => {
    render(<SideNav />);

    const nav = screen.getByRole('navigation', { name: /sidebar navigation/i });
    expect(nav).toHaveClass('hidden');
    expect(nav).toHaveClass('lg:flex');
  });

  it('renders icons and labels for each tab', () => {
    render(<SideNav />);

    const links = screen.getAllByRole('link');
    links.forEach(link => {
      const icon = link.querySelector('svg');
      expect(icon).toBeInTheDocument();

      const text = link.querySelector('span');
      expect(text).toBeInTheDocument();
    });
  });

  it('supports keyboard navigation', () => {
    render(<SideNav />);

    const links = screen.getAllByRole('link');
    links.forEach(link => {
      link.focus();
      expect(document.activeElement).toBe(link);
    });
  });

  it('shows badge on Activity tab when unread count > 0', () => {
    useNotificationStore.setState({ unreadCount: 7 });
    render(<SideNav />);

    expect(screen.getByLabelText('7 new notifications')).toBeInTheDocument();
  });

  it('does not show badge when unread count is 0', () => {
    useNotificationStore.setState({ unreadCount: 0 });
    render(<SideNav />);

    expect(screen.queryByLabelText(/new notifications/)).not.toBeInTheDocument();
  });

  it('shows 99+ badge for counts over 99', () => {
    useNotificationStore.setState({ unreadCount: 200 });
    render(<SideNav />);

    expect(screen.getByText('99+')).toBeInTheDocument();
  });
});
