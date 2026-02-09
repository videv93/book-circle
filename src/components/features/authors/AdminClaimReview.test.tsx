import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AdminClaimReview } from './AdminClaimReview';
import type { PendingClaimData } from '@/actions/authors/getPendingClaims';

// Mock reviewClaim
vi.mock('@/actions/authors/reviewClaim', () => ({
  reviewClaim: vi.fn(),
}));

import { reviewClaim } from '@/actions/authors/reviewClaim';

const mockReviewClaim = reviewClaim as ReturnType<typeof vi.fn>;

// Mock matchMedia
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

const mockClaims: PendingClaimData[] = [
  {
    id: 'claim-1',
    verificationMethod: 'AMAZON',
    verificationUrl: 'https://amazon.com/author/john',
    verificationText: null,
    createdAt: new Date('2026-02-01'),
    user: {
      id: 'user-1',
      name: 'John Author',
      email: 'john@example.com',
      image: null,
    },
    book: {
      id: 'book-1',
      title: 'Amazing Book',
      author: 'John Author',
      coverUrl: null,
    },
  },
  {
    id: 'claim-2',
    verificationMethod: 'MANUAL',
    verificationUrl: null,
    verificationText: 'I am the author, check my publisher records',
    createdAt: new Date('2026-02-02'),
    user: {
      id: 'user-2',
      name: 'Jane Writer',
      email: 'jane@example.com',
      image: null,
    },
    book: {
      id: 'book-2',
      title: 'Another Book',
      author: 'Jane Writer',
      coverUrl: null,
    },
  },
];

describe('AdminClaimReview', () => {
  it('renders empty state when no claims', () => {
    render(<AdminClaimReview claims={[]} />);

    expect(screen.getByTestId('no-pending-claims')).toBeInTheDocument();
    expect(screen.getByText('No pending claims to review')).toBeInTheDocument();
  });

  it('renders list of pending claims', () => {
    render(<AdminClaimReview claims={mockClaims} />);

    expect(screen.getByTestId('admin-claim-list')).toBeInTheDocument();
    expect(screen.getByText('2 pending claims')).toBeInTheDocument();
    expect(screen.getByText('John Author')).toBeInTheDocument();
    expect(screen.getByText('Jane Writer')).toBeInTheDocument();
  });

  it('displays claim details correctly', () => {
    render(<AdminClaimReview claims={mockClaims} />);

    expect(screen.getByText('Amazing Book')).toBeInTheDocument();
    expect(screen.getByText('AMAZON')).toBeInTheDocument();
    expect(
      screen.getByText('I am the author, check my publisher records')
    ).toBeInTheDocument();
  });

  it('removes claim from list after approval', async () => {
    const user = userEvent.setup();
    mockReviewClaim.mockResolvedValue({ success: true, data: { id: 'claim-1' } });

    render(<AdminClaimReview claims={mockClaims} />);

    await user.click(screen.getByTestId('approve-claim-1'));

    await waitFor(() => {
      expect(screen.queryByText('John Author')).not.toBeInTheDocument();
    });
    expect(screen.getByText('1 pending claim')).toBeInTheDocument();
  });

  it('removes claim from list after rejection', async () => {
    const user = userEvent.setup();
    mockReviewClaim.mockResolvedValue({ success: true, data: { id: 'claim-2' } });

    render(<AdminClaimReview claims={mockClaims} />);

    await user.click(screen.getByTestId('reject-claim-2'));

    await waitFor(() => {
      expect(screen.queryByText('Jane Writer')).not.toBeInTheDocument();
    });
  });
});
