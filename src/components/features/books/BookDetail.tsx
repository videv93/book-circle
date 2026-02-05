'use client';

import { useState, useCallback } from 'react';
import { BookDetailHero } from './BookDetailHero';
import { BookDescription } from './BookDescription';
import { BookReadersCount } from './BookReadersCount';
import { BookDetailActions } from './BookDetailActions';
import type { BookDetailData } from '@/actions/books';
import type { BookSearchResult } from '@/services/books/types';
import type { ReadingStatus } from '@prisma/client';

interface BookDetailProps {
  data: BookDetailData;
}

export function BookDetail({ data }: BookDetailProps) {
  const { book, stats, userStatus, authorVerified } = data;

  // Local state to track library status for optimistic updates
  const [isInLibrary, setIsInLibrary] = useState(userStatus?.isInLibrary ?? false);
  const [currentStatus, setCurrentStatus] = useState<ReadingStatus | undefined>(
    userStatus?.status
  );
  const [progress, setProgress] = useState(userStatus?.progress ?? 0);

  // Convert Book to BookSearchResult for AddToLibraryButton
  // TODO: Book model doesn't track original source. Using 'openlibrary' as fallback.
  // Consider adding source field to Book model if source tracking becomes needed.
  const bookSearchResult: BookSearchResult = {
    id: book.id,
    source: 'openlibrary', // Fallback - actual source not tracked in Book model
    title: book.title,
    authors: [book.author],
    publishedYear: book.publishedYear ?? undefined,
    coverUrl: book.coverUrl ?? undefined,
    isbn10: book.isbn10 ?? undefined,
    isbn13: book.isbn13 ?? undefined,
    pageCount: book.pageCount ?? undefined,
    description: book.description ?? undefined,
  };

  const handleStatusChange = useCallback((status: ReadingStatus) => {
    setIsInLibrary(true);
    setCurrentStatus(status);
    if (status !== 'CURRENTLY_READING') {
      setProgress(status === 'FINISHED' ? 100 : 0);
    }
  }, []);

  return (
    <div data-testid="book-detail">
      <BookDetailHero book={book} authorVerified={authorVerified} />

      <BookReadersCount
        totalReaders={stats.totalReaders}
        currentlyReading={stats.currentlyReading}
        className="border-t border-b border-border"
      />

      <BookDescription
        description={book.description}
        isbn={book.isbn13 || book.isbn10}
        className="py-4"
      />

      <BookDetailActions
        book={bookSearchResult}
        isInLibrary={isInLibrary}
        currentStatus={currentStatus}
        progress={progress}
        onStatusChange={handleStatusChange}
        className="border-t border-border"
      />
    </div>
  );
}
