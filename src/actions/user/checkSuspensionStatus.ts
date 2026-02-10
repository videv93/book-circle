'use server';

import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { checkSuspension, type SuspensionStatus } from '@/lib/checkSuspension';
import type { ActionResult } from '@/actions/books/types';

export async function checkSuspensionStatus(): Promise<
  ActionResult<SuspensionStatus>
> {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    const status = await checkSuspension(session.user.id);
    return { success: true, data: status };
  } catch (error) {
    console.error('checkSuspensionStatus error:', error);
    return { success: false, error: 'Failed to check suspension' };
  }
}
