import { BookDetailSkeleton } from '@/components/features/books';
import { PageHeader } from '@/components/layout';
import { Skeleton } from '@/components/ui/skeleton';

export default function BookLoading() {
  return (
    <>
      <PageHeader
        title="Book Details"
        leftSlot={<Skeleton className="h-10 w-10 rounded-md" />}
      />
      <BookDetailSkeleton />
    </>
  );
}
