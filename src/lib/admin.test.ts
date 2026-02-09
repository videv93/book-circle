import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getAdminIds, isAdminRole, isSuperAdminRole, isAdmin, isSuperAdmin } from './admin';

describe('admin utilities', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('getAdminIds', () => {
    it('returns empty array when env var is not set', () => {
      delete process.env.ADMIN_USER_IDS;
      expect(getAdminIds()).toEqual([]);
    });

    it('returns empty array when env var is empty string', () => {
      process.env.ADMIN_USER_IDS = '';
      expect(getAdminIds()).toEqual([]);
    });

    it('returns array of IDs from comma-separated env var', () => {
      process.env.ADMIN_USER_IDS = 'user-1,user-2,user-3';
      expect(getAdminIds()).toEqual(['user-1', 'user-2', 'user-3']);
    });

    it('filters out empty strings from trailing commas', () => {
      process.env.ADMIN_USER_IDS = 'user-1,,user-2,';
      expect(getAdminIds()).toEqual(['user-1', 'user-2']);
    });
  });

  describe('isAdminRole', () => {
    it('returns true for ADMIN role', () => {
      expect(isAdminRole('ADMIN')).toBe(true);
    });

    it('returns true for SUPER_ADMIN role', () => {
      expect(isAdminRole('SUPER_ADMIN')).toBe(true);
    });

    it('returns false for USER role', () => {
      expect(isAdminRole('USER')).toBe(false);
    });

    it('returns false for AUTHOR role', () => {
      expect(isAdminRole('AUTHOR')).toBe(false);
    });
  });

  describe('isSuperAdminRole', () => {
    it('returns true for SUPER_ADMIN role', () => {
      expect(isSuperAdminRole('SUPER_ADMIN')).toBe(true);
    });

    it('returns false for ADMIN role', () => {
      expect(isSuperAdminRole('ADMIN')).toBe(false);
    });

    it('returns false for USER role', () => {
      expect(isSuperAdminRole('USER')).toBe(false);
    });
  });

  describe('isAdmin', () => {
    it('returns true when user has ADMIN role', () => {
      process.env.ADMIN_USER_IDS = '';
      expect(isAdmin({ id: 'user-1', role: 'ADMIN' })).toBe(true);
    });

    it('returns true when user has SUPER_ADMIN role', () => {
      process.env.ADMIN_USER_IDS = '';
      expect(isAdmin({ id: 'user-1', role: 'SUPER_ADMIN' })).toBe(true);
    });

    it('returns true when user ID is in env var (legacy fallback)', () => {
      process.env.ADMIN_USER_IDS = 'user-1,user-2';
      expect(isAdmin({ id: 'user-1', role: 'USER' })).toBe(true);
    });

    it('returns true when user ID is in env var and no role provided', () => {
      process.env.ADMIN_USER_IDS = 'user-1';
      expect(isAdmin({ id: 'user-1' })).toBe(true);
    });

    it('returns false for regular user not in env var', () => {
      process.env.ADMIN_USER_IDS = '';
      expect(isAdmin({ id: 'user-1', role: 'USER' })).toBe(false);
    });

    it('returns false for AUTHOR role not in env var', () => {
      process.env.ADMIN_USER_IDS = '';
      expect(isAdmin({ id: 'user-1', role: 'AUTHOR' })).toBe(false);
    });

    it('prioritizes role check over env var', () => {
      process.env.ADMIN_USER_IDS = '';
      expect(isAdmin({ id: 'not-in-env', role: 'ADMIN' })).toBe(true);
    });
  });

  describe('isSuperAdmin', () => {
    it('returns true for SUPER_ADMIN role', () => {
      expect(isSuperAdmin({ id: 'user-1', role: 'SUPER_ADMIN' })).toBe(true);
    });

    it('returns false for ADMIN role', () => {
      expect(isSuperAdmin({ id: 'user-1', role: 'ADMIN' })).toBe(false);
    });

    it('returns false when no role provided', () => {
      expect(isSuperAdmin({ id: 'user-1' })).toBe(false);
    });
  });
});
