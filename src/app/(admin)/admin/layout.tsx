import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { isAdmin } from '@/lib/admin';
import { AdminShell } from '@/components/layout/AdminShell';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headersList = await headers();
  const session = await auth.api.getSession({ headers: headersList });

  if (!session?.user?.id) {
    redirect('/login');
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, role: true },
  });

  if (!user || !isAdmin(user)) {
    console.warn(`[Admin Access Denied] userId=${session.user.id} attempted to access admin routes`);
    redirect('/home?accessDenied=true');
  }

  return <AdminShell>{children}</AdminShell>;
}
