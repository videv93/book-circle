'use server';

import { headers } from 'next/headers';
import { z } from 'zod';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import type { ActionResult } from '@/types';

const createCommentSchema = z.object({
  postId: z.string().min(1),
  body: z.string().min(1).max(2000),
  parentId: z.string().optional(),
});

export type CreateCommentInput = z.input<typeof createCommentSchema>;

export async function createComment(
  input: CreateCommentInput
): Promise<ActionResult<{ id: string }>> {
  const parsed = createCommentSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: 'Invalid input' };
  }

  const headersList = await headers();
  const session = await auth.api.getSession({ headers: headersList });
  if (!session?.user?.id) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    const { postId, body, parentId } = parsed.data;

    const post = await prisma.discussionPost.findUnique({
      where: { id: postId },
      select: { id: true },
    });
    if (!post) {
      return { success: false, error: 'Post not found' };
    }

    const comment = await prisma.discussionComment.create({
      data: {
        postId,
        authorId: session.user.id,
        body,
        parentId,
      },
      select: { id: true },
    });

    return { success: true, data: { id: comment.id } };
  } catch (error) {
    console.error('Failed to create comment:', error);
    return { success: false, error: 'Failed to post reply' };
  }
}
