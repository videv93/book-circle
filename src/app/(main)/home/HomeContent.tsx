'use client';

import { useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { DailyGoalSetter, DailyGoalProgress } from '@/components/features/goals';
import { StreakRing, FreezeCountBadge, StreakFreezePrompt } from '@/components/features/streaks';
import {
  ContinueReadingSection,
  ReadingNowSection,
  DiscoverSection,
} from '@/components/features/home';
import type { CurrentlyReadingBook, ActiveBook, PopularBook } from '@/actions/home';

interface HomeContentProps {
  userName: string | null;
  userEmail: string;
  userImage: string | null;
  dailyGoalMinutes: number | null;
  minutesRead: number;
  currentStreak: number;
  freezeUsedToday: boolean;
  isStreakAtRisk?: boolean;
  freezesAvailable?: number;
  currentlyReading: CurrentlyReadingBook[];
  hasMoreCurrentlyReading: boolean;
  activeBooks: ActiveBook[];
  popularBooks: PopularBook[];
}

export function HomeContent({
  userName,
  userEmail,
  userImage,
  dailyGoalMinutes,
  minutesRead,
  currentStreak,
  freezeUsedToday,
  isStreakAtRisk = false,
  freezesAvailable = 0,
  currentlyReading,
  hasMoreCurrentlyReading,
  activeBooks,
  popularBooks,
}: HomeContentProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get('accessDenied') === 'true') {
      toast.error('Access denied');
      // Clean up the URL param
      window.history.replaceState({}, '', '/home');
    }
  }, [searchParams]);

  const handleGoalSet = () => {
    router.refresh();
  };

  return (
    <div className="flex flex-col gap-6 p-4 pt-8">
      {/* Welcome + Streak Section */}
      <div className="flex flex-col items-center gap-6">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-foreground">
            Welcome{userName ? `, ${userName}` : ''}!
          </h2>
          <div className="mt-4 flex flex-col items-center gap-2">
            {userImage && (
              <Image
                src={userImage}
                alt={userName || 'User avatar'}
                width={64}
                height={64}
                className="h-16 w-16 rounded-full"
              />
            )}
            <p className="text-sm text-muted-foreground">{userEmail}</p>
          </div>
        </div>

        {/* Daily Goal Section */}
        <div className="w-full max-w-md" data-testid="goal-section">
          {dailyGoalMinutes === null ? (
            <DailyGoalSetter onGoalSet={handleGoalSet} />
          ) : (
            <div className="flex flex-col items-center gap-4">
              <Link
                href="/profile#streak-history"
                className="cursor-pointer rounded-full min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label="View streak history"
                data-testid="streak-ring-link"
              >
                <StreakRing
                  currentStreak={currentStreak}
                  minutesRead={minutesRead}
                  goalMinutes={dailyGoalMinutes}
                  freezeUsedToday={freezeUsedToday}
                  size="lg"
                />
              </Link>
              {(currentStreak > 0 || freezesAvailable > 0) && (
                <FreezeCountBadge count={freezesAvailable} />
              )}
              <DailyGoalProgress minutesRead={minutesRead} goalMinutes={dailyGoalMinutes} />
              {isStreakAtRisk && currentStreak > 0 && freezesAvailable > 0 && (
                <StreakFreezePrompt
                  freezesAvailable={freezesAvailable}
                  isAtRisk={isStreakAtRisk}
                  currentStreak={currentStreak}
                  onFreezeUsed={() => router.refresh()}
                  onDecline={() => router.refresh()}
                />
              )}
              {isStreakAtRisk && currentStreak > 0 && freezesAvailable <= 0 && (
                <p
                  className="text-sm text-muted-foreground text-center"
                  data-testid="streak-at-risk-message"
                >
                  Your book is waiting — read today to keep your streak going!
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Continue Reading Section */}
      <ContinueReadingSection
        books={currentlyReading}
        hasMore={hasMoreCurrentlyReading}
      />

      {/* Reading Now Section (hidden if empty) */}
      <ReadingNowSection books={activeBooks} />

      {/* Discover Section (hidden if < 3 books) */}
      <DiscoverSection books={popularBooks} />
    </div>
  );
}
