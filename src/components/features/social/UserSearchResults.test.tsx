import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { UserSearchResults } from './UserSearchResults';

vi.mock('@/actions/social/searchUsers', () => ({
  searchUsers: vi.fn(),
}));

vi.mock('@/actions/social/followUser', () => ({
  followUser: vi.fn().mockResolvedValue({ success: true, data: { followId: 'f1' } }),
}));

vi.mock('@/actions/social/unfollowUser', () => ({
  unfollowUser: vi.fn().mockResolvedValue({ success: true, data: { unfollowed: true } }),
}));

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

import { searchUsers } from '@/actions/social/searchUsers';
import { toast } from 'sonner';

const mockSearchUsers = searchUsers as unknown as ReturnType<typeof vi.fn>;

const mockUser = {
  id: 'user-2',
  name: 'Jane Doe',
  bio: 'Reader',
  avatarUrl: null,
  image: null,
  isFollowing: false,
  followerCount: 5,
  followingCount: 2,
};

describe('UserSearchResults', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders search input', () => {
    render(<UserSearchResults />);
    expect(screen.getByLabelText('Search users')).toBeInTheDocument();
  });

  it('shows initial prompt before searching', () => {
    render(<UserSearchResults />);
    expect(screen.getByText('Search for readers to follow')).toBeInTheDocument();
  });

  it('shows results after search', async () => {
    mockSearchUsers.mockResolvedValue({
      success: true,
      data: { users: [mockUser], total: 1 },
    });

    render(<UserSearchResults />);
    fireEvent.change(screen.getByLabelText('Search users'), {
      target: { value: 'Jane' },
    });

    await waitFor(() => {
      expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    });
  });

  it('shows empty state when no users match', async () => {
    mockSearchUsers.mockResolvedValue({
      success: true,
      data: { users: [], total: 0 },
    });

    render(<UserSearchResults />);
    fireEvent.change(screen.getByLabelText('Search users'), {
      target: { value: 'zzz' },
    });

    await waitFor(() => {
      expect(screen.getByText(/No users found for/)).toBeInTheDocument();
    });
  });

  it('shows error state and toast on search failure', async () => {
    mockSearchUsers.mockResolvedValue({
      success: false,
      error: 'Failed to search users',
    });

    render(<UserSearchResults />);
    fireEvent.change(screen.getByLabelText('Search users'), {
      target: { value: 'test' },
    });

    await waitFor(() => {
      expect(
        screen.getByText('Something went wrong. Please try again.')
      ).toBeInTheDocument();
    });

    expect(toast.error).toHaveBeenCalledWith('Failed to search users');
  });

  it('debounces search input by 300ms', async () => {
    vi.useFakeTimers();
    mockSearchUsers.mockResolvedValue({
      success: true,
      data: { users: [], total: 0 },
    });

    render(<UserSearchResults />);
    const input = screen.getByLabelText('Search users');

    fireEvent.change(input, { target: { value: 'J' } });
    fireEvent.change(input, { target: { value: 'Ja' } });
    fireEvent.change(input, { target: { value: 'Jan' } });

    expect(mockSearchUsers).not.toHaveBeenCalled();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });

    expect(mockSearchUsers).toHaveBeenCalledTimes(1);
    expect(mockSearchUsers).toHaveBeenCalledWith(
      expect.objectContaining({ query: 'Jan' })
    );

    vi.useRealTimers();
  });

  it('shows Load More button when more results exist', async () => {
    const users = Array.from({ length: 20 }, (_, i) => ({
      ...mockUser,
      id: `user-${i}`,
      name: `User ${i}`,
    }));

    mockSearchUsers.mockResolvedValue({
      success: true,
      data: { users, total: 30 },
    });

    render(<UserSearchResults />);
    fireEvent.change(screen.getByLabelText('Search users'), {
      target: { value: 'User' },
    });

    await waitFor(() => {
      expect(screen.getByText('Load More')).toBeInTheDocument();
    });
  });

  it('clears results when input is emptied', async () => {
    mockSearchUsers.mockResolvedValue({
      success: true,
      data: { users: [mockUser], total: 1 },
    });

    render(<UserSearchResults />);
    const input = screen.getByLabelText('Search users');

    fireEvent.change(input, { target: { value: 'Jane' } });

    await waitFor(() => {
      expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    });

    fireEvent.change(input, { target: { value: '' } });

    await waitFor(() => {
      expect(screen.getByText('Search for readers to follow')).toBeInTheDocument();
    });
  });
});
