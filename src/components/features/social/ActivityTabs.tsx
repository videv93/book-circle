'use client';

import { useSearchParams } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ActivityFeed } from './ActivityFeed';
import { KudosList } from './KudosList';
import type { ActivityItem } from '@/actions/social/getActivityFeed';
import type { KudosWithDetails } from '@/actions/social';

interface ActivityTabsProps {
  initialActivities: ActivityItem[];
  initialTotal: number;
  hasFollows: boolean;
  initialKudos: KudosWithDetails[];
  initialKudosTotal: number;
}

export function ActivityTabs({
  initialActivities,
  initialTotal,
  hasFollows,
  initialKudos,
  initialKudosTotal,
}: ActivityTabsProps) {
  const searchParams = useSearchParams();
  const tab = searchParams.get('tab');
  const defaultTab = tab === 'kudos' ? 'kudos' : 'following';

  return (
    <Tabs defaultValue={defaultTab}>
      <TabsList className="w-full">
        <TabsTrigger value="following" className="flex-1">
          Following
        </TabsTrigger>
        <TabsTrigger value="kudos" className="flex-1">
          Kudos
        </TabsTrigger>
      </TabsList>
      <TabsContent value="following" className="py-4">
        <ActivityFeed
          initialActivities={initialActivities}
          initialTotal={initialTotal}
          hasFollows={hasFollows}
        />
      </TabsContent>
      <TabsContent value="kudos" className="py-4">
        <KudosList initialKudos={initialKudos} initialTotal={initialKudosTotal} />
      </TabsContent>
    </Tabs>
  );
}
