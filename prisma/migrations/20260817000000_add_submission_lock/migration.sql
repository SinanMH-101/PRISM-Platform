-- Existing and newly-created submissions remain locked until an educator explicitly unlocks them.
ALTER TABLE "Submission" ADD COLUMN "locked" BOOLEAN NOT NULL DEFAULT true;
