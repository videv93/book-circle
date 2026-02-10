import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ClaimDetailView } from './ClaimDetailView';
import type { ClaimDetailData } from '@/actions/authors/getClaimDetail';

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    refresh: vi.fn(),
  })),
}));

vi.mock('@/actions/authors/reviewClaim', () => ({
  reviewClaim: vi.fn(),
}));

vi.mock('./RejectClaimDialog', () => ({
  RejectClaimDialog: vi.fn(({ open }: { open: boolean }) =>
    open ? <div data-testid="reject-dialog-mock">Reject Dialog</div> : null
  ),
}));

vi.mock('sonner', () => ({
  toast: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn() }),
}));

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

const mockPendingClaim: ClaimDetailData = {
  id: 'claim-1',
  verificationMethod: 'AMAZON',
  verificationUrl: 'https://amazon.com/author/test',
  verificationText: null,
  status: 'PENDING',
  rejectionReason: null,
  adminNotes: null,
  createdAt: new Date('2026-02-01'),
  reviewedAt: null,
  user: {
    id: 'user-1',
    name: 'Test Author',
    email: 'test@example.com',
    image: null,
    createdAt: new Date('2026-01-01'),
    role: 'USER',
  },
  book: {
    id: 'book-1',
    title: 'Amazing Book',
    author: 'Test Author',
    coverUrl: null,
  },
  reviewer: null,
  claimHistory: [],
};

const mockClaimWithHistory: ClaimDetailData = {
  ...mockPendingClaim,
  claimHistory: [
    {
      id: 'old-claim',
      status: 'REJECTED',
      verificationMethod: 'MANUAL',
      rejectionReason: 'INSUFFICIENT_EVIDENCE',
      createdAt: new Date('2026-01-15'),
      reviewedAt: new Date('2026-01-16'),
      book: { id: 'book-2', title: 'Another Book' },
    },
  ],
};

describe('ClaimDetailView', () => {
  it('renders claim detail view', () => {
    render(<ClaimDetailView claim={mockPendingClaim} />);

    expect(screen.getByTestId('claim-detail-view')).toBeInTheDocument();
    expect(screen.getByText('Test Author')).toBeInTheDocument();
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
    expect(screen.getByText('Amazing Book')).toBeInTheDocument();
  });

  it('displays verification evidence with clickable URL', () => {
    render(<ClaimDetailView claim={mockPendingClaim} />);

    const url = screen.getByTestId('evidence-url');
    expect(url).toBeInTheDocument();
    expect(url).toHaveAttribute('href', 'https://amazon.com/author/test');
    expect(url).toHaveAttribute('target', '_blank');
  });

  it('displays status badge', () => {
    render(<ClaimDetailView claim={mockPendingClaim} />);

    const badge = screen.getByTestId('claim-status-badge');
    expect(badge).toHaveTextContent('PENDING');
  });

  it('shows action buttons for pending claims', () => {
    render(<ClaimDetailView claim={mockPendingClaim} />);

    expect(screen.getByTestId('approve-button')).toBeInTheDocument();
    expect(screen.getByTestId('reject-button')).toBeInTheDocument();
  });

  it('hides action buttons for non-pending claims', () => {
    const reviewedClaim = { ...mockPendingClaim, status: 'APPROVED' };
    render(<ClaimDetailView claim={reviewedClaim} />);

    expect(screen.queryByTestId('action-buttons')).not.toBeInTheDocument();
  });

  it('displays claim history when present', () => {
    render(<ClaimDetailView claim={mockClaimWithHistory} />);

    expect(screen.getByText('Previous Claims')).toBeInTheDocument();
    expect(screen.getByTestId('history-old-claim')).toBeInTheDocument();
    expect(screen.getByText('Another Book')).toBeInTheDocument();
  });

  it('hides claim history when empty', () => {
    render(<ClaimDetailView claim={mockPendingClaim} />);

    expect(screen.queryByText('Previous Claims')).not.toBeInTheDocument();
  });

  it('opens approve dialog on approve click', async () => {
    const user = userEvent.setup();
    render(<ClaimDetailView claim={mockPendingClaim} />);

    await user.click(screen.getByTestId('approve-button'));

    expect(screen.getByText('Approve Author Claim')).toBeInTheDocument();
  });

  it('opens reject dialog on reject click', async () => {
    const user = userEvent.setup();
    render(<ClaimDetailView claim={mockPendingClaim} />);

    await user.click(screen.getByTestId('reject-button'));

    expect(screen.getByTestId('reject-dialog-mock')).toBeInTheDocument();
  });

  it('displays verification text for MANUAL method', () => {
    const manualClaim = {
      ...mockPendingClaim,
      verificationMethod: 'MANUAL',
      verificationUrl: null,
      verificationText: 'I am the real author and here is my proof',
    };
    render(<ClaimDetailView claim={manualClaim} />);

    expect(screen.getByText('I am the real author and here is my proof')).toBeInTheDocument();
  });
});
