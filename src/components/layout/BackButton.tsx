'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface BackButtonProps {
  fallbackHref?: string;
  className?: string;
}

export function BackButton({
  fallbackHref = '/search',
  className,
}: BackButtonProps) {
  const router = useRouter();

  const handleBack = () => {
    // Check if there's history to go back to
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push(fallbackHref);
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleBack}
      className={cn('h-10 w-10', className)}
      aria-label="Go back"
      data-testid="back-button"
    >
      <ArrowLeft className="h-5 w-5" aria-hidden />
    </Button>
  );
}
