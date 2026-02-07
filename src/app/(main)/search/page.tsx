'use client';

import { useRouter } from 'next/navigation';
import { useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookSearch } from '@/components/features/books';
import { UserSearchResults } from '@/components/features/social';
import type { BookSearchResult } from '@/services/books/types';

export default function SearchPage() {
  const router = useRouter();

  const handleBookSelect = useCallback(
    (book: BookSearchResult) => {
      const bookId = book.isbn13 || book.isbn10 || book.id;
      router.push(`/book/${bookId}`);
    },
    [router]
  );

  return (
    <div className="flex flex-col h-full p-4">
      <Tabs defaultValue="books" className="w-full">
        <TabsList className="w-full mb-4">
          <TabsTrigger value="books" className="flex-1">
            Books
          </TabsTrigger>
          <TabsTrigger value="users" className="flex-1">
            Users
          </TabsTrigger>
        </TabsList>
        <TabsContent value="books">
          <BookSearch onBookSelect={handleBookSelect} />
        </TabsContent>
        <TabsContent value="users">
          <UserSearchResults />
        </TabsContent>
      </Tabs>
    </div>
  );
}
