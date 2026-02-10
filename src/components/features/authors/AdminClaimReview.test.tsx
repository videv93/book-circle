import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AdminClaimReview } from './AdminClaimReview';
import type { PendingClaimData } from '@/actions/authors/getPendingClaims';

const mockPush = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({
    push: mockPush,
    refresh: vi.fn(),
  })),
}));

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
  beforeAll(() => {
    mockPush.mockClear();
  });

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

  it('displays pending count badge', () => {
    render(<AdminClaimReview claims={mockClaims} />);

    expect(screen.getByTestId('pending-count-badge')).toHaveTextContent('2');
  });

  it('displays claim details correctly', () => {
    render(<AdminClaimReview claims={mockClaims} />);

    expect(screen.getByText('Amazing Book')).toBeInTheDocument();
    expect(screen.getByText('AMAZON')).toBeInTheDocument();
    expect(
      screen.getByText('I am the author, check my publisher records')
    ).toBeInTheDocument();
  });

  it('navigates to detail page on card click', async () => {
    const user = userEvent.setup();
    render(<AdminClaimReview claims={mockClaims} />);

    await user.click(screen.getByTestId('claim-card-claim-1'));

    expect(mockPush).toHaveBeenCalledWith('/admin/claims/claim-1');
  });

  it('navigates to detail page on Enter key', async () => {
    const user = userEvent.setup();
    render(<AdminClaimReview claims={mockClaims} />);

    const card = screen.getByTestId('claim-card-claim-2');
    card.focus();
    await user.keyboard('{Enter}');

    expect(mockPush).toHaveBeenCalledWith('/admin/claims/claim-2');
  });
});
