-- Remove historical point allocations whose target student is no longer a
-- member of the submission's group. Other submissions and feedback remain.
DELETE FROM "ContributionScore" AS cs
USING "Submission" AS s
WHERE cs."submissionId" = s.id
  AND NOT EXISTS (
    SELECT 1
    FROM "GroupMember" AS gm
    WHERE gm."groupId" = s."groupId"
      AND gm."studentId" = cs."targetStudentId"
  );
