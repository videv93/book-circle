'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Search } from 'lucide-react';
import { toast } from 'sonner';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { searchUsers } from '@/actions/social/searchUsers';
import type { UserSearchResult } from '@/actions/social/searchUsers';
import { UserCard } from './UserCard';

const PAGE_SIZE = 20;

export function UserSearchResults() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UserSearchResult[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [hasError, setHasError] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const performSearch = useCallback(async (searchQuery: string, offset = 0) => {
    if (!searchQuery.trim()) {
      setResults([]);
      setTotal(0);
      setHasSearched(false);
      setHasError(false);
      setIsLoading(false);
      return;
    }

    if (offset === 0) {
      setIsLoading(true);
    } else {
      setIsLoadingMore(true);
    }
    setHasError(false);

    const result = await searchUsers({ query: searchQuery.trim(), limit: PAGE_SIZE, offset });
    if (result.success) {
      if (offset === 0) {
        setResults(result.data.users);
      } else {
        setResults((prev) => [...prev, ...result.data.users]);
      }
      setTotal(result.data.total);
    } else {
      if (offset === 0) {
        setResults([]);
        setTotal(0);
      }
      setHasError(true);
      toast.error(result.error);
    }
    setHasSearched(true);
    setIsLoading(false);
    setIsLoadingMore(false);
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setQuery(value);

      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      debounceRef.current = setTimeout(() => {
        performSearch(value);
      }, 300);
    },
    [performSearch]
  );

  const handleLoadMore = useCallback(() => {
    performSearch(query, results.length);
  }, [performSearch, query, results.length]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const hasMore = results.length < total;

  return (
    <div className="flex flex-col gap-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search for readers..."
          value={query}
          onChange={handleInputChange}
          className="pl-9"
          aria-label="Search users"
        />
      </div>

      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 rounded-lg border p-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-48" />
              </div>
              <Skeleton className="h-9 w-24" />
            </div>
          ))}
        </div>
      )}

      {!isLoading && hasSearched && hasError && results.length === 0 && (
        <p className="py-8 text-center text-sm text-muted-foreground">
          Something went wrong. Please try again.
        </p>
      )}

      {!isLoading && hasSearched && !hasError && results.length === 0 && (
        <p className="py-8 text-center text-sm text-muted-foreground">
          No users found for &quot;{query}&quot;
        </p>
      )}

      {!isLoading && results.length > 0 && (
        <div className="space-y-2">
          {results.map((user) => (
            <UserCard key={user.id} user={user} />
          ))}
          {hasMore && (
            <Button
              variant="outline"
              className="w-full"
              onClick={handleLoadMore}
              disabled={isLoadingMore}
            >
              {isLoadingMore ? 'Loading...' : 'Load More'}
            </Button>
          )}
        </div>
      )}

      {!isLoading && !hasSearched && (
        <p className="py-8 text-center text-sm text-muted-foreground">
          Search for readers to follow
        </p>
      )}
    </div>
  );
}
