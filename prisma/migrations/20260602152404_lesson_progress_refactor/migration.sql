/*
  Warnings:

  - You are about to drop the column `paymentId` on the `enrollments` table. All the data in the column will be lost.
  - The `status` column on the `enrollments` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the `completed_lessons` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `job_applications` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `jobs` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `legal_documents` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `newsletter_subscribers` table. If the table is not empty, all the data it contains will be lost.
  - Made the column `level` on table `live_sessions` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "EnrollmentStatus" AS ENUM ('ACTIVE', 'PENDING', 'CANCELLED');

-- DropForeignKey
ALTER TABLE "completed_lessons" DROP CONSTRAINT "completed_lessons_lessonId_fkey";

-- DropForeignKey
ALTER TABLE "completed_lessons" DROP CONSTRAINT "completed_lessons_studentId_fkey";

-- DropForeignKey
ALTER TABLE "job_applications" DROP CONSTRAINT "job_applications_jobId_fkey";

-- DropIndex
DROP INDEX "lessons_moduleId_idx";

-- DropIndex
DROP INDEX "modules_courseId_idx";

-- DropIndex
DROP INDEX "reviews_rating_idx";

-- AlterTable
ALTER TABLE "enrollments" DROP COLUMN "paymentId",
DROP COLUMN "status",
ADD COLUMN     "status" "EnrollmentStatus" NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "live_sessions" ALTER COLUMN "level" SET NOT NULL;

-- DropTable
DROP TABLE "completed_lessons";

-- DropTable
DROP TABLE "job_applications";

-- DropTable
DROP TABLE "jobs";

-- DropTable
DROP TABLE "legal_documents";

-- DropTable
DROP TABLE "newsletter_subscribers";

-- CreateTable
CREATE TABLE "lesson_progress" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "progress" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lastWatched" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lesson_progress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "lesson_progress_studentId_idx" ON "lesson_progress"("studentId");

-- CreateIndex
CREATE INDEX "lesson_progress_courseId_idx" ON "lesson_progress"("courseId");

-- CreateIndex
CREATE INDEX "lesson_progress_lessonId_idx" ON "lesson_progress"("lessonId");

-- CreateIndex
CREATE UNIQUE INDEX "lesson_progress_studentId_lessonId_key" ON "lesson_progress"("studentId", "lessonId");

-- CreateIndex
CREATE INDEX "assignments_moduleId_createdAt_idx" ON "assignments"("moduleId", "createdAt");

-- CreateIndex
CREATE INDEX "courses_instructorId_idx" ON "courses"("instructorId");

-- CreateIndex
CREATE INDEX "courses_slug_idx" ON "courses"("slug");

-- CreateIndex
CREATE INDEX "enrollments_status_idx" ON "enrollments"("status");

-- CreateIndex
CREATE INDEX "lessons_moduleId_order_idx" ON "lessons"("moduleId", "order");

-- CreateIndex
CREATE INDEX "modules_courseId_order_idx" ON "modules"("courseId", "order");

-- CreateIndex
CREATE INDEX "payments_enrollId_idx" ON "payments"("enrollId");

-- CreateIndex
CREATE INDEX "payments_studentId_courseId_idx" ON "payments"("studentId", "courseId");

-- CreateIndex
CREATE INDEX "reviews_courseId_rating_idx" ON "reviews"("courseId", "rating");

-- AddForeignKey
ALTER TABLE "lesson_progress" ADD CONSTRAINT "lesson_progress_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_progress" ADD CONSTRAINT "lesson_progress_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;
