'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { acknowledgeWarning } from '@/actions/user/acknowledgeWarning';
import type { UserWarning } from '@prisma/client';

interface WarningBannerProps {
  warnings: UserWarning[];
  onAcknowledged: () => void;
}

export function WarningBanner({ warnings, onAcknowledged }: WarningBannerProps) {
  const [loading, setLoading] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  if (warnings.length === 0) return null;

  const warning = warnings[currentIndex];
  const isFirstWarning = warning.warningType === 'FIRST_WARNING';

  async function handleAcknowledge() {
    setLoading(true);
    try {
      const result = await acknowledgeWarning({ warningId: warning.id });
      if (result.success) {
        if (currentIndex < warnings.length - 1) {
          setCurrentIndex((prev) => prev + 1);
        } else {
          onAcknowledged();
        }
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error('Failed to acknowledge warning');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
      role="alertdialog"
      aria-labelledby="warning-title"
      aria-describedby="warning-message"
    >
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="text-center">
          <CardTitle
            id="warning-title"
            className={isFirstWarning ? 'text-yellow-600' : 'text-destructive'}
          >
            {isFirstWarning ? 'Warning' : 'Final Warning'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div id="warning-message" className="rounded-md bg-muted p-3">
            <p className="text-sm">{warning.message}</p>
          </div>
          <p className="text-xs text-muted-foreground text-center">
            Issued on{' '}
            {new Date(warning.createdAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
          {!isFirstWarning && (
            <p className="text-xs text-destructive text-center font-medium">
              Further violations may result in account suspension.
            </p>
          )}
          {warnings.length > 1 && (
            <p className="text-xs text-muted-foreground text-center">
              Warning {currentIndex + 1} of {warnings.length}
            </p>
          )}
          <Button
            className="w-full min-h-[44px]"
            onClick={handleAcknowledge}
            disabled={loading}
          >
            {loading ? 'Acknowledging...' : 'I Understand'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
