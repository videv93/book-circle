'use client';

import { BookOpen } from 'lucide-react';

export default function LibraryPage() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 p-8 pt-16">
      <BookOpen className="h-16 w-16 text-muted-foreground" />
      <h2 className="text-xl font-semibold text-foreground">Your Library</h2>
      <p className="text-center text-muted-foreground">
        Your book collection will appear here.
        <br />
        Coming soon in Epic 2.
      </p>
    </div>
  );
}
