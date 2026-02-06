import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BookDetail } from './BookDetail';
import type { BookDetailData } from '@/actions/books';

// Mock child components to simplify tests
vi.mock('./BookDetailHero', () => ({
  BookDetailHero: ({
    book,
    authorVerified,
  }: {
    book: { title: string };
    authorVerified?: boolean;
  }) => (
    <div data-testid="mock-hero">
      {book.title}
      {authorVerified && <span>verified</span>}
    </div>
  ),
}));

vi.mock('./BookDescription', () => ({
  BookDescription: ({
    description,
    isbn,
  }: {
    description?: string | null;
    isbn?: string | null;
  }) => (
    <div data-testid="mock-description">
      {description}
      {isbn && <span>ISBN: {isbn}</span>}
    </div>
  ),
}));

vi.mock('./BookReadersCount', () => ({
  BookReadersCount: ({
    totalReaders,
    currentlyReading,
  }: {
    totalReaders: number;
    currentlyReading: number;
  }) => (
    <div data-testid="mock-readers">
      {totalReaders} readers, {currentlyReading} reading
    </div>
  ),
}));

vi.mock('./BookDetailActions', () => ({
  BookDetailActions: ({
    isInLibrary,
    currentStatus,
    progress,
    userBookId,
    onStatusChange,
  }: {
    isInLibrary: boolean;
    currentStatus?: string;
    progress?: number;
    userBookId?: string;
    onStatusChange?: (status: 'CURRENTLY_READING' | 'FINISHED' | 'WANT_TO_READ') => void;
  }) => (
    <div data-testid="mock-actions">
      <span>{isInLibrary ? 'In Library' : 'Not In Library'}</span>
      {currentStatus && <span>Status: {currentStatus}</span>}
      {progress !== undefined && <span>Progress: {progress}%</span>}
      {userBookId && <span data-testid="user-book-id">{userBookId}</span>}
      <button
        onClick={() => onStatusChange?.('CURRENTLY_READING')}
        data-testid="add-button"
      >
        Add
      </button>
      <button
        onClick={() => onStatusChange?.('FINISHED')}
        data-testid="finish-button"
      >
        Finish
      </button>
      <button
        onClick={() => onStatusChange?.('WANT_TO_READ')}
        data-testid="want-to-read-button"
      >
        Want to Read
      </button>
    </div>
  ),
}));

const mockData: BookDetailData = {
  book: {
    id: 'book-123',
    isbn10: '0123456789',
    isbn13: '9780123456789',
    title: 'Test Book',
    author: 'Test Author',
    coverUrl: 'https://example.com/cover.jpg',
    pageCount: 300,
    publishedYear: 2024,
    description: 'A test description',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  stats: {
    totalReaders: 45,
    currentlyReading: 12,
  },
  userStatus: undefined,
  authorVerified: false,
};

describe('BookDetail', () => {
  it('renders all child components', () => {
    render(<BookDetail data={mockData} />);

    expect(screen.getByTestId('book-detail')).toBeInTheDocument();
    expect(screen.getByTestId('mock-hero')).toBeInTheDocument();
    expect(screen.getByTestId('mock-readers')).toBeInTheDocument();
    expect(screen.getByTestId('mock-description')).toBeInTheDocument();
    expect(screen.getByTestId('mock-actions')).toBeInTheDocument();
  });

  it('passes book data to hero component', () => {
    render(<BookDetail data={mockData} />);

    expect(screen.getByTestId('mock-hero')).toHaveTextContent('Test Book');
  });

  it('passes stats to readers count component', () => {
    render(<BookDetail data={mockData} />);

    expect(screen.getByTestId('mock-readers')).toHaveTextContent('45 readers');
    expect(screen.getByTestId('mock-readers')).toHaveTextContent('12 reading');
  });

  it('passes description and ISBN to description component', () => {
    render(<BookDetail data={mockData} />);

    expect(screen.getByTestId('mock-description')).toHaveTextContent(
      'A test description'
    );
    expect(screen.getByTestId('mock-description')).toHaveTextContent(
      'ISBN: 9780123456789'
    );
  });

  it('shows not in library state when userStatus is undefined', () => {
    render(<BookDetail data={mockData} />);

    expect(screen.getByTestId('mock-actions')).toHaveTextContent('Not In Library');
  });

  it('shows in library state when userStatus exists', () => {
    const dataWithUserStatus: BookDetailData = {
      ...mockData,
      userStatus: {
        isInLibrary: true,
        status: 'CURRENTLY_READING',
        progress: 50,
        userBookId: 'userbook-123',
      },
    };

    render(<BookDetail data={dataWithUserStatus} />);

    expect(screen.getByTestId('mock-actions')).toHaveTextContent('In Library');
    expect(screen.getByTestId('mock-actions')).toHaveTextContent(
      'Status: CURRENTLY_READING'
    );
    expect(screen.getByTestId('mock-actions')).toHaveTextContent('Progress: 50%');
  });

  it('updates local state when status changes', async () => {
    const user = userEvent.setup();
    render(<BookDetail data={mockData} />);

    // Initially not in library
    expect(screen.getByTestId('mock-actions')).toHaveTextContent('Not In Library');

    // Click add button to trigger status change
    await user.click(screen.getByTestId('add-button'));

    // Now should be in library
    expect(screen.getByTestId('mock-actions')).toHaveTextContent('In Library');
    expect(screen.getByTestId('mock-actions')).toHaveTextContent(
      'Status: CURRENTLY_READING'
    );
  });

  it('passes authorVerified to hero component', () => {
    const dataWithVerified: BookDetailData = {
      ...mockData,
      authorVerified: true,
    };

    render(<BookDetail data={dataWithVerified} />);

    expect(screen.getByTestId('mock-hero')).toHaveTextContent('verified');
  });

  it('prefers isbn13 over isbn10 for display', () => {
    render(<BookDetail data={mockData} />);

    expect(screen.getByTestId('mock-description')).toHaveTextContent(
      'ISBN: 9780123456789'
    );
  });

  it('falls back to isbn10 when isbn13 is not available', () => {
    const dataWithOnlyIsbn10: BookDetailData = {
      ...mockData,
      book: {
        ...mockData.book,
        isbn13: null,
      },
    };

    render(<BookDetail data={dataWithOnlyIsbn10} />);

    expect(screen.getByTestId('mock-description')).toHaveTextContent(
      'ISBN: 0123456789'
    );
  });

  it('passes userBookId to actions component', () => {
    const dataWithUserStatus: BookDetailData = {
      ...mockData,
      userStatus: {
        isInLibrary: true,
        status: 'CURRENTLY_READING',
        progress: 50,
        userBookId: 'userbook-123',
      },
    };

    render(<BookDetail data={dataWithUserStatus} />);

    expect(screen.getByTestId('user-book-id')).toHaveTextContent('userbook-123');
  });

  it('sets progress to 100 when status changes to FINISHED', async () => {
    const user = userEvent.setup();
    const dataWithUserStatus: BookDetailData = {
      ...mockData,
      userStatus: {
        isInLibrary: true,
        status: 'CURRENTLY_READING',
        progress: 50,
        userBookId: 'userbook-123',
      },
    };

    render(<BookDetail data={dataWithUserStatus} />);

    await user.click(screen.getByTestId('finish-button'));

    expect(screen.getByTestId('mock-actions')).toHaveTextContent('Status: FINISHED');
    expect(screen.getByTestId('mock-actions')).toHaveTextContent('Progress: 100%');
  });

  it('resets progress to 0 when status changes to WANT_TO_READ', async () => {
    const user = userEvent.setup();
    const dataWithUserStatus: BookDetailData = {
      ...mockData,
      userStatus: {
        isInLibrary: true,
        status: 'CURRENTLY_READING',
        progress: 50,
        userBookId: 'userbook-123',
      },
    };

    render(<BookDetail data={dataWithUserStatus} />);

    await user.click(screen.getByTestId('want-to-read-button'));

    expect(screen.getByTestId('mock-actions')).toHaveTextContent('Status: WANT_TO_READ');
    expect(screen.getByTestId('mock-actions')).toHaveTextContent('Progress: 0%');
  });
});
