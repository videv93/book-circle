'use client';

import { useState } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { reviewClaim } from '@/actions/authors/reviewClaim';
import type { RejectionReasonType } from '@/lib/validation/author';

const REJECTION_REASONS: { value: RejectionReasonType; label: string }[] = [
  { value: 'INSUFFICIENT_EVIDENCE', label: 'Insufficient Evidence' },
  { value: 'NOT_THE_AUTHOR', label: 'Not the Author' },
  { value: 'DUPLICATE_CLAIM', label: 'Duplicate Claim' },
  { value: 'OTHER', label: 'Other' },
];

interface RejectClaimDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  claimId: string;
  bookTitle: string;
  onSuccess?: () => void;
}

export function RejectClaimDialog({
  open,
  onOpenChange,
  claimId,
  bookTitle,
  onSuccess,
}: RejectClaimDialogProps) {
  const [rejectionReason, setRejectionReason] = useState<RejectionReasonType | ''>('');
  const [adminNotes, setAdminNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const isValid = rejectionReason !== '';

  function handleClose() {
    setRejectionReason('');
    setAdminNotes('');
    setError('');
    onOpenChange(false);
  }

  async function handleSubmit() {
    if (!isValid) {
      setError('Please select a rejection reason');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const result = await reviewClaim({
        claimId,
        decision: 'reject',
        rejectionReason,
        adminNotes: adminNotes.trim() || undefined,
      });

      if (result.success) {
        handleClose();
        onSuccess?.();
      } else {
        setError(result.error);
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Reject Author Claim</AlertDialogTitle>
          <AlertDialogDescription>
            Reject the author claim for &quot;{bookTitle}&quot;. Select a reason and optionally add notes for the user.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Rejection Reason</Label>
            <div className="flex flex-wrap gap-2">
              {REJECTION_REASONS.map((reason) => (
                <Button
                  key={reason.value}
                  type="button"
                  variant={rejectionReason === reason.value ? 'default' : 'outline'}
                  size="sm"
                  className="min-h-[44px]"
                  onClick={() => {
                    setRejectionReason(reason.value);
                    if (error) setError('');
                  }}
                  data-testid={`reason-${reason.value}`}
                >
                  {reason.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reject-notes">Notes for user (optional)</Label>
            <Textarea
              id="reject-notes"
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder="Explain what evidence was missing or why the claim was rejected..."
              rows={3}
              maxLength={500}
              className="text-sm"
              data-testid="admin-notes-input"
            />
            <p className="text-xs text-muted-foreground">
              {adminNotes.length}/500 characters
            </p>
          </div>

          {error && (
            <p className="text-sm text-destructive" role="alert" data-testid="reject-error">
              {error}
            </p>
          )}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={submitting} onClick={handleClose}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={(e) => {
              e.preventDefault();
              handleSubmit();
            }}
            disabled={submitting || !isValid}
            data-testid="confirm-reject"
          >
            {submitting ? 'Rejecting...' : 'Reject Claim'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
