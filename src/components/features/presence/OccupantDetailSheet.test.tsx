import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { OccupantDetailSheet } from './OccupantDetailSheet';
import type { PresenceMember } from '@/stores/usePresenceStore';

// Mock next/link
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

// Mock radix-ui Dialog (used by Sheet internally)
vi.mock('radix-ui', () => {
  const Root = ({
    children,
    open,
  }: {
    children: React.ReactNode;
    open?: boolean;
  }) => (open ? <div data-testid="sheet-root">{children}</div> : null);

  const Portal = ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  );

  const Overlay = (props: Record<string, unknown>) => (
    <div data-testid="sheet-overlay" {...props} />
  );

  const Content = ({
    children,
    ...props
  }: {
    children: React.ReactNode;
  }) => (
    <div data-testid="sheet-content" {...props}>
      {children}
    </div>
  );

  const Close = ({
    children,
    ...props
  }: {
    children: React.ReactNode;
  }) => <button {...props}>{children}</button>;

  const Title = ({
    children,
    ...props
  }: {
    children: React.ReactNode;
  }) => <h2 {...props}>{children}</h2>;

  const Description = ({
    children,
    ...props
  }: {
    children: React.ReactNode;
  }) => <p {...props}>{children}</p>;

  const Trigger = ({
    children,
    ...props
  }: {
    children: React.ReactNode;
  }) => <button {...props}>{children}</button>;

  return {
    Dialog: {
      Root,
      Portal,
      Overlay,
      Content,
      Close,
      Title,
      Description,
      Trigger,
    },
  };
});

function createMembers(count: number): Map<string, PresenceMember> {
  const map = new Map<string, PresenceMember>();
  for (let i = 0; i < count; i++) {
    map.set(`user-${i}`, {
      id: `user-${i}`,
      name: `Reader ${i}`,
      avatarUrl:
        i % 2 === 0 ? `https://example.com/avatar-${i}.jpg` : null,
    });
  }
  return map;
}

describe('OccupantDetailSheet', () => {
  it('does not render content when closed', () => {
    const members = createMembers(3);
    render(
      <OccupantDetailSheet
        open={false}
        onOpenChange={vi.fn()}
        members={members}
      />
    );
    expect(screen.queryByTestId('sheet-root')).toBeNull();
  });

  it('renders member list when open', () => {
    const members = createMembers(3);
    render(
      <OccupantDetailSheet
        open={true}
        onOpenChange={vi.fn()}
        members={members}
      />
    );
    expect(screen.getByText('3 readers in this room')).toBeInTheDocument();
    expect(screen.getByText('Reader 0')).toBeInTheDocument();
    expect(screen.getByText('Reader 1')).toBeInTheDocument();
    expect(screen.getByText('Reader 2')).toBeInTheDocument();
  });

  it('shows singular title for 1 reader', () => {
    const members = createMembers(1);
    render(
      <OccupantDetailSheet
        open={true}
        onOpenChange={vi.fn()}
        members={members}
      />
    );
    expect(screen.getByText('1 reader in this room')).toBeInTheDocument();
  });

  it('renders avatar images for members with avatarUrl', () => {
    const members = new Map<string, PresenceMember>();
    members.set('u1', {
      id: 'u1',
      name: 'Alice',
      avatarUrl: 'https://example.com/alice.jpg',
    });
    render(
      <OccupantDetailSheet
        open={true}
        onOpenChange={vi.fn()}
        members={members}
      />
    );
    const img = screen.getByAltText('Alice');
    expect(img).toHaveAttribute('src', 'https://example.com/alice.jpg');
  });

  it('renders initials fallback for members without avatarUrl', () => {
    const members = new Map<string, PresenceMember>();
    members.set('u1', { id: 'u1', name: 'Bob', avatarUrl: null });
    render(
      <OccupantDetailSheet
        open={true}
        onOpenChange={vi.fn()}
        members={members}
      />
    );
    expect(screen.getByText('B')).toBeInTheDocument();
  });

  it('links each member to their profile page', () => {
    const members = createMembers(2);
    render(
      <OccupantDetailSheet
        open={true}
        onOpenChange={vi.fn()}
        members={members}
      />
    );
    const links = screen.getAllByRole('link');
    expect(links[0]).toHaveAttribute('href', '/profile/user-0');
    expect(links[1]).toHaveAttribute('href', '/profile/user-1');
  });

  it('has accessible aria-label on each member row', () => {
    const members = createMembers(2);
    render(
      <OccupantDetailSheet
        open={true}
        onOpenChange={vi.fn()}
        members={members}
      />
    );
    expect(
      screen.getByLabelText("Reader 0's profile")
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText("Reader 1's profile")
    ).toBeInTheDocument();
  });

  it('has minimum 44px touch target on member rows', () => {
    const members = createMembers(1);
    render(
      <OccupantDetailSheet
        open={true}
        onOpenChange={vi.fn()}
        members={members}
      />
    );
    const link = screen.getByRole('link');
    expect(link.className).toContain('min-h-[44px]');
  });

  it('calls onOpenChange(false) when clicking a member link', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    const members = createMembers(1);
    render(
      <OccupantDetailSheet
        open={true}
        onOpenChange={onOpenChange}
        members={members}
      />
    );
    await user.click(screen.getByRole('link'));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('renders occupant-list test id', () => {
    const members = createMembers(2);
    render(
      <OccupantDetailSheet
        open={true}
        onOpenChange={vi.fn()}
        members={members}
      />
    );
    expect(screen.getByTestId('occupant-list')).toBeInTheDocument();
  });

  // --- Author presence (Story 5.6) ---

  it('sorts author to top of the list', () => {
    const members = new Map<string, PresenceMember>();
    members.set('u1', { id: 'u1', name: 'Reader One', avatarUrl: null });
    members.set('u2', { id: 'u2', name: 'Author Jane', avatarUrl: null, isAuthor: true });
    render(
      <OccupantDetailSheet
        open={true}
        onOpenChange={vi.fn()}
        members={members}
      />
    );
    const links = screen.getAllByRole('link');
    expect(links[0]).toHaveAttribute('href', '/profile/u2');
    expect(links[1]).toHaveAttribute('href', '/profile/u1');
  });

  it('shows "Author" badge for verified author', () => {
    const members = new Map<string, PresenceMember>();
    members.set('u1', { id: 'u1', name: 'Author Jane', avatarUrl: null, isAuthor: true });
    render(
      <OccupantDetailSheet
        open={true}
        onOpenChange={vi.fn()}
        members={members}
      />
    );
    expect(screen.getByTestId('author-badge')).toHaveTextContent('Author');
  });

  it('displays author name with "Author •" prefix', () => {
    const members = new Map<string, PresenceMember>();
    members.set('u1', { id: 'u1', name: 'Jane Doe', avatarUrl: null, isAuthor: true });
    render(
      <OccupantDetailSheet
        open={true}
        onOpenChange={vi.fn()}
        members={members}
      />
    );
    expect(screen.getByText(/Author.*Jane Doe/)).toBeInTheDocument();
  });

  it('includes "including the author" in title when author present', () => {
    const members = new Map<string, PresenceMember>();
    members.set('u1', { id: 'u1', name: 'Reader', avatarUrl: null });
    members.set('u2', { id: 'u2', name: 'Author', avatarUrl: null, isAuthor: true });
    render(
      <OccupantDetailSheet
        open={true}
        onOpenChange={vi.fn()}
        members={members}
      />
    );
    expect(screen.getByText('2 readers in this room including the author')).toBeInTheDocument();
  });

  it('has author profile aria-label for author row', () => {
    const members = new Map<string, PresenceMember>();
    members.set('u1', { id: 'u1', name: 'Jane', avatarUrl: null, isAuthor: true });
    render(
      <OccupantDetailSheet
        open={true}
        onOpenChange={vi.fn()}
        members={members}
      />
    );
    expect(screen.getByLabelText("Author Jane's profile")).toBeInTheDocument();
  });
});
