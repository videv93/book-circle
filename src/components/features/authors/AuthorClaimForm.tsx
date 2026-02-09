'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { submitClaim } from '@/actions/authors/submitClaim';

// Form schema (non-refined version for react-hook-form compatibility)
const formSchema = z.object({
  verificationMethod: z.enum(['AMAZON', 'WEBSITE', 'MANUAL']),
  verificationUrl: z.string().optional(),
  verificationText: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface AuthorClaimFormProps {
  bookId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function AuthorClaimForm({
  bookId,
  open,
  onOpenChange,
  onSuccess,
}: AuthorClaimFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    reset,
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      verificationMethod: 'AMAZON',
      verificationUrl: '',
      verificationText: '',
    },
  });

  const method = watch('verificationMethod');

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    setSubmitError(null);

    // Client-side validation for conditional fields
    if ((data.verificationMethod === 'AMAZON' || data.verificationMethod === 'WEBSITE')) {
      if (!data.verificationUrl || data.verificationUrl.length === 0) {
        setSubmitError('URL is required for this verification method');
        setIsSubmitting(false);
        return;
      }
      try {
        new URL(data.verificationUrl);
      } catch {
        setSubmitError('Please enter a valid URL');
        setIsSubmitting(false);
        return;
      }
    }

    if (data.verificationMethod === 'MANUAL') {
      if (!data.verificationText || data.verificationText.length < 10) {
        setSubmitError('Please provide at least 10 characters of explanation');
        setIsSubmitting(false);
        return;
      }
    }

    const result = await submitClaim({
      bookId,
      verificationMethod: data.verificationMethod,
      verificationUrl: data.verificationUrl,
      verificationText: data.verificationText,
    });

    setIsSubmitting(false);

    if (result.success) {
      setSubmitSuccess(true);
      onSuccess?.();
    } else {
      setSubmitError(result.error);
    }
  };

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      reset();
      setSubmitError(null);
      setSubmitSuccess(false);
    }
    onOpenChange(isOpen);
  };

  if (submitSuccess) {
    return (
      <Sheet open={open} onOpenChange={handleClose}>
        <SheetContent side="bottom" data-testid="author-claim-success">
          <SheetHeader>
            <SheetTitle>Claim Submitted!</SheetTitle>
            <SheetDescription>
              {"We'll verify your author claim within 24-48 hours. You'll receive a notification once it's reviewed."}
            </SheetDescription>
          </SheetHeader>
          <div className="p-4">
            <Button
              onClick={() => handleClose(false)}
              className="w-full min-h-[44px]"
            >
              Done
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent side="bottom" data-testid="author-claim-form">
        <SheetHeader>
          <SheetTitle>Are you the author?</SheetTitle>
          <SheetDescription>
            Submit a verification request to claim this book.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 p-4">
          {/* Verification method selection */}
          <fieldset>
            <Label asChild>
              <legend className="mb-2 text-sm font-medium">Verification Method</legend>
            </Label>
            <div className="flex flex-col gap-2">
              {[
                { value: 'AMAZON' as const, label: 'Amazon Author Page' },
                { value: 'WEBSITE' as const, label: 'Personal Website / Social Media' },
                { value: 'MANUAL' as const, label: 'Manual Verification' },
              ].map((option) => (
                <label
                  key={option.value}
                  className="flex items-center gap-3 rounded-md border p-3 cursor-pointer min-h-[44px] hover:bg-muted/50 transition-colors"
                  data-testid={`method-${option.value.toLowerCase()}`}
                >
                  <input
                    type="radio"
                    value={option.value}
                    checked={method === option.value}
                    onChange={() => setValue('verificationMethod', option.value)}
                    className="h-4 w-4"
                  />
                  <span className="text-sm">{option.label}</span>
                </label>
              ))}
            </div>
          </fieldset>

          {/* Conditional URL input */}
          {(method === 'AMAZON' || method === 'WEBSITE') && (
            <div className="space-y-2">
              <Label htmlFor="verificationUrl">
                {method === 'AMAZON'
                  ? 'Amazon Author Page URL'
                  : 'Website or Social Media URL'}
              </Label>
              <Input
                id="verificationUrl"
                type="url"
                placeholder={
                  method === 'AMAZON'
                    ? 'https://www.amazon.com/author/...'
                    : 'https://...'
                }
                {...register('verificationUrl')}
                data-testid="verification-url-input"
              />
              {errors.verificationUrl && (
                <p className="text-sm text-destructive" role="alert">
                  {errors.verificationUrl.message}
                </p>
              )}
            </div>
          )}

          {/* Conditional text input */}
          {method === 'MANUAL' && (
            <div className="space-y-2">
              <Label htmlFor="verificationText">
                How can we verify you are the author?
              </Label>
              <Textarea
                id="verificationText"
                placeholder="Please explain how we can verify your identity as the author..."
                rows={4}
                {...register('verificationText')}
                data-testid="verification-text-input"
              />
              {errors.verificationText && (
                <p className="text-sm text-destructive" role="alert">
                  {errors.verificationText.message}
                </p>
              )}
            </div>
          )}

          {submitError && (
            <p
              className="text-sm text-destructive"
              role="alert"
              data-testid="submit-error"
            >
              {submitError}
            </p>
          )}

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full min-h-[44px]"
            data-testid="submit-claim-button"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              'Submit Claim'
            )}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
