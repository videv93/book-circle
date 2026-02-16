-- CreateEnum
CREATE TYPE "BuddyReadStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "InvitationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED');

-- CreateTable
CREATE TABLE "affiliate_links" (
    "id" TEXT NOT NULL,
    "book_id" TEXT NOT NULL,
    "isbn" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "click_count" INTEGER NOT NULL DEFAULT 0,
    "conversions" INTEGER NOT NULL DEFAULT 0,
    "revenue" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "last_clicked" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "affiliate_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "affiliate_clicks" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "book_id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "source" TEXT,
    "converted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "affiliate_clicks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "buddy_reads" (
    "id" TEXT NOT NULL,
    "creator_id" TEXT NOT NULL,
    "book_id" TEXT NOT NULL,
    "status" "BuddyReadStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "buddy_reads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "buddy_read_invitations" (
    "id" TEXT NOT NULL,
    "buddy_read_id" TEXT NOT NULL,
    "inviter_id" TEXT NOT NULL,
    "invitee_id" TEXT NOT NULL,
    "status" "InvitationStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "buddy_read_invitations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "affiliate_links_book_id_idx" ON "affiliate_links"("book_id");

-- CreateIndex
CREATE INDEX "affiliate_links_provider_idx" ON "affiliate_links"("provider");

-- CreateIndex
CREATE UNIQUE INDEX "affiliate_links_book_id_provider_key" ON "affiliate_links"("book_id", "provider");

-- CreateIndex
CREATE INDEX "affiliate_clicks_user_id_idx" ON "affiliate_clicks"("user_id");

-- CreateIndex
CREATE INDEX "affiliate_clicks_book_id_idx" ON "affiliate_clicks"("book_id");

-- CreateIndex
CREATE INDEX "affiliate_clicks_provider_idx" ON "affiliate_clicks"("provider");

-- CreateIndex
CREATE INDEX "affiliate_clicks_created_at_idx" ON "affiliate_clicks"("created_at");

-- CreateIndex
CREATE INDEX "buddy_reads_creator_id_idx" ON "buddy_reads"("creator_id");

-- CreateIndex
CREATE INDEX "buddy_reads_book_id_idx" ON "buddy_reads"("book_id");

-- CreateIndex
CREATE INDEX "buddy_read_invitations_buddy_read_id_idx" ON "buddy_read_invitations"("buddy_read_id");

-- CreateIndex
CREATE INDEX "buddy_read_invitations_invitee_id_idx" ON "buddy_read_invitations"("invitee_id");

-- CreateIndex
CREATE INDEX "buddy_read_invitations_inviter_id_idx" ON "buddy_read_invitations"("inviter_id");

-- AddForeignKey
ALTER TABLE "affiliate_links" ADD CONSTRAINT "affiliate_links_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "books"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "affiliate_clicks" ADD CONSTRAINT "affiliate_clicks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "buddy_reads" ADD CONSTRAINT "buddy_reads_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "buddy_reads" ADD CONSTRAINT "buddy_reads_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "books"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "buddy_read_invitations" ADD CONSTRAINT "buddy_read_invitations_buddy_read_id_fkey" FOREIGN KEY ("buddy_read_id") REFERENCES "buddy_reads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "buddy_read_invitations" ADD CONSTRAINT "buddy_read_invitations_inviter_id_fkey" FOREIGN KEY ("inviter_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "buddy_read_invitations" ADD CONSTRAINT "buddy_read_invitations_invitee_id_fkey" FOREIGN KEY ("invitee_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
