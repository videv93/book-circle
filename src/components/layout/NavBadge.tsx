interface NavBadgeProps {
  count: number;
}

export function NavBadge({ count }: NavBadgeProps) {
  if (count <= 0) return null;
  const display = count > 99 ? '99+' : String(count);
  return (
    <span
      aria-label={`${count} new notifications`}
      className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground"
    >
      {display}
    </span>
  );
}
