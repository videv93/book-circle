'use server';

import { headers } from 'next/headers';

import { auth } from '@/lib/auth';
import { isPremium } from '@/lib/premium';
import type { ActionResult } from '@/types';

interface AuthorChatAccess {
  isPremium: boolean;
}

export async function getAuthorChatAccess(): Promise<
  ActionResult<AuthorChatAccess>
> {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    const premium = await isPremium(session.user.id);

    return { success: true, data: { isPremium: premium } };
  } catch (error) {
    console.error('Failed to check author chat access:', error);
    return { success: false, error: 'Failed to check chat access' };
  }
}
