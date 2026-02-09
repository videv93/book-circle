'use client';

import { useEffect, useState } from 'react';
import { BookOpen, Users, Radio } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { getBookEngagement } from '@/actions/authors/getBookEngagement';
import type { BookEngagementData } from '@/actions/authors/getBookEngagement';

interface AuthorEngagementMetricsProps {
  bookId: string;
}

export function AuthorEngagementMetrics({ bookId }: AuthorEngagementMetricsProps) {
  const [data, setData] = useState<BookEngagementData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getBookEngagement(bookId).then((result) => {
      if (result.success) {
        setData(result.data);
      }
      setLoading(false);
    });
  }, [bookId]);

  if (loading) {
    return (
      <Card data-testid="engagement-metrics-loading">
        <CardHeader>
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent>
          <div className="flex justify-around">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 w-16" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  const metrics = [
    {
      label: 'In Library',
      value: data.libraryCount,
      icon: BookOpen,
    },
    {
      label: 'Reading Now',
      value: data.currentlyReadingCount,
      icon: Users,
    },
    {
      label: 'In Room',
      value: data.roomOccupantCount,
      icon: Radio,
    },
  ];

  return (
    <Card data-testid="engagement-metrics">
      <CardHeader>
        <CardTitle className="text-sm text-[#92400e] dark:text-amber-300">
          Reader Engagement
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex justify-around">
          {metrics.map((metric) => (
            <div
              key={metric.label}
              className="flex flex-col items-center gap-1"
            >
              <metric.icon className="h-5 w-5 text-muted-foreground" aria-hidden />
              <span className="text-xl font-semibold">{metric.value}</span>
              <span className="text-xs text-muted-foreground">{metric.label}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
