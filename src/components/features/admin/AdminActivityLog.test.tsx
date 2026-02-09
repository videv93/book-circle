import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AdminActivityLog } from './AdminActivityLog';
import type { AdminActionEntry } from '@/actions/admin/getDashboardStats';

const mockActions: AdminActionEntry[] = [
  {
    id: 'action-1',
    actionType: 'REVIEW_CLAIM',
    targetId: 'claim-1',
    targetType: 'AuthorClaim',
    details: { decision: 'approve' },
    createdAt: new Date(),
    admin: { id: 'admin-1', name: 'Admin User', image: null },
  },
  {
    id: 'action-2',
    actionType: 'PROMOTE_USER',
    targetId: 'user-2',
    targetType: 'User',
    details: null,
    createdAt: new Date(Date.now() - 3600000),
    admin: { id: 'admin-1', name: 'Admin User', image: null },
  },
];

describe('AdminActivityLog', () => {
  it('renders empty state when no actions', () => {
    render(<AdminActivityLog actions={[]} />);

    expect(screen.getByText('No admin activity yet')).toBeInTheDocument();
  });

  it('renders action entries', () => {
    render(<AdminActivityLog actions={mockActions} />);

    expect(screen.getByText('Review Claim')).toBeInTheDocument();
    expect(screen.getByText('Promote User')).toBeInTheDocument();
  });

  it('shows admin name and target type', () => {
    render(<AdminActivityLog actions={[mockActions[0]]} />);

    expect(screen.getByText(/Admin User/)).toBeInTheDocument();
    expect(screen.getByText(/AuthorClaim/)).toBeInTheDocument();
  });

  it('shows relative time', () => {
    render(<AdminActivityLog actions={[mockActions[0]]} />);

    // The first action was just created, so should show "just now"
    expect(screen.getByText('just now')).toBeInTheDocument();
  });
});
