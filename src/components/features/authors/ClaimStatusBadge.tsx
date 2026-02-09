'use client';

import { cn } from '@/lib/utils';
import type { ClaimStatus } from '@prisma/client';

interface ClaimStatusBadgeProps {
  status: ClaimStatus;
  className?: string;
}

const statusConfig: Record<
  ClaimStatus,
  { label: string; className: string }
> = {
  PENDING: {
    label: 'Claim Pending',
    className: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  },
  APPROVED: {
    label: 'Verified Author',
    className:
      'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 animate-shimmer',
  },
  REJECTED: {
    label: 'Claim Not Approved',
    className: 'bg-muted text-muted-foreground',
  },
};

export function ClaimStatusBadge({ status, className }: ClaimStatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        config.className,
        className
      )}
      data-testid="claim-status-badge"
      data-status={status.toLowerCase()}
    >
      {config.label}
    </span>
  );
}
