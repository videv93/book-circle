'use client';

import Link from 'next/link';
import { Lock, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AuthorChatLockedOverlayProps {
  authorName?: string;
}

export function AuthorChatLockedOverlay({
  authorName,
}: AuthorChatLockedOverlayProps) {
  return (
    <div
      className="relative overflow-hidden rounded-b-lg"
      data-testid="author-chat-locked-overlay"
    >
      {/* Fake blurred chat lines to create desire/FOMO */}
      <div className="px-3 py-4 space-y-2 select-none" aria-hidden="true">
        <div className="h-3 w-3/4 rounded bg-amber-200/60 blur-[2px]" />
        <div className="h-3 w-1/2 rounded bg-amber-200/60 blur-[2px]" />
        <div className="h-3 w-2/3 rounded bg-amber-200/60 blur-[2px]" />
        <div className="h-3 w-1/3 rounded bg-amber-200/60 blur-[2px]" />
      </div>

      {/* Locked overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-amber-50/80 backdrop-blur-sm">
        <div className="flex flex-col items-center gap-2 px-4 text-center">
          <div className="flex items-center gap-1.5 text-amber-700">
            <Lock className="h-4 w-4" aria-hidden="true" />
            <Sparkles className="h-4 w-4" aria-hidden="true" />
          </div>
          <p className="text-sm font-medium text-amber-800">
            Chat with {authorName || 'the author'} — Premium feature
          </p>
          <Button
            asChild
            size="sm"
            className="mt-1 min-h-[44px] min-w-[44px] bg-amber-600 hover:bg-amber-700 text-white border border-amber-500 shadow-[0_0_8px_var(--author-shimmer,#eab308)]"
          >
            <Link href="/upgrade">Upgrade to Premium</Link>
          </Button>
        </div>
      </div>

      {/* Screen reader description */}
      <p className="sr-only" role="status">
        Author chat is a premium feature. {authorName || 'The author'} is
        currently in this reading room. Upgrade to premium to chat with them.
      </p>
    </div>
  );
}
