import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { checkSuspension } from '@/lib/checkSuspension';
import { SuspendedContent } from '@/components/features/admin/SuspendedContent';

export default async function SuspendedPage() {
  const headersList = await headers();
  const session = await auth.api.getSession({ headers: headersList });

  if (!session?.user?.id) {
    redirect('/login');
  }

  const status = await checkSuspension(session.user.id);

  if (!status.suspended) {
    redirect('/home');
  }

  return (
    <SuspendedContent
      suspendedUntil={status.suspendedUntil!.toISOString()}
      reason={status.reason}
    />
  );
}
