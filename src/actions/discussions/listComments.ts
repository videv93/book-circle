'use server';

import { z } from 'zod';

import { prisma } from '@/lib/prisma';
import type { ActionResult } from '@/types';

const listCommentsSchema = z.object({
  postId: z.string().min(1),
});

export type CommentSummary = {
  id: string;
  body: string;
  createdAt: Date;
  author: { id: string; name: string | null; image: string | null };
};

export async function listComments(
  input: z.input<typeof listCommentsSchema>
): Promise<ActionResult<{ comments: CommentSummary[] }>> {
  const parsed = listCommentsSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: 'Invalid input' };
  }

  try {
    const { postId } = parsed.data;

    const comments = await prisma.discussionComment.findMany({
      where: { postId, parentId: null },
      orderBy: { createdAt: 'asc' },
      include: {
        author: { select: { id: true, name: true, image: true } },
      },
    });

    return {
      success: true,
      data: {
        comments: comments.map((c) => ({
          id: c.id,
          body: c.body,
          createdAt: c.createdAt,
          author: c.author,
        })),
      },
    };
  } catch (error) {
    console.error('Failed to list comments:', error);
    return { success: false, error: 'Failed to load replies' };
  }
}
