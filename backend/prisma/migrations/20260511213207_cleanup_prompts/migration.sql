/*
  Warnings:

  - You are about to drop the column `cfg_scale` on the `prompts` table. All the data in the column will be lost.
  - You are about to drop the column `sampler` on the `prompts` table. All the data in the column will be lost.
  - You are about to drop the column `seed` on the `prompts` table. All the data in the column will be lost.
  - You are about to drop the column `steps` on the `prompts` table. All the data in the column will be lost.
  - You are about to drop the column `views_count` on the `prompts` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "prompts" DROP COLUMN "cfg_scale",
DROP COLUMN "sampler",
DROP COLUMN "seed",
DROP COLUMN "steps",
DROP COLUMN "views_count",
ADD COLUMN     "deleted_at" TIMESTAMP(3),
ALTER COLUMN "ai_model" DROP NOT NULL;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "deleted_at" TIMESTAMP(3);
