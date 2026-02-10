import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UserModerationDetail } from './UserModerationDetail';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }),
}));

vi.mock('@/actions/admin/liftSuspension', () => ({
  liftSuspension: vi.fn(),
}));

vi.mock('@/actions/admin/warnUser', () => ({
  warnUser: vi.fn(),
}));

vi.mock('@/actions/admin/suspendUser', () => ({
  suspendUser: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

describe('UserModerationDetail', () => {
  const baseData = {
    user: {
      id: 'user-1',
      name: 'Test User',
      email: 'test@example.com',
      role: 'USER',
      suspendedUntil: null,
      suspensionReason: null,
      createdAt: new Date('2026-01-01'),
    },
    warnings: [],
    suspensions: [],
    contentRemovals: [],
    flagCount: 2,
  };

  it('renders user info', () => {
    render(<UserModerationDetail data={baseData} />);
    expect(screen.getByText('Test User')).toBeInTheDocument();
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
    expect(screen.getByText('USER')).toBeInTheDocument();
  });

  it('shows quick action buttons', () => {
    render(<UserModerationDetail data={baseData} />);
    expect(screen.getByRole('button', { name: 'Warn User' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Suspend Account' })).toBeInTheDocument();
  });

  it('shows Lift Suspension when user is suspended', () => {
    const suspendedData = {
      ...baseData,
      user: {
        ...baseData.user,
        suspendedUntil: new Date(Date.now() + 86400000),
        suspensionReason: 'Test reason',
      },
    };
    render(<UserModerationDetail data={suspendedData} />);
    expect(screen.getByRole('button', { name: 'Lift Suspension' })).toBeInTheDocument();
    expect(screen.getByText('Suspended')).toBeInTheDocument();
  });

  it('shows empty states for no history', () => {
    render(<UserModerationDetail data={baseData} />);
    expect(screen.getByText('No warnings issued.')).toBeInTheDocument();
    expect(screen.getByText('No suspensions.')).toBeInTheDocument();
    expect(screen.getByText('No content removals.')).toBeInTheDocument();
  });

  it('displays warnings when present', () => {
    const dataWithWarnings = {
      ...baseData,
      warnings: [
        {
          id: 'w-1',
          warningType: 'FIRST_WARNING',
          message: 'Test warning message',
          acknowledgedAt: null,
          createdAt: new Date(),
          issuedBy: { id: 'admin-1', name: 'Admin' },
        },
      ],
    };
    render(<UserModerationDetail data={dataWithWarnings} />);
    expect(screen.getByText('Test warning message')).toBeInTheDocument();
    expect(screen.getByText('First Warning')).toBeInTheDocument();
  });

  it('displays flag count', () => {
    render(<UserModerationDetail data={baseData} />);
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('calls liftSuspension when Lift Suspension clicked', async () => {
    const { liftSuspension } = await import('@/actions/admin/liftSuspension');
    const mockLift = liftSuspension as unknown as ReturnType<typeof vi.fn>;
    mockLift.mockResolvedValueOnce({ success: true, data: { liftedAt: new Date() } });

    const suspendedData = {
      ...baseData,
      user: {
        ...baseData.user,
        suspendedUntil: new Date(Date.now() + 86400000),
        suspensionReason: 'Test reason',
      },
    };
    const user = userEvent.setup();
    render(<UserModerationDetail data={suspendedData} />);

    await user.click(screen.getByRole('button', { name: 'Lift Suspension' }));

    expect(mockLift).toHaveBeenCalledWith({ userId: 'user-1' });
  });

  it('opens Warn User dialog when button clicked', async () => {
    const user = userEvent.setup();
    render(<UserModerationDetail data={baseData} />);

    await user.click(screen.getByRole('button', { name: 'Warn User' }));

    expect(screen.getByText('Issue Warning')).toBeInTheDocument();
  });

  it('opens Suspend Account dialog when button clicked', async () => {
    const user = userEvent.setup();
    render(<UserModerationDetail data={baseData} />);

    await user.click(screen.getByRole('button', { name: 'Suspend Account' }));

    expect(screen.getByRole('heading', { name: 'Suspend Account' })).toBeInTheDocument();
  });
});
