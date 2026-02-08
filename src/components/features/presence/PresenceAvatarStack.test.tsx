import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PresenceAvatarStack } from './PresenceAvatarStack';
import type { PresenceMember } from '@/stores/usePresenceStore';

// Mock framer-motion: render children but expose key props for testing
const mockUseReducedMotion = vi.fn(() => false);
vi.mock('framer-motion', () => ({
  AnimatePresence: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="animate-presence">{children}</div>
  ),
  motion: {
    div: ({
      children,
      animate,
      transition,
      layout,
      initial,
      exit,
      ...rest
    }: Record<string, unknown> & { children?: React.ReactNode }) => (
      <div
        data-motion-animate={animate ? JSON.stringify(animate) : undefined}
        data-motion-layout={layout ? 'true' : undefined}
        {...rest}
      >
        {children}
      </div>
    ),
  },
  useReducedMotion: () => mockUseReducedMotion(),
}));

function createMembers(count: number): Map<string, PresenceMember> {
  const map = new Map<string, PresenceMember>();
  for (let i = 0; i < count; i++) {
    map.set(`user-${i}`, {
      id: `user-${i}`,
      name: `Reader ${i}`,
      avatarUrl: i % 2 === 0 ? `https://example.com/avatar-${i}.jpg` : null,
    });
  }
  return map;
}

describe('PresenceAvatarStack', () => {
  beforeEach(() => {
    mockUseReducedMotion.mockReturnValue(false);
  });

  it('renders nothing for empty members', () => {
    const { container } = render(
      <PresenceAvatarStack members={new Map()} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders single member with correct aria-label (singular)', () => {
    const members = createMembers(1);
    render(<PresenceAvatarStack members={members} />);
    // When no onClick, role is "group"
    const group = screen.getByRole('group');
    expect(group).toHaveAttribute('aria-label', '1 reader in room');
  });

  it('renders multiple members with correct aria-label (plural)', () => {
    const members = createMembers(3);
    render(<PresenceAvatarStack members={members} />);
    const group = screen.getByRole('group');
    expect(group).toHaveAttribute('aria-label', '3 readers in room');
  });

  it('renders avatar images when avatarUrl is provided', () => {
    const members = new Map<string, PresenceMember>();
    members.set('u1', {
      id: 'u1',
      name: 'Alice',
      avatarUrl: 'https://example.com/alice.jpg',
    });
    render(<PresenceAvatarStack members={members} />);
    const img = screen.getByAltText('Alice');
    expect(img).toHaveAttribute('src', 'https://example.com/alice.jpg');
  });

  it('renders initials fallback when avatarUrl is null', () => {
    const members = new Map<string, PresenceMember>();
    members.set('u1', { id: 'u1', name: 'Bob', avatarUrl: null });
    render(<PresenceAvatarStack members={members} />);
    expect(screen.getByText('B')).toBeInTheDocument();
  });

  it('limits visible avatars to maxVisible (default 5)', () => {
    const members = createMembers(7);
    render(<PresenceAvatarStack members={members} />);
    const overflow = screen.getByTestId('overflow-indicator');
    expect(overflow).toHaveTextContent('+2');
  });

  it('does not show overflow when members <= maxVisible', () => {
    const members = createMembers(5);
    render(<PresenceAvatarStack members={members} />);
    expect(screen.queryByTestId('overflow-indicator')).toBeNull();
  });

  it('respects custom maxVisible', () => {
    const members = createMembers(5);
    render(<PresenceAvatarStack members={members} maxVisible={3} />);
    const overflow = screen.getByTestId('overflow-indicator');
    expect(overflow).toHaveTextContent('+2');
  });

  it('applies custom size to avatars', () => {
    const members = new Map<string, PresenceMember>();
    members.set('u1', { id: 'u1', name: 'Alice', avatarUrl: null });
    const { container } = render(
      <PresenceAvatarStack members={members} size={40} />
    );
    const avatar = container.querySelector('[title="Alice"]');
    expect(avatar).toHaveStyle({ width: '40px', height: '40px' });
  });

  it('applies overlapping margins to non-first avatars', () => {
    const members = createMembers(3);
    const { container } = render(<PresenceAvatarStack members={members} />);
    const avatars = container.querySelectorAll('[title]');
    expect(avatars[0]).toHaveStyle({ marginLeft: '0px' });
    expect(avatars[1]).toHaveStyle({ marginLeft: '-8px' });
    expect(avatars[2]).toHaveStyle({ marginLeft: '-8px' });
  });

  // --- AnimatePresence wrapper ---

  it('wraps avatars in AnimatePresence', () => {
    const members = createMembers(2);
    render(<PresenceAvatarStack members={members} />);
    expect(screen.getByTestId('animate-presence')).toBeInTheDocument();
  });

  // --- Click behavior ---

  it('has role="group" when no onClick provided', () => {
    const members = createMembers(2);
    render(<PresenceAvatarStack members={members} />);
    expect(screen.getByRole('group')).toBeInTheDocument();
  });

  it('has role="button" when onClick provided', () => {
    const members = createMembers(2);
    const onClick = vi.fn();
    render(<PresenceAvatarStack members={members} onClick={onClick} />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('fires onClick when clicked', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    const members = createMembers(2);
    render(<PresenceAvatarStack members={members} onClick={onClick} />);
    await user.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('fires onClick on Enter key', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    const members = createMembers(2);
    render(<PresenceAvatarStack members={members} onClick={onClick} />);
    screen.getByRole('button').focus();
    await user.keyboard('{Enter}');
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('fires onClick on Space key', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    const members = createMembers(2);
    render(<PresenceAvatarStack members={members} onClick={onClick} />);
    screen.getByRole('button').focus();
    await user.keyboard(' ');
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('sets aria-expanded when provided', () => {
    const members = createMembers(2);
    const onClick = vi.fn();
    render(
      <PresenceAvatarStack
        members={members}
        onClick={onClick}
        aria-expanded={true}
      />
    );
    expect(screen.getByRole('button')).toHaveAttribute(
      'aria-expanded',
      'true'
    );
  });

  it('has tabIndex=0 when clickable', () => {
    const members = createMembers(2);
    const onClick = vi.fn();
    render(<PresenceAvatarStack members={members} onClick={onClick} />);
    expect(screen.getByRole('button')).toHaveAttribute('tabindex', '0');
  });

  it('does not have tabIndex when not clickable', () => {
    const members = createMembers(2);
    render(<PresenceAvatarStack members={members} />);
    expect(screen.getByRole('group')).not.toHaveAttribute('tabindex');
  });

  // --- Reduced motion ---

  it('disables pulse animation when reduced motion is preferred', () => {
    mockUseReducedMotion.mockReturnValue(true);
    const members = new Map<string, PresenceMember>();
    members.set('u1', { id: 'u1', name: 'Alice', avatarUrl: null });
    const { container } = render(
      <PresenceAvatarStack members={members} />
    );
    // Inner motion.div should have empty animate
    const innerDiv = container.querySelector('[title="Alice"]');
    expect(innerDiv).toHaveAttribute('data-motion-animate', '{}');
  });

  it('enables pulse animation when reduced motion is not preferred', () => {
    mockUseReducedMotion.mockReturnValue(false);
    const members = new Map<string, PresenceMember>();
    members.set('u1', { id: 'u1', name: 'Alice', avatarUrl: null });
    const { container } = render(
      <PresenceAvatarStack members={members} />
    );
    const innerDiv = container.querySelector('[title="Alice"]');
    const animateAttr = innerDiv?.getAttribute('data-motion-animate');
    expect(animateAttr).toContain('scale');
  });
});
