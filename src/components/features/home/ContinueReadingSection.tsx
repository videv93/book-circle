'use client';

import Link from 'next/link';
import { BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { CurrentlyReadingBook } from '@/actions/home';
import { ContinueReadingCard } from './ContinueReadingCard';

interface ContinueReadingSectionProps {
  books: CurrentlyReadingBook[];
  hasMore?: boolean;
}

export function ContinueReadingSection({
  books,
  hasMore = false,
}: ContinueReadingSectionProps) {
  if (books.length === 0) {
    return (
      <section aria-label="Continue Reading" data-testid="continue-reading-empty">
        <h2 className="mb-3 text-lg font-semibold">Continue Reading</h2>
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed p-6">
          <BookOpen className="h-10 w-10 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Find your next book</p>
          <Button asChild size="sm">
            <Link href="/search">Browse Books</Link>
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section aria-label="Continue Reading" data-testid="continue-reading-section">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Continue Reading</h2>
        {hasMore && (
          <Link
            href="/library"
            className="text-sm text-amber-600 hover:underline"
            data-testid="see-all-library"
          >
            See all in Library
          </Link>
        )}
      </div>
      <div className="space-y-1">
        {books.map((book) => (
          <ContinueReadingCard key={book.userBookId} book={book} />
        ))}
      </div>
    </section>
  );
}
