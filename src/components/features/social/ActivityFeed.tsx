'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ActivityFeedItem } from './ActivityFeedItem';
import { getActivityFeed } from '@/actions/social/getActivityFeed';
import type { ActivityItem } from '@/actions/social/getActivityFeed';
import { toast } from 'sonner';

interface ActivityFeedProps {
  initialActivities: ActivityItem[];
  initialTotal: number;
  hasFollows: boolean;
}

const PAGE_SIZE = 20;

export function ActivityFeed({
  initialActivities,
  initialTotal,
  hasFollows: initialHasFollows,
}: ActivityFeedProps) {
  const [activities, setActivities] = useState<ActivityItem[]>(initialActivities);
  const [total, setTotal] = useState(initialTotal);
  const [hasFollows] = useState(initialHasFollows);
  const [isPending, startTransition] = useTransition();

  const hasMore = activities.length < total;

  const loadMore = () => {
    startTransition(async () => {
      const result = await getActivityFeed({
        limit: PAGE_SIZE,
        offset: activities.length,
      });

      if (result.success) {
        setActivities((prev) => [...prev, ...result.data.activities]);
        setTotal(result.data.total);
      } else {
        toast.error(result.error);
      }
    });
  };

  // Empty state: User follows no one
  if (!hasFollows && activities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
        <Users className="h-12 w-12 text-muted-foreground" />
        <div>
          <h3 className="text-lg font-medium mb-2">Follow readers to see their activity</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Discover what other readers are enjoying
          </p>
          <Button asChild>
            <Link href="/search?tab=users">Find Readers</Link>
          </Button>
        </div>
      </div>
    );
  }

  // Empty state: User has follows but they have no activity
  if (hasFollows && activities.length === 0 && !isPending) {
    return (
      <div className="py-12 text-center">
        <p className="text-sm text-muted-foreground">
          No recent activity from people you follow
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Activity List */}
      <div className="space-y-3">
        {activities.map((activity) => (
          <ActivityFeedItem key={activity.id} activity={activity} />
        ))}
      </div>

      {/* Loading Skeleton */}
      {isPending && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-start gap-3 rounded-lg border p-3">
              <Skeleton className="h-10 w-10 rounded-full shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
              <Skeleton className="h-16 w-10 rounded shrink-0" />
            </div>
          ))}
        </div>
      )}

      {/* Load More Button */}
      {hasMore && !isPending && (
        <Button
          onClick={loadMore}
          disabled={isPending}
          variant="outline"
          className="w-full"
        >
          Load More
        </Button>
      )}
    </div>
  );
}
