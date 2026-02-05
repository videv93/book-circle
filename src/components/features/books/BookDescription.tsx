'use client';

import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface BookDescriptionProps {
  description?: string | null;
  isbn?: string | null;
  className?: string;
}

export function BookDescription({
  description,
  isbn,
  className,
}: BookDescriptionProps) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopyISBN = async () => {
    if (!isbn) return;
    try {
      await navigator.clipboard.writeText(isbn);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API may fail in insecure contexts or if permission denied
      console.error('Failed to copy ISBN to clipboard');
    }
  };

  const shouldTruncate = description && description.length > 200;

  return (
    <div className={cn('px-4', className)} data-testid="book-description">
      {description ? (
        <div className="mb-4">
          <p
            className={cn(
              'text-sm text-muted-foreground leading-relaxed',
              !expanded && shouldTruncate && 'line-clamp-3'
            )}
            data-testid="description-text"
          >
            {description}
          </p>
          {shouldTruncate && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(!expanded)}
              className="mt-1 h-auto p-0 text-primary"
              data-testid="expand-toggle"
            >
              {expanded ? 'Show less' : 'Show more'}
            </Button>
          )}
        </div>
      ) : (
        <p
          className="text-sm text-muted-foreground italic mb-4"
          data-testid="no-description"
        >
          No description available
        </p>
      )}

      {isbn && (
        <div
          className="flex items-center gap-2 text-sm text-muted-foreground"
          data-testid="isbn-display"
        >
          <span>ISBN: {isbn}</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={handleCopyISBN}
            aria-label="Copy ISBN"
            data-testid="copy-isbn-button"
          >
            {copied ? (
              <Check className="h-3 w-3 text-green-600" aria-hidden />
            ) : (
              <Copy className="h-3 w-3" aria-hidden />
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
