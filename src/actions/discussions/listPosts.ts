'use server';

import { z } from 'zod';

import { prisma } from '@/lib/prisma';
import type { ActionResult } from '@/types';

const listPostsSchema = z.object({
  bookId: z.string().min(1),
  cursor: z.string().optional(),
  limit: z.number().int().min(1).max(50).optional().default(20),
});

export type PostSummary = {
  id: string;
  title: string;
  body: string;
  createdAt: Date;
  author: { id: string; name: string | null; image: string | null };
  commentCount: number;
};

export async function listPosts(
  input: z.input<typeof listPostsSchema>
): Promise<ActionResult<{ posts: PostSummary[]; nextCursor: string | null }>> {
  const parsed = listPostsSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: 'Invalid input' };
  }

  try {
    const { bookId, cursor, limit } = parsed.data;

    const posts = await prisma.discussionPost.findMany({
      where: { bookId },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      include: {
        author: { select: { id: true, name: true, image: true } },
        _count: { select: { comments: true } },
      },
    });

    const hasMore = posts.length > limit;
    const resultPosts = hasMore ? posts.slice(0, limit) : posts;
    const nextCursor = hasMore ? resultPosts[resultPosts.length - 1].id : null;

    return {
      success: true,
      data: {
        posts: resultPosts.map((p) => ({
          id: p.id,
          title: p.title,
          body: p.body,
          createdAt: p.createdAt,
          author: p.author,
          commentCount: p._count.comments,
        })),
        nextCursor,
      },
    };
  } catch (error) {
    console.error('Failed to list discussion posts:', error);
    return { success: false, error: 'Failed to load discussions' };
  }
}
