'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { signIn } from '@/lib/auth-client';
import { authClient } from '@/lib/auth-client';
import { logError } from '@/lib/error-logging';

const formSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string(),
});

type FormInput = z.infer<typeof formSchema>;

interface EmailPasswordFormProps {
  callbackUrl?: string;
}

export function EmailPasswordForm({ callbackUrl }: EmailPasswordFormProps) {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const isSignUp = mode === 'signup';

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormInput>({
    resolver: zodResolver(formSchema),
    mode: 'onBlur',
    defaultValues: {
      email: '',
      password: '',
      name: '',
    },
  });

  const onSubmit = async (data: FormInput) => {
    try {
      setIsSubmitting(true);
      setServerError(null);

      if (isSignUp) {
        if (!data.name.trim()) {
          setServerError('Name is required');
          return;
        }
        const result = await authClient.signUp.email({
          email: data.email,
          password: data.password,
          name: data.name || '',
        });
        if (result.error) {
          setServerError(result.error.message || 'Sign up failed. Please try again.');
          return;
        }
      } else {
        const result = await signIn.email({
          email: data.email,
          password: data.password,
        });
        if (result.error) {
          setServerError(result.error.message || 'Invalid email or password.');
          return;
        }
      }

      router.push(callbackUrl || '/home');
    } catch (err) {
      logError(err, { mode, email: data.email });
      setServerError(
        isSignUp
          ? 'Failed to create account. Please try again.'
          : 'Failed to sign in. Please try again.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleMode = () => {
    setMode(isSignUp ? 'signin' : 'signup');
    setServerError(null);
    reset();
  };

  return (
    <div>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {isSignUp && (
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              type="text"
              placeholder="Your name"
              {...register('name')}
              aria-describedby={errors.name ? 'name-error' : undefined}
              aria-invalid={!!errors.name}
            />
            {errors.name && (
              <p id="name-error" className="text-sm text-destructive">
                {errors.name.message}
              </p>
            )}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            {...register('email')}
            aria-describedby={errors.email ? 'email-error' : undefined}
            aria-invalid={!!errors.email}
          />
          {errors.email && (
            <p id="email-error" className="text-sm text-destructive">
              {errors.email.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            placeholder="At least 8 characters"
            {...register('password')}
            aria-describedby={errors.password ? 'password-error' : undefined}
            aria-invalid={!!errors.password}
          />
          {errors.password && (
            <p id="password-error" className="text-sm text-destructive">
              {errors.password.message}
            </p>
          )}
        </div>

        {serverError && (
          <p className="text-sm text-destructive text-center" role="alert">
            {serverError}
          </p>
        )}

        <Button
          type="submit"
          className="w-full min-h-[44px]"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
              {isSignUp ? 'Creating account...' : 'Signing in...'}
            </span>
          ) : isSignUp ? (
            'Create Account'
          ) : (
            'Sign In'
          )}
        </Button>
      </form>

      <p className="mt-4 text-center text-sm text-muted-foreground">
        {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
        <button
          type="button"
          onClick={toggleMode}
          className="text-primary underline-offset-4 hover:underline"
        >
          {isSignUp ? 'Sign in' : 'Sign up'}
        </button>
      </p>
    </div>
  );
}
