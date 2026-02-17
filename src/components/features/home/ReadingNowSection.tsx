'use client';

import type { ActiveBook } from '@/actions/home';
import { ReadingNowCard } from './ReadingNowCard';

interface ReadingNowSectionProps {
  books: ActiveBook[];
}

export function ReadingNowSection({ books }: ReadingNowSectionProps) {
  if (books.length === 0) return null;

  return (
    <section aria-label="Reading Now" data-testid="reading-now-section">
      <h2 className="mb-2 text-lg font-semibold">Reading Now</h2>
      <div
        className="overflow-x-auto scrollbar-hide -mx-4 px-4"
        tabIndex={0}
        role="region"
        aria-label="Horizontally scrollable list of books with active readers"
      >
        <div className="flex gap-3 w-max">
          {books.map((activeBook) => (
            <ReadingNowCard key={activeBook.book.id} activeBook={activeBook} />
          ))}
        </div>
      </div>
    </section>
  );
}
