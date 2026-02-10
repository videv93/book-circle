import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('next/headers', () => ({
  headers: vi.fn().mockResolvedValue(new Headers()),
}));

vi.mock('@/lib/auth', () => ({
  auth: { api: { getSession: vi.fn() } },
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    userWarning: { findUnique: vi.fn(), update: vi.fn() },
  },
}));

import { acknowledgeWarning } from './acknowledgeWarning';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const mockGetSession = auth.api.getSession as unknown as ReturnType<typeof vi.fn>;
const mockWarningFindUnique = prisma.userWarning.findUnique as unknown as ReturnType<typeof vi.fn>;
const mockWarningUpdate = prisma.userWarning.update as unknown as ReturnType<typeof vi.fn>;

describe('acknowledgeWarning', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSession.mockResolvedValue({ user: { id: 'user-1' } });
    mockWarningFindUnique.mockResolvedValue({
      id: 'warning-1',
      userId: 'user-1',
      acknowledgedAt: null,
    });
    mockWarningUpdate.mockResolvedValue({});
  });

  it('acknowledges warning successfully', async () => {
    const result = await acknowledgeWarning({ warningId: 'warning-1' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.acknowledgedAt).toBeInstanceOf(Date);
    }
    expect(mockWarningUpdate).toHaveBeenCalledWith({
      where: { id: 'warning-1' },
      data: { acknowledgedAt: expect.any(Date) },
    });
  });

  it('returns error for unauthenticated user', async () => {
    mockGetSession.mockResolvedValueOnce(null);
    const result = await acknowledgeWarning({ warningId: 'warning-1' });
    expect(result).toEqual({ success: false, error: 'Unauthorized' });
  });

  it('returns error if warning not found', async () => {
    mockWarningFindUnique.mockResolvedValueOnce(null);
    const result = await acknowledgeWarning({ warningId: 'warning-1' });
    expect(result).toEqual({ success: false, error: 'Warning not found' });
  });

  it('returns error if user does not own the warning', async () => {
    mockWarningFindUnique.mockResolvedValueOnce({
      id: 'warning-1',
      userId: 'other-user',
      acknowledgedAt: null,
    });
    const result = await acknowledgeWarning({ warningId: 'warning-1' });
    expect(result).toEqual({ success: false, error: 'Forbidden' });
  });

  it('returns error if already acknowledged', async () => {
    mockWarningFindUnique.mockResolvedValueOnce({
      id: 'warning-1',
      userId: 'user-1',
      acknowledgedAt: new Date(),
    });
    const result = await acknowledgeWarning({ warningId: 'warning-1' });
    expect(result).toEqual({ success: false, error: 'Warning already acknowledged' });
  });

  it('returns error for invalid input', async () => {
    const result = await acknowledgeWarning({ warningId: '' });
    expect(result).toEqual({ success: false, error: 'Invalid input' });
  });
});
