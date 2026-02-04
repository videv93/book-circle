import { Home, Search, BookOpen, Bell, User, type LucideIcon } from 'lucide-react';

export interface NavItem {
  href: string;
  icon: LucideIcon;
  label: string;
}

export const NAV_ITEMS: NavItem[] = [
  { href: '/home', icon: Home, label: 'Home' },
  { href: '/search', icon: Search, label: 'Search' },
  { href: '/library', icon: BookOpen, label: 'Library' },
  { href: '/activity', icon: Bell, label: 'Activity' },
  { href: '/profile', icon: User, label: 'Profile' },
];

export interface PageHeaderProps {
  title: string;
  leftSlot?: React.ReactNode;
  rightSlot?: React.ReactNode;
}

export interface AppShellProps {
  children: React.ReactNode;
  title?: string;
  leftSlot?: React.ReactNode;
  rightSlot?: React.ReactNode;
}
