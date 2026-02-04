'use client';

import { cn } from '@/lib/utils';
import type { PageHeaderProps } from './types';

export function PageHeader({ title, leftSlot, rightSlot }: PageHeaderProps) {
  return (
    <header
      role="banner"
      className={cn(
        'sticky top-0 z-40 border-b border-border',
        'bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60'
      )}
    >
      <div className="flex h-14 items-center justify-between px-4">
        <div className="flex w-12 items-center justify-start">{leftSlot}</div>
        <h1 className="text-lg font-semibold text-foreground">{title}</h1>
        <div className="flex w-12 items-center justify-end">{rightSlot}</div>
      </div>
    </header>
  );
}
