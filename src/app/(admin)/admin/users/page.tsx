'use client';

import { useState, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { UserSearchBar } from '@/components/features/admin/UserSearchBar';
import { UserSearchResults } from '@/components/features/admin/UserSearchResults';
import { searchUsers } from '@/actions/admin/searchUsers';
import type { UserSearchResult } from '@/actions/admin/searchUsers';

const PAGE_SIZE = 20;

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserSearchResult[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastQuery = useRef('');

  const doSearch = useCallback(async (query: string, searchOffset: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await searchUsers({ query, limit: PAGE_SIZE, offset: searchOffset });
      if (result.success) {
        setUsers(result.data.users);
        setTotal(result.data.total);
        setOffset(searchOffset);
        lastQuery.current = query;
      } else {
        setError(result.error);
        setUsers([]);
        setTotal(0);
      }
    } catch {
      setError('Search failed. Please try again.');
      setUsers([]);
      setTotal(0);
    } finally {
      setIsLoading(false);
      setHasSearched(true);
    }
  }, []);

  const handleSearch = useCallback((query: string) => {
    doSearch(query, 0);
  }, [doSearch]);

  const hasNextPage = offset + PAGE_SIZE < total;
  const hasPrevPage = offset > 0;
  const currentPage = Math.floor(offset / PAGE_SIZE) + 1;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="container max-w-4xl mx-auto px-4 py-6">
      <h2 className="text-xl font-semibold mb-6">User Lookup</h2>
      <div className="space-y-6">
        <UserSearchBar onSearch={handleSearch} isLoading={isLoading} />
        {error && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}
        <UserSearchResults
          users={users}
          total={total}
          isLoading={isLoading}
          hasSearched={hasSearched}
        />
        {hasSearched && totalPages > 1 && (
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              className="min-h-[44px]"
              disabled={!hasPrevPage || isLoading}
              onClick={() => doSearch(lastQuery.current, offset - PAGE_SIZE)}
            >
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              className="min-h-[44px]"
              disabled={!hasNextPage || isLoading}
              onClick={() => doSearch(lastQuery.current, offset + PAGE_SIZE)}
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
