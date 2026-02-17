import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EmailPasswordForm } from './EmailPasswordForm';

const mockPush = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock('@/lib/auth-client', () => ({
  signIn: {
    email: vi.fn(),
  },
  authClient: {
    signUp: {
      email: vi.fn(),
    },
  },
}));

vi.mock('@/lib/error-logging', () => ({
  logError: vi.fn(),
}));

import { signIn, authClient } from '@/lib/auth-client';

describe('EmailPasswordForm', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders sign-in form by default', () => {
    render(<EmailPasswordForm />);
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign In' })).toBeInTheDocument();
    expect(screen.queryByLabelText('Name')).not.toBeInTheDocument();
  });

  it('toggles to sign-up mode', async () => {
    render(<EmailPasswordForm />);
    await user.click(screen.getByText('Sign up'));

    expect(screen.getByLabelText('Name')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create Account' })).toBeInTheDocument();
  });

  it('toggles back to sign-in mode', async () => {
    render(<EmailPasswordForm />);
    await user.click(screen.getByText('Sign up'));
    await user.click(screen.getByText('Sign in'));

    expect(screen.queryByLabelText('Name')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign In' })).toBeInTheDocument();
  });

  it('validates email format on blur', async () => {
    render(<EmailPasswordForm />);
    const emailInput = screen.getByLabelText('Email');

    await user.type(emailInput, 'not-an-email');
    await user.tab();

    await waitFor(() => {
      expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
    });
  });

  it('validates password min length on blur', async () => {
    render(<EmailPasswordForm />);
    const passwordInput = screen.getByLabelText('Password');

    await user.type(passwordInput, 'short');
    await user.tab();

    await waitFor(() => {
      expect(screen.getByText('Password must be at least 8 characters')).toBeInTheDocument();
    });
  });

  it('calls signIn.email on sign-in submit', async () => {
    vi.mocked(signIn.email).mockResolvedValueOnce({ data: {}, error: null });
    render(<EmailPasswordForm callbackUrl="/home" />);

    await user.type(screen.getByLabelText('Email'), 'test@example.com');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.click(screen.getByRole('button', { name: 'Sign In' }));

    await waitFor(() => {
      expect(signIn.email).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });
  });

  it('calls signUp.email on sign-up submit', async () => {
    vi.mocked(authClient.signUp.email).mockResolvedValueOnce({ data: {}, error: null });
    render(<EmailPasswordForm callbackUrl="/home" />);

    await user.click(screen.getByText('Sign up'));
    await user.type(screen.getByLabelText('Name'), 'Test User');
    await user.type(screen.getByLabelText('Email'), 'test@example.com');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.click(screen.getByRole('button', { name: 'Create Account' }));

    await waitFor(() => {
      expect(authClient.signUp.email).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      });
    });
  });

  it('shows loading state during submission', async () => {
    vi.mocked(signIn.email).mockImplementation(
      () => new Promise(() => {}),
    );
    render(<EmailPasswordForm />);

    await user.type(screen.getByLabelText('Email'), 'test@example.com');
    await user.type(screen.getByLabelText('Password'), 'password123');

    // Click submit — don't await since signIn.email never resolves
    const submitButton = screen.getByRole('button', { name: 'Sign In' });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Signing in/)).toBeInTheDocument();
    });
  });

  it('displays server error on sign-in failure', async () => {
    vi.mocked(signIn.email).mockResolvedValueOnce({
      data: null,
      error: { message: 'Invalid credentials' },
    });
    render(<EmailPasswordForm />);

    await user.type(screen.getByLabelText('Email'), 'test@example.com');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.click(screen.getByRole('button', { name: 'Sign In' }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Invalid credentials');
    });
  });

  it('displays server error on sign-up duplicate email', async () => {
    vi.mocked(authClient.signUp.email).mockResolvedValueOnce({
      data: null,
      error: { message: 'User already exists' },
    });
    render(<EmailPasswordForm />);

    await user.click(screen.getByText('Sign up'));
    await user.type(screen.getByLabelText('Name'), 'Test');
    await user.type(screen.getByLabelText('Email'), 'existing@example.com');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.click(screen.getByRole('button', { name: 'Create Account' }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('User already exists');
    });
  });

  it('redirects on successful sign-in', async () => {
    vi.mocked(signIn.email).mockResolvedValueOnce({ data: {}, error: null });
    render(<EmailPasswordForm callbackUrl="/dashboard" />);

    await user.type(screen.getByLabelText('Email'), 'test@example.com');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.click(screen.getByRole('button', { name: 'Sign In' }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });
  });
});
