import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { NavBadge } from './NavBadge';

describe('NavBadge', () => {
  it('renders count when greater than 0', () => {
    render(<NavBadge count={3} />);

    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('renders nothing when count is 0', () => {
    const { container } = render(<NavBadge count={0} />);

    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when count is negative', () => {
    const { container } = render(<NavBadge count={-1} />);

    expect(container.firstChild).toBeNull();
  });

  it('shows 99+ when count exceeds 99', () => {
    render(<NavBadge count={150} />);

    expect(screen.getByText('99+')).toBeInTheDocument();
  });

  it('has correct aria-label with exact count', () => {
    render(<NavBadge count={5} />);

    expect(screen.getByLabelText('5 new notifications')).toBeInTheDocument();
  });

  it('has correct aria-label for count over 99', () => {
    render(<NavBadge count={150} />);

    expect(screen.getByLabelText('150 new notifications')).toBeInTheDocument();
  });

  it('applies destructive styling classes', () => {
    render(<NavBadge count={1} />);

    const badge = screen.getByText('1');
    expect(badge).toHaveClass('bg-destructive');
    expect(badge).toHaveClass('text-destructive-foreground');
  });
});
