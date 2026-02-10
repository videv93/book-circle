'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/lib/auth-client';
import { toast } from 'sonner';
import { checkSuspensionStatus } from '@/actions/user/checkSuspensionStatus';
import { useUnacknowledgedWarnings } from '@/hooks/useUnacknowledgedWarnings';
import { WarningBanner } from '@/components/features/admin/WarningBanner';

export function SuspensionGuard({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const router = useRouter();
  const { warnings, loading: warningsLoading, refresh: refreshWarnings } = useUnacknowledgedWarnings();

  useEffect(() => {
    if (!session?.user?.id) return;

    checkSuspensionStatus().then((result) => {
      if (result.success) {
        if (result.data.suspended) {
          router.replace('/suspended');
        } else if (result.data.justExpired) {
          toast(
            'Your suspension has ended. Please review our community guidelines.',
            { duration: 8000 }
          );
        }
      }
    });
  }, [session?.user?.id, router]);

  if (!warningsLoading && warnings.length > 0) {
    return (
      <>
        <WarningBanner warnings={warnings} onAcknowledged={refreshWarnings} />
        {children}
      </>
    );
  }

  return <>{children}</>;
}
