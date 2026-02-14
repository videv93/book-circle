'use client';

import { useEffect, useState } from 'react';
import { getRecommendations } from '@/actions/books/getRecommendations';
import { RecommendationCard } from './RecommendationCard';
import type { RecommendedBook } from '@/actions/books/getRecommendations';

interface PostReadingRecommendationsProps {
  bookId: string;
  bookTitle?: string;
}

export function PostReadingRecommendations({ bookId }: PostReadingRecommendationsProps) {
  const [recommendations, setRecommendations] = useState<RecommendedBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function fetchRecommendations() {
      setLoading(true);
      const result = await getRecommendations(bookId);

      if (cancelled) return;

      if (result.success) {
        setRecommendations(result.data);
      } else {
        setError(true);
      }
      setLoading(false);
    }

    fetchRecommendations();
    return () => { cancelled = true; };
  }, [bookId]);

  if (loading) {
    return (
      <div className="px-4 py-4" data-testid="recommendations-loading">
        <div className="h-4 w-40 bg-muted rounded animate-pulse mb-3" />
        <div className="flex gap-3 overflow-hidden">
          {[1, 2, 3].map((i) => (
            <div key={i} className="min-w-[160px] space-y-2">
              <div className="h-40 bg-muted rounded animate-pulse" />
              <div className="h-3 w-24 bg-muted rounded animate-pulse" />
              <div className="h-3 w-16 bg-muted rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error || recommendations.length === 0) {
    return null;
  }

  return (
    <div className="px-4 py-4" data-testid="recommendations-section">
      <h3 className="text-sm font-medium text-muted-foreground mb-3">What to read next</h3>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {recommendations.map((rec, i) => (
          <RecommendationCard key={`${rec.isbn13 ?? rec.isbn10 ?? i}`} book={rec} bookId={rec.id} />
        ))}
      </div>
    </div>
  );
}
