import { cache } from 'react';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getBookById } from '@/actions/books';
import { PageHeader, BackButton } from '@/components/layout';
import { BookDiscussion } from '@/components/features/discussions';

const getCachedBookById = cache(getBookById);

interface DiscussionPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: DiscussionPageProps): Promise<Metadata> {
  const { id } = await params;
  const result = await getCachedBookById(id);

  if (!result.success) {
    return { title: 'Discussion Not Found' };
  }

  const { book } = result.data;
  return {
    title: `Discussion - ${book.title}`,
    description: `Join the discussion about ${book.title} by ${book.author}`,
  };
}

export default async function DiscussionPage({ params }: DiscussionPageProps) {
  const { id } = await params;
  const result = await getCachedBookById(id);

  if (!result.success) {
    notFound();
  }

  const { book, authorUserId } = result.data;

  return (
    <>
      <PageHeader
        title={`${book.title} - Discussion`}
        leftSlot={<BackButton fallbackHref={`/book/${id}`} />}
      />
      <div className="flex flex-col h-[calc(100vh-3.5rem-4rem)] lg:h-[calc(100vh-3.5rem)]">
        <BookDiscussion bookId={book.id} authorUserId={authorUserId} fullScreen />
      </div>
    </>
  );
}
