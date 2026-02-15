'use server';

import { z } from 'zod';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import type { ActionResult } from '@/actions/books/types';

const getAuthorPresenceSchema = z.string().min(1);

export interface AuthorPresenceData {
  isCurrentlyPresent: boolean;
  lastSeenAt: Date | null;
  authorName: string;
  authorId: string;
}

export async function getAuthorPresence(
  bookId: string
): Promise<ActionResult<AuthorPresenceData | null>> {
  try {
    const validated = getAuthorPresenceSchema.parse(bookId);

    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });
    if (!session?.user?.id) {
      return { success: false, error: 'You must be logged in' };
    }

    // 1. Find verified author for this book
    const claim = await prisma.authorClaim.findFirst({
      where: { bookId: validated, status: 'APPROVED' },
      select: {
        userId: true,
        user: { select: { id: true, name: true } },
      },
    });

    if (!claim) {
      return { success: true, data: null };
    }

    // 2. Find their latest RoomPresence (active or within 24h)
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const presence = await prisma.roomPresence.findFirst({
      where: {
        userId: claim.userId,
        bookId: validated,
        isAuthor: true,
        OR: [
          { leftAt: null }, // currently present
          { leftAt: { gte: twentyFourHoursAgo } }, // left within 24h
        ],
      },
      orderBy: { joinedAt: 'desc' },
    });

    if (!presence) {
      return { success: true, data: null };
    }

    return {
      success: true,
      data: {
        isCurrentlyPresent: presence.leftAt === null,
        lastSeenAt: presence.leftAt ?? presence.lastActiveAt,
        authorName: claim.user.name || 'Author',
        authorId: claim.user.id,
      },
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: 'Invalid book ID' };
    }
    return { success: false, error: 'Failed to get author presence' };
  }
}
