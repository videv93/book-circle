import { getClaimDetail } from '@/actions/authors/getClaimDetail';
import { ClaimDetailView } from '@/components/features/admin/ClaimDetailView';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

interface ClaimDetailPageProps {
  params: Promise<{ claimId: string }>;
}

export default async function ClaimDetailPage({ params }: ClaimDetailPageProps) {
  const { claimId } = await params;
  const result = await getClaimDetail(claimId);

  return (
    <div className="container max-w-2xl mx-auto px-4 py-6">
      <Link
        href="/admin/claims"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to Claims
      </Link>

      <h1 className="text-2xl font-semibold mb-6">Claim Review</h1>

      {result.success ? (
        <ClaimDetailView claim={result.data} />
      ) : (
        <p className="text-destructive">{result.error}</p>
      )}
    </div>
  );
}
