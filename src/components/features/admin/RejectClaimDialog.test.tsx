import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RejectClaimDialog } from './RejectClaimDialog';

vi.mock('@/actions/authors/reviewClaim', () => ({
  reviewClaim: vi.fn(),
}));

import { reviewClaim } from '@/actions/authors/reviewClaim';

const mockReviewClaim = reviewClaim as ReturnType<typeof vi.fn>;

beforeAll(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
});

describe('RejectClaimDialog', () => {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    claimId: 'claim-1',
    bookTitle: 'Test Book',
    onSuccess: vi.fn(),
  };

  it('renders rejection reason buttons', () => {
    render(<RejectClaimDialog {...defaultProps} />);

    expect(screen.getByTestId('reason-INSUFFICIENT_EVIDENCE')).toBeInTheDocument();
    expect(screen.getByTestId('reason-NOT_THE_AUTHOR')).toBeInTheDocument();
    expect(screen.getByTestId('reason-DUPLICATE_CLAIM')).toBeInTheDocument();
    expect(screen.getByTestId('reason-OTHER')).toBeInTheDocument();
  });

  it('renders admin notes textarea', () => {
    render(<RejectClaimDialog {...defaultProps} />);

    expect(screen.getByTestId('admin-notes-input')).toBeInTheDocument();
  });

  it('disables confirm button when no reason selected', () => {
    render(<RejectClaimDialog {...defaultProps} />);

    expect(screen.getByTestId('confirm-reject')).toBeDisabled();
  });

  it('enables confirm button after selecting a reason', async () => {
    const user = userEvent.setup();
    render(<RejectClaimDialog {...defaultProps} />);

    await user.click(screen.getByTestId('reason-INSUFFICIENT_EVIDENCE'));

    expect(screen.getByTestId('confirm-reject')).not.toBeDisabled();
  });

  it('calls reviewClaim with correct params on confirm', async () => {
    const user = userEvent.setup();
    mockReviewClaim.mockResolvedValue({ success: true, data: {} });

    render(<RejectClaimDialog {...defaultProps} />);

    await user.click(screen.getByTestId('reason-NOT_THE_AUTHOR'));
    await user.type(screen.getByTestId('admin-notes-input'), 'Not enough proof');
    await user.click(screen.getByTestId('confirm-reject'));

    await waitFor(() => {
      expect(mockReviewClaim).toHaveBeenCalledWith({
        claimId: 'claim-1',
        decision: 'reject',
        rejectionReason: 'NOT_THE_AUTHOR',
        adminNotes: 'Not enough proof',
      });
    });
  });

  it('calls onSuccess after successful rejection', async () => {
    const user = userEvent.setup();
    mockReviewClaim.mockResolvedValue({ success: true, data: {} });

    render(<RejectClaimDialog {...defaultProps} />);

    await user.click(screen.getByTestId('reason-INSUFFICIENT_EVIDENCE'));
    await user.click(screen.getByTestId('confirm-reject'));

    await waitFor(() => {
      expect(defaultProps.onSuccess).toHaveBeenCalled();
    });
  });

  it('shows error when reviewClaim fails', async () => {
    const user = userEvent.setup();
    mockReviewClaim.mockResolvedValue({ success: false, error: 'Review failed' });

    render(<RejectClaimDialog {...defaultProps} />);

    await user.click(screen.getByTestId('reason-OTHER'));
    await user.click(screen.getByTestId('confirm-reject'));

    await waitFor(() => {
      expect(screen.getByTestId('reject-error')).toHaveTextContent('Review failed');
    });
  });

  it('does not render when closed', () => {
    render(<RejectClaimDialog {...defaultProps} open={false} />);

    expect(screen.queryByText('Reject Author Claim')).not.toBeInTheDocument();
  });
});
