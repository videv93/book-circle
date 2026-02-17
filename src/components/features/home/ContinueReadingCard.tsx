'use client';

import Link from 'next/link';
import Image from 'next/image';
import { BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CurrentlyReadingBook } from '@/actions/home';

interface ContinueReadingCardProps {
  book: CurrentlyReadingBook;
  className?: string;
}

function formatTimeAgo(date: Date | null): string {
  if (!date) return 'No sessions yet';
  const now = Date.now();
  const diffMs = now - new Date(date).getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'Read just now';
  if (diffMin < 60) return `Read ${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `Read ${diffHr}h ago`;
  const diffDays = Math.floor(diffHr / 24);
  return `Read ${diffDays}d ago`;
}

export function ContinueReadingCard({
  book,
  className,
}: ContinueReadingCardProps) {
  const identifier = book.book.isbn13 || book.book.isbn10 || book.book.id;

  return (
    <Link
      href={`/book/${identifier}`}
      className={cn(
        'flex gap-3 rounded-lg p-3 transition-colors',
        'hover:bg-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        'min-h-[44px]',
        className,
      )}
      aria-label={`${book.book.title} by ${book.book.author}, continue reading`}
      data-testid="continue-reading-card"
    >
      <div className="h-[72px] w-[48px] flex-shrink-0 overflow-hidden rounded-md bg-muted">
        {book.book.coverUrl ? (
          <Image
            src={book.book.coverUrl}
            alt={`Cover of ${book.book.title}`}
            width={48}
            height={72}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <BookOpen className="h-5 w-5 text-muted-foreground" />
          </div>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col justify-center gap-0.5">
        <h3 className="line-clamp-1 text-sm font-medium">{book.book.title}</h3>
        <p className="line-clamp-1 text-xs text-muted-foreground">
          {book.book.author}
        </p>
        <p className="text-xs text-amber-600" data-testid="last-session-time">
          {formatTimeAgo(book.lastSessionAt)}
        </p>
      </div>
    </Link>
  );
}
