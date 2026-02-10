'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { liftSuspension } from '@/actions/admin/liftSuspension';
import { WarnUserDialog } from '@/components/features/admin/WarnUserDialog';
import { SuspendUserDialog } from '@/components/features/admin/SuspendUserDialog';
import type { UserModerationHistoryResult } from '@/actions/admin/getUserModerationHistory';

interface UserModerationDetailProps {
  data: UserModerationHistoryResult;
}

export function UserModerationDetail({ data }: UserModerationDetailProps) {
  const router = useRouter();
  const [warnDialogOpen, setWarnDialogOpen] = useState(false);
  const [suspendDialogOpen, setSuspendDialogOpen] = useState(false);
  const [liftingLoading, setLiftingLoading] = useState(false);

  const { user, warnings, suspensions, contentRemovals, flagCount } = data;
  const isSuspended =
    user.suspendedUntil && new Date(user.suspendedUntil) > new Date();

  async function handleLiftSuspension() {
    setLiftingLoading(true);
    try {
      const result = await liftSuspension({ userId: user.id });
      if (result.success) {
        toast.success('Suspension lifted');
        router.refresh();
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error('Failed to lift suspension');
    } finally {
      setLiftingLoading(false);
    }
  }

  function handleActionComplete() {
    router.refresh();
  }

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{user.name ?? 'Unknown User'}</h1>
          <p className="text-sm text-muted-foreground">{user.email}</p>
          <div className="flex gap-2 mt-1">
            <span className="text-xs bg-muted px-2 py-0.5 rounded">{user.role}</span>
            {isSuspended && (
              <span className="text-xs bg-destructive/10 text-destructive px-2 py-0.5 rounded">
                Suspended
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            className="min-h-[44px]"
            onClick={() => setWarnDialogOpen(true)}
          >
            Warn User
          </Button>
          {isSuspended ? (
            <Button
              variant="outline"
              size="sm"
              className="min-h-[44px]"
              onClick={handleLiftSuspension}
              disabled={liftingLoading}
            >
              {liftingLoading ? 'Lifting...' : 'Lift Suspension'}
            </Button>
          ) : (
            <Button
              variant="destructive"
              size="sm"
              className="min-h-[44px]"
              onClick={() => setSuspendDialogOpen(true)}
            >
              Suspend Account
            </Button>
          )}
        </div>
      </div>

      {/* Account Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Account Info</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Joined:</span>{' '}
            {new Date(user.createdAt).toLocaleDateString()}
          </div>
          <div>
            <span className="text-muted-foreground">Flags received:</span>{' '}
            {flagCount}
          </div>
          {isSuspended && user.suspendedUntil && (
            <>
              <div>
                <span className="text-muted-foreground">Suspended until:</span>{' '}
                {new Date(user.suspendedUntil).getFullYear() >= 9999
                  ? 'Permanently'
                  : new Date(user.suspendedUntil).toLocaleString()}
              </div>
              {user.suspensionReason && (
                <div>
                  <span className="text-muted-foreground">Reason:</span>{' '}
                  {user.suspensionReason}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Warnings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Warnings ({warnings.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {warnings.length === 0 ? (
            <p className="text-sm text-muted-foreground">No warnings issued.</p>
          ) : (
            <div className="space-y-3">
              {warnings.map((w) => (
                <div key={w.id} className="border rounded-md p-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded ${
                        w.warningType === 'FINAL_WARNING'
                          ? 'bg-destructive/10 text-destructive'
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                      }`}
                    >
                      {w.warningType === 'FIRST_WARNING'
                        ? 'First Warning'
                        : 'Final Warning'}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(w.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="mt-2">{w.message}</p>
                  <div className="mt-1 flex justify-between text-xs text-muted-foreground">
                    <span>By: {w.issuedBy.name ?? 'Unknown'}</span>
                    <span>
                      {w.acknowledgedAt ? 'Acknowledged' : 'Pending acknowledgment'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Suspensions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Suspensions ({suspensions.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {suspensions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No suspensions.</p>
          ) : (
            <div className="space-y-3">
              {suspensions.map((s) => (
                <div key={s.id} className="border rounded-md p-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium bg-destructive/10 text-destructive px-2 py-0.5 rounded">
                      {s.duration.replace('_', ' ')}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(s.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="mt-2">{s.reason}</p>
                  <div className="mt-1 text-xs text-muted-foreground">
                    <span>By: {s.issuedBy.name ?? 'Unknown'}</span>
                    {s.liftedAt && (
                      <span className="ml-3">
                        Lifted: {new Date(s.liftedAt).toLocaleDateString()}
                        {s.liftedBy ? ` by ${s.liftedBy.name}` : ''}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Content Removals */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Content Removals ({contentRemovals.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {contentRemovals.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No content removals.
            </p>
          ) : (
            <div className="space-y-3">
              {contentRemovals.map((r) => (
                <div key={r.id} className="border rounded-md p-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium bg-muted px-2 py-0.5 rounded">
                      {r.violationType}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(r.removedAt).toLocaleDateString()}
                    </span>
                  </div>
                  {r.adminNotes && (
                    <p className="mt-2 text-muted-foreground">{r.adminNotes}</p>
                  )}
                  {r.restoredAt && (
                    <p className="mt-1 text-xs text-green-600">
                      Restored: {new Date(r.restoredAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <WarnUserDialog
        open={warnDialogOpen}
        onOpenChange={setWarnDialogOpen}
        userId={user.id}
        userName={user.name ?? 'Unknown'}
        onSuccess={handleActionComplete}
      />

      <SuspendUserDialog
        open={suspendDialogOpen}
        onOpenChange={setSuspendDialogOpen}
        userId={user.id}
        userName={user.name ?? 'Unknown'}
        onSuccess={handleActionComplete}
      />
    </div>
  );
}
