'use client';

import { formatDistanceToNow } from 'date-fns';
import { MessageCircle, Sparkles } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import type { PostSummary } from '@/actions/discussions';

interface PostCardProps {
  post: PostSummary;
  authorUserId?: string;
}

export function PostCard({ post, authorUserId }: PostCardProps) {
  const isBookAuthor = authorUserId != null && post.author.id === authorUserId;

  return (
    <Card
      className="rounded-xl hover:shadow-md transition-shadow"
      data-testid="post-card"
    >
      <CardContent className="p-4">
        <h3 className="font-semibold text-base leading-snug mb-1">
          {post.title}
        </h3>
        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
          {post.body}
        </p>
        <div className="flex items-center justify-between min-h-[44px]">
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              {post.author.image && (
                <AvatarImage src={post.author.image} alt={post.author.name ?? 'User'} />
              )}
              <AvatarFallback className="text-xs">
                {(post.author.name ?? '?')[0]}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm text-muted-foreground">
              {post.author.name ?? 'Anonymous'}
            </span>
            {isBookAuthor && (
              <span
                className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200"
                data-testid="author-badge"
              >
                <Sparkles className="h-3 w-3" aria-hidden="true" />
                Author
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span>{formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}</span>
            <span className="flex items-center gap-1">
              <MessageCircle className="h-3.5 w-3.5" aria-hidden="true" />
              {post.commentCount}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
