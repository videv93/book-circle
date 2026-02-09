import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ClaimStatusBadge } from './ClaimStatusBadge';

describe('ClaimStatusBadge', () => {
  it('renders pending status', () => {
    render(<ClaimStatusBadge status="PENDING" />);

    const badge = screen.getByTestId('claim-status-badge');
    expect(badge).toHaveTextContent('Claim Pending');
    expect(badge).toHaveAttribute('data-status', 'pending');
  });

  it('renders approved status', () => {
    render(<ClaimStatusBadge status="APPROVED" />);

    const badge = screen.getByTestId('claim-status-badge');
    expect(badge).toHaveTextContent('Verified Author');
    expect(badge).toHaveAttribute('data-status', 'approved');
  });

  it('renders rejected status', () => {
    render(<ClaimStatusBadge status="REJECTED" />);

    const badge = screen.getByTestId('claim-status-badge');
    expect(badge).toHaveTextContent('Claim Not Approved');
    expect(badge).toHaveAttribute('data-status', 'rejected');
  });

  it('applies custom className', () => {
    render(<ClaimStatusBadge status="PENDING" className="custom-class" />);

    const badge = screen.getByTestId('claim-status-badge');
    expect(badge.className).toContain('custom-class');
  });
});
