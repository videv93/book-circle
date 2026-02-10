'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { signOut } from '@/lib/auth-client';

interface SuspendedContentProps {
  suspendedUntil: string;
  reason?: string;
}

export function SuspendedContent({
  suspendedUntil,
  reason,
}: SuspendedContentProps) {
  const isPermanent = new Date(suspendedUntil).getFullYear() >= 9999;
  const formattedDate = isPermanent
    ? 'permanently'
    : `until ${new Date(suspendedUntil).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })}`;

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-destructive">Account Suspended</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p className="text-muted-foreground">
            Your account is suspended {formattedDate}.
          </p>
          {reason && (
            <div className="rounded-md bg-muted p-3">
              <p className="text-sm font-medium">Reason:</p>
              <p className="text-sm text-muted-foreground">{reason}</p>
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            If you believe this is a mistake, please contact support.
          </p>
          <Button
            variant="outline"
            className="w-full min-h-[44px]"
            onClick={() => signOut({ fetchOptions: { onSuccess: () => window.location.assign('/login') } })}
          >
            Sign Out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
