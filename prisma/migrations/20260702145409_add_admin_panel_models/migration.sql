-- CreateEnum
CREATE TYPE "AssessmentStatus" AS ENUM ('DRAFT', 'ACTIVE', 'CLOSED');

-- CreateEnum
CREATE TYPE "RepeatType" AS ENUM ('WEEKLY', 'FORTNIGHTLY');

-- CreateEnum
CREATE TYPE "FeedbackVisibility" AS ENUM ('IMMEDIATE_AFTER_SUBMISSION', 'AFTER_DEADLINE');

-- CreateEnum
CREATE TYPE "InviteStatus" AS ENUM ('INVITED', 'JOINED', 'REMOVED');

-- CreateEnum
CREATE TYPE "DeadlineDay" AS ENUM ('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY');

-- AlterTable
ALTER TABLE "Assessment" ADD COLUMN     "assessmentWeighting" DECIMAL(5,2) NOT NULL DEFAULT 0,
ADD COLUMN     "cohortSize" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "deadlineDay" "DeadlineDay" NOT NULL DEFAULT 'SUNDAY',
ADD COLUMN     "deadlineTime" TEXT NOT NULL DEFAULT '23:55',
ADD COLUMN     "educatorCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "feedbackVisibility" "FeedbackVisibility" NOT NULL DEFAULT 'AFTER_DEADLINE',
ADD COLUMN     "numberOfWeeks" INTEGER NOT NULL DEFAULT 13,
ADD COLUMN     "processWeighting" DECIMAL(5,2) NOT NULL DEFAULT 0,
ADD COLUMN     "repeatType" "RepeatType" NOT NULL DEFAULT 'WEEKLY',
ADD COLUMN     "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "status" "AssessmentStatus" NOT NULL DEFAULT 'DRAFT',
ADD COLUMN     "studentsPerGroup" INTEGER NOT NULL DEFAULT 1;

-- CreateTable
CREATE TABLE "AssessmentEducator" (
    "id" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "userId" TEXT,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "status" "InviteStatus" NOT NULL DEFAULT 'INVITED',
    "inviteToken" TEXT,
    "invitedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "joinedAt" TIMESTAMP(3),
    "removedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssessmentEducator_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UniversitySettings" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "logoUrl" TEXT,
    "primaryColour" TEXT NOT NULL DEFAULT '#31536a',
    "secondaryColour" TEXT NOT NULL DEFAULT '#59798e',
    "accentColour" TEXT NOT NULL DEFAULT '#0f766e',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UniversitySettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AssessmentEducator_assessmentId_email_key" ON "AssessmentEducator"("assessmentId", "email");

-- AddForeignKey
ALTER TABLE "AssessmentEducator" ADD CONSTRAINT "AssessmentEducator_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentEducator" ADD CONSTRAINT "AssessmentEducator_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
