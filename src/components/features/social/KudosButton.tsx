'use client';

import { useState, useTransition } from 'react';
import { Heart } from 'lucide-react';
import { toast } from 'sonner';
import { giveKudos, removeKudos } from '@/actions/social';
import { useReducedMotion } from '@/hooks/useReducedMotion';

interface KudosButtonProps {
  sessionId: string;
  receiverId: string;
  initialKudosCount: number;
  initialUserGaveKudos: boolean;
  onKudosChange?: (count: number) => void;
}

export function KudosButton({
  sessionId,
  receiverId,
  initialKudosCount,
  initialUserGaveKudos,
  onKudosChange,
}: KudosButtonProps) {
  const [kudosCount, setKudosCount] = useState(initialKudosCount);
  const [userGaveKudos, setUserGaveKudos] = useState(initialUserGaveKudos);
  const [isPending, startTransition] = useTransition();
  const [animate, setAnimate] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  const handleToggleKudos = () => {
    // Save previous state for rollback
    const prevCount = kudosCount;
    const prevGaveKudos = userGaveKudos;

    // Optimistic update
    const newGaveKudos = !userGaveKudos;
    const newCount = newGaveKudos ? kudosCount + 1 : Math.max(0, kudosCount - 1);
    setUserGaveKudos(newGaveKudos);
    setKudosCount(newCount);
    onKudosChange?.(newCount);

    // Trigger animation on give (not remove)
    if (newGaveKudos && !shouldReduceMotion) {
      setAnimate(true);
      setTimeout(() => setAnimate(false), 150);
    }

    // Haptic feedback on mobile
    if (newGaveKudos && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(10);
      } catch {
        // Vibration API not supported or blocked
      }
    }

    // Server action
    startTransition(async () => {
      const result = newGaveKudos
        ? await giveKudos({ sessionId, targetUserId: receiverId })
        : await removeKudos({ sessionId, targetUserId: receiverId });

      if (!result.success) {
        // Rollback on error
        setUserGaveKudos(prevGaveKudos);
        setKudosCount(prevCount);
        onKudosChange?.(prevCount);
        toast.error(result.error);
      } else {
        // Update with server count (may differ from optimistic)
        setKudosCount(result.data.totalKudos);
        onKudosChange?.(result.data.totalKudos);
      }
    });
  };

  return (
    <button
      onClick={handleToggleKudos}
      disabled={isPending}
      aria-label={
        userGaveKudos
          ? `You gave kudos, ${kudosCount} total`
          : 'Give kudos'
      }
      aria-pressed={userGaveKudos}
      className="flex items-center gap-1.5 min-h-[44px] min-w-[44px] rounded-md px-1 transition-colors hover:bg-muted/50 disabled:opacity-50"
    >
      <Heart
        className={`h-5 w-5 transition-all duration-150 ${
          animate ? 'scale-125' : 'scale-100'
        } ${
          userGaveKudos
            ? 'fill-[#ff7f50] text-[#ff7f50]'
            : 'text-muted-foreground'
        }`}
      />
      {kudosCount > 0 && (
        <span className="text-sm text-muted-foreground">{kudosCount}</span>
      )}
    </button>
  );
}
