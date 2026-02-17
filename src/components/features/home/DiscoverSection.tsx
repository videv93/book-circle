'use client';

import type { PopularBook } from '@/actions/home';
import { DiscoverBookCard } from './DiscoverBookCard';

interface DiscoverSectionProps {
  books: PopularBook[];
}

export function DiscoverSection({ books }: DiscoverSectionProps) {
  if (books.length < 3) return null;

  return (
    <section aria-label="Discover" data-testid="discover-section">
      <h2 className="mb-2 text-lg font-semibold">Discover</h2>
      <div
        className="overflow-x-auto scrollbar-hide -mx-4 px-4"
        tabIndex={0}
        role="region"
        aria-label="Horizontally scrollable list of popular books"
      >
        <div className="flex gap-3 w-max">
          {books.map((popularBook) => (
            <DiscoverBookCard
              key={popularBook.book.id}
              popularBook={popularBook}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
