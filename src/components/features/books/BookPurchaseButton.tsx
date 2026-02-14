'use client';

import { ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BookPurchaseButtonProps {
  isbn: string;
  bookId?: string;
}

function buildAffiliateUrl(isbn: string, provider: string, bookId?: string): string {
  const params = new URLSearchParams({
    isbn,
    provider,
    ...(bookId && { bookId }),
  });
  return `/api/affiliate?${params.toString()}`;
}

export function BookPurchaseButton({ isbn, bookId }: BookPurchaseButtonProps) {
  const openLibraryUrl = `https://openlibrary.org/isbn/${isbn}`;
  const amazonUrl = buildAffiliateUrl(isbn, 'amazon', bookId);
  const bookshopUrl = buildAffiliateUrl(isbn, 'bookshop', bookId);

  return (
    <div className="flex flex-col gap-2 px-4 py-3" data-testid="book-purchase-options">
      <p className="text-xs text-muted-foreground">Get this book</p>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" asChild className="min-h-[44px]">
          <a
            href={openLibraryUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Read free on OpenLibrary"
          >
            <ExternalLink className="size-3.5" />
            Free on OpenLibrary
          </a>
        </Button>
        <Button variant="secondary" size="sm" asChild className="min-h-[44px]">
          <a
            href={amazonUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Buy on Amazon (supports app)"
          >
            <ExternalLink className="size-3.5" />
            Buy on Amazon
            <span className="text-[10px] text-muted-foreground ml-0.5">(supports app)</span>
          </a>
        </Button>
        <Button variant="secondary" size="sm" asChild className="min-h-[44px]">
          <a
            href={bookshopUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Buy on Bookshop.org (supports app)"
          >
            <ExternalLink className="size-3.5" />
            Buy on Bookshop.org
            <span className="text-[10px] text-muted-foreground ml-0.5">(supports app)</span>
          </a>
        </Button>
      </div>
    </div>
  );
}
