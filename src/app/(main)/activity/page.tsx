import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { getActivityFeed } from '@/actions/social/getActivityFeed';
import { getKudosReceived } from '@/actions/social';
import { ActivityTabs } from '@/components/features/social';
import { ActivityPageEffect } from '@/components/features/social/ActivityPageEffect';
import { PageHeader } from '@/components/layout/PageHeader';

export default async function ActivityPage() {
  const headersList = await headers();
  const session = await auth.api.getSession({ headers: headersList });

  if (!session?.user) {
    redirect('/login?callbackUrl=/activity');
  }

  const result = await getActivityFeed({ limit: 20, offset: 0 });

  const kudosResult = await getKudosReceived({ limit: 20, offset: 0 });
  const kudosData = kudosResult.success
    ? kudosResult.data
    : { kudos: [], total: 0, hasMore: false };

  if (!result.success) {
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
      <ActivityTabs
        initialActivities={activities}
        initialTotal={total}
        hasFollows={hasFollows}
        initialKudos={kudosData.kudos}
        initialKudosTotal={kudosData.total}
      />
    </main>
  );
}
