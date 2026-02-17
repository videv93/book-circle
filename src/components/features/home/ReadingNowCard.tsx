'use client';

import Link from 'next/link';
import Image from 'next/image';
import { BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PresenceAvatarStack } from '@/components/features/presence/PresenceAvatarStack';
import type { PresenceMember } from '@/stores/usePresenceStore';
import type { ActiveBook } from '@/actions/home';

interface ReadingNowCardProps {
  activeBook: ActiveBook;
  className?: string;
}

export function ReadingNowCard({ activeBook, className }: ReadingNowCardProps) {
  const { book, readerCount, hasAuthorPresence, readers } = activeBook;
  const identifier = book.isbn13 || book.isbn10 || book.id;

  // Build PresenceMember map from readers data
  const membersMap = new Map<string, PresenceMember>(
    (readers ?? []).map((r) => [r.id, { id: r.id, name: r.name, avatarUrl: r.avatarUrl, isAuthor: r.isAuthor }]),
  );

  return (
    <Link
      href={`/book/${identifier}`}
      className={cn(
        'flex w-[140px] flex-shrink-0 flex-col rounded-xl border p-2 transition-colors',
        'hover:bg-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        'min-h-[44px]',
        hasAuthorPresence &&
          'border-[var(--author-shimmer,#eab308)] ring-2 ring-[var(--author-shimmer,#eab308)]/30',
        className,
      )}
      aria-label={`${book.title} by ${book.author}, ${readerCount} reading now${hasAuthorPresence ? ', author is here' : ''}`}
      data-testid="reading-now-card"
    >
      <div className="mx-auto h-[100px] w-[68px] overflow-hidden rounded-md bg-muted">
        {book.coverUrl ? (
          <Image
            src={book.coverUrl}
            alt={`Cover of ${book.title}`}
            width={68}
            height={100}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <BookOpen className="h-6 w-6 text-muted-foreground" />
          </div>
        )}
      </div>

      <h3 className="mt-2 line-clamp-1 text-xs font-medium">{book.title}</h3>
      <p className="line-clamp-1 text-[10px] text-muted-foreground">
        {book.author}
      </p>

      {membersMap.size > 0 && (
        <div className="mt-1">
          <PresenceAvatarStack members={membersMap} maxVisible={3} size={20} />
        </div>
      )}
      <div className="mt-1 flex items-center gap-1">
        <span className="text-[10px] text-amber-600">
          {readerCount} reading now
        </span>
      </div>

      {hasAuthorPresence && (
        <span
          className="mt-0.5 text-[10px] font-medium text-[var(--author-shimmer,#eab308)]"
          data-testid="author-indicator"
        >
          Author is here
        </span>
      )}
    </Link>
  );
}
