'use client';

import { useState, useEffect } from 'react';
import { MessageSquare } from 'lucide-react';

import { createPost, listPosts } from '@/actions/discussions';
import type { PostSummary } from '@/actions/discussions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
} from '@/components/ui/sheet';
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
  const [sheetOpen, setSheetOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');

  const handleCreatePost = async () => {
    setSubmitting(true);
    setSubmitError(null);
    const result = await createPost({ bookId, title, body });
    if (result.success) {
      setTitle('');
      setBody('');
      setSheetOpen(false);
      const refreshed = await listPosts({ bookId });
      if (refreshed.success) {
        setPosts(refreshed.data.posts);
        setCursor(refreshed.data.nextCursor);
      }
    } else {
      setSubmitError(result.error);
    }
    setSubmitting(false);
  };

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
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
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-muted-foreground">Discussions</h3>
        <Button size="sm" onClick={() => setSheetOpen(true)} data-testid="new-post-button">
          New Post
        </Button>
      </div>
      {posts.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center gap-3 py-12"
          data-testid="discussions-empty"
        >
          <MessageSquare className="h-12 w-12 text-muted-foreground" />
          <p className="text-sm font-medium text-foreground">No discussions yet</p>
          <p className="text-center text-sm text-muted-foreground">
            Be the first to start a conversation about this book.
          </p>
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

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="bottom" data-testid="new-post-sheet">
          <SheetHeader>
            <SheetTitle>New Post</SheetTitle>
            <SheetDescription>Start a discussion about this book.</SheetDescription>
          </SheetHeader>
          <div className="flex flex-col gap-4 px-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="post-title">Title</Label>
              <Input
                id="post-title"
                placeholder="What do you want to discuss?"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={200}
                data-testid="post-title-input"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="post-body">Body</Label>
              <Textarea
                id="post-body"
                placeholder="Share your thoughts..."
                value={body}
                onChange={(e) => setBody(e.target.value)}
                maxLength={5000}
                rows={4}
                data-testid="post-body-input"
              />
            </div>
            {submitError && (
              <p className="text-sm text-destructive" data-testid="post-submit-error">
                {submitError}
              </p>
            )}
          </div>
          <SheetFooter>
            <SheetClose asChild>
              <Button variant="outline">Cancel</Button>
            </SheetClose>
            <Button
              onClick={handleCreatePost}
              disabled={submitting || !title.trim() || !body.trim()}
              data-testid="post-submit-button"
            >
              {submitting ? 'Posting...' : 'Post'}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
