import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { getActivityFeed } from '@/actions/social/getActivityFeed';
import { ActivityFeed } from '@/components/features/social';
import { ActivityPageEffect } from '@/components/features/social/ActivityPageEffect';
import { PageHeader } from '@/components/layout/PageHeader';

export default async function ActivityPage() {
  // Authenticate user
  const headersList = await headers();
  const session = await auth.api.getSession({ headers: headersList });

  if (!session?.user) {
    redirect('/login?callbackUrl=/activity');
  }

  // Fetch initial activity feed data
  const result = await getActivityFeed({ limit: 20, offset: 0 });

  if (!result.success) {
    // Handle error - show empty state
    return (
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <PageHeader title="Activity" />
        <div className="mt-6">
          <p className="text-center text-muted-foreground">
            Unable to load activity feed. Please try again later.
          </p>
        </div>
      </main>
    );
  }

  const { activities, total, hasFollows } = result.data;

  return (
    <main className="container mx-auto px-4 py-8 max-w-2xl">
      <ActivityPageEffect />
      <ActivityFeed
        initialActivities={activities}
        initialTotal={total}
        hasFollows={hasFollows}
      />
    </main>
  );
}
