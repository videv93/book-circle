'use client';

import Link from 'next/link';
import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AuthorShimmerBadgeProps {
  authorName: string;
  lastSeenAt: Date;
  isLive: boolean;
  authorId: string;
  className?: string;
}

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function AuthorShimmerBadge({
  authorName,
  lastSeenAt,
  isLive,
  authorId,
  className,
}: AuthorShimmerBadgeProps) {
  const timeAgo = formatTimeAgo(lastSeenAt);

  const label = isLive
    ? `Author ${authorName} is here now`
    : `Author ${authorName} was here ${timeAgo}`;

  return (
    <Link
      href={`/profile/${authorId}`}
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full min-h-[44px]',
        'text-sm font-medium transition-colors',
        'bg-amber-100 text-amber-800 border border-amber-300',
        'dark:bg-amber-900/30 dark:text-amber-200 dark:border-amber-700',
        'hover:bg-amber-200 dark:hover:bg-amber-900/50',
        isLive && [
          'motion-safe:animate-shimmer motion-safe:bg-gradient-to-r',
          'motion-safe:from-amber-100 motion-safe:via-amber-200 motion-safe:to-amber-100',
          'motion-safe:bg-[length:200%_100%]',
          'dark:motion-safe:from-amber-900/30 dark:motion-safe:via-amber-800/30 dark:motion-safe:to-amber-900/30',
        ],
        className
      )}
      aria-label={label}
      data-testid="author-shimmer-badge"
    >
      <Sparkles
        className={cn(
          'h-4 w-4 flex-shrink-0',
          isLive ? 'text-amber-600 dark:text-amber-300' : 'text-amber-500 dark:text-amber-400'
        )}
        aria-hidden="true"
      />
      <span data-testid="author-shimmer-text">
        {isLive ? (
          <>Author is here!</>
        ) : (
          <>Author was here {timeAgo}</>
        )}
      </span>
    </Link>
  );
}
