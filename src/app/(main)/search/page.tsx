'use client';

import { useRouter } from 'next/navigation';
import { useCallback } from 'react';
import { BookSearch } from '@/components/features/books';
import type { BookSearchResult } from '@/services/books/types';

export default function SearchPage() {
  const router = useRouter();

  const handleBookSelect = useCallback(
    (book: BookSearchResult) => {
      // Navigate to book detail using ISBN (preferred) or id
      const bookId = book.isbn13 || book.isbn10 || book.id;
      router.push(`/book/${bookId}`);
    },
    [router]
  );

  return (
    <div className="flex flex-col h-full p-4">
      <BookSearch onBookSelect={handleBookSelect} />
    </div>
  );
}
