'use client';

import Link from 'next/link';
import Image from 'next/image';
import { BookOpen, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PopularBook } from '@/actions/home';

interface DiscoverBookCardProps {
  popularBook: PopularBook;
  className?: string;
}

export function DiscoverBookCard({
  popularBook,
  className,
}: DiscoverBookCardProps) {
  const { book, totalReaders, isInUserLibrary } = popularBook;
  const identifier = book.isbn13 || book.isbn10 || book.id;

  return (
    <Link
      href={`/book/${identifier}`}
      className={cn(
        'flex w-[130px] flex-shrink-0 flex-col rounded-xl border p-2 transition-colors',
        'hover:bg-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        'min-h-[44px]',
        className,
      )}
      aria-label={`${book.title} by ${book.author}, ${totalReaders} readers${isInUserLibrary ? ', in your library' : ''}`}
      data-testid="discover-book-card"
    >
      <div className="relative mx-auto h-[100px] w-[68px] overflow-hidden rounded-md bg-muted">
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
        {isInUserLibrary && (
          <div
            className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-white"
            data-testid="in-library-badge"
          >
            <Check className="h-3 w-3" />
          </div>
        )}
      </div>

      <h3 className="mt-2 line-clamp-1 text-xs font-medium">{book.title}</h3>
      <p className="line-clamp-1 text-[10px] text-muted-foreground">
        {book.author}
      </p>
      <p className="mt-0.5 text-[10px] text-muted-foreground">
        {totalReaders} {totalReaders === 1 ? 'reader' : 'readers'}
      </p>
    </Link>
  );
}
