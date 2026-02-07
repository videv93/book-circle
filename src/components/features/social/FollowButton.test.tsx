import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { FollowButton } from './FollowButton';

vi.mock('@/actions/social/followUser', () => ({
  followUser: vi.fn(),
}));

vi.mock('@/actions/social/unfollowUser', () => ({
  unfollowUser: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

import { followUser } from '@/actions/social/followUser';
import { unfollowUser } from '@/actions/social/unfollowUser';
import { toast } from 'sonner';

const mockFollowUser = followUser as unknown as ReturnType<typeof vi.fn>;
const mockUnfollowUser = unfollowUser as unknown as ReturnType<typeof vi.fn>;

describe('FollowButton', () => {
  const defaultProps = {
    targetUserId: 'user-2',
    targetUserName: 'Jane Doe',
    initialIsFollowing: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockFollowUser.mockResolvedValue({ success: true, data: { followId: 'f1' } });
    mockUnfollowUser.mockResolvedValue({ success: true, data: { unfollowed: true } });
  });

  it('renders "Follow" when not following', () => {
    render(<FollowButton {...defaultProps} />);
    expect(screen.getByText('Follow')).toBeInTheDocument();
  });

  it('renders "Following" when following', () => {
    render(<FollowButton {...defaultProps} initialIsFollowing={true} />);
    expect(screen.getByText('Following')).toBeInTheDocument();
  });

  it('optimistic UI: toggles immediately on follow click', async () => {
    render(<FollowButton {...defaultProps} />);
    const button = screen.getByRole('button');

    fireEvent.click(button);

    // Should optimistically show "Following"
    expect(screen.getByText('Following')).toBeInTheDocument();
  });

  it('shows confirmation dialog on unfollow', () => {
    render(<FollowButton {...defaultProps} initialIsFollowing={true} />);
    const button = screen.getByRole('button');

    fireEvent.click(button);

    expect(screen.getByText('Unfollow Jane Doe?')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('reverts state on follow server error', async () => {
    mockFollowUser.mockResolvedValue({ success: false, error: 'Failed to follow user' });

    render(<FollowButton {...defaultProps} />);
    const button = screen.getByRole('button');

    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText('Follow')).toBeInTheDocument();
    });

    expect(toast.error).toHaveBeenCalledWith('Failed to follow user');
  });

  it('calls onFollowChange callback', () => {
    const onFollowChange = vi.fn();
    render(<FollowButton {...defaultProps} onFollowChange={onFollowChange} />);
    const button = screen.getByRole('button');

    fireEvent.click(button);

    expect(onFollowChange).toHaveBeenCalledWith(true);
  });

  it('has correct aria-label and aria-pressed when not following', () => {
    render(<FollowButton {...defaultProps} />);
    const button = screen.getByRole('button');

    expect(button).toHaveAttribute('aria-label', 'Follow Jane Doe');
    expect(button).toHaveAttribute('aria-pressed', 'false');
  });

  it('has correct aria-label and aria-pressed when following', () => {
    render(<FollowButton {...defaultProps} initialIsFollowing={true} />);
    const button = screen.getByRole('button');

    expect(button).toHaveAttribute(
      'aria-label',
      'Following Jane Doe, tap to unfollow'
    );
    expect(button).toHaveAttribute('aria-pressed', 'true');
  });
});
