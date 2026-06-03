/*
  Warnings:

  - You are about to drop the column `lastActivity` on the `enrollments` table. All the data in the column will be lost.
  - You are about to drop the `quiz_questions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `quiz_submissions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `quizzes` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[slug]` on the table `categories` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `slug` to the `categories` table without a default value. This is not possible if the table is not empty.
  - Added the required column `email` to the `enrollments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `enrollments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `phone` to the `enrollments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `enrollId` to the `payments` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "quiz_questions" DROP CONSTRAINT "quiz_questions_quizId_fkey";

-- DropForeignKey
ALTER TABLE "quiz_submissions" DROP CONSTRAINT "quiz_submissions_quizId_fkey";

-- DropForeignKey
ALTER TABLE "quiz_submissions" DROP CONSTRAINT "quiz_submissions_studentId_fkey";

-- DropForeignKey
ALTER TABLE "quizzes" DROP CONSTRAINT "quizzes_moduleId_fkey";

-- AlterTable
ALTER TABLE "categories" ADD COLUMN     "slug" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "enrollments" DROP COLUMN "lastActivity",
ADD COLUMN     "amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'usd',
ADD COLUMN     "email" TEXT NOT NULL,
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "paymentId" TEXT,
ADD COLUMN     "phone" TEXT NOT NULL,
ADD COLUMN     "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "enrollId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "phone" TEXT;

-- DropTable
DROP TABLE "quiz_questions";

-- DropTable
DROP TABLE "quiz_submissions";

-- DropTable
DROP TABLE "quizzes";

-- CreateIndex
CREATE UNIQUE INDEX "categories_slug_key" ON "categories"("slug");

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_enrollId_fkey" FOREIGN KEY ("enrollId") REFERENCES "enrollments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
