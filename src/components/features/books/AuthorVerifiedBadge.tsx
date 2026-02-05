'use client';

import { BadgeCheck } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface AuthorVerifiedBadgeProps {
  className?: string;
}

export function AuthorVerifiedBadge({ className }: AuthorVerifiedBadgeProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={cn(
              'inline-flex items-center gap-1 px-2 py-0.5 rounded-full',
              'bg-amber-100 text-amber-800 text-xs font-medium',
              'dark:bg-amber-900/30 dark:text-amber-200',
              // Use CSS media query via Tailwind's motion-safe: variant for shimmer animation
              // This avoids SSR hydration mismatch and respects user preferences automatically
              'motion-safe:animate-shimmer motion-safe:bg-gradient-to-r motion-safe:from-amber-100 motion-safe:via-amber-200 motion-safe:to-amber-100 motion-safe:bg-[length:200%_100%]',
              'dark:motion-safe:from-amber-900/30 dark:motion-safe:via-amber-800/30 dark:motion-safe:to-amber-900/30',
              className
            )}
            data-testid="author-verified-badge"
          >
            <BadgeCheck className="h-3 w-3" aria-hidden />
            <span>Verified</span>
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <p>This author has verified their identity on the platform</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
