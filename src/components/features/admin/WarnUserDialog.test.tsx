import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WarnUserDialog } from './WarnUserDialog';

vi.mock('@/actions/admin/warnUser', () => ({
  warnUser: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

import { warnUser } from '@/actions/admin/warnUser';

const mockWarnUser = warnUser as unknown as ReturnType<typeof vi.fn>;

describe('WarnUserDialog', () => {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    userId: 'user-1',
    userName: 'Test User',
    onSuccess: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockWarnUser.mockResolvedValue({ success: true, data: {} });
  });

  it('renders dialog with title and description', () => {
    render(<WarnUserDialog {...defaultProps} />);
    expect(screen.getByText('Warn User')).toBeInTheDocument();
    expect(screen.getByText(/Test User/)).toBeInTheDocument();
  });

  it('shows warning type buttons', () => {
    render(<WarnUserDialog {...defaultProps} />);
    expect(screen.getByRole('button', { name: 'First Warning' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Final Warning' })).toBeInTheDocument();
  });

  it('has disabled submit when form incomplete', () => {
    render(<WarnUserDialog {...defaultProps} />);
    const submitBtn = screen.getByRole('button', { name: 'Issue Warning' });
    expect(submitBtn).toBeDisabled();
  });

  it('enables submit when form is valid', async () => {
    const user = userEvent.setup();
    render(<WarnUserDialog {...defaultProps} />);

    await user.click(screen.getByRole('button', { name: 'First Warning' }));
    await user.type(
      screen.getByPlaceholderText(/Explain the violation/),
      'This is a warning message for testing purposes.'
    );

    const submitBtn = screen.getByRole('button', { name: 'Issue Warning' });
    expect(submitBtn).not.toBeDisabled();
  });

  it('calls warnUser on submit', async () => {
    const user = userEvent.setup();
    render(<WarnUserDialog {...defaultProps} />);

    await user.click(screen.getByRole('button', { name: 'First Warning' }));
    await user.type(
      screen.getByPlaceholderText(/Explain the violation/),
      'This is a warning message for testing purposes.'
    );
    await user.click(screen.getByRole('button', { name: 'Issue Warning' }));

    expect(mockWarnUser).toHaveBeenCalledWith({
      userId: 'user-1',
      warningType: 'FIRST_WARNING',
      message: 'This is a warning message for testing purposes.',
      moderationItemId: undefined,
    });
  });
});
