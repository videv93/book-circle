'use server';

import { headers } from 'next/headers';
import { z } from 'zod';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import type { ActionResult } from '@/types';

const createPostSchema = z.object({
  bookId: z.string().min(1),
  title: z.string().min(1).max(200),
  body: z.string().min(1).max(5000),
});

export type CreatePostInput = z.input<typeof createPostSchema>;

export async function createPost(
  input: CreatePostInput
): Promise<ActionResult<{ id: string }>> {
  const parsed = createPostSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: 'Invalid input' };
  }

  const headersList = await headers();
  const session = await auth.api.getSession({ headers: headersList });
  if (!session?.user?.id) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    const { bookId, title, body } = parsed.data;

    const book = await prisma.book.findUnique({ where: { id: bookId }, select: { id: true } });
    if (!book) {
      return { success: false, error: 'Book not found' };
    }

    const post = await prisma.discussionPost.create({
      data: {
        bookId,
        authorId: session.user.id,
        title,
        body,
      },
      select: { id: true },
    });

    return { success: true, data: { id: post.id } };
  } catch (error) {
    console.error('Failed to create discussion post:', error);
    return { success: false, error: 'Failed to create post' };
  }
}
