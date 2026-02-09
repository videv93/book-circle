import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('@/actions/admin/promoteUser', () => ({
  promoteUser: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

import { PromoteUserDialog } from './PromoteUserDialog';
import { promoteUser } from '@/actions/admin/promoteUser';

const mockPromoteUser = promoteUser as unknown as ReturnType<typeof vi.fn>;

describe('PromoteUserDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders trigger button', () => {
    render(
      <PromoteUserDialog
        userId="user-1"
        userName="Test User"
        currentRole="USER"
      />
    );

    expect(screen.getByText('Change Role')).toBeInTheDocument();
  });

  it('opens dialog when trigger is clicked', async () => {
    const user = userEvent.setup();

    render(
      <PromoteUserDialog
        userId="user-1"
        userName="Test User"
        currentRole="USER"
      />
    );

    await user.click(screen.getByText('Change Role'));

    expect(screen.getByText('Change User Role')).toBeInTheDocument();
    expect(screen.getByText(/Test User/)).toBeInTheDocument();
  });

  it('shows role options', async () => {
    const user = userEvent.setup();

    render(
      <PromoteUserDialog
        userId="user-1"
        userName="Test User"
        currentRole="USER"
      />
    );

    await user.click(screen.getByText('Change Role'));

    expect(screen.getByLabelText('User')).toBeInTheDocument();
    expect(screen.getByLabelText('Author')).toBeInTheDocument();
    expect(screen.getByLabelText('Admin')).toBeInTheDocument();
  });

  it('disables confirm when same role selected', async () => {
    const user = userEvent.setup();

    render(
      <PromoteUserDialog
        userId="user-1"
        userName="Test User"
        currentRole="USER"
      />
    );

    await user.click(screen.getByText('Change Role'));

    const confirmButton = screen.getByText('Confirm');
    expect(confirmButton).toBeDisabled();
  });

  it('enables confirm when different role selected', async () => {
    const user = userEvent.setup();

    render(
      <PromoteUserDialog
        userId="user-1"
        userName="Test User"
        currentRole="USER"
      />
    );

    await user.click(screen.getByText('Change Role'));
    await user.click(screen.getByLabelText('Admin'));

    const confirmButton = screen.getByText('Confirm');
    expect(confirmButton).not.toBeDisabled();
  });
});
