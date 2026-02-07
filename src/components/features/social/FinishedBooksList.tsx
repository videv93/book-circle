import Link from 'next/link';
import { BookCheck } from 'lucide-react';
import type { FinishedBook } from '@/actions/social/getUserProfile';

interface FinishedBooksListProps {
  books: FinishedBook[] | null;
}

export function FinishedBooksList({ books }: FinishedBooksListProps) {
  if (!books || books.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No finished books yet.</p>
    );
  }

  return (
    <div className="space-y-2">
      {books.map((item) => (
        <Link
          key={item.id}
          href={`/book/${item.book.id}`}
          className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50"
        >
          {item.book.coverUrl ? (
            <img
              src={item.book.coverUrl}
              alt={`Cover of ${item.book.title}`}
              className="h-12 w-8 rounded object-cover"
            />
          ) : (
            <div className="flex h-12 w-8 items-center justify-center rounded bg-muted text-xs text-muted-foreground">
              ?
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{item.book.title}</p>
            <p className="truncate text-xs text-muted-foreground">
              {item.book.author}
            </p>
            {/* Defensive check: dateFinished should always exist for FINISHED status books */}
            {item.dateFinished && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <BookCheck className="h-3 w-3" />
                <span>
                  Finished{' '}
                  {new Date(item.dateFinished).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
              </div>
            )}
          </div>
        </Link>
      ))}
    </div>
  );
}
