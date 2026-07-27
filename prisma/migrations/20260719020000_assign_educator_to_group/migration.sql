ALTER TABLE "Group" ADD COLUMN "educatorId" TEXT;

-- Existing groups can be assigned automatically when their assessment has one
-- joined educator. Groups in assessments with multiple educators remain
-- unassigned because there is no reliable way to infer ownership.
UPDATE "Group" AS g
SET "educatorId" = (
  SELECT ae."userId"
  FROM "AssessmentEducator" AS ae
  INNER JOIN "Class" AS c ON c."assessmentId" = ae."assessmentId"
  WHERE c.id = g."classId"
    AND ae.status = 'JOINED'
    AND ae."removedAt" IS NULL
    AND ae."userId" IS NOT NULL
  LIMIT 1
)
WHERE 1 = (
  SELECT COUNT(*)
  FROM "AssessmentEducator" AS ae
  INNER JOIN "Class" AS c ON c."assessmentId" = ae."assessmentId"
  WHERE c.id = g."classId"
    AND ae.status = 'JOINED'
    AND ae."removedAt" IS NULL
    AND ae."userId" IS NOT NULL
);

ALTER TABLE "Group"
ADD CONSTRAINT "Group_educatorId_fkey"
FOREIGN KEY ("educatorId") REFERENCES "User"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
