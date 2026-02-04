'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';

import { cn } from '@/lib/utils';
import { NAV_ITEMS } from './types';

export function SideNav() {
  const pathname = usePathname();

  const isActive = (href: string) => pathname.startsWith(href);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (isActive(href)) {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <nav
      aria-label="Sidebar navigation"
      role="navigation"
      className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 lg:border-r lg:border-border lg:bg-background lg:pt-16"
    >
      <div className="flex flex-col gap-1 p-4">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={(e) => handleClick(e, item.href)}
              aria-current={active ? 'page' : undefined}
              aria-label={`Navigate to ${item.label}`}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                active
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <Icon
                className={cn('h-5 w-5', active && 'fill-primary/20')}
                strokeWidth={active ? 2.5 : 2}
              />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
