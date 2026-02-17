'use client';

import { useState, useEffect, useRef } from 'react';

import { listPosts } from '@/actions/discussions';
import type { PostSummary } from '@/actions/discussions';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { PostCard } from './PostCard';

interface PostListProps {
  bookId: string;
  authorUserId?: string;
}

function PostCardSkeleton() {
  return (
    <Card className="rounded-xl" data-testid="post-card-skeleton">
      <CardContent className="p-4 space-y-3">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-1/2" />
        <div className="flex items-center gap-2 pt-1">
          <Skeleton className="h-6 w-6 rounded-full" />
          <Skeleton className="h-3 w-20" />
        </div>
      </CardContent>
    </Card>
  );
}

export function PostList({ bookId, authorUserId }: PostListProps) {
  return <PostListInner key={bookId} bookId={bookId} authorUserId={authorUserId} />;
}

function PostListInner({ bookId, authorUserId }: PostListProps) {
  const [posts, setPosts] = useState<PostSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cursor, setCursor] = useState<string | null>(null);
  const didFetch = useRef(false);

  useEffect(() => {
    if (didFetch.current) return;
    didFetch.current = true;

    let cancelled = false;
    listPosts({ bookId }).then((result) => {
      if (cancelled) return;
      if (result.success) {
        setPosts(result.data.posts);
        setCursor(result.data.nextCursor);
      } else {
        setError(result.error);
      }
      setLoading(false);
    });

    return () => { cancelled = true; };
  }, [bookId]);

  const [loadMoreError, setLoadMoreError] = useState(false);

  const handleLoadMore = async (pageCursor: string) => {
    setLoadingMore(true);
    setLoadMoreError(false);
    const result = await listPosts({ bookId, cursor: pageCursor });
    if (result.success) {
      setPosts((prev) => [...prev, ...result.data.posts]);
      setCursor(result.data.nextCursor);
    } else {
      setLoadMoreError(true);
    }
    setLoadingMore(false);
  };

  if (loading) {
    return (
      <div className="border-t border-border px-4 py-4" data-testid="discussions-section">
        <h3 className="text-sm font-medium text-muted-foreground mb-3">Discussions</h3>
        <div className="space-y-3">
          <PostCardSkeleton />
          <PostCardSkeleton />
          <PostCardSkeleton />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="border-t border-border px-4 py-4" data-testid="discussions-section">
        <h3 className="text-sm font-medium text-muted-foreground mb-3">Discussions</h3>
        <p className="text-sm text-muted-foreground" data-testid="discussions-error">
          Discussions unavailable
        </p>
      </div>
    );
  }

  return (
    <div className="border-t border-border px-4 py-4" data-testid="discussions-section">
      <h3 className="text-sm font-medium text-muted-foreground mb-3">Discussions</h3>
      {posts.length === 0 ? (
        <div className="text-center py-6" data-testid="discussions-empty">
          <p className="text-sm text-muted-foreground mb-3">
            No discussions yet &mdash; start one!
          </p>
          <button
            disabled
            className="inline-flex items-center justify-center min-h-[44px] px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium opacity-50 cursor-not-allowed"
            data-testid="new-post-button"
          >
            New Post
          </button>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} authorUserId={authorUserId} />
            ))}
          </div>
          {cursor && (
            <div className="mt-4 text-center">
              {loadMoreError && (
                <p className="text-sm text-destructive mb-2" data-testid="load-more-error">
                  Failed to load more posts
                </p>
              )}
              <button
                onClick={() => handleLoadMore(cursor)}
                disabled={loadingMore}
                className="inline-flex items-center justify-center min-h-[44px] px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-accent transition-colors disabled:opacity-50"
                data-testid="load-more-button"
              >
                {loadingMore ? 'Loading...' : loadMoreError ? 'Retry' : 'Load more'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
