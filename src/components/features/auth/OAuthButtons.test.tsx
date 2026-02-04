import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { OAuthButtons } from './OAuthButtons';
import { isApplePrivateRelayEmail } from './types';

// Mock the auth client
vi.mock('@/lib/auth-client', () => ({
  signIn: {
    social: vi.fn(),
  },
}));

import { signIn } from '@/lib/auth-client';

describe('OAuthButtons', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Google Sign In', () => {
    it('renders the Google sign-in button', () => {
      render(<OAuthButtons />);

      expect(screen.getByRole('button', { name: /continue with google/i })).toBeInTheDocument();
    });

    it('shows loading state when signing in with Google', async () => {
      vi.mocked(signIn.social).mockImplementation(() => new Promise(() => {}));

      render(<OAuthButtons />);

      const button = screen.getByRole('button', { name: /continue with google/i });
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText(/signing in/i)).toBeInTheDocument();
      });
      expect(button).toBeDisabled();
    });

    it('calls signIn.social with google provider when clicked', async () => {
      vi.mocked(signIn.social).mockResolvedValueOnce(undefined);

      render(<OAuthButtons />);

      const button = screen.getByRole('button', { name: /continue with google/i });
      fireEvent.click(button);

      await waitFor(() => {
        expect(signIn.social).toHaveBeenCalledWith({
          provider: 'google',
          callbackURL: '/home',
        });
      });
    });

    it('uses provided callbackUrl for Google sign-in', async () => {
      vi.mocked(signIn.social).mockResolvedValueOnce(undefined);

      render(<OAuthButtons callbackUrl="/library" />);

      const button = screen.getByRole('button', { name: /continue with google/i });
      fireEvent.click(button);

      await waitFor(() => {
        expect(signIn.social).toHaveBeenCalledWith({
          provider: 'google',
          callbackURL: '/library',
        });
      });
    });

    it('shows error message when Google sign-in fails', async () => {
      vi.mocked(signIn.social).mockRejectedValueOnce(new Error('OAuth failed'));

      render(<OAuthButtons />);

      const button = screen.getByRole('button', { name: /continue with google/i });
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(/failed to sign in with google/i);
      });
    });
  });

  describe('Apple Sign In', () => {
    it('renders the Apple sign-in button', () => {
      render(<OAuthButtons />);

      expect(screen.getByRole('button', { name: /continue with apple/i })).toBeInTheDocument();
    });

    it('Apple button has correct styling (black background)', () => {
      render(<OAuthButtons />);

      const appleButton = screen.getByRole('button', { name: /continue with apple/i });
      expect(appleButton).toHaveClass('bg-black');
      expect(appleButton).toHaveClass('text-white');
      expect(appleButton).toHaveClass('min-h-[44px]');
    });

    it('shows loading state when signing in with Apple', async () => {
      vi.mocked(signIn.social).mockImplementation(() => new Promise(() => {}));

      render(<OAuthButtons />);

      const button = screen.getByRole('button', { name: /continue with apple/i });
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText(/signing in/i)).toBeInTheDocument();
      });
      expect(button).toBeDisabled();
    });

    it('calls signIn.social with apple provider when clicked', async () => {
      vi.mocked(signIn.social).mockResolvedValueOnce(undefined);

      render(<OAuthButtons />);

      const button = screen.getByRole('button', { name: /continue with apple/i });
      fireEvent.click(button);

      await waitFor(() => {
        expect(signIn.social).toHaveBeenCalledWith({
          provider: 'apple',
          callbackURL: '/home',
        });
      });
    });

    it('uses provided callbackUrl for Apple sign-in', async () => {
      vi.mocked(signIn.social).mockResolvedValueOnce(undefined);

      render(<OAuthButtons callbackUrl="/profile" />);

      const button = screen.getByRole('button', { name: /continue with apple/i });
      fireEvent.click(button);

      await waitFor(() => {
        expect(signIn.social).toHaveBeenCalledWith({
          provider: 'apple',
          callbackURL: '/profile',
        });
      });
    });

    it('shows error message when Apple sign-in fails', async () => {
      vi.mocked(signIn.social).mockRejectedValueOnce(new Error('OAuth failed'));

      render(<OAuthButtons />);

      const button = screen.getByRole('button', { name: /continue with apple/i });
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(/failed to sign in with apple/i);
      });
    });
  });

  describe('Button interaction', () => {
    it('disables both buttons when one is loading', async () => {
      vi.mocked(signIn.social).mockImplementation(() => new Promise(() => {}));

      render(<OAuthButtons />);

      const googleButton = screen.getByRole('button', { name: /continue with google/i });
      const appleButton = screen.getByRole('button', { name: /continue with apple/i });

      fireEvent.click(googleButton);

      await waitFor(() => {
        expect(googleButton).toBeDisabled();
        expect(appleButton).toBeDisabled();
      });
    });

    it('renders Google button before Apple button', () => {
      render(<OAuthButtons />);

      const buttons = screen.getAllByRole('button');
      expect(buttons[0]).toHaveAccessibleName(/continue with google/i);
      expect(buttons[1]).toHaveAccessibleName(/continue with apple/i);
    });

    it('clears error message when retrying sign-in', async () => {
      // First attempt fails
      vi.mocked(signIn.social).mockRejectedValueOnce(new Error('OAuth failed'));

      render(<OAuthButtons />);

      const googleButton = screen.getByRole('button', { name: /continue with google/i });
      fireEvent.click(googleButton);

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });

      // Second attempt - error should clear when clicking
      vi.mocked(signIn.social).mockImplementation(() => new Promise(() => {}));
      fireEvent.click(googleButton);

      await waitFor(() => {
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      });
    });

    it('Google button has consistent touch target (min-h-[44px])', () => {
      render(<OAuthButtons />);

      const googleButton = screen.getByRole('button', { name: /continue with google/i });
      expect(googleButton).toHaveClass('min-h-[44px]');
    });
  });
});

describe('isApplePrivateRelayEmail', () => {
  it('returns true for Apple private relay emails', () => {
    expect(isApplePrivateRelayEmail('abc123xyz@privaterelay.appleid.com')).toBe(true);
    expect(isApplePrivateRelayEmail('user_random@privaterelay.appleid.com')).toBe(true);
  });

  it('returns false for regular emails', () => {
    expect(isApplePrivateRelayEmail('user@gmail.com')).toBe(false);
    expect(isApplePrivateRelayEmail('user@icloud.com')).toBe(false);
    expect(isApplePrivateRelayEmail('user@apple.com')).toBe(false);
  });

  it('returns false for null or undefined', () => {
    expect(isApplePrivateRelayEmail(null)).toBe(false);
    expect(isApplePrivateRelayEmail(undefined)).toBe(false);
  });

  it('returns false for empty string', () => {
    expect(isApplePrivateRelayEmail('')).toBe(false);
  });
});
