import Link from 'next/link';
import { Clock } from 'lucide-react';
import { formatDuration, formatRelativeTime } from '@/lib/utils';
import type { RecentSession } from '@/actions/social/getUserProfile';

interface RecentSessionsListProps {
  sessions: RecentSession[] | null;
}

export function RecentSessionsList({ sessions }: RecentSessionsListProps) {
  if (!sessions || sessions.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No recent sessions.</p>
    );
  }

  return (
    <div className="space-y-2">
      {sessions.map((session) => (
        <Link
          key={session.id}
          href={`/book/${session.book.id}`}
          className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50"
        >
          {session.book.coverUrl ? (
            <img
              src={session.book.coverUrl}
              alt={`Cover of ${session.book.title}`}
              className="h-12 w-8 rounded object-cover"
            />
          ) : (
            <div className="flex h-12 w-8 items-center justify-center rounded bg-muted text-xs text-muted-foreground">
              ?
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{session.book.title}</p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatDuration(session.duration)}
              </span>
              <span aria-label={`Session date: ${new Date(session.startedAt).toLocaleDateString()}`}>
                {formatRelativeTime(new Date(session.startedAt))}
              </span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
