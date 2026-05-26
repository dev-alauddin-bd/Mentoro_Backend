-- AlterTable
ALTER TABLE "live_sessions" ADD COLUMN     "keyTopics" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "learningOutcomes" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "level" TEXT DEFAULT 'BEGINNER',
ADD COLUMN     "whoShouldAttend" TEXT[] DEFAULT ARRAY[]::TEXT[];
