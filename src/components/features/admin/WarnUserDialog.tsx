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
import { warnUser } from '@/actions/admin/warnUser';
import { toast } from 'sonner';

const WARNING_TYPES = [
  { value: 'FIRST_WARNING', label: 'First Warning' },
  { value: 'FINAL_WARNING', label: 'Final Warning' },
] as const;

type WarningTypeValue = (typeof WARNING_TYPES)[number]['value'];

interface WarnUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  userName: string;
  moderationItemId?: string;
  onSuccess?: () => void;
}

export function WarnUserDialog({
  open,
  onOpenChange,
  userId,
  userName,
  moderationItemId,
  onSuccess,
}: WarnUserDialogProps) {
  const [warningType, setWarningType] = useState<WarningTypeValue | ''>('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const isValid = warningType !== '' && message.trim().length >= 10;

  function handleClose() {
    setWarningType('');
    setMessage('');
    setError('');
    onOpenChange(false);
  }

  async function handleSubmit() {
    if (!isValid) {
      setError('Please select a warning type and provide a message (min 10 characters)');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const result = await warnUser({
        userId,
        warningType,
        message: message.trim(),
        moderationItemId,
      });

      if (result.success) {
        toast.success(`Warning issued to ${userName}`);
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
          <AlertDialogTitle>Warn User</AlertDialogTitle>
          <AlertDialogDescription>
            Issue a warning to <strong>{userName}</strong>. The user will be
            required to acknowledge this warning before continuing to use the
            platform.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Warning Type</Label>
            <div className="flex flex-wrap gap-2">
              {WARNING_TYPES.map((type) => (
                <Button
                  key={type.value}
                  type="button"
                  variant={warningType === type.value ? 'default' : 'outline'}
                  size="sm"
                  className="min-h-[44px]"
                  onClick={() => {
                    setWarningType(type.value);
                    if (error) setError('');
                  }}
                >
                  {type.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="warning-message">Message</Label>
            <Textarea
              id="warning-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Explain the violation to the user..."
              rows={4}
              maxLength={1000}
              className="text-sm"
            />
            <p className="text-xs text-muted-foreground">
              {message.length}/1000 characters (min 10)
            </p>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={submitting} onClick={handleClose}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleSubmit();
            }}
            disabled={submitting || !isValid}
          >
            {submitting ? 'Issuing Warning...' : 'Issue Warning'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
