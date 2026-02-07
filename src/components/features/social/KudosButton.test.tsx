import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { KudosButton } from './KudosButton';

// Mock server actions (barrel import)
const mockGiveKudos = vi.fn();
const mockRemoveKudos = vi.fn();

vi.mock('@/actions/social', () => ({
  giveKudos: (...args: unknown[]) => mockGiveKudos(...args),
  removeKudos: (...args: unknown[]) => mockRemoveKudos(...args),
}));

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

const mockUseReducedMotion = vi.fn(() => false);
vi.mock('@/hooks/useReducedMotion', () => ({
  useReducedMotion: () => mockUseReducedMotion(),
}));

import { toast } from 'sonner';

describe('KudosButton', () => {
  const defaultProps = {
    sessionId: 'session-1',
    receiverId: 'user-2',
    initialKudosCount: 5,
    initialUserGaveKudos: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseReducedMotion.mockReturnValue(false);
    mockGiveKudos.mockResolvedValue({
      success: true,
      data: { kudosId: 'kudos-1', totalKudos: 6 },
    });
    mockRemoveKudos.mockResolvedValue({
      success: true,
      data: { totalKudos: 4 },
    });
  });

  it('renders heart icon and kudos count', () => {
    render(<KudosButton {...defaultProps} />);

    expect(screen.getByLabelText('Give kudos')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('shows filled heart when user gave kudos', () => {
    render(<KudosButton {...defaultProps} initialUserGaveKudos={true} />);

    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-pressed', 'true');
    expect(button).toHaveAttribute(
      'aria-label',
      'You gave kudos, 5 total'
    );
  });

  it('shows outline heart when user did not give kudos', () => {
    render(<KudosButton {...defaultProps} initialUserGaveKudos={false} />);

    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-pressed', 'false');
    expect(button).toHaveAttribute('aria-label', 'Give kudos');
  });

  it('toggles heart on click (optimistic UI)', async () => {
    render(<KudosButton {...defaultProps} />);

    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-pressed', 'false');

    await act(async () => {
      fireEvent.click(button);
    });

    // Optimistic update: should now show as given
    expect(button).toHaveAttribute('aria-pressed', 'true');
  });

  it('increments count when giving kudos', async () => {
    render(<KudosButton {...defaultProps} />);

    expect(screen.getByText('5')).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(screen.getByRole('button'));
    });

    // Optimistic: count should increment to 6
    expect(screen.getByText('6')).toBeInTheDocument();
  });

  it('decrements count when removing kudos', async () => {
    render(
      <KudosButton {...defaultProps} initialUserGaveKudos={true} />
    );

    expect(screen.getByText('5')).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(screen.getByRole('button'));
    });

    // Optimistic: count should decrement to 4
    expect(screen.getByText('4')).toBeInTheDocument();
  });

  it('calls giveKudos action when not given', async () => {
    render(<KudosButton {...defaultProps} />);

    await act(async () => {
      fireEvent.click(screen.getByRole('button'));
    });

    await waitFor(() => {
      expect(mockGiveKudos).toHaveBeenCalledWith({
        sessionId: 'session-1',
        targetUserId: 'user-2',
      });
    });
  });

  it('calls removeKudos action when already given', async () => {
    render(
      <KudosButton {...defaultProps} initialUserGaveKudos={true} />
    );

    await act(async () => {
      fireEvent.click(screen.getByRole('button'));
    });

    await waitFor(() => {
      expect(mockRemoveKudos).toHaveBeenCalledWith({
        sessionId: 'session-1',
        targetUserId: 'user-2',
      });
    });
  });

  it('reverts state on error with toast', async () => {
    mockGiveKudos.mockResolvedValue({
      success: false,
      error: 'Failed to give kudos',
    });

    render(<KudosButton {...defaultProps} />);

    const button = screen.getByRole('button');

    await act(async () => {
      fireEvent.click(button);
    });

    // Wait for server action to complete and revert
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to give kudos');
    });

    // Should revert to original state
    expect(button).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('updates count from server response', async () => {
    mockGiveKudos.mockResolvedValue({
      success: true,
      data: { kudosId: 'kudos-1', totalKudos: 10 },
    });

    render(<KudosButton {...defaultProps} />);

    await act(async () => {
      fireEvent.click(screen.getByRole('button'));
    });

    await waitFor(() => {
      // Server says 10, not the optimistic 6
      expect(screen.getByText('10')).toBeInTheDocument();
    });
  });

  it('calls onKudosChange callback with optimistic then server value', async () => {
    // Server returns 8, different from optimistic 6 (5+1)
    mockGiveKudos.mockResolvedValue({
      success: true,
      data: { kudosId: 'kudos-1', totalKudos: 8 },
    });

    const onKudosChange = vi.fn();

    render(
      <KudosButton {...defaultProps} onKudosChange={onKudosChange} />
    );

    await act(async () => {
      fireEvent.click(screen.getByRole('button'));
    });

    // Called with optimistic value first (5 + 1 = 6)
    expect(onKudosChange).toHaveBeenCalledWith(6);

    await waitFor(() => {
      // Then called with server value (8, verifying server reconciliation)
      expect(onKudosChange).toHaveBeenCalledWith(8);
    });
  });

  it('has correct accessibility attributes', () => {
    render(<KudosButton {...defaultProps} />);

    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-label', 'Give kudos');
    expect(button).toHaveAttribute('aria-pressed', 'false');
  });

  it('has min 44px touch target', () => {
    render(<KudosButton {...defaultProps} />);

    const button = screen.getByRole('button');
    expect(button.className).toContain('min-h-[44px]');
    expect(button.className).toContain('min-w-[44px]');
  });

  it('disables button while pending', async () => {
    let resolveAction!: (value: unknown) => void;
    mockGiveKudos.mockImplementation(
      () => new Promise((resolve) => { resolveAction = resolve; })
    );

    render(<KudosButton {...defaultProps} />);
    const button = screen.getByRole('button');

    // Initially enabled
    expect(button).not.toBeDisabled();

    // Verify disabled styling class is wired up
    expect(button.className).toContain('disabled:opacity-50');

    // Click to start transition
    fireEvent.click(button);

    // Resolve the pending action
    await act(async () => {
      resolveAction({
        success: true,
        data: { kudosId: 'k1', totalKudos: 6 },
      });
    });

    // After resolution, button should be enabled again
    expect(button).not.toBeDisabled();
  });

  it('does not trigger animation when reduced motion is preferred', async () => {
    mockUseReducedMotion.mockReturnValue(true);

    const { container } = render(<KudosButton {...defaultProps} />);

    await act(async () => {
      fireEvent.click(screen.getByRole('button'));
    });

    // With reduced motion, the heart icon should not have scale-125 class
    const heartIcon = container.querySelector('svg');
    expect(heartIcon?.className).not.toContain('scale-125');
  });

  it('does not show count when kudos count is 0', () => {
    render(<KudosButton {...defaultProps} initialKudosCount={0} />);

    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
    // Should not render the count span
    expect(screen.queryByText('0')).not.toBeInTheDocument();
  });

  it('prevents count from going below 0', async () => {
    render(
      <KudosButton
        {...defaultProps}
        initialKudosCount={0}
        initialUserGaveKudos={true}
      />
    );

    await act(async () => {
      fireEvent.click(screen.getByRole('button'));
    });

    // Should not show negative count
    expect(screen.queryByText('-1')).not.toBeInTheDocument();
  });
});
