'use client';

import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { ExternalLink } from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import type { PendingClaimData } from '@/actions/authors/getPendingClaims';

interface AdminClaimReviewProps {
  claims: PendingClaimData[];
}

export function AdminClaimReview({ claims }: AdminClaimReviewProps) {
  const router = useRouter();

  if (claims.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground" data-testid="no-pending-claims">
        <p className="text-lg">No pending claims to review</p>
        <p className="text-sm mt-1">All author claims have been processed.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4" data-testid="admin-claim-list">
      <div className="flex items-center gap-2">
        <p className="text-sm text-muted-foreground">
          {claims.length} pending claim{claims.length !== 1 ? 's' : ''}
        </p>
        <span
          className="inline-flex items-center justify-center rounded-full bg-amber-100 text-amber-800 px-2 py-0.5 text-xs font-medium"
          data-testid="pending-count-badge"
        >
          {claims.length}
        </span>
      </div>

      {claims.map((claim) => (
        <Card
          key={claim.id}
          data-testid={`claim-card-${claim.id}`}
          className="cursor-pointer hover:border-foreground/20 transition-colors"
          onClick={() => router.push(`/admin/claims/${claim.id}`)}
          role="link"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              router.push(`/admin/claims/${claim.id}`);
            }
          }}
        >
          <CardHeader>
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                {claim.user.image && (
                  <AvatarImage src={claim.user.image} alt={claim.user.name || ''} />
                )}
                <AvatarFallback>
                  {(claim.user.name || claim.user.email)[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-base">
                  {claim.user.name || claim.user.email}
                </CardTitle>
                <CardDescription>{claim.user.email}</CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <div className="flex gap-3 mb-3">
              {claim.book.coverUrl && (
                <Image
                  src={claim.book.coverUrl}
                  alt={claim.book.title}
                  width={48}
                  height={64}
                  className="rounded object-cover"
                />
              )}
              <div>
                <p className="font-medium">{claim.book.title}</p>
                <p className="text-sm text-muted-foreground">by {claim.book.author}</p>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <p>
                <span className="font-medium">Method:</span>{' '}
                {claim.verificationMethod}
              </p>
              {claim.verificationUrl && (
                <p className="flex items-center gap-1">
                  <span className="font-medium">URL:</span>{' '}
                  <a
                    href={claim.verificationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline underline-offset-2 inline-flex items-center gap-1"
                    onClick={(e) => e.stopPropagation()}
                    data-testid={`claim-url-${claim.id}`}
                  >
                    {claim.verificationUrl}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </p>
              )}
              {claim.verificationText && (
                <div>
                  <span className="font-medium">Explanation:</span>
                  <p className="mt-1 p-2 bg-muted rounded text-muted-foreground">
                    {claim.verificationText}
                  </p>
                </div>
              )}
              <p className="text-muted-foreground">
                Submitted: {new Date(claim.createdAt).toLocaleDateString()}
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
