import type { AdminActionEntry } from '@/actions/admin/getDashboardStats';

function formatActionType(type: string): string {
  return type
    .split('_')
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(' ');
}

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - new Date(date).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return new Date(date).toLocaleDateString();
}

interface AdminActivityLogProps {
  actions: AdminActionEntry[];
}

export function AdminActivityLog({ actions }: AdminActivityLogProps) {
  if (actions.length === 0) {
    return (
      <div className="rounded-lg border border-border p-6 text-center">
        <p className="text-muted-foreground">No admin activity yet</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border">
      <div className="divide-y divide-border">
        {actions.map((action) => (
          <div key={action.id} className="flex items-center justify-between gap-4 px-4 py-3">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate">
                {formatActionType(action.actionType)}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {action.admin.name ?? 'Unknown'} &middot; {action.targetType}
              </p>
            </div>
            <time className="text-xs text-muted-foreground whitespace-nowrap">
              {formatRelativeTime(action.createdAt)}
            </time>
          </div>
        ))}
      </div>
    </div>
  );
}
