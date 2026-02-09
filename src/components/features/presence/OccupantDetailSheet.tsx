'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import type { PresenceMember } from '@/stores/usePresenceStore';

interface OccupantDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  members: Map<string, PresenceMember>;
}

function getInitial(name: string): string {
  if (!name) return '?';
  return name.charAt(0).toUpperCase();
}

export function OccupantDetailSheet({
  open,
  onOpenChange,
  members,
}: OccupantDetailSheetProps) {
  const memberList = Array.from(members.values());

  // Sort author to top of the list
  const sorted = [...memberList].sort((a, b) => {
    if (a.isAuthor && !b.isAuthor) return -1;
    if (!a.isAuthor && b.isAuthor) return 1;
    return 0;
  });

  const count = sorted.length;
  const hasAuthor = sorted.some((m) => m.isAuthor);
  const label = hasAuthor
    ? count === 1
      ? '1 reader in this room including the author'
      : `${count} readers in this room including the author`
    : count === 1
      ? '1 reader in this room'
      : `${count} readers in this room`;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[70vh]">
        <SheetHeader>
          <SheetTitle className="text-amber-800">{label}</SheetTitle>
          <SheetDescription className="sr-only">
            List of readers currently in this reading room
          </SheetDescription>
        </SheetHeader>
        <div className="overflow-y-auto px-4 pb-4" data-testid="occupant-list">
          {sorted.map((member) => (
            <Link
              key={member.id}
              href={`/profile/${member.id}`}
              className="flex items-center gap-3 rounded-lg px-2 py-2 min-h-[44px] hover:bg-amber-50 transition-colors"
              aria-label={member.isAuthor ? `Author ${member.name}'s profile` : `${member.name}'s profile`}
              onClick={() => onOpenChange(false)}
            >
              <div className={`flex-shrink-0 w-10 h-10 rounded-full border-2 bg-amber-100 flex items-center justify-center overflow-hidden ${member.isAuthor ? 'border-[var(--author-shimmer,#eab308)] ring-2 ring-[var(--author-shimmer,#eab308)]' : 'border-amber-200'}`}>
                {member.avatarUrl ? (
                  <img
                    src={member.avatarUrl}
                    alt={member.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span
                    className="text-sm font-medium text-amber-700"
                    aria-hidden="true"
                  >
                    {getInitial(member.name)}
                  </span>
                )}
              </div>
              <span className="text-sm font-medium text-amber-900 flex-1">
                {member.isAuthor ? `Author \u2022 ${member.name}` : member.name}
              </span>
              {member.isAuthor && (
                <span
                  className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-300"
                  data-testid="author-badge"
                >
                  Author
                </span>
              )}
              <ChevronRight
                className="h-4 w-4 text-amber-400 flex-shrink-0"
                aria-hidden="true"
              />
            </Link>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
