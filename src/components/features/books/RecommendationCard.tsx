'use client';

import { ExternalLink, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { RecommendedBook } from '@/actions/books/getRecommendations';

interface RecommendationCardProps {
  book: RecommendedBook;
  bookId?: string;
}

function buildAffiliateUrl(isbn: string, provider: string, source: string, bookId?: string): string {
  const params = new URLSearchParams({ isbn, provider, source, ...(bookId && { bookId }) });
  return `/api/affiliate?${params.toString()}`;
}

export function RecommendationCard({ book, bookId }: RecommendationCardProps) {
  const isbn = book.isbn13 ?? book.isbn10 ?? '';
  const openLibraryUrl = `https://openlibrary.org/isbn/${isbn}`;
  const amazonUrl = buildAffiliateUrl(isbn, 'amazon', 'recommendation', bookId);
  const bookshopUrl = buildAffiliateUrl(isbn, 'bookshop', 'recommendation', bookId);

  return (
    <div
      className="flex flex-col gap-2 min-w-[160px] max-w-[180px] shrink-0"
      data-testid="recommendation-card"
    >
      {book.coverUrl ? (
        <img
          src={book.coverUrl}
          alt={`Cover of ${book.title}`}
          className="w-full h-40 object-cover rounded"
        />
      ) : (
        <div className="w-full h-40 bg-muted rounded flex items-center justify-center" data-testid="cover-placeholder">
          <span className="text-xs text-muted-foreground">No cover</span>
        </div>
      )}

      <div className="flex flex-col gap-0.5">
        <p className="text-sm font-medium line-clamp-2" title={book.title}>{book.title}</p>
        <p className="text-xs text-muted-foreground line-clamp-1">{book.author}</p>
      </div>

      {book.friendCount > 0 && (
        <div className="flex items-center gap-1 text-xs text-muted-foreground" data-testid="social-proof">
          <Users className="size-3" />
          <span>{book.friendCount} {book.friendCount === 1 ? 'friend read this' : 'friends read this'}</span>
        </div>
      )}

      <div className="flex flex-col gap-1">
        <Button variant="outline" size="sm" asChild className="min-h-[44px] text-xs">
          <a href={openLibraryUrl} target="_blank" rel="noopener noreferrer" aria-label={`Read ${book.title} free on OpenLibrary`}>
            <ExternalLink className="size-3" />
            Free on OpenLibrary
          </a>
        </Button>
        <Button variant="secondary" size="sm" asChild className="min-h-[44px] text-xs">
          <a href={amazonUrl} target="_blank" rel="noopener noreferrer" aria-label={`Buy ${book.title} on Amazon (supports app)`}>
            <ExternalLink className="size-3" />
            Amazon
            <span className="text-[10px] text-muted-foreground ml-0.5">(supports app)</span>
          </a>
        </Button>
        <Button variant="secondary" size="sm" asChild className="min-h-[44px] text-xs">
          <a href={bookshopUrl} target="_blank" rel="noopener noreferrer" aria-label={`Buy ${book.title} on Bookshop.org (supports app)`}>
            <ExternalLink className="size-3" />
            Bookshop.org
            <span className="text-[10px] text-muted-foreground ml-0.5">(supports app)</span>
          </a>
        </Button>
      </div>
    </div>
  );
}
