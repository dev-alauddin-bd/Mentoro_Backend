/*
  Warnings:

  - You are about to drop the column `userId` on the `assignment_submissions` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `completed_lessons` table. All the data in the column will be lost.
  - You are about to drop the column `instructorId` on the `courses` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `enrollments` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `payments` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `quiz_submissions` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `reviews` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[studentProfileId,assignmentId]` on the table `assignment_submissions` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[studentProfileId,lessonId]` on the table `completed_lessons` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[studentProfileId,courseId]` on the table `enrollments` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[studentProfileId,quizId]` on the table `quiz_submissions` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `studentProfileId` to the `assignment_submissions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `studentProfileId` to the `completed_lessons` table without a default value. This is not possible if the table is not empty.
  - Added the required column `instructorProfileId` to the `courses` table without a default value. This is not possible if the table is not empty.
  - Added the required column `studentProfileId` to the `enrollments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `instructorProfileId` to the `live_sessions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `studentProfileId` to the `payments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `studentProfileId` to the `quiz_submissions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `studentProfileId` to the `reviews` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "assignment_submissions" DROP CONSTRAINT "assignment_submissions_userId_fkey";

-- DropForeignKey
ALTER TABLE "completed_lessons" DROP CONSTRAINT "completed_lessons_userId_fkey";

-- DropForeignKey
ALTER TABLE "courses" DROP CONSTRAINT "courses_instructorId_fkey";

-- DropForeignKey
ALTER TABLE "enrollments" DROP CONSTRAINT "enrollments_userId_fkey";

-- DropForeignKey
ALTER TABLE "payments" DROP CONSTRAINT "payments_courseId_fkey";

-- DropForeignKey
ALTER TABLE "payments" DROP CONSTRAINT "payments_userId_fkey";

-- DropForeignKey
ALTER TABLE "quiz_submissions" DROP CONSTRAINT "quiz_submissions_userId_fkey";

-- DropForeignKey
ALTER TABLE "reviews" DROP CONSTRAINT "reviews_userId_fkey";

-- DropIndex
DROP INDEX "assignment_submissions_userId_assignmentId_key";

-- DropIndex
DROP INDEX "assignment_submissions_userId_idx";

-- DropIndex
DROP INDEX "completed_lessons_userId_idx";

-- DropIndex
DROP INDEX "completed_lessons_userId_lessonId_key";

-- DropIndex
DROP INDEX "courses_instructorId_idx";

-- DropIndex
DROP INDEX "enrollments_userId_courseId_key";

-- DropIndex
DROP INDEX "enrollments_userId_idx";

-- DropIndex
DROP INDEX "payments_userId_idx";

-- DropIndex
DROP INDEX "quiz_submissions_userId_idx";

-- DropIndex
DROP INDEX "quiz_submissions_userId_quizId_key";

-- DropIndex
DROP INDEX "reviews_userId_idx";

-- AlterTable
ALTER TABLE "assignment_submissions" DROP COLUMN "userId",
ADD COLUMN     "studentProfileId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "categories" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "completed_lessons" DROP COLUMN "userId",
ADD COLUMN     "studentProfileId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "courses" DROP COLUMN "instructorId",
ADD COLUMN     "instructorProfileId" TEXT NOT NULL,
ALTER COLUMN "learningOutcomes" SET DEFAULT ARRAY[]::TEXT[],
ALTER COLUMN "requirements" SET DEFAULT ARRAY[]::TEXT[],
ALTER COLUMN "tags" SET DEFAULT ARRAY[]::TEXT[],
ALTER COLUMN "targetAudience" SET DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "enrollments" DROP COLUMN "userId",
ADD COLUMN     "studentProfileId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "live_sessions" ADD COLUMN     "instructorProfileId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "payments" DROP COLUMN "userId",
ADD COLUMN     "studentProfileId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "quiz_submissions" DROP COLUMN "userId",
ADD COLUMN     "studentProfileId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "reviews" DROP COLUMN "userId",
ADD COLUMN     "studentProfileId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "student_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "instructor_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "headline" TEXT,
    "biography" TEXT,
    "expertise" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "experience" INTEGER,
    "facebook" TEXT,
    "linkedin" TEXT,
    "github" TEXT,
    "website" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "instructor_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "designation" TEXT,
    "permissions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admin_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "student_profiles_userId_key" ON "student_profiles"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "instructor_profiles_userId_key" ON "instructor_profiles"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "admin_profiles_userId_key" ON "admin_profiles"("userId");

-- CreateIndex
CREATE INDEX "assignment_submissions_studentProfileId_idx" ON "assignment_submissions"("studentProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "assignment_submissions_studentProfileId_assignmentId_key" ON "assignment_submissions"("studentProfileId", "assignmentId");

-- CreateIndex
CREATE INDEX "completed_lessons_studentProfileId_idx" ON "completed_lessons"("studentProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "completed_lessons_studentProfileId_lessonId_key" ON "completed_lessons"("studentProfileId", "lessonId");

-- CreateIndex
CREATE INDEX "courses_instructorProfileId_idx" ON "courses"("instructorProfileId");

-- CreateIndex
CREATE INDEX "enrollments_studentProfileId_idx" ON "enrollments"("studentProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "enrollments_studentProfileId_courseId_key" ON "enrollments"("studentProfileId", "courseId");

-- CreateIndex
CREATE INDEX "live_sessions_instructorProfileId_idx" ON "live_sessions"("instructorProfileId");

-- CreateIndex
CREATE INDEX "payments_studentProfileId_idx" ON "payments"("studentProfileId");

-- CreateIndex
CREATE INDEX "quiz_submissions_studentProfileId_idx" ON "quiz_submissions"("studentProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "quiz_submissions_studentProfileId_quizId_key" ON "quiz_submissions"("studentProfileId", "quizId");

-- CreateIndex
CREATE INDEX "reviews_studentProfileId_idx" ON "reviews"("studentProfileId");

-- AddForeignKey
ALTER TABLE "student_profiles" ADD CONSTRAINT "student_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "instructor_profiles" ADD CONSTRAINT "instructor_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_profiles" ADD CONSTRAINT "admin_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "courses" ADD CONSTRAINT "courses_instructorProfileId_fkey" FOREIGN KEY ("instructorProfileId") REFERENCES "instructor_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_studentProfileId_fkey" FOREIGN KEY ("studentProfileId") REFERENCES "student_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "completed_lessons" ADD CONSTRAINT "completed_lessons_studentProfileId_fkey" FOREIGN KEY ("studentProfileId") REFERENCES "student_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_studentProfileId_fkey" FOREIGN KEY ("studentProfileId") REFERENCES "student_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_studentProfileId_fkey" FOREIGN KEY ("studentProfileId") REFERENCES "student_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignment_submissions" ADD CONSTRAINT "assignment_submissions_studentProfileId_fkey" FOREIGN KEY ("studentProfileId") REFERENCES "student_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quiz_submissions" ADD CONSTRAINT "quiz_submissions_studentProfileId_fkey" FOREIGN KEY ("studentProfileId") REFERENCES "student_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "live_sessions" ADD CONSTRAINT "live_sessions_instructorProfileId_fkey" FOREIGN KEY ("instructorProfileId") REFERENCES "instructor_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
