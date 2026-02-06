import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BookDetailActions } from './BookDetailActions';
import type { BookSearchResult } from '@/services/books/types';

// Mock the server actions
vi.mock('@/actions/books', () => ({
  addToLibrary: vi.fn(),
  updateReadingStatus: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

import { updateReadingStatus } from '@/actions/books';
import { toast } from 'sonner';

const mockUpdateReadingStatus = updateReadingStatus as unknown as ReturnType<typeof vi.fn>;
const mockToastSuccess = toast.success as unknown as ReturnType<typeof vi.fn>;
const mockToastError = toast.error as unknown as ReturnType<typeof vi.fn>;

const mockBook: BookSearchResult = {
  id: 'book-123',
  source: 'openlibrary',
  title: 'Test Book',
  authors: ['Test Author'],
  publishedYear: 2024,
  coverUrl: 'https://example.com/cover.jpg',
  isbn10: '0123456789',
  isbn13: '9780123456789',
  pageCount: 300,
  description: 'A test book',
};

describe('BookDetailActions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('when book is not in library', () => {
    it('renders Add to Library button', () => {
      render(<BookDetailActions book={mockBook} isInLibrary={false} />);

      expect(screen.getByTestId('add-to-library-section')).toBeInTheDocument();
      expect(screen.getByText('Add to Library')).toBeInTheDocument();
    });

    it('does not render status section', () => {
      render(<BookDetailActions book={mockBook} isInLibrary={false} />);

      expect(
        screen.queryByTestId('library-status-section')
      ).not.toBeInTheDocument();
    });
  });

  describe('when book is in library', () => {
    it('renders current status', () => {
      render(
        <BookDetailActions
          book={mockBook}
          isInLibrary={true}
          currentStatus="CURRENTLY_READING"
          userBookId="ub-123"
        />
      );

      expect(screen.getByTestId('library-status-section')).toBeInTheDocument();
      expect(screen.getByTestId('current-status')).toHaveTextContent(
        'Currently Reading'
      );
    });

    it('renders Finished status label', () => {
      render(
        <BookDetailActions
          book={mockBook}
          isInLibrary={true}
          currentStatus="FINISHED"
          userBookId="ub-123"
        />
      );
      expect(screen.getByTestId('current-status')).toHaveTextContent('Finished');
    });

    it('renders Want to Read status label', () => {
      render(
        <BookDetailActions
          book={mockBook}
          isInLibrary={true}
          currentStatus="WANT_TO_READ"
          userBookId="ub-123"
        />
      );
      expect(screen.getByTestId('current-status')).toHaveTextContent(
        'Want to Read'
      );
    });

    it('renders progress bar when currently reading', () => {
      render(
        <BookDetailActions
          book={mockBook}
          isInLibrary={true}
          currentStatus="CURRENTLY_READING"
          progress={45}
          userBookId="ub-123"
        />
      );

      expect(screen.getByTestId('progress-section')).toBeInTheDocument();
      expect(screen.getByTestId('progress-value')).toHaveTextContent('45%');
    });

    it('does not render progress bar when not currently reading', () => {
      render(
        <BookDetailActions
          book={mockBook}
          isInLibrary={true}
          currentStatus="FINISHED"
          progress={100}
          userBookId="ub-123"
        />
      );

      expect(screen.queryByTestId('progress-section')).not.toBeInTheDocument();
    });

    it('renders disabled quick action buttons', () => {
      render(
        <BookDetailActions
          book={mockBook}
          isInLibrary={true}
          currentStatus="CURRENTLY_READING"
          userBookId="ub-123"
        />
      );

      expect(screen.getByTestId('log-session-button')).toBeDisabled();
      expect(screen.getByTestId('update-progress-button')).toBeDisabled();
    });

    it('renders future feature message', () => {
      render(
        <BookDetailActions
          book={mockBook}
          isInLibrary={true}
          currentStatus="CURRENTLY_READING"
          userBookId="ub-123"
        />
      );

      expect(
        screen.getByText(
          'Session logging and progress updates coming in future updates'
        )
      ).toBeInTheDocument();
    });

    it('renders enabled change status button', () => {
      render(
        <BookDetailActions
          book={mockBook}
          isInLibrary={true}
          currentStatus="CURRENTLY_READING"
          userBookId="ub-123"
        />
      );

      expect(screen.getByTestId('change-status-button')).not.toBeDisabled();
    });

    it('opens popover with status selector on click', async () => {
      const user = userEvent.setup();
      render(
        <BookDetailActions
          book={mockBook}
          isInLibrary={true}
          currentStatus="CURRENTLY_READING"
          userBookId="ub-123"
        />
      );

      await user.click(screen.getByTestId('change-status-button'));

      expect(screen.getByRole('radiogroup')).toBeInTheDocument();
      expect(screen.getByText('Finished')).toBeInTheDocument();
      expect(screen.getByText('Want to Read')).toBeInTheDocument();
    });

    it('shows current status highlighted in picker', async () => {
      const user = userEvent.setup();
      render(
        <BookDetailActions
          book={mockBook}
          isInLibrary={true}
          currentStatus="CURRENTLY_READING"
          userBookId="ub-123"
        />
      );

      await user.click(screen.getByTestId('change-status-button'));

      const currentlyReadingOption = screen.getByRole('radio', {
        name: /Currently Reading/i,
      });
      expect(currentlyReadingOption).toHaveAttribute('aria-checked', 'true');
    });

    it('calls updateReadingStatus on status selection', async () => {
      const user = userEvent.setup();
      mockUpdateReadingStatus.mockResolvedValue({
        success: true,
        data: { id: 'ub-123', status: 'FINISHED' },
      });

      render(
        <BookDetailActions
          book={mockBook}
          isInLibrary={true}
          currentStatus="CURRENTLY_READING"
          userBookId="ub-123"
        />
      );

      await user.click(screen.getByTestId('change-status-button'));
      await user.click(screen.getByRole('radio', { name: /Finished/i }));

      await waitFor(() => {
        expect(mockUpdateReadingStatus).toHaveBeenCalledWith({
          userBookId: 'ub-123',
          status: 'FINISHED',
        });
      });
    });

    it('shows success toast after status update', async () => {
      const user = userEvent.setup();
      mockUpdateReadingStatus.mockResolvedValue({
        success: true,
        data: { id: 'ub-123', status: 'FINISHED' },
      });

      render(
        <BookDetailActions
          book={mockBook}
          isInLibrary={true}
          currentStatus="CURRENTLY_READING"
          userBookId="ub-123"
        />
      );

      await user.click(screen.getByTestId('change-status-button'));
      await user.click(screen.getByRole('radio', { name: /Finished/i }));

      await waitFor(() => {
        expect(mockToastSuccess).toHaveBeenCalledWith(
          'Status updated to Finished'
        );
      });
    });

    it('updates UI optimistically on status change', async () => {
      const user = userEvent.setup();
      // Make the server action hang to observe optimistic state
      mockUpdateReadingStatus.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ success: true, data: {} }), 100))
      );

      render(
        <BookDetailActions
          book={mockBook}
          isInLibrary={true}
          currentStatus="CURRENTLY_READING"
          progress={30}
          userBookId="ub-123"
        />
      );

      await user.click(screen.getByTestId('change-status-button'));
      await user.click(screen.getByRole('radio', { name: /Finished/i }));

      // Optimistic: status should change immediately
      await waitFor(() => {
        expect(screen.getByTestId('current-status')).toHaveTextContent('Finished');
      });
    });

    it('rolls back on error', async () => {
      const user = userEvent.setup();
      mockUpdateReadingStatus.mockResolvedValue({
        success: false,
        error: 'Something went wrong',
      });

      render(
        <BookDetailActions
          book={mockBook}
          isInLibrary={true}
          currentStatus="CURRENTLY_READING"
          progress={30}
          userBookId="ub-123"
        />
      );

      await user.click(screen.getByTestId('change-status-button'));
      await user.click(screen.getByRole('radio', { name: /Finished/i }));

      await waitFor(() => {
        expect(mockToastError).toHaveBeenCalledWith('Something went wrong');
      });

      // Should roll back to original status
      await waitFor(() => {
        expect(screen.getByTestId('current-status')).toHaveTextContent(
          'Currently Reading'
        );
      });
    });

    it('sets progress to 100% when changing to Finished', async () => {
      const user = userEvent.setup();
      mockUpdateReadingStatus.mockResolvedValue({
        success: true,
        data: { id: 'ub-123', status: 'FINISHED', progress: 100 },
      });

      render(
        <BookDetailActions
          book={mockBook}
          isInLibrary={true}
          currentStatus="CURRENTLY_READING"
          progress={30}
          userBookId="ub-123"
        />
      );

      await user.click(screen.getByTestId('change-status-button'));
      await user.click(screen.getByRole('radio', { name: /Finished/i }));

      // Finished doesn't show progress bar, but status should update
      await waitFor(() => {
        expect(screen.getByTestId('current-status')).toHaveTextContent('Finished');
      });
      // Progress section hidden for FINISHED
      expect(screen.queryByTestId('progress-section')).not.toBeInTheDocument();
    });

    it('keeps progress at 100% when changing from Finished to Currently Reading', async () => {
      const user = userEvent.setup();
      mockUpdateReadingStatus.mockResolvedValue({
        success: true,
        data: { id: 'ub-123', status: 'CURRENTLY_READING' },
      });

      render(
        <BookDetailActions
          book={mockBook}
          isInLibrary={true}
          currentStatus="FINISHED"
          progress={100}
          userBookId="ub-123"
        />
      );

      await user.click(screen.getByTestId('change-status-button'));
      await user.click(
        screen.getByRole('radio', { name: /Currently Reading/i })
      );

      await waitFor(() => {
        expect(screen.getByTestId('current-status')).toHaveTextContent(
          'Currently Reading'
        );
      });

      // Progress should remain at 100% per AC#5
      expect(screen.getByTestId('progress-value')).toHaveTextContent('100%');
    });

    it('does not call server action when selecting same status', async () => {
      const user = userEvent.setup();

      render(
        <BookDetailActions
          book={mockBook}
          isInLibrary={true}
          currentStatus="CURRENTLY_READING"
          userBookId="ub-123"
        />
      );

      await user.click(screen.getByTestId('change-status-button'));
      await user.click(
        screen.getByRole('radio', { name: /Currently Reading/i })
      );

      expect(mockUpdateReadingStatus).not.toHaveBeenCalled();
    });

    it('calls onStatusChange callback on success', async () => {
      const user = userEvent.setup();
      const onStatusChange = vi.fn();
      mockUpdateReadingStatus.mockResolvedValue({
        success: true,
        data: { id: 'ub-123', status: 'FINISHED' },
      });

      render(
        <BookDetailActions
          book={mockBook}
          isInLibrary={true}
          currentStatus="CURRENTLY_READING"
          userBookId="ub-123"
          onStatusChange={onStatusChange}
        />
      );

      await user.click(screen.getByTestId('change-status-button'));
      await user.click(screen.getByRole('radio', { name: /Finished/i }));

      await waitFor(() => {
        expect(onStatusChange).toHaveBeenCalledWith('FINISHED');
      });
    });
  });

  it('accepts additional className', () => {
    render(
      <BookDetailActions
        book={mockBook}
        isInLibrary={true}
        currentStatus="CURRENTLY_READING"
        className="custom-class"
        userBookId="ub-123"
      />
    );

    const section = screen.getByTestId('library-status-section');
    expect(section.className).toContain('custom-class');
  });

  it('defaults progress to 0', () => {
    render(
      <BookDetailActions
        book={mockBook}
        isInLibrary={true}
        currentStatus="CURRENTLY_READING"
        userBookId="ub-123"
      />
    );

    expect(screen.getByTestId('progress-value')).toHaveTextContent('0%');
  });
});
