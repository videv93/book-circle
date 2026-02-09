import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthorClaimForm } from './AuthorClaimForm';

// Mock submitClaim
vi.mock('@/actions/authors/submitClaim', () => ({
  submitClaim: vi.fn(),
}));

import { submitClaim } from '@/actions/authors/submitClaim';

const mockSubmitClaim = submitClaim as ReturnType<typeof vi.fn>;

// Mock matchMedia for Sheet component
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

describe('AuthorClaimForm', () => {
  const defaultProps = {
    bookId: 'book-123',
    open: true,
    onOpenChange: vi.fn(),
    onSuccess: vi.fn(),
  };

  it('renders the form when open', () => {
    render(<AuthorClaimForm {...defaultProps} />);

    expect(screen.getByText('Are you the author?')).toBeInTheDocument();
    expect(screen.getByTestId('submit-claim-button')).toBeInTheDocument();
  });

  it('renders verification method options', () => {
    render(<AuthorClaimForm {...defaultProps} />);

    expect(screen.getByTestId('method-amazon')).toBeInTheDocument();
    expect(screen.getByTestId('method-website')).toBeInTheDocument();
    expect(screen.getByTestId('method-manual')).toBeInTheDocument();
  });

  it('shows URL input for Amazon method by default', () => {
    render(<AuthorClaimForm {...defaultProps} />);

    expect(screen.getByTestId('verification-url-input')).toBeInTheDocument();
  });

  it('shows text input when MANUAL method is selected', async () => {
    const user = userEvent.setup();
    render(<AuthorClaimForm {...defaultProps} />);

    const manualRadio = screen.getByTestId('method-manual').querySelector('input');
    await user.click(manualRadio!);

    expect(screen.getByTestId('verification-text-input')).toBeInTheDocument();
  });

  it('shows error when URL is missing for Amazon method', async () => {
    const user = userEvent.setup();
    render(<AuthorClaimForm {...defaultProps} />);

    await user.click(screen.getByTestId('submit-claim-button'));

    await waitFor(() => {
      expect(screen.getByTestId('submit-error')).toHaveTextContent(
        'URL is required for this verification method'
      );
    });
  });

  it('shows server error for invalid submission', async () => {
    const user = userEvent.setup();
    mockSubmitClaim.mockResolvedValue({
      success: false,
      error: 'Invalid input',
    });

    render(<AuthorClaimForm {...defaultProps} />);

    const urlInput = screen.getByTestId('verification-url-input');
    await user.type(urlInput, 'https://some-url.com');
    await user.click(screen.getByTestId('submit-claim-button'));

    await waitFor(() => {
      expect(screen.getByTestId('submit-error')).toHaveTextContent(
        'Invalid input'
      );
    });
  });

  it('submits successfully and shows confirmation', async () => {
    const user = userEvent.setup();
    mockSubmitClaim.mockResolvedValue({ success: true, data: { id: 'claim-1' } });

    render(<AuthorClaimForm {...defaultProps} />);

    const urlInput = screen.getByTestId('verification-url-input');
    await user.type(urlInput, 'https://amazon.com/author/test');
    await user.click(screen.getByTestId('submit-claim-button'));

    await waitFor(() => {
      expect(screen.getByTestId('author-claim-success')).toBeInTheDocument();
    });
    expect(defaultProps.onSuccess).toHaveBeenCalled();
  });

  it('displays server error when submission fails', async () => {
    const user = userEvent.setup();
    mockSubmitClaim.mockResolvedValue({
      success: false,
      error: 'You already have a pending claim for this book',
    });

    render(<AuthorClaimForm {...defaultProps} />);

    const urlInput = screen.getByTestId('verification-url-input');
    await user.type(urlInput, 'https://amazon.com/author/test');
    await user.click(screen.getByTestId('submit-claim-button'));

    await waitFor(() => {
      expect(screen.getByTestId('submit-error')).toHaveTextContent(
        'You already have a pending claim for this book'
      );
    });
  });
});
