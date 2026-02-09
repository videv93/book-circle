import type { UserRole } from '@prisma/client';

/**
 * Get admin user IDs from environment variable (legacy fallback).
 * Used for backward compatibility during migration to role-based access.
 */
export function getAdminIds(): string[] {
  return (process.env.ADMIN_USER_IDS ?? '').split(',').filter(Boolean);
}

/**
 * Check if a role grants admin privileges.
 */
export function isAdminRole(role: UserRole | string): boolean {
  return role === 'ADMIN' || role === 'SUPER_ADMIN';
}

/**
 * Check if a role grants super-admin privileges.
 */
export function isSuperAdminRole(role: UserRole | string): boolean {
  return role === 'SUPER_ADMIN';
}

/**
 * Check if a user has admin access.
 * Supports both role-based (preferred) and env-var-based (legacy fallback).
 */
export function isAdmin(user: { id: string; role?: UserRole | string }): boolean {
  if (user.role && isAdminRole(user.role)) {
    return true;
  }
  return getAdminIds().includes(user.id);
}

/**
 * Check if a user has super-admin access.
 */
export function isSuperAdmin(user: { id: string; role?: UserRole | string }): boolean {
  return user.role === 'SUPER_ADMIN';
}
