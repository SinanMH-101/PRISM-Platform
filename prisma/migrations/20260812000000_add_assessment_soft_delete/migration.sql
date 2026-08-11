-- Assessments are soft-deleted so their complete historical record remains available.
ALTER TABLE "Assessment" ADD COLUMN "deletedAt" TIMESTAMP(3);

CREATE INDEX "Assessment_deletedAt_idx" ON "Assessment"("deletedAt");
