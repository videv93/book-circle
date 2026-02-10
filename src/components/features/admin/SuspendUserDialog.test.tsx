import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SuspendUserDialog } from './SuspendUserDialog';

vi.mock('@/actions/admin/suspendUser', () => ({
  suspendUser: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

import { suspendUser } from '@/actions/admin/suspendUser';

const mockSuspendUser = suspendUser as unknown as ReturnType<typeof vi.fn>;

describe('SuspendUserDialog', () => {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    userId: 'user-1',
    userName: 'Test User',
    onSuccess: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockSuspendUser.mockResolvedValue({ success: true, data: {} });
  });

  it('renders dialog with title', () => {
    render(<SuspendUserDialog {...defaultProps} />);
    expect(screen.getByRole('heading', { name: 'Suspend Account' })).toBeInTheDocument();
    expect(screen.getByText(/Test User/)).toBeInTheDocument();
  });

  it('shows duration buttons', () => {
    render(<SuspendUserDialog {...defaultProps} />);
    expect(screen.getByRole('button', { name: '24 Hours' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '7 Days' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '30 Days' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Permanent' })).toBeInTheDocument();
  });

  it('has disabled submit when form incomplete', () => {
    render(<SuspendUserDialog {...defaultProps} />);
    const submitBtn = screen.getByRole('button', { name: 'Suspend Account' });
    expect(submitBtn).toBeDisabled();
  });

  it('shows confirmation when form valid', async () => {
    const user = userEvent.setup();
    render(<SuspendUserDialog {...defaultProps} />);

    await user.click(screen.getByRole('button', { name: '7 Days' }));
    await user.type(
      screen.getByPlaceholderText(/Explain why/),
      'Repeated community guideline violations found.'
    );

    expect(screen.getByText('Confirm Suspension:')).toBeInTheDocument();
    expect(screen.getAllByText(/7 Days/).length).toBeGreaterThanOrEqual(2);
  });

  it('calls suspendUser on submit', async () => {
    const user = userEvent.setup();
    render(<SuspendUserDialog {...defaultProps} />);

    await user.click(screen.getByRole('button', { name: '7 Days' }));
    await user.type(
      screen.getByPlaceholderText(/Explain why/),
      'Repeated community guideline violations found.'
    );
    await user.click(screen.getByRole('button', { name: 'Suspend Account' }));

    expect(mockSuspendUser).toHaveBeenCalledWith({
      userId: 'user-1',
      duration: 'DAYS_7',
      reason: 'Repeated community guideline violations found.',
      moderationItemId: undefined,
    });
  });
});
