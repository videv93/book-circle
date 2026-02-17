'use client';

import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { MessageCircle, Sparkles } from 'lucide-react';

import { createComment, listComments } from '@/actions/discussions';
import type { PostSummary, CommentSummary } from '@/actions/discussions';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface PostCardProps {
  post: PostSummary;
  authorUserId?: string;
}

export function PostCard({ post, authorUserId }: PostCardProps) {
  const isBookAuthor = authorUserId != null && post.author.id === authorUserId;
  const [expanded, setExpanded] = useState(false);
  const [comments, setComments] = useState<CommentSummary[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [replyBody, setReplyBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [commentCount, setCommentCount] = useState(post.commentCount);
  const [error, setError] = useState<string | null>(null);

  const handleToggleReplies = async () => {
    if (expanded) {
      setExpanded(false);
      return;
    }
    setExpanded(true);
    setLoadingComments(true);
    const result = await listComments({ postId: post.id });
    if (result.success) {
      setComments(result.data.comments);
    }
    setLoadingComments(false);
  };

  const handleSubmitReply = async () => {
    if (!replyBody.trim()) return;
    setSubmitting(true);
    setError(null);
    const result = await createComment({ postId: post.id, body: replyBody });
    if (result.success) {
      setReplyBody('');
      setCommentCount((c) => c + 1);
      const refreshed = await listComments({ postId: post.id });
      if (refreshed.success) {
        setComments(refreshed.data.comments);
      }
    } else {
      setError(result.error);
    }
    setSubmitting(false);
  };

  return (
    <Card
      className="rounded-xl hover:shadow-md transition-shadow py-0"
      data-testid="post-card"
    >
      <CardContent className="p-2">
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
            <button
              onClick={handleToggleReplies}
              className="flex items-center gap-1 min-h-[44px] hover:text-foreground transition-colors"
              data-testid="toggle-replies-button"
            >
              <MessageCircle className="h-3.5 w-3.5" aria-hidden="true" />
              {commentCount}
            </button>
          </div>
        </div>

        {expanded && (
          <div className="mt-3 border-t border-border pt-3 space-y-3" data-testid="replies-section">
            {loadingComments ? (
              <p className="text-xs text-muted-foreground">Loading replies...</p>
            ) : comments.length === 0 ? (
              <p className="text-xs text-muted-foreground">No replies yet.</p>
            ) : (
              <div className="space-y-3">
                {comments.map((comment) => (
                  <div key={comment.id} className="flex gap-2" data-testid="comment-item">
                    <Avatar className="h-5 w-5 mt-0.5">
                      {comment.author.image && (
                        <AvatarImage src={comment.author.image} alt={comment.author.name ?? 'User'} />
                      )}
                      <AvatarFallback className="text-[10px]">
                        {(comment.author.name ?? '?')[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium">{comment.author.name ?? 'Anonymous'}</span>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-sm text-foreground mt-0.5">{comment.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2" data-testid="reply-form">
              <Textarea
                placeholder="Write a reply..."
                value={replyBody}
                onChange={(e) => setReplyBody(e.target.value)}
                maxLength={2000}
                rows={2}
                className="text-sm"
                data-testid="reply-input"
              />
              <Button
                size="sm"
                onClick={handleSubmitReply}
                disabled={submitting || !replyBody.trim()}
                className="self-end"
                data-testid="reply-submit-button"
              >
                {submitting ? '...' : 'Reply'}
              </Button>
            </div>
            {error && (
              <p className="text-xs text-destructive" data-testid="reply-error">{error}</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
