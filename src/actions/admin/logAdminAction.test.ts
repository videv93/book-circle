import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    adminAction: {
      create: vi.fn(),
    },
  },
}));

import { logAdminAction } from './logAdminAction';
import { prisma } from '@/lib/prisma';

const mockCreate = prisma.adminAction.create as unknown as ReturnType<typeof vi.fn>;

describe('logAdminAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates an admin action record', async () => {
    const mockAction = {
      id: 'action-1',
      adminId: 'admin-1',
      actionType: 'REVIEW_CLAIM',
      targetId: 'claim-1',
      targetType: 'AuthorClaim',
      details: { decision: 'approve' },
      createdAt: new Date(),
    };
    mockCreate.mockResolvedValue(mockAction);

    const result = await logAdminAction({
      adminId: 'admin-1',
      actionType: 'REVIEW_CLAIM',
      targetId: 'claim-1',
      targetType: 'AuthorClaim',
      details: { decision: 'approve' },
    });

    expect(result).toEqual(mockAction);
    expect(mockCreate).toHaveBeenCalledWith({
      data: {
        adminId: 'admin-1',
        actionType: 'REVIEW_CLAIM',
        targetId: 'claim-1',
        targetType: 'AuthorClaim',
        details: { decision: 'approve' },
      },
    });
  });

  it('creates action without details', async () => {
    const mockAction = {
      id: 'action-2',
      adminId: 'admin-1',
      actionType: 'PROMOTE_USER',
      targetId: 'user-2',
      targetType: 'User',
      details: null,
      createdAt: new Date(),
    };
    mockCreate.mockResolvedValue(mockAction);

    await logAdminAction({
      adminId: 'admin-1',
      actionType: 'PROMOTE_USER',
      targetId: 'user-2',
      targetType: 'User',
    });

    expect(mockCreate).toHaveBeenCalledWith({
      data: {
        adminId: 'admin-1',
        actionType: 'PROMOTE_USER',
        targetId: 'user-2',
        targetType: 'User',
        details: undefined,
      },
    });
  });
});
