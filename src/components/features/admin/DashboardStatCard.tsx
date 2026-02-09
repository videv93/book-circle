import Link from 'next/link';
import { type LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface DashboardStatCardProps {
  label: string;
  count: number;
  icon: LucideIcon;
  href?: string;
  className?: string;
}

export function DashboardStatCard({
  label,
  count,
  icon: Icon,
  href,
  className,
}: DashboardStatCardProps) {
  const content = (
    <Card className={cn('transition-colors', href && 'hover:bg-muted/50', className)}>
      <CardContent className="flex items-center gap-4 p-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/20">
          <Icon className="h-6 w-6 text-amber-700 dark:text-amber-400" />
        </div>
        <div>
          <p className="text-2xl font-bold">{count}</p>
          <p className="text-sm text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );

  if (href) {
    return (
      <Link href={href} className="block">
        {content}
      </Link>
    );
  }

  return content;
}
