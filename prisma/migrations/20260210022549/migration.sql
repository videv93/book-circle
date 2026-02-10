-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'AUTHOR', 'ADMIN', 'SUPER_ADMIN');

-- CreateEnum
CREATE TYPE "ModerationStatus" AS ENUM ('PENDING', 'DISMISSED', 'WARNED', 'REMOVED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "ContentType" AS ENUM ('PROFILE_BIO', 'READING_ROOM_DESCRIPTION');

-- CreateEnum
CREATE TYPE "WarningType" AS ENUM ('FIRST_WARNING', 'FINAL_WARNING');

-- CreateEnum
CREATE TYPE "SuspensionDuration" AS ENUM ('HOURS_24', 'DAYS_7', 'DAYS_30', 'PERMANENT');

-- CreateEnum
CREATE TYPE "ViolationType" AS ENUM ('SPAM', 'HARASSMENT', 'SPOILERS', 'INAPPROPRIATE', 'OTHER');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "bio_removed_at" TIMESTAMP(3),
ADD COLUMN     "role" "UserRole" NOT NULL DEFAULT 'USER',
ADD COLUMN     "suspended_until" TIMESTAMP(3),
ADD COLUMN     "suspension_reason" TEXT;

-- CreateTable
CREATE TABLE "moderation_items" (
    "id" TEXT NOT NULL,
    "content_type" "ContentType" NOT NULL,
    "content_id" TEXT NOT NULL,
    "reporter_id" TEXT NOT NULL,
    "reported_user_id" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "ModerationStatus" NOT NULL DEFAULT 'PENDING',
    "reviewed_by_id" TEXT,
    "reviewed_at" TIMESTAMP(3),
    "admin_notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "moderation_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_actions" (
    "id" TEXT NOT NULL,
    "admin_id" TEXT NOT NULL,
    "action_type" TEXT NOT NULL,
    "target_id" TEXT NOT NULL,
    "target_type" TEXT NOT NULL,
    "details" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_actions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_removals" (
    "id" TEXT NOT NULL,
    "moderation_item_id" TEXT NOT NULL,
    "violation_type" "ViolationType" NOT NULL,
    "admin_notes" TEXT,
    "removed_by_id" TEXT NOT NULL,
    "removed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "restored_at" TIMESTAMP(3),
    "restored_by_id" TEXT,
    "original_content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "content_removals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_warnings" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "issued_by_id" TEXT NOT NULL,
    "warning_type" "WarningType" NOT NULL,
    "message" TEXT NOT NULL,
    "moderation_item_id" TEXT,
    "acknowledged_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_warnings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_suspensions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "issued_by_id" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "duration" "SuspensionDuration" NOT NULL,
    "suspended_until" TIMESTAMP(3) NOT NULL,
    "lifted_at" TIMESTAMP(3),
    "lifted_by_id" TEXT,
    "moderation_item_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_suspensions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "moderation_items_status_idx" ON "moderation_items"("status");

-- CreateIndex
CREATE INDEX "moderation_items_reported_user_id_idx" ON "moderation_items"("reported_user_id");

-- CreateIndex
CREATE INDEX "moderation_items_created_at_idx" ON "moderation_items"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "moderation_items_reporter_id_content_type_content_id_key" ON "moderation_items"("reporter_id", "content_type", "content_id");

-- CreateIndex
CREATE INDEX "admin_actions_admin_id_idx" ON "admin_actions"("admin_id");

-- CreateIndex
CREATE INDEX "admin_actions_created_at_idx" ON "admin_actions"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "content_removals_moderation_item_id_key" ON "content_removals"("moderation_item_id");

-- CreateIndex
CREATE INDEX "content_removals_moderation_item_id_idx" ON "content_removals"("moderation_item_id");

-- CreateIndex
CREATE INDEX "content_removals_removed_by_id_idx" ON "content_removals"("removed_by_id");

-- CreateIndex
CREATE INDEX "content_removals_removed_at_idx" ON "content_removals"("removed_at");

-- CreateIndex
CREATE INDEX "user_warnings_user_id_idx" ON "user_warnings"("user_id");

-- CreateIndex
CREATE INDEX "user_warnings_user_id_acknowledged_at_idx" ON "user_warnings"("user_id", "acknowledged_at");

-- CreateIndex
CREATE INDEX "user_warnings_created_at_idx" ON "user_warnings"("created_at");

-- CreateIndex
CREATE INDEX "user_suspensions_user_id_idx" ON "user_suspensions"("user_id");

-- CreateIndex
CREATE INDEX "user_suspensions_suspended_until_idx" ON "user_suspensions"("suspended_until");

-- CreateIndex
CREATE INDEX "user_suspensions_created_at_idx" ON "user_suspensions"("created_at");

-- AddForeignKey
ALTER TABLE "moderation_items" ADD CONSTRAINT "moderation_items_reporter_id_fkey" FOREIGN KEY ("reporter_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "moderation_items" ADD CONSTRAINT "moderation_items_reported_user_id_fkey" FOREIGN KEY ("reported_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "moderation_items" ADD CONSTRAINT "moderation_items_reviewed_by_id_fkey" FOREIGN KEY ("reviewed_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_actions" ADD CONSTRAINT "admin_actions_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_removals" ADD CONSTRAINT "content_removals_moderation_item_id_fkey" FOREIGN KEY ("moderation_item_id") REFERENCES "moderation_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_removals" ADD CONSTRAINT "content_removals_removed_by_id_fkey" FOREIGN KEY ("removed_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_removals" ADD CONSTRAINT "content_removals_restored_by_id_fkey" FOREIGN KEY ("restored_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_warnings" ADD CONSTRAINT "user_warnings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_warnings" ADD CONSTRAINT "user_warnings_issued_by_id_fkey" FOREIGN KEY ("issued_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_warnings" ADD CONSTRAINT "user_warnings_moderation_item_id_fkey" FOREIGN KEY ("moderation_item_id") REFERENCES "moderation_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_suspensions" ADD CONSTRAINT "user_suspensions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_suspensions" ADD CONSTRAINT "user_suspensions_issued_by_id_fkey" FOREIGN KEY ("issued_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_suspensions" ADD CONSTRAINT "user_suspensions_lifted_by_id_fkey" FOREIGN KEY ("lifted_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_suspensions" ADD CONSTRAINT "user_suspensions_moderation_item_id_fkey" FOREIGN KEY ("moderation_item_id") REFERENCES "moderation_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;
