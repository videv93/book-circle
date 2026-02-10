import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WarningBanner } from './WarningBanner';

vi.mock('@/actions/user/acknowledgeWarning', () => ({
  acknowledgeWarning: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: { error: vi.fn() },
}));

import { acknowledgeWarning } from '@/actions/user/acknowledgeWarning';

const mockAcknowledgeWarning = acknowledgeWarning as unknown as ReturnType<typeof vi.fn>;

describe('WarningBanner', () => {
  const mockWarning = {
    id: 'warning-1',
    userId: 'user-1',
    issuedById: 'admin-1',
    warningType: 'FIRST_WARNING' as const,
    message: 'You violated our community guidelines.',
    moderationItemId: null,
    acknowledgedAt: null,
    createdAt: new Date('2026-02-01'),
  };

  const defaultProps = {
    warnings: [mockWarning],
    onAcknowledged: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockAcknowledgeWarning.mockResolvedValue({ success: true, data: { acknowledgedAt: new Date() } });
  });

  it('renders warning message', () => {
    render(<WarningBanner {...defaultProps} />);
    expect(screen.getByText('Warning')).toBeInTheDocument();
    expect(screen.getByText('You violated our community guidelines.')).toBeInTheDocument();
  });

  it('shows I Understand button', () => {
    render(<WarningBanner {...defaultProps} />);
    expect(screen.getByRole('button', { name: 'I Understand' })).toBeInTheDocument();
  });

  it('calls acknowledgeWarning on click', async () => {
    const user = userEvent.setup();
    render(<WarningBanner {...defaultProps} />);

    await user.click(screen.getByRole('button', { name: 'I Understand' }));
    expect(mockAcknowledgeWarning).toHaveBeenCalledWith({ warningId: 'warning-1' });
  });

  it('calls onAcknowledged after last warning', async () => {
    const user = userEvent.setup();
    render(<WarningBanner {...defaultProps} />);

    await user.click(screen.getByRole('button', { name: 'I Understand' }));
    expect(defaultProps.onAcknowledged).toHaveBeenCalled();
  });

  it('renders nothing when no warnings', () => {
    const { container } = render(
      <WarningBanner warnings={[]} onAcknowledged={vi.fn()} />
    );
    expect(container.innerHTML).toBe('');
  });

  it('shows Final Warning style for final warnings', () => {
    const finalWarning = { ...mockWarning, warningType: 'FINAL_WARNING' as const };
    render(<WarningBanner warnings={[finalWarning]} onAcknowledged={vi.fn()} />);
    expect(screen.getByText('Final Warning')).toBeInTheDocument();
    expect(screen.getByText(/Further violations/)).toBeInTheDocument();
  });

  it('shows counter for multiple warnings', () => {
    const warnings = [
      mockWarning,
      { ...mockWarning, id: 'warning-2', message: 'Second warning' },
    ];
    render(<WarningBanner warnings={warnings} onAcknowledged={vi.fn()} />);
    expect(screen.getByText('Warning 1 of 2')).toBeInTheDocument();
  });
});
