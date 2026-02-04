'use client';

import { Search } from 'lucide-react';

export default function SearchPage() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 p-8 pt-16">
      <Search className="h-16 w-16 text-muted-foreground" />
      <h2 className="text-xl font-semibold text-foreground">Search Books</h2>
      <p className="text-center text-muted-foreground">
        Search for books to add to your library.
        <br />
        Coming soon in Epic 2.
      </p>
    </div>
  );
}
