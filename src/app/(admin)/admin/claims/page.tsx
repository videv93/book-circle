import { getPendingClaims } from '@/actions/authors/getPendingClaims';
import { AdminClaimReview } from '@/components/features/authors/AdminClaimReview';

export default async function AdminClaimsPage() {
  const result = await getPendingClaims();

  return (
    <div className="container max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-semibold mb-6">Author Claim Reviews</h1>
      {result.success ? (
        <AdminClaimReview claims={result.data} />
      ) : (
        <p className="text-destructive">{result.error}</p>
      )}
    </div>
  );
}
