// Auth feature types

export interface User {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
}

export interface Session {
  user: User;
}

export interface AuthContextValue {
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export interface OAuthButtonsProps {
  callbackUrl?: string;
}

// Supported OAuth providers
export type OAuthProvider = 'google' | 'apple';

/**
 * Apple-specific user data returned from Apple OAuth.
 * Exported for consumers handling Apple auth responses.
 * Note: Apple only sends name on FIRST authorization - subsequent logins return null for name.
 */
export interface AppleAuthUser {
  id: string;
  email: string | null;
  name?: {
    firstName?: string;
    lastName?: string;
  } | null;
}

/**
 * Checks if an email is an Apple private relay email.
 * Apple private relay emails follow the format: *@privaterelay.appleid.com
 * These emails are unique per-app, per-user and Apple routes mail to the user's real address.
 */
export function isApplePrivateRelayEmail(email: string | null | undefined): boolean {
  return email?.endsWith('@privaterelay.appleid.com') ?? false;
}
