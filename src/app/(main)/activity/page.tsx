'use client';

import { Bell } from 'lucide-react';

export default function ActivityPage() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 p-8 pt-16">
      <Bell className="h-16 w-16 text-muted-foreground" />
      <h2 className="text-xl font-semibold text-foreground">Activity Feed</h2>
      <p className="text-center text-muted-foreground">
        See what your friends are reading.
        <br />
        Coming soon in Epic 4.
      </p>
    </div>
  );
}
