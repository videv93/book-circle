'use client';

import { useState, useTransition } from 'react';
import { UserPlus, UserCheck, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { followUser } from '@/actions/social/followUser';
import { unfollowUser } from '@/actions/social/unfollowUser';

interface FollowButtonProps {
  targetUserId: string;
  targetUserName: string;
  initialIsFollowing: boolean;
  onFollowChange?: (isFollowing: boolean) => void;
}

export function FollowButton({
  targetUserId,
  targetUserName,
  initialIsFollowing,
  onFollowChange,
}: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [showUnfollowDialog, setShowUnfollowDialog] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleFollow = () => {
    const previousState = isFollowing;
    setIsFollowing(true);
    onFollowChange?.(true);

    startTransition(async () => {
      const result = await followUser({ targetUserId });
      if (!result.success) {
        setIsFollowing(previousState);
        onFollowChange?.(previousState);
        toast.error(result.error);
      }
    });
  };

  const handleUnfollow = () => {
    setShowUnfollowDialog(false);
    const previousState = isFollowing;
    setIsFollowing(false);
    onFollowChange?.(false);

    startTransition(async () => {
      const result = await unfollowUser({ targetUserId });
      if (!result.success) {
        setIsFollowing(previousState);
        onFollowChange?.(previousState);
        toast.error(result.error);
      }
    });
  };

  const handleClick = () => {
    if (isFollowing) {
      setShowUnfollowDialog(true);
    } else {
      handleFollow();
    }
  };

  return (
    <>
      <Button
        variant={isFollowing ? 'default' : 'outline'}
        size="sm"
        onClick={handleClick}
        disabled={isPending}
        className="min-h-[44px] min-w-[100px]"
        aria-label={
          isFollowing
            ? `Following ${targetUserName}, tap to unfollow`
            : `Follow ${targetUserName}`
        }
        aria-pressed={isFollowing}
      >
        {isPending ? (
          <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
        ) : isFollowing ? (
          <UserCheck className="mr-1.5 h-4 w-4" />
        ) : (
          <UserPlus className="mr-1.5 h-4 w-4" />
        )}
        {isFollowing ? 'Following' : 'Follow'}
      </Button>

      <AlertDialog open={showUnfollowDialog} onOpenChange={setShowUnfollowDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unfollow {targetUserName}?</AlertDialogTitle>
            <AlertDialogDescription>
              You will no longer see their reading activity in your feed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleUnfollow}>Unfollow</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
