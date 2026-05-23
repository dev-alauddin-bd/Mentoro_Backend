/*
  Warnings:

  - You are about to drop the column `featureRequested` on the `courses` table. All the data in the column will be lost.
  - You are about to drop the column `isFeatured` on the `courses` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "courses" DROP COLUMN "featureRequested",
DROP COLUMN "isFeatured",
ADD COLUMN     "hasCertificate" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isFree" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "learningOutcomes" TEXT[],
ADD COLUMN     "requirements" TEXT[],
ADD COLUMN     "tags" TEXT[],
ADD COLUMN     "targetAudience" TEXT[];
