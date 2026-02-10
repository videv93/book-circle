'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Check, ExternalLink, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/ui/card';
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
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { reviewClaim } from '@/actions/authors/reviewClaim';
import { RejectClaimDialog } from '@/components/features/admin/RejectClaimDialog';
import { toast } from 'sonner';
import type { ClaimDetailData } from '@/actions/authors/getClaimDetail';

const STATUS_STYLES: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-800',
  APPROVED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-gray-100 text-gray-600',
};

interface ClaimDetailViewProps {
  claim: ClaimDetailData;
}

export function ClaimDetailView({ claim }: ClaimDetailViewProps) {
  const router = useRouter();
  const [approving, setApproving] = useState(false);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [error, setError] = useState('');

  const isPending = claim.status === 'PENDING';

  async function handleApprove() {
    setApproving(true);
    setError('');

    const result = await reviewClaim({
      claimId: claim.id,
      decision: 'approve',
    });

    if (result.success) {
      setShowApproveDialog(false);
      toast.success(`Approved author claim for "${claim.book.title}"`);
      router.refresh();
      router.push('/admin/claims');
    } else {
      setShowApproveDialog(false);
      setError(result.error);
      setApproving(false);
    }
  }

  function handleRejectSuccess() {
    toast.success(`Rejected author claim for "${claim.book.title}"`);
    router.refresh();
    router.push('/admin/claims');
  }

  return (
    <div className="space-y-6" data-testid="claim-detail-view">
      {/* User Profile Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Claimant Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              {claim.user.image && (
                <AvatarImage src={claim.user.image} alt={claim.user.name || ''} />
              )}
              <AvatarFallback>
                {(claim.user.name || claim.user.email)[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{claim.user.name || claim.user.email}</p>
              <p className="text-sm text-muted-foreground">{claim.user.email}</p>
              <p className="text-xs text-muted-foreground">
                Joined {new Date(claim.user.createdAt).toLocaleDateString()} &middot; Role: {claim.user.role}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Book Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Claimed Book</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            {claim.book.coverUrl && (
              <Image
                src={claim.book.coverUrl}
                alt={claim.book.title}
                width={64}
                height={96}
                className="rounded object-cover"
              />
            )}
            <div>
              <p className="font-medium">{claim.book.title}</p>
              <p className="text-sm text-muted-foreground">by {claim.book.author}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Evidence Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Verification Evidence</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="text-sm font-medium">Method</p>
            <p className="text-sm text-muted-foreground">{claim.verificationMethod}</p>
          </div>

          {claim.verificationUrl && (
            <div>
              <p className="text-sm font-medium">URL</p>
              <a
                href={claim.verificationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary underline underline-offset-2 inline-flex items-center gap-1"
                data-testid="evidence-url"
              >
                {claim.verificationUrl}
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          )}

          {claim.verificationText && (
            <div>
              <p className="text-sm font-medium">Explanation</p>
              <p className="text-sm p-2 bg-muted rounded text-muted-foreground">
                {claim.verificationText}
              </p>
            </div>
          )}

          <div>
            <p className="text-sm font-medium">Submitted</p>
            <p className="text-sm text-muted-foreground">
              {new Date(claim.createdAt).toLocaleDateString()}
            </p>
          </div>

          <div>
            <p className="text-sm font-medium">Status</p>
            <span
              className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[claim.status] || 'bg-gray-100 text-gray-600'}`}
              data-testid="claim-status-badge"
            >
              {claim.status}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Claim History Section */}
      {claim.claimHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Previous Claims</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {claim.claimHistory.map((history) => (
                <div
                  key={history.id}
                  className="flex items-center justify-between border-b pb-2 last:border-0"
                  data-testid={`history-${history.id}`}
                >
                  <div>
                    <p className="text-sm font-medium">{history.book.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {history.verificationMethod} &middot;{' '}
                      {new Date(history.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[history.status] || 'bg-gray-100 text-gray-600'}`}
                  >
                    {history.status}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons (only for PENDING) */}
      {isPending && (
        <div className="flex gap-3" data-testid="action-buttons">
          <Button
            onClick={() => setShowApproveDialog(true)}
            disabled={approving}
            className="flex-1 min-h-[44px]"
            data-testid="approve-button"
          >
            {approving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Check className="mr-1 h-4 w-4" />
                Approve
              </>
            )}
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowRejectDialog(true)}
            disabled={approving}
            className="flex-1 min-h-[44px]"
            data-testid="reject-button"
          >
            Reject
          </Button>
        </div>
      )}

      {error && (
        <p className="text-sm text-destructive" role="alert" data-testid="action-error">
          {error}
        </p>
      )}

      {/* Approve Confirmation Dialog */}
      <AlertDialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve Author Claim</AlertDialogTitle>
            <AlertDialogDescription>
              This will verify {claim.user.name || claim.user.email} as the author of &quot;{claim.book.title}&quot;.
              The user will be notified and receive an author badge.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={approving}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleApprove();
              }}
              disabled={approving}
            >
              {approving ? 'Approving...' : 'Confirm Approve'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject Dialog */}
      <RejectClaimDialog
        open={showRejectDialog}
        onOpenChange={setShowRejectDialog}
        claimId={claim.id}
        bookTitle={claim.book.title}
        onSuccess={handleRejectSuccess}
      />
    </div>
  );
}
