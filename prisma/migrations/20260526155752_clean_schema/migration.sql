/*
  Warnings:

  - You are about to drop the column `studentProfileId` on the `assignment_submissions` table. All the data in the column will be lost.
  - You are about to drop the column `studentProfileId` on the `completed_lessons` table. All the data in the column will be lost.
  - You are about to drop the column `instructorProfileId` on the `courses` table. All the data in the column will be lost.
  - You are about to drop the column `studentProfileId` on the `enrollments` table. All the data in the column will be lost.
  - You are about to drop the column `instructorProfileId` on the `live_sessions` table. All the data in the column will be lost.
  - You are about to drop the column `studentProfileId` on the `payments` table. All the data in the column will be lost.
  - You are about to drop the column `studentProfileId` on the `quiz_submissions` table. All the data in the column will be lost.
  - You are about to drop the column `studentProfileId` on the `reviews` table. All the data in the column will be lost.
  - You are about to drop the `admin_profiles` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `instructor_profiles` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `student_profiles` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[studentId,assignmentId]` on the table `assignment_submissions` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[studentId,lessonId]` on the table `completed_lessons` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[studentId,courseId]` on the table `enrollments` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[studentId,quizId]` on the table `quiz_submissions` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `studentId` to the `assignment_submissions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `studentId` to the `completed_lessons` table without a default value. This is not possible if the table is not empty.
  - Added the required column `instructorId` to the `courses` table without a default value. This is not possible if the table is not empty.
  - Added the required column `studentId` to the `enrollments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `live_sessions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `studentId` to the `payments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `studentId` to the `quiz_submissions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `studentId` to the `reviews` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "admin_profiles" DROP CONSTRAINT "admin_profiles_userId_fkey";

-- DropForeignKey
ALTER TABLE "assignment_submissions" DROP CONSTRAINT "assignment_submissions_studentProfileId_fkey";

-- DropForeignKey
ALTER TABLE "completed_lessons" DROP CONSTRAINT "completed_lessons_studentProfileId_fkey";

-- DropForeignKey
ALTER TABLE "courses" DROP CONSTRAINT "courses_instructorProfileId_fkey";

-- DropForeignKey
ALTER TABLE "enrollments" DROP CONSTRAINT "enrollments_studentProfileId_fkey";

-- DropForeignKey
ALTER TABLE "instructor_profiles" DROP CONSTRAINT "instructor_profiles_userId_fkey";

-- DropForeignKey
ALTER TABLE "live_sessions" DROP CONSTRAINT "live_sessions_instructorProfileId_fkey";

-- DropForeignKey
ALTER TABLE "payments" DROP CONSTRAINT "payments_studentProfileId_fkey";

-- DropForeignKey
ALTER TABLE "quiz_submissions" DROP CONSTRAINT "quiz_submissions_studentProfileId_fkey";

-- DropForeignKey
ALTER TABLE "reviews" DROP CONSTRAINT "reviews_studentProfileId_fkey";

-- DropForeignKey
ALTER TABLE "student_profiles" DROP CONSTRAINT "student_profiles_userId_fkey";

-- DropIndex
DROP INDEX "assignment_submissions_studentProfileId_assignmentId_key";

-- DropIndex
DROP INDEX "assignment_submissions_studentProfileId_idx";

-- DropIndex
DROP INDEX "completed_lessons_studentProfileId_idx";

-- DropIndex
DROP INDEX "completed_lessons_studentProfileId_lessonId_key";

-- DropIndex
DROP INDEX "courses_instructorProfileId_idx";

-- DropIndex
DROP INDEX "enrollments_studentProfileId_courseId_key";

-- DropIndex
DROP INDEX "enrollments_studentProfileId_idx";

-- DropIndex
DROP INDEX "live_sessions_instructorProfileId_idx";

-- DropIndex
DROP INDEX "payments_studentProfileId_idx";

-- DropIndex
DROP INDEX "quiz_submissions_studentProfileId_idx";

-- DropIndex
DROP INDEX "quiz_submissions_studentProfileId_quizId_key";

-- DropIndex
DROP INDEX "reviews_studentProfileId_idx";

-- AlterTable
ALTER TABLE "assignment_submissions" DROP COLUMN "studentProfileId",
ADD COLUMN     "studentId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "completed_lessons" DROP COLUMN "studentProfileId",
ADD COLUMN     "studentId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "courses" DROP COLUMN "instructorProfileId",
ADD COLUMN     "instructorId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "enrollments" DROP COLUMN "studentProfileId",
ADD COLUMN     "studentId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "live_sessions" DROP COLUMN "instructorProfileId",
ADD COLUMN     "userId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "payments" DROP COLUMN "studentProfileId",
ADD COLUMN     "studentId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "quiz_submissions" DROP COLUMN "studentProfileId",
ADD COLUMN     "studentId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "reviews" DROP COLUMN "studentProfileId",
ADD COLUMN     "studentId" TEXT NOT NULL;

-- DropTable
DROP TABLE "admin_profiles";

-- DropTable
DROP TABLE "instructor_profiles";

-- DropTable
DROP TABLE "student_profiles";

-- CreateIndex
CREATE INDEX "assignment_submissions_studentId_idx" ON "assignment_submissions"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "assignment_submissions_studentId_assignmentId_key" ON "assignment_submissions"("studentId", "assignmentId");

-- CreateIndex
CREATE INDEX "completed_lessons_studentId_idx" ON "completed_lessons"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "completed_lessons_studentId_lessonId_key" ON "completed_lessons"("studentId", "lessonId");

-- CreateIndex
CREATE INDEX "enrollments_studentId_idx" ON "enrollments"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "enrollments_studentId_courseId_key" ON "enrollments"("studentId", "courseId");

-- CreateIndex
CREATE INDEX "payments_studentId_idx" ON "payments"("studentId");

-- CreateIndex
CREATE INDEX "quiz_submissions_studentId_idx" ON "quiz_submissions"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "quiz_submissions_studentId_quizId_key" ON "quiz_submissions"("studentId", "quizId");

-- CreateIndex
CREATE INDEX "reviews_studentId_idx" ON "reviews"("studentId");

-- AddForeignKey
ALTER TABLE "courses" ADD CONSTRAINT "courses_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "completed_lessons" ADD CONSTRAINT "completed_lessons_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignment_submissions" ADD CONSTRAINT "assignment_submissions_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quiz_submissions" ADD CONSTRAINT "quiz_submissions_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "live_sessions" ADD CONSTRAINT "live_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
