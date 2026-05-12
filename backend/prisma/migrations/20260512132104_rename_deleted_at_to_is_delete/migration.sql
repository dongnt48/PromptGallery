/*
  Warnings:

  - You are about to drop the column `deleted_at` on the `prompts` table. All the data in the column will be lost.
  - You are about to drop the column `deleted_at` on the `users` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "prompts" DROP COLUMN "deleted_at",
ADD COLUMN     "is_delete" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "users" DROP COLUMN "deleted_at",
ADD COLUMN     "is_delete" BOOLEAN NOT NULL DEFAULT false;
