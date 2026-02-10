import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { isAdmin } from '@/lib/admin';
import { getUserModerationHistory } from '@/actions/admin/getUserModerationHistory';
import { UserModerationDetail } from '@/components/features/admin/UserModerationDetail';

interface UserDetailPageProps {
  params: Promise<{ userId: string }>;
}

export default async function UserDetailPage({ params }: UserDetailPageProps) {
  const { userId } = await params;

  const headersList = await headers();
  const session = await auth.api.getSession({ headers: headersList });

  if (!session?.user?.id) {
    redirect('/login');
  }

  const adminUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, role: true },
  });

  if (!adminUser || !isAdmin(adminUser)) {
    redirect('/home');
  }

  const result = await getUserModerationHistory(userId);

  if (!result.success) {
    return (
      <div className="p-6">
        <p className="text-destructive">{result.error}</p>
      </div>
    );
  }

  return <UserModerationDetail data={result.data} />;
}
