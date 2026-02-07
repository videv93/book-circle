import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ActivityFeed } from './ActivityFeed';
import type { ActivityItem } from '@/actions/social/getActivityFeed';

// Mock dependencies
vi.mock('next/link', () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

vi.mock('@/actions/social/getActivityFeed', () => ({
  getActivityFeed: vi.fn(),
}));

vi.mock('./ActivityFeedItem', () => ({
  ActivityFeedItem: ({ activity }: { activity: ActivityItem }) => (
    <div data-testid="activity-item" data-activity-id={activity.id}>
      {activity.type === 'session' ? 'Session' : 'Finished'} - {activity.bookTitle}
    </div>
  ),
}));

vi.mock('@/components/ui/skeleton', () => ({
  Skeleton: ({ className }: { className?: string }) => (
    <div data-testid="skeleton" className={className} />
  ),
}));

import { getActivityFeed } from '@/actions/social/getActivityFeed';
import { toast } from 'sonner';

const mockGetActivityFeed = getActivityFeed as ReturnType<typeof vi.fn>;

describe('ActivityFeed', () => {
  const mockActivities: ActivityItem[] = [
    {
      type: 'session',
      id: 'session-1',
      userId: 'user-1',
      userName: 'John Doe',
      userAvatar: 'avatar.jpg',
      bookId: 'book-1',
      bookTitle: 'Book One',
      bookCover: 'cover1.jpg',
      duration: 1800,
      timestamp: new Date(),
      kudosCount: 0,
      userGaveKudos: false,
    },
    {
      type: 'finished',
      id: 'finished-1',
      userId: 'user-2',
      userName: 'Jane Smith',
      userAvatar: 'avatar2.jpg',
      bookId: 'book-2',
      bookTitle: 'Book Two',
      bookCover: 'cover2.jpg',
      bookAuthor: 'Author Two',
      timestamp: new Date(),
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders initial activities list', () => {
    render(
      <ActivityFeed
        initialActivities={mockActivities}
        initialTotal={2}
        hasFollows={true}
      />
    );

    const items = screen.getAllByTestId('activity-item');
    expect(items).toHaveLength(2);
    expect(screen.getByText(/Book One/)).toBeInTheDocument();
    expect(screen.getByText(/Book Two/)).toBeInTheDocument();
  });

  it('shows empty state when no activities and no follows', () => {
    render(
      <ActivityFeed initialActivities={[]} initialTotal={0} hasFollows={false} />
    );

    expect(screen.getByText(/Follow readers to see their activity/i)).toBeInTheDocument();
    expect(screen.getByText(/Find Readers/i)).toBeInTheDocument();
  });

  it('shows "No recent activity" when follows exist but no activity', () => {
    render(
      <ActivityFeed initialActivities={[]} initialTotal={0} hasFollows={true} />
    );

    expect(
      screen.getByText(/No recent activity from people you follow/i)
    ).toBeInTheDocument();
  });

  it('Load More button appears when activities.length < total', () => {
    render(
      <ActivityFeed
        initialActivities={mockActivities}
        initialTotal={10}
        hasFollows={true}
      />
    );

    expect(screen.getByText('Load More')).toBeInTheDocument();
  });

  it('Load More button hidden when all activities loaded', () => {
    render(
      <ActivityFeed
        initialActivities={mockActivities}
        initialTotal={2}
        hasFollows={true}
      />
    );

    expect(screen.queryByText('Load More')).not.toBeInTheDocument();
  });

  it('Load More fetches next batch and appends to list', async () => {
    const additionalActivities: ActivityItem[] = [
      {
        type: 'session',
        id: 'session-2',
        userId: 'user-3',
        userName: 'User Three',
        userAvatar: null,
        bookId: 'book-3',
        bookTitle: 'Book Three',
        bookCover: null,
        duration: 900,
        timestamp: new Date(),
        kudosCount: 0,
        userGaveKudos: false,
      },
    ];

    mockGetActivityFeed.mockResolvedValue({
      success: true,
      data: {
        activities: additionalActivities,
        total: 3,
        hasFollows: true,
      },
    });

    render(
      <ActivityFeed
        initialActivities={mockActivities}
        initialTotal={3}
        hasFollows={true}
      />
    );

    const loadMoreButton = screen.getByText('Load More');
    fireEvent.click(loadMoreButton);

    await waitFor(() => {
      const items = screen.getAllByTestId('activity-item');
      expect(items).toHaveLength(3);
    });

    expect(mockGetActivityFeed).toHaveBeenCalledWith({
      limit: 20,
      offset: 2,
    });
  });

  it('Loading state shown while fetching more items', async () => {
    mockGetActivityFeed.mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                success: true,
                data: { activities: [], total: 2, hasFollows: true },
              }),
            100
          )
        )
    );

    render(
      <ActivityFeed
        initialActivities={mockActivities}
        initialTotal={10}
        hasFollows={true}
      />
    );

    const loadMoreButton = screen.getByText('Load More');
    fireEvent.click(loadMoreButton);

    // Should show skeleton loaders
    await waitFor(() => {
      const skeletons = screen.getAllByTestId('skeleton');
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  it('Error handling shows toast on load more failure', async () => {
    mockGetActivityFeed.mockResolvedValue({
      success: false,
      error: 'Failed to load activities',
    });

    render(
      <ActivityFeed
        initialActivities={mockActivities}
        initialTotal={10}
        hasFollows={true}
      />
    );

    const loadMoreButton = screen.getByText('Load More');
    fireEvent.click(loadMoreButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to load activities');
    });
  });

  it('Find Readers button links to user search', () => {
    render(
      <ActivityFeed initialActivities={[]} initialTotal={0} hasFollows={false} />
    );

    const link = screen.getByText('Find Readers').closest('a');
    expect(link).toHaveAttribute('href', '/search?tab=users');
  });

  it('renders activities in correct container with spacing', () => {
    const { container } = render(
      <ActivityFeed
        initialActivities={mockActivities}
        initialTotal={2}
        hasFollows={true}
      />
    );

    const activityList = container.querySelector('.space-y-3');
    expect(activityList).toBeInTheDocument();
  });
});
