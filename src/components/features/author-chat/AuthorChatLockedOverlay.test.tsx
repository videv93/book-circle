import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AuthorChatLockedOverlay } from './AuthorChatLockedOverlay';

describe('AuthorChatLockedOverlay', () => {
  it('renders premium feature headline with author name', () => {
    render(<AuthorChatLockedOverlay authorName="Jane Author" />);

    expect(
      screen.getByText('Chat with Jane Author — Premium feature'),
    ).toBeInTheDocument();
  });

  it('falls back to "the author" when no name provided', () => {
    render(<AuthorChatLockedOverlay />);

    expect(
      screen.getByText('Chat with the author — Premium feature'),
    ).toBeInTheDocument();
  });

  it('renders upgrade CTA linking to /upgrade', () => {
    render(<AuthorChatLockedOverlay />);

    const link = screen.getByRole('link', { name: 'Upgrade to Premium' });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/upgrade');
  });

  it('has minimum 44px touch target on CTA button', () => {
    render(<AuthorChatLockedOverlay />);

    const link = screen.getByRole('link', { name: 'Upgrade to Premium' });
    expect(link.className).toContain('min-h-[44px]');
    expect(link.className).toContain('min-w-[44px]');
  });

  it('provides screen reader description of the limitation', () => {
    render(<AuthorChatLockedOverlay authorName="Jane Author" />);

    const srText = screen.getByRole('status');
    expect(srText).toHaveTextContent(
      'Author chat is a premium feature. Jane Author is currently in this reading room. Upgrade to premium to chat with them.',
    );
  });

  it('hides decorative blurred lines from screen readers', () => {
    const { container } = render(<AuthorChatLockedOverlay />);

    const blurredSection = container.querySelector('[aria-hidden="true"]');
    expect(blurredSection).toBeInTheDocument();
  });

  it('renders the locked overlay test id', () => {
    render(<AuthorChatLockedOverlay />);

    expect(
      screen.getByTestId('author-chat-locked-overlay'),
    ).toBeInTheDocument();
  });
});
