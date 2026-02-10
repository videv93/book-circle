-- CreateEnum
CREATE TYPE "ClaimStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "VerificationMethod" AS ENUM ('AMAZON', 'WEBSITE', 'MANUAL');

-- CreateTable
CREATE TABLE "author_claims" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "book_id" TEXT NOT NULL,
    "verification_method" "VerificationMethod" NOT NULL,
    "verification_url" TEXT,
    "verification_text" TEXT,
    "status" "ClaimStatus" NOT NULL DEFAULT 'PENDING',
    "reviewed_by_id" TEXT,
    "reviewed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "author_claims_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "author_claims_status_idx" ON "author_claims"("status");

-- CreateIndex
CREATE INDEX "author_claims_book_id_idx" ON "author_claims"("book_id");

-- CreateIndex
CREATE UNIQUE INDEX "author_claims_user_id_book_id_key" ON "author_claims"("user_id", "book_id");

-- AddForeignKey
ALTER TABLE "author_claims" ADD CONSTRAINT "author_claims_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "author_claims" ADD CONSTRAINT "author_claims_reviewed_by_id_fkey" FOREIGN KEY ("reviewed_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "author_claims" ADD CONSTRAINT "author_claims_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "books"("id") ON DELETE CASCADE ON UPDATE CASCADE;
