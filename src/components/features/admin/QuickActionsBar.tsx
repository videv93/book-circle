'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageSquare, KeyRound } from 'lucide-react';
import { toast } from 'sonner';

interface QuickActionsBarProps {
  userId: string;
  userName: string | null;
}

export function QuickActionsBar({ userId, userName }: QuickActionsBarProps) {
  const displayName = userName ?? 'this user';

  function handleSendMessage() {
    toast.info(`Messaging system not yet available. User: ${displayName}`);
  }

  function handleResetPassword() {
    toast.info('Password reset is not applicable — this app uses OAuth-only authentication.');
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-3">
          <Button
            variant="outline"
            size="sm"
            className="min-h-[44px]"
            onClick={handleSendMessage}
          >
            <MessageSquare className="mr-2 h-4 w-4" />
            Send Message
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="min-h-[44px]"
            onClick={handleResetPassword}
            disabled
          >
            <KeyRound className="mr-2 h-4 w-4" />
            Reset Password
          </Button>
          <p className="w-full text-xs text-muted-foreground mt-1">
            Warn and Suspend actions are available in the Moderation History section below.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
