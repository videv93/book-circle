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
import { suspendUser } from '@/actions/admin/suspendUser';
import { toast } from 'sonner';

const DURATION_OPTIONS = [
  { value: 'HOURS_24', label: '24 Hours' },
  { value: 'DAYS_7', label: '7 Days' },
  { value: 'DAYS_30', label: '30 Days' },
  { value: 'PERMANENT', label: 'Permanent' },
] as const;

type DurationValue = (typeof DURATION_OPTIONS)[number]['value'];

interface SuspendUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  userName: string;
  moderationItemId?: string;
  onSuccess?: () => void;
}

export function SuspendUserDialog({
  open,
  onOpenChange,
  userId,
  userName,
  moderationItemId,
  onSuccess,
}: SuspendUserDialogProps) {
  const [duration, setDuration] = useState<DurationValue | ''>('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const isValid = duration !== '' && reason.trim().length >= 10;

  function handleClose() {
    setDuration('');
    setReason('');
    setError('');
    onOpenChange(false);
  }

  async function handleSubmit() {
    if (!isValid) {
      setError('Please select a duration and provide a reason (min 10 characters)');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const result = await suspendUser({
        userId,
        duration,
        reason: reason.trim(),
        moderationItemId,
      });

      if (result.success) {
        toast.success(`${userName} has been suspended`);
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

  const durationLabel = DURATION_OPTIONS.find((d) => d.value === duration)?.label;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="text-destructive">
            Suspend Account
          </AlertDialogTitle>
          <AlertDialogDescription>
            Suspend <strong>{userName}</strong>&apos;s account. They will be
            immediately logged out and unable to access the platform.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Duration</Label>
            <div className="flex flex-wrap gap-2">
              {DURATION_OPTIONS.map((opt) => (
                <Button
                  key={opt.value}
                  type="button"
                  variant={duration === opt.value ? 'default' : 'outline'}
                  size="sm"
                  className={`min-h-[44px] ${
                    opt.value === 'PERMANENT' && duration === opt.value
                      ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
                      : ''
                  }`}
                  onClick={() => {
                    setDuration(opt.value);
                    if (error) setError('');
                  }}
                >
                  {opt.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="suspension-reason">Reason</Label>
            <Textarea
              id="suspension-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain why this account is being suspended..."
              rows={4}
              maxLength={1000}
              className="text-sm"
            />
            <p className="text-xs text-muted-foreground">
              {reason.length}/1000 characters (min 10)
            </p>
          </div>

          {isValid && (
            <div className="rounded-md bg-muted p-3 text-sm">
              <p className="font-medium">Confirm Suspension:</p>
              <p>
                User: <strong>{userName}</strong>
              </p>
              <p>
                Duration: <strong>{durationLabel}</strong>
              </p>
              <p className="mt-1 text-muted-foreground">{reason.trim()}</p>
            </div>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}
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
          >
            {submitting ? 'Suspending...' : 'Suspend Account'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
